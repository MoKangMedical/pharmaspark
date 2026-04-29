// PharmaSpark — Drug Library LoD (Level-of-Detail)
// Stream millions of drug compounds with progressive loading

import { type SplatData, moleculeToSplats } from "./atom-to-splat";
import { type Molecule } from "./sdf-parser";

export interface CompoundEntry {
  id: string;
  name: string;
  smiles: string;
  molecule: Molecule;
  gridPosition: [number, number, number]; // Position in 3D grid
  properties?: {
    molecularWeight?: number;
    logP?: number;
    tpsa?: number;
    hba?: number;
    hbd?: number;
    activity?: number; // IC50 or similar
  };
}

export interface DrugLibraryConfig {
  compounds: CompoundEntry[];
  gridSize: [number, number, number]; // Grid dimensions
  spacing: number; // Å between grid cells
  lodLevels: number; // Number of LoD levels (default: 3)
}

export interface LoDLevel {
  level: number;
  description: string;
  splatsPerCompound: number;
  totalSplats: number;
}

// Arrange compounds in a 3D grid and generate LoD splats
export class DrugLibraryRenderer {
  private compounds: CompoundEntry[];
  private gridSize: [number, number, number];
  private spacing: number;
  private lodLevels: number;

  constructor(config: DrugLibraryConfig) {
    this.compounds = config.compounds;
    this.gridSize = config.gridSize;
    this.spacing = config.spacing;
    this.lodLevels = config.lodLevels || 3;
  }

  // Compute grid positions for all compounds
  computeLayout(): void {
    const [gx, gy, gz] = this.gridSize;
    for (let i = 0; i < this.compounds.length; i++) {
      const c = this.compounds[i];
      const ix = i % gx;
      const iy = Math.floor(i / gx) % gy;
      const iz = Math.floor(i / (gx * gy)) % gz;
      c.gridPosition = [
        ix * this.spacing - (gx * this.spacing) / 2,
        iy * this.spacing - (gy * this.spacing) / 2,
        iz * this.spacing - (gz * this.spacing) / 2,
      ];
    }
  }

  // Generate LoD levels
  getLoDLevels(): LoDLevel[] {
    const levels: LoDLevel[] = [
      { level: 0, description: "Point cloud (1 splat per compound)", splatsPerCompound: 1, totalSplats: this.compounds.length },
      { level: 1, description: "Skeleton (atoms only, ~10 splats)", splatsPerCompound: 10, totalSplats: this.compounds.length * 10 },
      { level: 2, description: "Full structure (all atoms + bonds)", splatsPerCompound: 50, totalSplats: this.compounds.length * 50 },
    ];
    return levels.slice(0, this.lodLevels);
  }

  // Generate splats for a specific LoD level and visible region
  generateLoDSplats(
    level: number,
    cameraPosition: [number, number, number],
    viewRadius: number,
  ): SplatData {
    this.computeLayout();

    // Filter compounds within view radius
    const visible = this.compounds.filter(c => {
      const dx = c.gridPosition[0] - cameraPosition[0];
      const dy = c.gridPosition[1] - cameraPosition[1];
      const dz = c.gridPosition[2] - cameraPosition[2];
      return Math.sqrt(dx * dx + dy * dy + dz * dz) < viewRadius;
    });

    if (level === 0) {
      return this.generatePointSplats(visible);
    } else if (level === 1) {
      return this.generateSkeletonSplats(visible);
    } else {
      return this.generateFullSplats(visible);
    }
  }

  // Level 0: Single point per compound
  private generatePointSplats(compounds: CompoundEntry[]): SplatData {
    const n = compounds.length;
    const positions = new Float32Array(n * 3);
    const scales = new Float32Array(n * 3);
    const rotations = new Float32Array(n * 4);
    const colors = new Float32Array(n * 4);

    for (let i = 0; i < n; i++) {
      const c = compounds[i];
      const i3 = i * 3;
      const i4 = i * 4;

      positions[i3] = c.gridPosition[0];
      positions[i3 + 1] = c.gridPosition[1];
      positions[i3 + 2] = c.gridPosition[2];

      const r = 0.5;
      scales[i3] = r; scales[i3 + 1] = r; scales[i3 + 2] = r;
      rotations[i4] = 0; rotations[i4 + 1] = 0; rotations[i4 + 2] = 0; rotations[i4 + 3] = 1;

      // Color by activity (if available): green=active, red=inactive
      const activity = c.properties?.activity ?? 0.5;
      colors[i4] = 1 - activity;
      colors[i4 + 1] = activity;
      colors[i4 + 2] = 0.2;
      colors[i4 + 3] = 0.9;
    }

    return { positions, scales, rotations, colors, count: n };
  }

  // Level 1: Centroid atoms only (heavy atoms, no bonds)
  private generateSkeletonSplats(compounds: CompoundEntry[]): SplatData {
    const splatArrays: SplatData[] = [];
    for (const c of compounds) {
      const molSplats = moleculeToSplats(c.molecule, { radiusScale: 0.3 });
      // Offset to grid position
      for (let j = 0; j < molSplats.count; j++) {
        molSplats.positions[j * 3] += c.gridPosition[0];
        molSplats.positions[j * 3 + 1] += c.gridPosition[1];
        molSplats.positions[j * 3 + 2] += c.gridPosition[2];
      }
      splatArrays.push(molSplats);
    }
    return mergeSplats(splatArrays);
  }

  // Level 2: Full atoms + bonds
  private generateFullSplats(compounds: CompoundEntry[]): SplatData {
    const splatArrays: SplatData[] = [];
    for (const c of compounds) {
      const molSplats = moleculeToSplats(c.molecule, { radiusScale: 0.5 });
      // Offset to grid position
      for (let j = 0; j < molSplats.count; j++) {
        molSplats.positions[j * 3] += c.gridPosition[0];
        molSplats.positions[j * 3 + 1] += c.gridPosition[1];
        molSplats.positions[j * 3 + 2] += c.gridPosition[2];
      }
      splatArrays.push(molSplats);
    }
    return mergeSplats(splatArrays);
  }

  get count(): number {
    return this.compounds.length;
  }
}

// Merge multiple SplatData arrays
function mergeSplats(arrays: SplatData[]): SplatData {
  const totalCount = arrays.reduce((s, a) => s + a.count, 0);
  const positions = new Float32Array(totalCount * 3);
  const scales = new Float32Array(totalCount * 3);
  const rotations = new Float32Array(totalCount * 4);
  const colors = new Float32Array(totalCount * 4);

  let offset = 0;
  for (const arr of arrays) {
    positions.set(arr.positions, offset * 3);
    scales.set(arr.scales, offset * 3);
    rotations.set(arr.rotations, offset * 4);
    colors.set(arr.colors, offset * 4);
    offset += arr.count;
  }

  return { positions, scales, rotations, colors, count: totalCount };
}
