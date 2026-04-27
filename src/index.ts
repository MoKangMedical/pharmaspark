// PharmaSpark — Main Entry Point
// 3D Gaussian Splatting for Pharmaceutical Visualization

// Core parsers
export { parsePDB, type Atom, type Residue, type Chain, type Protein } from "./core/pdb-parser";
export { parseSDF, parseMOL, type Molecule, type MoleculeAtom, type MoleculeBond, type SDFDocument } from "./core/sdf-parser";

// Element data
export { ELEMENTS, getElement, AA_HYDROPHOBICITY, SS_COLORS, type ElementProperties } from "./core/elements";

// Original Splat converters
export {
  atomsToSplats,
  moleculeToSplats,
  bondsToSplats,
  generateSurfaceSplats,
  highlightPocket,
  type SplatData,
  type AtomToSplatOptions,
  type ColorMode,
  type SurfaceOptions,
  type PocketOptions,
} from "./core/atom-to-splat";

// Optimized Splat converters (for large molecules)
export {
  atomsToSplats as atomsToSplatsOptimized,
  moleculeToSplats as moleculeToSplatsOptimized,
  generateSurfaceSplats as generateSurfaceSplatsOptimized,
  highlightPocket as highlightPocketOptimized,
  generateLODSplats,
  measurePerformance,
  type LODSplatData,
  type PerformanceMetrics,
} from "./core/atom-to-splat-optimized";

// Advanced visualization options
export {
  visualizeAtoms,
  visualizeCartoon,
  visualizeBackbone,
  getResidueColor,
  getElectrostaticColor,
  getHydrophobicityColor,
  getRainbowColor,
  getGradientColor,
  type VisualizationMode,
  type ColorScheme,
  type VisualizationOptions,
} from "./core/visualization-options";

// Additional file format parsers
export {
  parseMOL2,
  parseXYZ,
  parsePQR,
  mol2ToMolecule,
  xyzToMolecule,
  pqrToMolecule,
  detectFileFormat,
  parseMolecularFile,
  type MOL2Molecule,
  type MOL2Atom,
  type MOL2Bond,
  type MOL2Residue,
  type XYZMolecule,
  type XYZAtom,
  type PQRMolecule,
  type PQRAtom,
  type PQRBond,
  type FileFormat,
} from "./core/file-formats";

// PLY export
export { splatsToPLY, splatsToBlob, splatsToDownloadURL } from "./core/ply-export";

// Drug library LoD
export {
  DrugLibraryRenderer,
  type CompoundEntry,
  type DrugLibraryConfig,
  type LoDLevel,
} from "./core/drug-library";

// Docking visualization
export {
  interactionLinesToSplats,
  pharmacophoreToSplats,
  type DockingResult,
  type MolecularInteraction,
  type PharmacophoreFeature,
} from "./core/docking";

// Renderers
export { PharmaSparkViewer, type PharmaSparkViewerOptions } from "./renderers/spark-bridge";

// Version
export const VERSION = "0.1.5";
export const NAME = "PharmaSpark";
