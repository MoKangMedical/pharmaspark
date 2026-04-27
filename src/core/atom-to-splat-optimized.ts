// PharmaSpark — Optimized Molecular → Splat Converter
// Performance optimizations for large molecule handling

import { type Atom, type Protein } from "./pdb-parser";
import { type Molecule, type MoleculeAtom } from "./sdf-parser";
import { SS_COLORS } from "./elements";

// Splat data: x, y, z, scaleX, scaleY, scaleZ, rotX, rotY, rotZ, rotW, r, g, b, opacity
export interface SplatData {
  positions: Float32Array;   // xyz per splat (length = n * 3)
  scales: Float32Array;      // xyz scale per splat (length = n * 3)
  rotations: Float32Array;   // quaternion per splat (length = n * 4)
  colors: Float32Array;      // rgba per splat (length = n * 4)
  count: number;
}

// ============ Atom → Splat ============

export type ColorMode = "element" | "chain" | "secondary" | "b-factor" | "hydrophobicity" | "custom";

export interface AtomToSplatOptions {
  colorMode?: ColorMode;
  radiusScale?: number;     // Multiplier for vdW radius → splat scale (default: 0.5)
  opacity?: number;         // Default opacity (default: 0.9)
  includeHydrogens?: boolean; // (default: false)
  customColorFn?: (atom: Atom) => [number, number, number];
  
  // Performance options
  batchSize?: number;       // Process atoms in batches (default: 1000)
  useWorkers?: boolean;     // Use Web Workers for processing (default: false)
  enableLOD?: boolean;      // Enable Level of Detail (default: false)
  lodThreshold?: number;    // Distance threshold for LOD (default: 100)
}

const CHAIN_COLORS: [number, number, number][] = [
  [255, 100, 100], [100, 100, 255], [100, 255, 100], [255, 255, 100],
  [255, 100, 255], [100, 255, 255], [255, 180, 100], [180, 100, 255],
];

// Pre-computed color lookup table for elements
const ELEMENT_COLOR_CACHE = new Map<string, [number, number, number]>();

// Pre-compute color for element
function getElementColor(element: string): [number, number, number] {
  if (!ELEMENT_COLOR_CACHE.has(element)) {
    // Default colors for common elements
    const colors: Record<string, [number, number, number]> = {
      'C': [200, 200, 200],
      'N': [0, 0, 255],
      'O': [255, 0, 0],
      'S': [255, 255, 0],
      'H': [255, 255, 255],
      'P': [255, 165, 0],
      'Fe': [255, 165, 0],
      'Mg': [0, 200, 0],
      'Ca': [0, 200, 0],
      'Zn': [0, 200, 0],
    };
    ELEMENT_COLOR_CACHE.set(element, colors[element] || [200, 200, 200]);
  }
  return ELEMENT_COLOR_CACHE.get(element)!;
}

// Optimized atoms to splats conversion
export function atomsToSplatsOptimized(atoms: Atom[], options: AtomToSplatOptions = {}): SplatData {
  const {
    colorMode = "element",
    radiusScale = 0.5,
    opacity = 0.9,
    includeHydrogens = false,
    customColorFn,
    batchSize = 1000,
    enableLOD = false,
    lodThreshold = 100,
  } = options;

  // Filter hydrogen atoms
  const filtered = includeHydrogens ? atoms : atoms.filter(a => a.element !== "H");
  const n = filtered.length;

  // Pre-allocate arrays
  const positions = new Float32Array(n * 3);
  const scales = new Float32Array(n * 3);
  const rotations = new Float32Array(n * 4); // Identity quaternion
  const colors = new Float32Array(n * 4);

  // Chain color mapping
  const chainColorMap = new Map<string, number>();
  let chainIdx = 0;

  // Process atoms in batches for better cache performance
  for (let batchStart = 0; batchStart < n; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, n);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const atom = filtered[i];
      const i3 = i * 3;
      const i4 = i * 4;

      // Position
      positions[i3] = atom.x;
      positions[i3 + 1] = atom.y;
      positions[i3 + 2] = atom.z;

      // Scale (isotropic, based on vdW radius)
      const r = atom.vdWRadius * radiusScale;
      scales[i3] = r;
      scales[i3 + 1] = r;
      scales[i3 + 2] = r;

      // Rotation (identity = no rotation, isotropic doesn't need it)
      rotations[i4] = 0;
      rotations[i4 + 1] = 0;
      rotations[i4 + 2] = 0;
      rotations[i4 + 3] = 1;

      // Color
      let rgb: [number, number, number];
      switch (colorMode) {
        case "chain": {
          if (!chainColorMap.has(atom.chainID)) {
            chainColorMap.set(atom.chainID, chainIdx % CHAIN_COLORS.length);
            chainIdx++;
          }
          rgb = CHAIN_COLORS[chainColorMap.get(atom.chainID)!];
          break;
        }
        case "b-factor": {
          // Blue (cold) → Red (hot) based on B-factor
          const t = Math.min(atom.tempFactor / 100, 1);
          rgb = [Math.round(t * 255), Math.round((1 - t) * 128), Math.round((1 - t) * 255)];
          break;
        }
        case "custom":
          rgb = customColorFn ? customColorFn(atom) : getElementColor(atom.element);
          break;
        case "element":
        default:
          rgb = getElementColor(atom.element);
          break;
      }

      colors[i4] = rgb[0] / 255;
      colors[i4 + 1] = rgb[1] / 255;
      colors[i4 + 2] = rgb[2] / 255;
      colors[i4 + 3] = opacity;
    }
  }

  return { positions, scales, rotations, colors, count: n };
}

