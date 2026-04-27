// PharmaSpark — Additional File Format Parsers
// Support for MOL2, XYZ, and other molecular file formats

import { type Molecule, type MoleculeAtom, type MoleculeBond } from "./sdf-parser";
import { ELEMENTS, getElement } from "./elements";

// ============ MOL2 Parser ============

export interface MOL2Molecule {
  name: string;
  atoms: MOL2Atom[];
  bonds: MOL2Bond[];
  residues: MOL2Residue[];
}

export interface MOL2Atom {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  element: string;
  atomType: string;
  residueId: number;
  residueName: string;
  charge: number;
  color: [number, number, number];
  vdWRadius: number;
}

export interface MOL2Bond {
  id: number;
  atom1: number;
  atom2: number;
  bondType: string;
  order: number;
}

export interface MOL2Residue {
  id: number;
  name: string;
  atoms: number[];
}

// Parse MOL2 file
export function parseMOL2(mol2Text: string): MOL2Molecule {
  const lines = mol2Text.split('\n');
  let name = '';
  const atoms: MOL2Atom[] = [];
  const bonds: MOL2Bond[] = [];
  const residues: MOL2Residue[] = [];
  
  let currentSection = '';
  let atomId = 0;
  let bondId = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    // Check for section headers
    if (trimmed.startsWith('@<TRIPOS>')) {
      currentSection = trimmed.substring(9);
      continue;
    }
    
    // Parse molecule section
    if (currentSection === 'MOLECULE') {
      if (!name && trimmed && !trimmed.startsWith('@')) {
        name = trimmed;
      }
      continue;
    }
    
    // Parse atom section
    if (currentSection === 'ATOM') {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 9) {
        const id = parseInt(parts[0]);
        const atomName = parts[1];
        const x = parseFloat(parts[2]);
        const y = parseFloat(parts[3]);
        const z = parseFloat(parts[4]);
        const atomType = parts[5];
        const residueId = parseInt(parts[6]);
        const residueName = parts[7];
        const charge = parseFloat(parts[8]);
        
        // Extract element from atom type
        const element = atomType.split('.')[0];
        
        // Get element properties
        const elementProps = getElement(element);
        const color = elementProps ? elementProps.color : [200, 200, 200];
        const vdWRadius = elementProps ? elementProps.vdWRadius : 1.7;
        
        atoms.push({
          id,
          name: atomName,
          x,
          y,
          z,
          element,
          atomType,
          residueId,
          residueName,
          charge,
          color,
          vdWRadius,
        });
        
        atomId = Math.max(atomId, id);
      }
      continue;
    }
    
    // Parse bond section
    if (currentSection === 'BOND') {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 4) {
        const id = parseInt(parts[0]);
        const atom1 = parseInt(parts[1]);
        const atom2 = parseInt(parts[2]);
        const bondType = parts[3];
        
        // Determine bond order
        let order = 1;
        if (bondType === '2' || bondType === 'double') {
          order = 2;
        } else if (bondType === '3' || bondType === 'triple') {
          order = 3;
        } else if (bondType === 'ar' || bondType === 'aromatic') {
          order = 1.5;
        }
        
        bonds.push({
          id,
          atom1,
          atom2,
          bondType,
          order,
        });
        
        bondId = Math.max(bondId, id);
      }
      continue;
    }
    
    // Parse substructure section
    if (currentSection === 'SUBSTRUCTURE') {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        const id = parseInt(parts[0]);
        const residueName = parts[1];
        
        // Find atoms in this residue
        const residueAtoms = atoms
          .filter(atom => atom.residueId === id)
          .map(atom => atom.id);
        
        residues.push({
          id,
          name: residueName,
          atoms: residueAtoms,
        });
      }
      continue;
    }
  }
  
  return {
    name,
    atoms,
    bonds,
    residues,
  };
}

// ============ XYZ Parser ============

export interface XYZMolecule {
  name: string;
  atoms: XYZAtom[];
  comment: string;
}

export interface XYZAtom {
  element: string;
  x: number;
  y: number;
  z: number;
  color: [number, number, number];
  vdWRadius: number;
}

