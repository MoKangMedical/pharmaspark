import { describe, it, expect } from 'vitest';
import { parsePDB } from '../../src/core/pdb-parser';

describe('PDB Parser', () => {
  it('should parse PDB file correctly', () => {
    const pdbText = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       2.000   3.000   4.000  1.00  0.00           C
ATOM      3  C   ALA A   1       3.000   4.000   5.000  1.00  0.00           C
ATOM      4  O   ALA A   1       4.000   5.000   6.000  1.00  0.00           O
ATOM      5  CB  ALA A   1       1.500   2.500   3.500  1.00  0.00           C
    `;
    
    const protein = parsePDB(pdbText);
    
    expect(protein.atoms).toHaveLength(5);
    expect(protein.atoms[0].element).toBe('N');
    expect(protein.atoms[1].element).toBe('C');
    expect(protein.atoms[2].element).toBe('C');
    expect(protein.atoms[3].element).toBe('O');
    expect(protein.atoms[4].element).toBe('C');
  });

  it('should parse atom coordinates correctly', () => {
    const pdbText = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
    `;
    
    const protein = parsePDB(pdbText);
    const atom = protein.atoms[0];
    
    expect(atom.x).toBe(1.0);
    expect(atom.y).toBe(2.0);
    expect(atom.z).toBe(3.0);
  });

  it('should parse residue information correctly', () => {
    const pdbText = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       2.000   3.000   4.000  1.00  0.00           C
ATOM      3  N   GLY A   2       3.000   4.000   5.000  1.00  0.00           N
    `;
    
    const protein = parsePDB(pdbText);
    
    // Check chains and residues
    expect(protein.chains).toHaveLength(1);
    expect(protein.chains[0].id).toBe('A');
    expect(protein.chains[0].residues).toHaveLength(2);
    expect(protein.chains[0].residues[0].name).toBe('ALA');
    expect(protein.chains[0].residues[1].name).toBe('GLY');
  });

  it('should parse chain information correctly', () => {
    const pdbText = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
ATOM      2  N   GLY B   1       2.000   3.000   4.000  1.00  0.00           N
    `;
    
    const protein = parsePDB(pdbText);
    
    expect(protein.chains).toHaveLength(2);
    expect(protein.chains[0].id).toBe('A');
    expect(protein.chains[1].id).toBe('B');
  });

  it('should handle empty PDB file', () => {
    const pdbText = '';
    
    const protein = parsePDB(pdbText);
    
    expect(protein.atoms).toHaveLength(0);
    expect(protein.chains).toHaveLength(0);
  });

  it('should parse B-factor correctly', () => {
    const pdbText = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00 25.00           N
    `;
    
    const protein = parsePDB(pdbText);
    const atom = protein.atoms[0];
    
    expect(atom.tempFactor).toBe(25.0);
  });

  it('should parse occupancy correctly', () => {
    const pdbText = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  0.50  0.00           N
    `;
    
    const protein = parsePDB(pdbText);
    const atom = protein.atoms[0];
    
    expect(atom.occupancy).toBe(0.5);
  });

  it('should assign colors based on element', () => {
    const pdbText = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
ATOM      2  C   ALA A   1       2.000   3.000   4.000  1.00  0.00           C
ATOM      3  O   ALA A   1       3.000   4.000   5.000  1.00  0.00           O
    `;
    
    const protein = parsePDB(pdbText);
    
    // Nitrogen should be [48, 80, 240]
    expect(protein.atoms[0].color).toEqual([48, 80, 240]);
    
    // Carbon should be [100, 100, 100]
    expect(protein.atoms[1].color).toEqual([100, 100, 100]);
    
    // Oxygen should be [255, 13, 13]
    expect(protein.atoms[2].color).toEqual([255, 13, 13]);
  });

  it('should assign vdW radius based on element', () => {
    const pdbText = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
ATOM      2  C   ALA A   1       2.000   3.000   4.000  1.00  0.00           C
    `;
    
    const protein = parsePDB(pdbText);
    
    expect(protein.atoms[0].vdWRadius).toBe(1.55);
    expect(protein.atoms[1].vdWRadius).toBe(1.7);
  });
});