// Optimized molecule to splats conversion
export function moleculeToSplatsOptimized(mol: Molecule, options: Omit<AtomToSplatOptions, "colorMode"> = {}): SplatData {
  const {
    radiusScale = 0.5,
    opacity = 0.9,
    batchSize = 1000,
  } = options;

  const n = mol.atoms.length;
  const positions = new Float32Array(n * 3);
  const scales = new Float32Array(n * 3);
  const rotations = new Float32Array(n * 4);
  const colors = new Float32Array(n * 4);

  // Process atoms in batches
  for (let batchStart = 0; batchStart < n; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, n);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const atom = mol.atoms[i];
      const i3 = i * 3;
      const i4 = i * 4;

      positions[i3] = atom.x;
      positions[i3 + 1] = atom.y;
      positions[i3 + 2] = atom.z;

      const r = atom.vdWRadius * radiusScale;
      scales[i3] = r;
      scales[i3 + 1] = r;
      scales[i3 + 2] = r;

      rotations[i4] = 0;
      rotations[i4 + 1] = 0;
      rotations[i4 + 2] = 0;
      rotations[i4 + 3] = 1;

      colors[i4] = atom.color[0] / 255;
      colors[i4 + 1] = atom.color[1] / 255;
      colors[i4 + 2] = atom.color[2] / 255;
      colors[i4 + 3] = opacity;
    }
  }

  return { positions, scales, rotations, colors, count: n };
}

// Optimized surface generation using spatial partitioning
export function generateSurfaceSplatsOptimized(atoms: Atom[], options: SurfaceOptions = {}): SplatData {
  const {
    resolution = 20,
    probe = 1.4,
    opacity = 0.3,
    scale = 0.3,
    batchSize = 100,
  } = options;

  // Filter non-hydrogen atoms
  const nonH = atoms.filter(a => a.element !== "H");
  
  // Create spatial grid for faster neighbor lookup
  const gridSize = 5.0; // Grid cell size in Angstroms
  const grid = new Map<string, Atom[]>();
  
  // Populate spatial grid
  for (const atom of nonH) {
    const gx = Math.floor(atom.x / gridSize);
    const gy = Math.floor(atom.y / gridSize);
    const gz = Math.floor(atom.z / gridSize);
    const key = `${gx},${gy},${gz}`;
    
    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key)!.push(atom);
  }
  
  // Get neighbors from grid
  function getNeighbors(atom: Atom): Atom[] {
    const gx = Math.floor(atom.x / gridSize);
    const gy = Math.floor(atom.y / gridSize);
    const gz = Math.floor(atom.z / gridSize);
    
    const neighbors: Atom[] = [];
    
    // Check 3x3x3 grid cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${gx + dx},${gy + dy},${gz + dz}`;
          const cell = grid.get(key);
          if (cell) {
            neighbors.push(...cell);
          }
        }
      }
    }
    
    return neighbors;
  }

  // Fibonacci sphere sampling for uniform point distribution
  function fibonacciSphere(n: number): [number, number, number][] {
    const points: [number, number, number][] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      points.push([Math.cos(theta) * radius, y, Math.sin(theta) * radius]);
    }
    return points;
  }

  const spherePoints = fibonacciSphere(resolution);

  // Generate surface points for each atom
  const allPoints: { x: number; y: number; z: number; color: [number, number, number] }[] = [];

  // Process atoms in batches
  for (let batchStart = 0; batchStart < nonH.length; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, nonH.length);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const atom = nonH[i];
      const r = atom.vdWRadius + probe;
      
      // Get neighbors from spatial grid
      const neighbors = getNeighbors(atom);
      
      for (const [sx, sy, sz] of spherePoints) {
        const px = atom.x + sx * r;
        const py = atom.y + sy * r;
        const pz = atom.z + sz * r;

        // Check if point is buried by other atoms
        let buried = false;
        for (const other of neighbors) {
          if (other === atom) continue;
          const d2 = (px - other.x) ** 2 + (py - other.y) ** 2 + (pz - other.z) ** 2;
          if (d2 < (other.vdWRadius + probe) ** 2) {
            buried = true;
            break;
          }
        }

        if (!buried) {
          allPoints.push({
            x: px, y: py, z: pz,
            color: getElementColor(atom.element),
          });
        }
      }
    }
  }

  const n = allPoints.length;
  const positions = new Float32Array(n * 3);
  const scales = new Float32Array(n * 3);
  const rotations = new Float32Array(n * 4);
  const colors = new Float32Array(n * 4);

  for (let i = 0; i < n; i++) {
    const p = allPoints[i];
    const i3 = i * 3;
    const i4 = i * 4;

    positions[i3] = p.x;
    positions[i3 + 1] = p.y;
    positions[i3 + 2] = p.z;

    scales[i3] = scale;
    scales[i3 + 1] = scale;
    scales[i3 + 2] = scale;

    rotations[i4] = 0;
    rotations[i4 + 1] = 0;
    rotations[i4 + 2] = 0;
    rotations[i4 + 3] = 1;

    colors[i4] = p.color[0] / 255;
    colors[i4 + 1] = p.color[1] / 255;
    colors[i4 + 2] = p.color[2] / 255;
    colors[i4 + 3] = opacity;
  }

  return { positions, scales, rotations, colors, count: n };
}

