// PharmaSpark — SDF/MOL File Parser
// Parses small molecule files (SDF, MOL, MOL2) into structured data

import { getElement } from "./elements";

export interface MoleculeAtom {
  index: number;
  x: number;
  y: number;
  z: number;
  element: string;
  charge: number;
  color: [number, number, number];
  vdWRadius: number;
}

export interface MoleculeBond {
  atom1: number;
  atom2: number;
  order: number; // 1=single, 2=double, 3=triple
}

export interface Molecule {
  name: string;
  atoms: MoleculeAtom[];
  bonds: MoleculeBond[];
  properties: Record<string, string>;
  center: [number, number, number];
  boundingBox: { min: [number, number, number]; max: [number, number, number] };
  // Computed
  molecularWeight: number;
  formula: string;
}

export interface SDFDocument {
  molecules: Molecule[];
}

// Parse single MOL block (V2000)
function parseMolBlock(lines: string[], startLine: number): Molecule | null {
  if (startLine + 3 >= lines.length) return null;

  const name = lines[startLine].trim();
  const countsLine = lines[startLine + 3];

  if (!countsLine || countsLine.length < 10) return null;

  const numAtoms = parseInt(countsLine.substring(0, 3).trim());
  const numBonds = parseInt(countsLine.substring(3, 6).trim());

  const atoms: MoleculeAtom[] = [];
  for (let i = 0; i < numAtoms; i++) {
    const line = lines[startLine + 4 + i];
    if (!line) continue;

    const parts = line.trim().split(/\s+/);
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    const z = parseFloat(parts[2]);
    const element = parts[3] || "C";
    const elemProps = getElement(element);

    atoms.push({
      index: i,
      x, y, z,
      element,
      charge: parts.length > 6 ? parseInt(parts[6]) || 0 : 0,
      color: elemProps.color,
      vdWRadius: elemProps.vdWRadius,
    });
  }

  const bonds: MoleculeBond[] = [];
  const bondStart = startLine + 4 + numAtoms;
  for (let i = 0; i < numBonds; i++) {
    const line = lines[bondStart + i];
    if (!line) continue;

    const parts = line.trim().split(/\s+/);
    bonds.push({
      atom1: parseInt(parts[0]) - 1, // 1-indexed to 0-indexed
      atom2: parseInt(parts[1]) - 1,
      order: parseInt(parts[2]) || 1,
    });
  }

  // Parse properties section
  const properties: Record<string, string> = {};
  let propLine = bondStart + numBonds;
  while (propLine < lines.length) {
    const line = lines[propLine];
    if (line.startsWith("M  END")) break;
    if (line.startsWith(">")) {
      const match = line.match(/<(.+?)>/);
      if (match) {
        const key = match[1];
        const value = lines[propLine + 1]?.trim() || "";
        properties[key] = value;
      }
    }
    propLine++;
  }

  // Compute bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let totalMass = 0;
  const elementCounts: Record<string, number> = {};

  for (const a of atoms) {
    minX = Math.min(minX, a.x); minY = Math.min(minY, a.y); minZ = Math.min(minZ, a.z);
    maxX = Math.max(maxX, a.x); maxY = Math.max(maxY, a.y); maxZ = Math.max(maxZ, a.z);
    const elem = getElement(a.element);
    totalMass += elem.mass;
    elementCounts[a.element] = (elementCounts[a.element] || 0) + 1;
  }

  const formula = Object.entries(elementCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([el, count]) => count > 1 ? `${el}${count}` : el)
    .join("");

  return {
    name: name || "unnamed",
    atoms,
    bonds,
    properties,
    center: atoms.length > 0 ? [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2] : [0, 0, 0],
    boundingBox: { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] },
    molecularWeight: totalMass,
    formula,
  };
}

// Parse SDF file (multiple molecules separated by $$$$)
export function parseSDF(sdfText: string): SDFDocument {
  const lines = sdfText.split("\n");
  const molecules: Molecule[] = [];
  let currentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "$$$$") {
      const mol = parseMolBlock(lines, currentStart);
      if (mol) molecules.push(mol);
      currentStart = i + 1;
    }
  }

  // Handle last molecule if no $$$$ terminator
  if (currentStart < lines.length - 3) {
    const mol = parseMolBlock(lines, currentStart);
    if (mol) molecules.push(mol);
  }

  return { molecules };
}

// Parse single MOL file
export function parseMOL(molText: string): Molecule | null {
  return parseMolBlock(molText.split("\n"), 0);
}