// Parse XYZ file
export function parseXYZ(xyzText: string): XYZMolecule {
  const lines = xyzText.split('\n');
  let name = '';
  let comment = '';
  const atoms: XYZAtom[] = [];
  
  let atomCount = 0;
  let lineIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      continue;
    }
    
    // First line: atom count
    if (lineIndex === 0) {
      atomCount = parseInt(line);
      if (isNaN(atomCount)) {
        throw new Error('Invalid XYZ file: first line must be atom count');
      }
      lineIndex++;
      continue;
    }
    
    // Second line: comment/title
    if (lineIndex === 1) {
      comment = line;
      name = line;
      lineIndex++;
      continue;
    }
    
    // Remaining lines: atoms
    if (lineIndex >= 2 && atoms.length < atomCount) {
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        const element = parts[0];
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        const z = parseFloat(parts[3]);
        
        // Get element properties
        const elementProps = getElement(element);
        const color = elementProps ? elementProps.color : [200, 200, 200];
        const vdWRadius = elementProps ? elementProps.vdWRadius : 1.7;
        
        atoms.push({
          element,
          x,
          y,
          z,
          color,
          vdWRadius,
        });
      }
      lineIndex++;
    }
  }
  
  return {
    name,
    atoms,
    comment,
  };
}

// ============ PQR Parser ============

export interface PQRMolecule {
  name: string;
  atoms: PQRAtom[];
  bonds: PQRBond[];
}

export interface PQRAtom {
  id: number;
  name: string;
  resName: string;
  chainID: string;
  resSeq: number;
  x: number;
  y: number;
  z: number;
  charge: number;
  radius: number;
  element: string;
  color: [number, number, number];
  vdWRadius: number;
}

export interface PQRBond {
  atom1: number;
  atom2: number;
  order: number;
}

// Parse PQR file (similar to PDB but with charge and radius)
export function parsePQR(pqrText: string): PQRMolecule {
  const lines = pqrText.split('\n');
  const atoms: PQRAtom[] = [];
  const bonds: PQRBond[] = [];
  
  let name = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) {
      continue;
    }
    
    // Parse REMARK lines for name
    if (trimmed.startsWith('REMARK')) {
      if (trimmed.includes('Name:')) {
        name = trimmed.split('Name:')[1].trim();
      }
      continue;
    }
    
    // Parse ATOM lines
    if (trimmed.startsWith('ATOM') || trimmed.startsWith('HETATM')) {
      const id = parseInt(trimmed.substring(6, 11).trim());
      const atomName = trimmed.substring(12, 16).trim();
      const resName = trimmed.substring(17, 20).trim();
      const chainID = trimmed.substring(21, 22).trim();
      const resSeq = parseInt(trimmed.substring(22, 26).trim());
      const x = parseFloat(trimmed.substring(30, 38).trim());
      const y = parseFloat(trimmed.substring(38, 46).trim());
      const z = parseFloat(trimmed.substring(46, 54).trim());
      const charge = parseFloat(trimmed.substring(54, 62).trim());
      const radius = parseFloat(trimmed.substring(62, 70).trim());
      
      // Determine element from atom name
      let element = atomName.charAt(0);
      if (atomName.length > 1 && atomName.charAt(1) >= 'a' && atomName.charAt(1) <= 'z') {
        element = atomName.substring(0, 2);
      }
      
      // Get element properties
      const elementProps = getElement(element);
      const color = elementProps ? elementProps.color : [200, 200, 200];
      const vdWRadius = elementProps ? elementProps.vdWRadius : radius;
      
      atoms.push({
        id,
        name: atomName,
        resName,
        chainID,
        resSeq,
        x,
        y,
        z,
        charge,
        radius,
        element,
        color,
        vdWRadius,
      });
      continue;
    }
    
    // Parse CONECT lines for bonds
    if (trimmed.startsWith('CONECT')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        const atom1 = parseInt(parts[1]);
        for (let i = 2; i < parts.length; i++) {
          const atom2 = parseInt(parts[i]);
          if (!isNaN(atom2)) {
            bonds.push({
              atom1,
              atom2,
              order: 1, // Default to single bond
            });
          }
        }
      }
      continue;
    }
  }
  
  return {
    name,
    atoms,
    bonds,
  };
}

// ============ Conversion Functions ============

