// PharmaSpark — Molecular → Splat Converter
// Converts atoms, bonds, surfaces into Gaussian Splat data for Spark rendering

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
}

const CHAIN_COLORS: [number, number, number][] = [
  [255, 100, 100], [100, 100, 255], [100, 255, 100], [255, 255, 100],
  [255, 100, 255], [100, 255, 255], [255, 180, 100], [180, 100, 255],
];

export function atomsToSplats(atoms: Atom[], options: AtomToSplatOptions = {}): SplatData {
  const {
    colorMode = "element",
    radiusScale = 0.5,
    opacity = 0.9,
    includeHydrogens = false,
    customColorFn,
  } = options;

  const filtered = includeHydrogens ? atoms : atoms.filter(a => a.element !== "H");
  const n = filtered.length;

  const positions = new Float32Array(n * 3);
  const scales = new Float32Array(n * 3);
  const rotations = new Float32Array(n * 4); // Identity quaternion
  const colors = new Float32Array(n * 4);

  // Chain color mapping
  const chainColorMap = new Map<string, number>();
  let chainIdx = 0;

  for (let i = 0; i < n; i++) {
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
        rgb = customColorFn ? customColorFn(atom) : atom.color;
        break;
      case "element":
      default:
        rgb = atom.color;
        break;
    }

    colors[i4] = rgb[0] / 255;
    colors[i4 + 1] = rgb[1] / 255;
    colors[i4 + 2] = rgb[2] / 255;
    colors[i4 + 3] = opacity;
  }

  return { positions, scales, rotations, colors, count: n };
}

// ============ Molecule (SDF) → Splat ============

export function moleculeToSplats(mol: Molecule, options: Omit<AtomToSplatOptions, "colorMode"> = {}): SplatData {
  const {
    radiusScale = 0.5,
    opacity = 0.9,
  } = options;

  const n = mol.atoms.length;
  const positions = new Float32Array(n * 3);
  const scales = new Float32Array(n * 3);
  const rotations = new Float32Array(n * 4);
  const colors = new Float32Array(n * 4);

  for (let i = 0; i < n; i++) {
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

  return { positions, scales, rotations, colors, count: n };
}

// ============ Bonds → Cylinder Splats ============

// Generate intermediate splats along bonds (cylinders)
export function bondsToSplats(
  atoms: MoleculeAtom[],
  bonds: { atom1: number; atom2: number; order: number }[],
  splatsPerBond: number = 8,
  radius: number = 0.15,
  opacity: number = 0.7,
): SplatData {
  const n = bonds.length * splatsPerBond;
  const positions = new Float32Array(n * 3);
  const scales = new Float32Array(n * 3);
  const rotations = new Float32Array(n * 4);
  const colors = new Float32Array(n * 4);

  let idx = 0;
  for (const bond of bonds) {
    const a1 = atoms[bond.atom1];
    const a2 = atoms[bond.atom2];

    // Bond direction
    const dx = a2.x - a1.x;
    const dy = a2.y - a1.y;
    const dz = a2.z - a1.z;

    // Offset for double/triple bonds
    const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-0.12, 0.12] : [-0.15, 0, 0.15];

    for (const offset of offsets) {
      for (let s = 0; s < splatsPerBond; s++) {
        const t = (s + 0.5) / splatsPerBond;
        const i3 = idx * 3;
        const i4 = idx * 4;

        // Position along bond
        positions[i3] = a1.x + dx * t + offset;
        positions[i3 + 1] = a1.y + dy * t;
        positions[i3 + 2] = a1.z + dz * t;

        // Scale
        scales[i3] = radius;
        scales[i3 + 1] = radius;
        scales[i3 + 2] = radius;

        // Rotation (identity)
        rotations[i4] = 0;
        rotations[i4 + 1] = 0;
        rotations[i4 + 2] = 0;
        rotations[i4 + 3] = 1;

        // Color: blend between two atoms
        const c1 = a1.color;
        const c2 = a2.color;
        colors[i4] = ((c1[0] * (1 - t) + c2[0] * t) / 255);
        colors[i4 + 1] = ((c1[1] * (1 - t) + c2[1] * t) / 255);
        colors[i4 + 2] = ((c1[2] * (1 - t) + c2[2] * t) / 255);
        colors[i4 + 3] = opacity;

        idx++;
      }
    }
  }

  return { positions, scales, rotations, colors, count: idx };
}

// ============ Protein Surface → Splat Cloud ============

export interface SurfaceOptions {
  resolution?: number;    // Points per atom (default: 20)
  probe?: number;         // Probe radius in Å (default: 1.4)
  opacity?: number;       // (default: 0.3)
  colorMode?: "element" | "electrostatic" | "hydrophobicity";
  scale?: number;         // Splat scale (default: 0.3)
}

// Generate approximate molecular surface using atom-centered sampling
export function generateSurfaceSplats(atoms: Atom[], options: SurfaceOptions = {}): SplatData {
  const {
    resolution = 20,
    probe = 1.4,
    opacity = 0.3,
    scale = 0.3,
  } = options;

  // Fibonacci sphere sampling for uniform point distribution
  function fibonacciSphere(n: number): [number, number, number][] {
    const points: [number, number, number][] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      points.push([Math.cos(theta) * radius * 1, y, Math.sin(theta) * radius]);
    }
    return points;
  }

  const spherePoints = fibonacciSphere(resolution);
  const nonH = atoms.filter(a => a.element !== "H");

  // Generate surface points for each atom
  const allPoints: { x: number; y: number; z: number; color: [number, number, number] }[] = [];

  for (const atom of nonH) {
    const r = atom.vdWRadius + probe;
    for (const [sx, sy, sz] of spherePoints) {
      const px = atom.x + sx * r;
      const py = atom.y + sy * r;
      const pz = atom.z + sz * r;

      // Check if point is buried by other atoms
      let buried = false;
      for (const other of nonH) {
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
          color: atom.color,
        });
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

// ============ Binding Pocket Highlight ============

export interface PocketOptions {
  center: [number, number, number];
  radius: number;         // Å
  highlightColor?: [number, number, number];
  dimOpacity?: number;
}

export function highlightPocket(splatData: SplatData, options: PocketOptions): SplatData {
  const { center, radius, highlightColor = [0, 255, 128], dimOpacity = 0.15 } = options;
  const { positions, scales, rotations, colors, count } = splatData;

  const newColors = new Float32Array(colors);
  const r2 = radius * radius;
  const [cx, cy, cz] = center;

  for (let i = 0; i < count; i++) {
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

  return { positions, scales, rotations, colors: newColors, count };
}
