// PharmaSpark — Advanced Visualization Options
// Additional visualization modes and effects

import { type Atom, type Protein } from "./pdb-parser";
import { type Molecule, type MoleculeAtom } from "./sdf-parser";
import { type SplatData } from "./atom-to-splat";

// ============ Visualization Modes ============

export type VisualizationMode = 
  | "standard"           // Standard ball-and-stick
  | "spacefill"          // Space-filling model
  | "surface"            // Molecular surface
  | "cartoon"            // Secondary structure cartoon
  | "backbone"           // Backbone trace
  | "wireframe"          // Wireframe model
  | "licorice"           // Licorice model
  | "sphere"             // Sphere model
  | "electrostatic"      // Electrostatic potential
  | "hydrophobicity"     // Hydrophobicity map
  | "b-factor"           // B-factor coloring
  | "chain"              // Chain coloring
  | "residue"            // Residue coloring
  | "element";           // Element coloring

// ============ Advanced Color Schemes ============

export type ColorScheme = 
  | "element"            // Standard element colors
  | "chain"              // Chain colors
  | "residue"            // Residue colors
  | "secondary"          // Secondary structure colors
  | "b-factor"           // B-factor colors
  | "hydrophobicity"     // Hydrophobicity colors
  | "electrostatic"      // Electrostatic potential colors
  | "rainbow"            // Rainbow colors
  | "gradient"           // Gradient colors
  | "custom";            // Custom color function

// ============ Visualization Options ============

export interface VisualizationOptions {
  mode: VisualizationMode;
  colorScheme: ColorScheme;
  
  // Rendering options
  opacity?: number;
  scale?: number;
  radiusScale?: number;
  
  // Surface options
  surfaceResolution?: number;
  surfaceProbe?: number;
  
  // Cartoon options
  cartoonWidth?: number;
  cartoonHeight?: number;
  
  // Wireframe options
  wireframeRadius?: number;
  
  // Licorice options
  licoriceRadius?: number;
  
  // Sphere options
  sphereScale?: number;
  
  // Custom color function
  customColorFn?: (atom: Atom) => [number, number, number];
  
  // Performance options
  batchSize?: number;
  enableLOD?: boolean;
}

// ============ Color Palettes ============

// Residue color palette
const RESIDUE_COLORS: Record<string, [number, number, number]> = {
  // Nonpolar
  'ALA': [200, 200, 200],
  'VAL': [200, 200, 200],
  'LEU': [200, 200, 200],
  'ILE': [200, 200, 200],
  'MET': [200, 200, 200],
  'PHE': [200, 200, 200],
  'TRP': [200, 200, 200],
  'PRO': [200, 200, 200],
  
  // Polar
  'GLY': [0, 200, 0],
  'SER': [0, 200, 0],
  'THR': [0, 200, 0],
  'CYS': [0, 200, 0],
  'TYR': [0, 200, 0],
  'ASN': [0, 200, 0],
  'GLN': [0, 200, 0],
  
  // Positive
  'LYS': [0, 0, 255],
  'ARG': [0, 0, 255],
  'HIS': [0, 0, 255],
  
  // Negative
  'ASP': [255, 0, 0],
  'GLU': [255, 0, 0],
};

// Electrostatic potential colors
const ELECTROSTATIC_COLORS: Record<string, [number, number, number]> = {
  'positive': [0, 0, 255],      // Blue for positive
  'negative': [255, 0, 0],      // Red for negative
  'neutral': [200, 200, 200],   // Gray for neutral
};

// Hydrophobicity colors
const HYDROPHOBICITY_COLORS: Record<string, [number, number, number]> = {
  'hydrophobic': [255, 165, 0],  // Orange for hydrophobic
  'hydrophilic': [0, 0, 255],    // Blue for hydrophilic
  'neutral': [200, 200, 200],    // Gray for neutral
};

// Rainbow color palette
const RAINBOW_COLORS: [number, number, number][] = [
  [255, 0, 0],      // Red
  [255, 165, 0],    // Orange
  [255, 255, 0],    // Yellow
  [0, 255, 0],      // Green
  [0, 0, 255],      // Blue
  [75, 0, 130],     // Indigo
  [148, 0, 211],    // Violet
];

// ============ Color Functions ============

// Get residue color
function getResidueColor(resName: string): [number, number, number] {
  return RESIDUE_COLORS[resName] || [200, 200, 200];
}

