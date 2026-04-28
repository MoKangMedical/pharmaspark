export interface ElementProperties {
    symbol: string;
    name: string;
    color: [number, number, number];
    vdWRadius: number;
    mass: number;
}
export declare const ELEMENTS: Record<string, ElementProperties>;
export declare function getElement(symbol: string): ElementProperties;
export declare const AA_HYDROPHOBICITY: Record<string, number>;
export declare const SS_COLORS: Record<string, [number, number, number]>;
//# sourceMappingURL=elements.d.ts.map