// Level of Detail (LOD) support
export interface LODSplatData {
  high: SplatData;
  medium: SplatData;
  low: SplatData;
}

export function generateLODSplats(atoms: Atom[], options: AtomToSplatOptions = {}): LODSplatData {
  const {
    colorMode = "element",
    radiusScale = 0.5,
    opacity = 0.9,
    includeHydrogens = false,
  } = options;

  // High detail: all atoms
  const high = atomsToSplatsOptimized(atoms, {
    colorMode,
    radiusScale,
    opacity,
    includeHydrogens,
  });

  // Medium detail: every 2nd atom
  const mediumAtoms = atoms.filter((_, i) => i % 2 === 0);
  const medium = atomsToSplatsOptimized(mediumAtoms, {
    colorMode,
    radiusScale: radiusScale * 1.2, // Slightly larger to compensate
    opacity,
    includeHydrogens,
  });

  // Low detail: every 4th atom
  const lowAtoms = atoms.filter((_, i) => i % 4 === 0);
  const low = atomsToSplatsOptimized(lowAtoms, {
    colorMode,
    radiusScale: radiusScale * 1.5, // Even larger to compensate
    opacity,
    includeHydrogens,
  });

  return { high, medium, low };
}

// Performance monitoring
export interface PerformanceMetrics {
  parseTime: number;
  convertTime: number;
  totalTime: number;
  atomCount: number;
  splatCount: number;
  memoryUsage: number;
}

export function measurePerformance<T>(fn: () => T): { result: T; metrics: Omit<PerformanceMetrics, 'atomCount' | 'splatCount' | 'memoryUsage'> } {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();

  return {
    result,
    metrics: {
      parseTime: 0,
      convertTime: endTime - startTime,
      totalTime: endTime - startTime,
    },
  };
}

// Export interfaces
export interface SurfaceOptions {
  resolution?: number;    // Points per atom (default: 20)
  probe?: number;         // Probe radius in Å (default: 1.4)
  opacity?: number;       // (default: 0.3)
  colorMode?: "element" | "electrostatic" | "hydrophobicity";
  scale?: number;         // Splat scale (default: 0.3)
  batchSize?: number;     // Process atoms in batches (default: 100)
}

export interface PocketOptions {
  center: [number, number, number];
  radius: number;         // Å
  highlightColor?: [number, number, number];
  dimOpacity?: number;
}

// Optimized pocket highlighting
export function highlightPocketOptimized(splatData: SplatData, options: PocketOptions): SplatData {
  const { center, radius, highlightColor = [0, 255, 128], dimOpacity = 0.15 } = options;
  const { positions, scales, rotations, colors, count } = splatData;

  const newColors = new Float32Array(colors);
  const r2 = radius * radius;
  const [cx, cy, cz] = center;

  // Process in batches for better cache performance
  const batchSize = 1000;
  for (let batchStart = 0; batchStart < count; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, count);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const i3 = i * 3;
      const i4 = i * 4;
      const dx = positions[i3] - cx;
      const dy = positions[i3 + 1] - cy;
      const dz = positions[i3 + 2] - cz;
      const d2 = dx * dx + dy * dy + dz * dz;

      if (d2 < r2) {
        // Highlight: tint toward pocket color
        const t = 0.4;
        newColors[i4] = colors[i4] * (1 - t) + highlightColor[0] / 255 * t;
        newColors[i4 + 1] = colors[i4 + 1] * (1 - t) + highlightColor[1] / 255 * t;
        newColors[i4 + 2] = colors[i4 + 2] * (1 - t) + highlightColor[2] / 255 * t;
        newColors[i4 + 3] = 0.95;
      } else {
        // Dim outside pocket
        newColors[i4 + 3] = dimOpacity;
      }
    }
  }

  return { positions, scales, rotations, colors: newColors, count };
}

// Export all optimized functions
export {
  atomsToSplatsOptimized as atomsToSplats,
  moleculeToSplatsOptimized as moleculeToSplats,
  generateSurfaceSplatsOptimized as generateSurfaceSplats,
  highlightPocketOptimized as highlightPocket,
};
