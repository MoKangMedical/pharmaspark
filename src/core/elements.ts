// PharmaSpark — Element Properties
// CPK coloring convention + van der Waals radii (Å)

export interface ElementProperties {
  symbol: string;
  name: string;
  color: [number, number, number]; // RGB 0-255
  vdWRadius: number; // Å
  mass: number; // Da
}

// CPK coloring + common element radii
export const ELEMENTS: Record<string, ElementProperties> = {
  H:  { symbol: "H",  name: "Hydrogen",  color: [255, 255, 255], vdWRadius: 1.20, mass: 1.008 },
  C:  { symbol: "C",  name: "Carbon",    color: [100, 100, 100], vdWRadius: 1.70, mass: 12.011 },
  N:  { symbol: "N",  name: "Nitrogen",  color: [48,  80,  240], vdWRadius: 1.55, mass: 14.007 },
  O:  { symbol: "O",  name: "Oxygen",    color: [255, 13,  13],  vdWRadius: 1.52, mass: 15.999 },
  F:  { symbol: "F",  name: "Fluorine",  color: [144, 224, 80],  vdWRadius: 1.47, mass: 18.998 },
  P:  { symbol: "P",  name: "Phosphorus",color: [255, 128, 0],   vdWRadius: 1.80, mass: 30.974 },
  S:  { symbol: "S",  name: "Sulfur",    color: [255, 255, 48],  vdWRadius: 1.80, mass: 32.065 },
  Cl: { symbol: "Cl", name: "Chlorine",  color: [31,  240, 31],  vdWRadius: 1.75, mass: 35.453 },
  Br: { symbol: "Br", name: "Bromine",   color: [166, 41,  41],  vdWRadius: 1.85, mass: 79.904 },
  I:  { symbol: "I",  name: "Iodine",    color: [148, 0,   148], vdWRadius: 1.98, mass: 126.90 },
  Fe: { symbol: "Fe", name: "Iron",      color: [224, 102, 51],  vdWRadius: 1.95, mass: 55.845 },
  Zn: { symbol: "Zn", name: "Zinc",      color: [125, 128, 176], vdWRadius: 1.87, mass: 65.38 },
  Mg: { symbol: "Mg", name: "Magnesium", color: [138, 255, 0],   vdWRadius: 1.73, mass: 24.305 },
  Ca: { symbol: "Ca", name: "Calcium",   color: [61,  255, 0],   vdWRadius: 1.97, mass: 40.078 },
  Na: { symbol: "Na", name: "Sodium",    color: [171, 92,  242], vdWRadius: 2.27, mass: 22.990 },
  K:  { symbol: "K",  name: "Potassium", color: [143, 64,  212], vdWRadius: 2.75, mass: 39.098 },
  Mn: { symbol: "Mn", name: "Manganese", color: [156, 122, 199], vdWRadius: 1.87, mass: 54.938 },
  Cu: { symbol: "Cu", name: "Copper",    color: [200, 128, 51],  vdWRadius: 1.78, mass: 63.546 },
  Se: { symbol: "Se", name: "Selenium",  color: [255, 161, 0],   vdWRadius: 1.90, mass: 78.971 },
  DEFAULT: { symbol: "X", name: "Unknown", color: [255, 20, 147], vdWRadius: 1.70, mass: 0 },
};

export function getElement(symbol: string): ElementProperties {
  return ELEMENTS[symbol] || ELEMENTS[symbol.toUpperCase()] || ELEMENTS[symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase()] || ELEMENTS.DEFAULT;
}

// Amino acid hydrophobicity (Kyte-Doolittle)
export const AA_HYDROPHOBICITY: Record<string, number> = {
  I: 4.5, V: 4.2, L: 3.8, F: 2.8, C: 2.5, M: 1.9, A: 1.8,
  G: -0.4, T: -0.7, S: -0.8, W: -0.9, Y: -1.3, P: -1.6,
  H: -3.2, D: -3.5, E: -3.5, N: -3.5, Q: -3.5, K: -3.9, R: -4.5,
};

// Secondary structure colors
export const SS_COLORS: Record<string, [number, number, number]> = {
  helix:  [255, 80,  80],  // Red
  sheet:  [255, 255, 80],  // Yellow
  coil:   [200, 200, 200], // Gray
  turn:   [80,  200, 255], // Cyan
};
