import { describe, it, expect } from 'vitest';
import { parseSDF } from '../../src/core/sdf-parser';

describe('SDF Parser', () => {
  it('should parse SDF file correctly', () => {
    const sdfText = `
     RDKit          3D

  3  2  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    1.5000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0
  1  3  1  0
M  END
$$$$
    `;
    
    const result = parseSDF(sdfText);
    
    expect(result.molecules).toHaveLength(1);
    
    const molecule = result.molecules[0];
    expect(molecule.atoms).toHaveLength(3);
    expect(molecule.bonds).toHaveLength(2);
  });

  it('should parse atom coordinates correctly', () => {
    const sdfText = `
     RDKit          3D

  1  0  0  0  0  0  0  0  0  0999 V2000
    1.0000    2.0000    3.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
M  END
$$$$
    `;
    
    const result = parseSDF(sdfText);
    const molecule = result.molecules[0];
    const atom = molecule.atoms[0];
    
    expect(atom.x).toBe(1.0);
    expect(atom.y).toBe(2.0);
    expect(atom.z).toBe(3.0);
  });

  it('should parse atom elements correctly', () => {
    const sdfText = `
     RDKit          3D

  3  0  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.0000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    1.0000    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
M  END
$$$$
    `;
    
    const result = parseSDF(sdfText);
    const molecule = result.molecules[0];
    
    expect(molecule.atoms[0].element).toBe('C');
    expect(molecule.atoms[1].element).toBe('O');
    expect(molecule.atoms[2].element).toBe('N');
  });

  it('should parse bond information correctly', () => {
    const sdfText = `
     RDKit          3D

  3  3  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    1.5000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0
  1  3  1  0
  2  3  1  0
M  END
$$$$
    `;
    
    const result = parseSDF(sdfText);
    const molecule = result.molecules[0];
    
    expect(molecule.bonds[0].atom1).toBe(0);
    expect(molecule.bonds[0].atom2).toBe(1);
    expect(molecule.bonds[0].order).toBe(2);
    
    expect(molecule.bonds[1].atom1).toBe(0);
    expect(molecule.bonds[1].atom2).toBe(2);
    expect(molecule.bonds[1].order).toBe(1);
  });

  it('should parse molecule name', () => {
    const sdfText = `
     TestMolecule
     
  1  0  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
M  END
$$$$
    `;
    
    const result = parseSDF(sdfText);
    const molecule = result.molecules[0];
    
    expect(molecule.name).toBe('TestMolecule');
  });

  it('should handle empty SDF file', () => {
    const sdfText = '';
    
    const result = parseSDF(sdfText);
    
    expect(result.molecules).toHaveLength(0);
  });

  it('should assign colors based on element', () => {
    const sdfText = `
     RDKit          3D

  3  0  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.0000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    1.0000    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
M  END
$$$$
    `;
    
    const result = parseSDF(sdfText);
    const molecule = result.molecules[0];
    
    // Carbon should be gray
    expect(molecule.atoms[0].color).toEqual([200, 200, 200]);
    
    // Oxygen should be red
    expect(molecule.atoms[1].color).toEqual([255, 0, 0]);
    
    // Nitrogen should be blue
    expect(molecule.atoms[2].color).toEqual([0, 0, 255]);
  });

  it('should assign vdW radius based on element', () => {
    const sdfText = `
     RDKit          3D

  2  0  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.0000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
M  END
$$$$
    `;
    
    const result = parseSDF(sdfText);
    const molecule = result.molecules[0];
    
    expect(molecule.atoms[0].vdWRadius).toBe(1.7);
    expect(molecule.atoms[1].vdWRadius).toBe(1.52);
  });
});
