// PharmaSpark — Docking Visualization
// Visualize drug-receptor binding poses with interaction details

import { type SplatData } from "./atom-to-splat";
import { type Atom } from "./pdb-parser";
import { type Molecule, type MoleculeAtom } from "./sdf-parser";

export interface DockingResult {
  receptor: { atoms: Atom[] };
  ligand: Molecule;
  pose: number;
  score: number; // Docking score (e.g., Glide, AutoDock)
  // Interaction data
  interactions?: MolecularInteraction[];
}

export interface MolecularInteraction {
  type: "hbond" | "hydrophobic" | "ionic" | "pi-stacking" | "water-bridge" | "halogen";
  receptorAtom: number; // Index
  ligandAtom: number;   // Index
  distance: number;     // Å
  strength?: number;    // 0-1
}

const INTERACTION_COLORS: Record<string, [number, number, number]> = {
  hbond:       [0, 200, 255],    // Cyan
  hydrophobic: [255, 200, 0],    // Yellow
  ionic:       [255, 50, 50],    // Red
  "pi-stacking": [200, 0, 255],  // Purple
  "water-bridge": [0, 150, 255], // Blue
  halogen:     [0, 255, 100],    // Green
};

// Generate interaction line splats between receptor and ligand
export function interactionLinesToSplats(
  interactions: MolecularInteraction[],
  receptorAtoms: Atom[],
  ligandAtoms: MoleculeAtom[],
  splatsPerLine: number = 12,
  radius: number = 0.08,
): SplatData {
  const n = interactions.length * splatsPerLine;
  const positions = new Float32Array(n * 3);
  const scales = new Float32Array(n * 3);
  const rotations = new Float32Array(n * 4);
  const colors = new Float32Array(n * 4);

  let idx = 0;
  for (const inter of interactions) {
    const ra = receptorAtoms[inter.receptorAtom];
    const la = ligandAtoms[inter.ligandAtom];
    if (!ra || !la) continue;

    const color = INTERACTION_COLORS[inter.type] || [200, 200, 200];
    const dx = la.x - ra.x;
    const dy = la.y - ra.y;
    const dz = la.z - ra.z;

    // Dashed line effect: alternate segments
    for (let s = 0; s < splatsPerLine; s++) {
      if (s % 2 === 0) continue; // Dashed

      const t = (s + 0.5) / splatsPerLine;
      const i3 = idx * 3;
      const i4 = idx * 4;

      positions[i3] = ra.x + dx * t;
      positions[i3 + 1] = ra.y + dy * t;
      positions[i3 + 2] = ra.z + dz * t;

      scales[i3] = radius;
      scales[i3 + 1] = radius;
      scales[i3 + 2] = radius;

      rotations[i4] = 0;
      rotations[i4 + 1] = 0;
      rotations[i4 + 2] = 0;
      rotations[i4 + 3] = 1;

      colors[i4] = color[0] / 255;
      colors[i4 + 1] = color[1] / 255;
      colors[i4 + 2] = color[2] / 255;
      colors[i4 + 3] = 0.8;

      idx++;
    }
  }

  return { positions, scales, rotations, colors, count: idx };
}

// Generate pharmacophore feature splats
export interface PharmacophoreFeature {
  type: "donor" | "acceptor" | "hydrophobic" | "aromatic" | "positive" | "negative";
  position: [number, number, number];
  radius: number;
}

const PHARMACOPHORE_COLORS: Record<string, [number, number, number]> = {
  donor:      [0, 150, 255],
  acceptor:   [255, 50, 50],
  hydrophobic: [255, 200, 0],
  aromatic:   [200, 0, 200],
  positive:   [0, 0, 255],
  negative:   [255, 0, 0],
};

export function pharmacophoreToSplats(features: PharmacophoreFeature[]): SplatData {
  const n = features.length;
  const positions = new Float32Array(n * 3);
  const scales = new Float32Array(n * 3);
  const rotations = new Float32Array(n * 4);
  const colors = new Float32Array(n * 4);

  for (let i = 0; i < n; i++) {
    const f = features[i];
    const i3 = i * 3;
    const i4 = i * 4;
    const color = PHARMACOPHORE_COLORS[f.type] || [200, 200, 200];

    positions[i3] = f.position[0];
    positions[i3 + 1] = f.position[1];
    positions[i3 + 2] = f.position[2];

    scales[i3] = f.radius;
    scales[i3 + 1] = f.radius;
    scales[i3 + 2] = f.radius;

    rotations[i4] = 0;
    rotations[i4 + 1] = 0;
    rotations[i4 + 2] = 0;
    rotations[i4 + 3] = 1;

    colors[i4] = color[0] / 255;
    colors[i4 + 1] = color[1] / 255;
    colors[i4 + 2] = color[2] / 255;
    colors[i4 + 3] = 0.5;
  }

  return { positions, scales, rotations, colors, count: n };
}
