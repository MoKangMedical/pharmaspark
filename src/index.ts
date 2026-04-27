// PharmaSpark — Main Entry Point
// 3D Gaussian Splatting for Pharmaceutical Visualization

// Core parsers
export { parsePDB, type Atom, type Residue, type Chain, type Protein } from "./core/pdb-parser";
export { parseSDF, parseMOL, type Molecule, type MoleculeAtom, type MoleculeBond, type SDFDocument } from "./core/sdf-parser";

// Element data
export { ELEMENTS, getElement, AA_HYDROPHOBICITY, SS_COLORS, type ElementProperties } from "./core/elements";

// Splat converters
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
export const VERSION = "0.1.0";
export const NAME = "PharmaSpark";
