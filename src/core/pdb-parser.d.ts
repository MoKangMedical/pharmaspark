export interface Atom {
    serial: number;
    name: string;
    altLoc: string;
    resName: string;
    chainID: string;
    resSeq: number;
    iCode: string;
    x: number;
    y: number;
    z: number;
    occupancy: number;
    tempFactor: number;
    element: string;
    charge: string;
    color: [number, number, number];
    vdWRadius: number;
}
export interface Residue {
    name: string;
    seq: number;
    chainID: string;
    atoms: Atom[];
    secondaryStructure?: "helix" | "sheet" | "coil" | "turn";
}
export interface Chain {
    id: string;
    residues: Residue[];
}
export interface Protein {
    id: string;
    title: string;
    chains: Chain[];
    atoms: Atom[];
    boundingBox: {
        min: [number, number, number];
        max: [number, number, number];
    };
    center: [number, number, number];
}
export declare function parsePDB(pdbText: string): Protein;
//# sourceMappingURL=pdb-parser.d.ts.map