// Get electrostatic potential color
function getElectrostaticColor(atom: Atom): [number, number, number] {
  // Simplified electrostatic potential based on element
  const element = atom.element;
  
  if (['N', 'O'].includes(element)) {
    return ELECTROSTATIC_COLORS['negative'];
  } else if (['C', 'S'].includes(element)) {
    return ELECTROSTATIC_COLORS['neutral'];
  } else if (['H'].includes(element)) {
    return ELECTROSTATIC_COLORS['positive'];
  }
  
  return ELECTROSTATIC_COLORS['neutral'];
}

// Get hydrophobicity color
function getHydrophobicityColor(atom: Atom): [number, number, number] {
  // Simplified hydrophobicity based on residue
  const resName = atom.resName;
  
  const hydrophobicResidues = ['ALA', 'VAL', 'LEU', 'ILE', 'MET', 'PHE', 'TRP', 'PRO'];
  const hydrophilicResidues = ['LYS', 'ARG', 'HIS', 'ASP', 'GLU', 'ASN', 'GLN', 'SER', 'THR', 'TYR', 'CYS'];
  
  if (hydrophobicResidues.includes(resName)) {
    return HYDROPHOBICITY_COLORS['hydrophobic'];
  } else if (hydrophilicResidues.includes(resName)) {
    return HYDROPHOBICITY_COLORS['hydrophilic'];
  }
  
  return HYDROPHOBICITY_COLORS['neutral'];
}

// Get rainbow color based on index
function getRainbowColor(index: number, total: number): [number, number, number] {
  const t = index / total;
  const colorIndex = Math.floor(t * (RAINBOW_COLORS.length - 1));
  const nextIndex = Math.min(colorIndex + 1, RAINBOW_COLORS.length - 1);
  const fraction = (t * (RAINBOW_COLORS.length - 1)) - colorIndex;
  
  const c1 = RAINBOW_COLORS[colorIndex];
  const c2 = RAINBOW_COLORS[nextIndex];
  
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * fraction),
    Math.round(c1[1] + (c2[1] - c1[1]) * fraction),
    Math.round(c1[2] + (c2[2] - c1[2]) * fraction),
  ];
}

// Get gradient color based on position
function getGradientColor(atom: Atom, minZ: number, maxZ: number): [number, number, number] {
  const t = (atom.z - minZ) / (maxZ - minZ);
  
  // Blue to red gradient
  return [
    Math.round(t * 255),
    Math.round((1 - t) * 128),
    Math.round((1 - t) * 255),
  ];
}

// ============ Visualization Functions ============

// Convert atoms to splats with visualization options
export function visualizeAtoms(atoms: Atom[], options: VisualizationOptions): SplatData {
  const {
    mode,
    colorScheme,
    opacity = 0.9,
    scale = 0.5,
    radiusScale = 0.5,
    customColorFn,
    batchSize = 1000,
  } = options;

  // Filter hydrogen atoms for most modes
  const filtered = mode === "spacefill" ? atoms : atoms.filter(a => a.element !== "H");
  const n = filtered.length;

  // Pre-allocate arrays
  const positions = new Float32Array(n * 3);
  const scales = new Float32Array(n * 3);
  const rotations = new Float32Array(n * 4);
  const colors = new Float32Array(n * 4);

  // Get Z range for gradient coloring
  let minZ = Infinity, maxZ = -Infinity;
  if (colorScheme === "gradient") {
    for (const atom of filtered) {
      minZ = Math.min(minZ, atom.z);
      maxZ = Math.max(maxZ, atom.z);
    }
  }

  // Process atoms in batches
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

      // Scale based on mode
      let r: number;
      switch (mode) {
        case "spacefill":
          r = atom.vdWRadius * radiusScale;
          break;
        case "sphere":
          r = atom.vdWRadius * radiusScale * 1.2;
          break;
        case "licorice":
          r = 0.15; // Fixed radius for licorice
          break;
        case "wireframe":
          r = 0.05; // Thin radius for wireframe
          break;
        default:
          r = atom.vdWRadius * radiusScale * 0.5;
          break;
      }
      
      scales[i3] = r;
      scales[i3 + 1] = r;
      scales[i3 + 2] = r;

      // Rotation (identity)
      rotations[i4] = 0;
      rotations[i4 + 1] = 0;
      rotations[i4 + 2] = 0;
      rotations[i4 + 3] = 1;

      // Color based on scheme
      let rgb: [number, number, number];
      switch (colorScheme) {
        case "residue":
          rgb = getResidueColor(atom.resName);
          break;
        case "electrostatic":
          rgb = getElectrostaticColor(atom);
          break;
        case "hydrophobicity":
          rgb = getHydrophobicityColor(atom);
          break;
        case "rainbow":
          rgb = getRainbowColor(i, n);
          break;
        case "gradient":
          rgb = getGradientColor(atom, minZ, maxZ);
          break;
        case "custom":
          rgb = customColorFn ? customColorFn(atom) : [200, 200, 200];
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
  }

  return { positions, scales, rotations, colors, count: n };
}

