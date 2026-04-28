import { type Atom } from "./pdb-parser";
import { type Molecule, type MoleculeAtom } from "./sdf-parser";
export interface SplatData {
    positions: Float32Array;
    scales: Float32Array;
    rotations: Float32Array;
    colors: Float32Array;
    count: number;
}
export type ColorMode = "element" | "chain" | "secondary" | "b-factor" | "hydrophobicity" | "custom";
export interface AtomToSplatOptions {
    colorMode?: ColorMode;
    radiusScale?: number;
    opacity?: number;
    includeHydrogens?: boolean;
    customColorFn?: (atom: Atom) => [number, number, number];
}
export declare function atomsToSplats(atoms: Atom[], options?: AtomToSplatOptions): SplatData;
export declare function moleculeToSplats(mol: Molecule, options?: Omit<AtomToSplatOptions, "colorMode">): SplatData;
export declare function bondsToSplats(atoms: MoleculeAtom[], bonds: {
    atom1: number;
    atom2: number;
    order: number;
}[], splatsPerBond?: number, radius?: number, opacity?: number): SplatData;
export interface SurfaceOptions {
    resolution?: number;
    probe?: number;
    opacity?: number;
    colorMode?: "element" | "electrostatic" | "hydrophobicity";
    scale?: number;
}
export declare function generateSurfaceSplats(atoms: Atom[], options?: SurfaceOptions): SplatData;
export interface PocketOptions {
    center: [number, number, number];
    radius: number;
    highlightColor?: [number, number, number];
    dimOpacity?: number;
}
export declare function highlightPocket(splatData: SplatData, options: PocketOptions): SplatData;
//# sourceMappingURL=atom-to-splat.d.ts.map