// Convert MOL2 to standard Molecule format
export function mol2ToMolecule(mol2: MOL2Molecule): Molecule {
  return {
    name: mol2.name,
    atoms: mol2.atoms.map(atom => ({
      x: atom.x,
      y: atom.y,
      z: atom.z,
      element: atom.element,
      color: atom.color,
      vdWRadius: atom.vdWRadius,
    })),
    bonds: mol2.bonds.map(bond => ({
      atom1: bond.atom1 - 1, // Convert to 0-based index
      atom2: bond.atom2 - 1,
      order: bond.order,
    })),
  };
}

// Convert XYZ to standard Molecule format
export function xyzToMolecule(xyz: XYZMolecule): Molecule {
  return {
    name: xyz.name,
    atoms: xyz.atoms.map(atom => ({
      x: atom.x,
      y: atom.y,
      z: atom.z,
      element: atom.element,
      color: atom.color,
      vdWRadius: atom.vdWRadius,
    })),
    bonds: [], // XYZ files don't contain bond information
  };
}

// Convert PQR to standard Molecule format
export function pqrToMolecule(pqr: PQRMolecule): Molecule {
  return {
    name: pqr.name,
    atoms: pqr.atoms.map(atom => ({
      x: atom.x,
      y: atom.y,
      z: atom.z,
      element: atom.element,
      color: atom.color,
      vdWRadius: atom.vdWRadius,
    })),
    bonds: pqr.bonds.map(bond => ({
      atom1: bond.atom1 - 1, // Convert to 0-based index
      atom2: bond.atom2 - 1,
      order: bond.order,
    })),
  };
}

// ============ File Format Detection ============

export type FileFormat = 'pdb' | 'sdf' | 'mol2' | 'xyz' | 'pqr' | 'unknown';

// Detect file format from content
export function detectFileFormat(content: string): FileFormat {
  const lines = content.split('\n');
  const firstLine = lines[0]?.trim() || '';
  
  // PDB format
  if (firstLine.startsWith('HEADER') || firstLine.startsWith('TITLE') || 
      firstLine.startsWith('ATOM') || firstLine.startsWith('HETATM')) {
    return 'pdb';
  }
  
  // SDF format
  if (firstLine.includes('V2000') || firstLine.includes('V3000') || 
      content.includes('M  END')) {
    return 'sdf';
  }
  
  // MOL2 format
  if (content.includes('@<TRIPOS>')) {
    return 'mol2';
  }
  
  // XYZ format
  const firstLineNum = parseInt(firstLine);
  if (!isNaN(firstLineNum) && lines.length >= firstLineNum + 2) {
    return 'xyz';
  }
  
  // PQR format
  if (content.includes('REMARK') && (content.includes('ATOM') || content.includes('HETATM'))) {
    return 'pqr';
  }
  
  return 'unknown';
}

// Parse file based on detected format
export function parseMolecularFile(content: string): { format: FileFormat; molecule: Molecule } {
  const format = detectFileFormat(content);
  
  switch (format) {
    case 'pdb':
      // Import and use PDB parser
      const { parsePDB } = require('./pdb-parser');
      const protein = parsePDB(content);
      return {
        format,
        molecule: {
          name: 'PDB Molecule',
          atoms: protein.atoms.map(atom => ({
            x: atom.x,
            y: atom.y,
            z: atom.z,
            element: atom.element,
            color: atom.color,
            vdWRadius: atom.vdWRadius,
          })),
          bonds: [], // PDB doesn't directly provide bond information
        },
      };
    
    case 'sdf':
      const { parseSDF } = require('./sdf-parser');
      return {
        format,
        molecule: parseSDF(content),
      };
    
    case 'mol2':
      const mol2 = parseMOL2(content);
      return {
        format,
        molecule: mol2ToMolecule(mol2),
      };
    
    case 'xyz':
      const xyz = parseXYZ(content);
      return {
        format,
        molecule: xyzToMolecule(xyz),
      };
    
    case 'pqr':
      const pqr = parsePQR(content);
      return {
        format,
        molecule: pqrToMolecule(pqr),
      };
    
    default:
      throw new Error(`Unsupported file format: ${format}`);
  }
}

// ============ Export Functions ============

export {
  parseMOL2,
  parseXYZ,
  parsePQR,
  mol2ToMolecule,
  xyzToMolecule,
  pqrToMolecule,
  detectFileFormat,
  parseMolecularFile,
};