// Generate cartoon representation for secondary structures
export function visualizeCartoon(protein: Protein, options: VisualizationOptions): SplatData {
  const {
    colorScheme = "secondary",
    opacity = 0.9,
    cartoonWidth = 2.0,
    cartoonHeight = 0.5,
    batchSize = 100,
  } = options;

  const allPoints: { x: number; y: number; z: number; color: [number, number, number] }[] = [];

  // Process helices
  for (const helix of protein.helices) {
    const startResidue = helix.startSeq;
    const endResidue = helix.endSeq;
    
    // Get atoms in this helix
    const helixAtoms = protein.atoms.filter(atom => 
      atom.resSeq >= startResidue && atom.resSeq <= endResidue
    );
    
    if (helixAtoms.length === 0) continue;
    
    // Calculate helix center
    let cx = 0, cy = 0, cz = 0;
    for (const atom of helixAtoms) {
      cx += atom.x;
      cy += atom.y;
      cz += atom.z;
    }
    cx /= helixAtoms.length;
    cy /= helixAtoms.length;
    cz /= helixAtoms.length;
    
    // Generate points along helix
    for (let i = 0; i < helixAtoms.length; i++) {
      const atom = helixAtoms[i];
      const t = i / helixAtoms.length;
      
      // Create ribbon-like structure
      for (let j = 0; j < 5; j++) {
        const offset = (j - 2) * cartoonWidth / 4;
        allPoints.push({
          x: atom.x + offset,
          y: atom.y,
          z: atom.z,
          color: [255, 0, 0], // Red for helices
        });
      }
    }
  }

  // Process sheets
  for (const sheet of protein.sheets) {
    const startResidue = sheet.startSeq;
    const endResidue = sheet.endSeq;
    
    // Get atoms in this sheet
    const sheetAtoms = protein.atoms.filter(atom => 
      atom.resSeq >= startResidue && atom.resSeq <= endResidue
    );
    
    if (sheetAtoms.length === 0) continue;
    
    // Generate points along sheet
    for (let i = 0; i < sheetAtoms.length; i++) {
      const atom = sheetAtoms[i];
      
      // Create arrow-like structure
      for (let j = 0; j < 3; j++) {
        const offset = (j - 1) * cartoonWidth / 2;
        allPoints.push({
          x: atom.x + offset,
          y: atom.y,
          z: atom.z,
          color: [0, 0, 255], // Blue for sheets
        });
      }
    }
  }

  // Convert to splat data
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

    scales[i3] = cartoonHeight;
    scales[i3 + 1] = cartoonHeight;
    scales[i3 + 2] = cartoonHeight;

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

// Generate backbone trace
export function visualizeBackbone(protein: Protein, options: VisualizationOptions): SplatData {
  const {
    colorScheme = "chain",
    opacity = 0.9,
    scale = 0.3,
    batchSize = 100,
  } = options;

  // Get CA atoms (backbone)
  const caAtoms = protein.atoms.filter(atom => atom.name === "CA");
  
  if (caAtoms.length === 0) {
    return {
      positions: new Float32Array(0),
      scales: new Float32Array(0),
      rotations: new Float32Array(0),
      colors: new Float32Array(0),
      count: 0,
    };
  }

  // Generate points along backbone
  const allPoints: { x: number; y: number; z: number; color: [number, number, number] }[] = [];
  
  for (let i = 0; i < caAtoms.length; i++) {
    const atom = caAtoms[i];
    const nextAtom = caAtoms[i + 1];
    
    // Add point for current CA
    allPoints.push({
      x: atom.x,
      y: atom.y,
      z: atom.z,
      color: atom.color,
    });
    
    // Add intermediate points if next CA exists
    if (nextAtom) {
      const numIntermediate = 3;
      for (let j = 1; j < numIntermediate; j++) {
        const t = j / numIntermediate;
        allPoints.push({
          x: atom.x + (nextAtom.x - atom.x) * t,
          y: atom.y + (nextAtom.y - atom.y) * t,
          z: atom.z + (nextAtom.z - atom.z) * t,
          color: atom.color,
        });
      }
    }
  }

  // Convert to splat data
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

// ============ Export Functions ============

export {
  getResidueColor,
  getElectrostaticColor,
  getHydrophobicityColor,
  getRainbowColor,
  getGradientColor,
};
