import { describe, it, expect } from 'vitest';
import { atomsToSplats } from '../../src/core/atom-to-splat';
import { parsePDB } from '../../src/core/pdb-parser';

describe('Atom to Splat Converter', () => {
  const pdbText = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       2.000   3.000   4.000  1.00  0.00           C
ATOM      3  C   ALA A   1       3.000   4.000   5.000  1.00  0.00           C
ATOM      4  O   ALA A   1       4.000   5.000   6.000  1.00  0.00           O
  `;
  
  const protein = parsePDB(pdbText);

  it('should convert atoms to splat data', () => {
    const splatData = atomsToSplats(protein.atoms);
    
    expect(splatData.count).toBe(4);
    expect(splatData.positions).toBeInstanceOf(Float32Array);
    expect(splatData.scales).toBeInstanceOf(Float32Array);
    expect(splatData.rotations).toBeInstanceOf(Float32Array);
    expect(splatData.colors).toBeInstanceOf(Float32Array);
  });

  it('should have correct array lengths', () => {
    const splatData = atomsToSplats(protein.atoms);
    
    expect(splatData.positions.length).toBe(4 * 3); // 4 atoms * 3 coordinates
    expect(splatData.scales.length).toBe(4 * 3);
    expect(splatData.rotations.length).toBe(4 * 4); // 4 atoms * 4 quaternion components
    expect(splatData.colors.length).toBe(4 * 4); // 4 atoms * 4 RGBA components
  });

  it('should set correct positions', () => {
    const splatData = atomsToSplats(protein.atoms);
    
    // First atom: N at (1, 2, 3)
    expect(splatData.positions[0]).toBe(1.0);
    expect(splatData.positions[1]).toBe(2.0);
    expect(splatData.positions[2]).toBe(3.0);
    
    // Second atom: CA at (2, 3, 4)
    expect(splatData.positions[3]).toBe(2.0);
    expect(splatData.positions[4]).toBe(3.0);
    expect(splatData.positions[5]).toBe(4.0);
  });

  it('should set correct scales based on vdW radius', () => {
    const splatData = atomsToSplats(protein.atoms, { radiusScale: 0.5 });
    
    // Nitrogen vdW radius is 1.55, scaled by 0.5 = 0.775
    expect(splatData.scales[0]).toBeCloseTo(0.775);
    expect(splatData.scales[1]).toBeCloseTo(0.775);
    expect(splatData.scales[2]).toBeCloseTo(0.775);
    
    // Carbon vdW radius is 1.7, scaled by 0.5 = 0.85
    expect(splatData.scales[3]).toBeCloseTo(0.85);
    expect(splatData.scales[4]).toBeCloseTo(0.85);
    expect(splatData.scales[5]).toBeCloseTo(0.85);
  });

  it('should set identity rotations', () => {
    const splatData = atomsToSplats(protein.atoms);
    
    // Identity quaternion: (0, 0, 0, 1)
    for (let i = 0; i < 4; i++) {
      const i4 = i * 4;
      expect(splatData.rotations[i4]).toBe(0);     // x
      expect(splatData.rotations[i4 + 1]).toBe(0); // y
      expect(splatData.rotations[i4 + 2]).toBe(0); // z
      expect(splatData.rotations[i4 + 3]).toBe(1); // w
    }
  });

  it('should set correct colors in element mode', () => {
    const splatData = atomsToSplats(protein.atoms, { colorMode: 'element', opacity: 1.0 });
    
    // Nitrogen color: [48, 80, 240] from elements.ts
    expect(splatData.colors[0]).toBeCloseTo(48 / 255);    // R
    expect(splatData.colors[1]).toBeCloseTo(80 / 255);    // G
    expect(splatData.colors[2]).toBeCloseTo(240 / 255);   // B
    expect(splatData.colors[3]).toBeCloseTo(1.0);          // A
    
    // Carbon color: [100, 100, 100] from elements.ts
    expect(splatData.colors[4]).toBeCloseTo(100 / 255);   // R
    expect(splatData.colors[5]).toBeCloseTo(100 / 255);   // G
    expect(splatData.colors[6]).toBeCloseTo(100 / 255);   // B
    expect(splatData.colors[7]).toBeCloseTo(1.0);          // A
  });

  it('should set correct opacity', () => {
    const splatData = atomsToSplats(protein.atoms, { opacity: 0.5 });
    
    // All alpha values should be 0.5
    for (let i = 0; i < 4; i++) {
      expect(splatData.colors[i * 4 + 3]).toBeCloseTo(0.5);
    }
  });

  it('should filter hydrogen atoms by default', () => {
    const pdbWithH = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
ATOM      2  H   ALA A   1       1.500   2.500   3.500  1.00  0.00           H
ATOM      3  CA  ALA A   1       2.000   3.000   4.000  1.00  0.00           C
    `;
    
    const proteinWithH = parsePDB(pdbWithH);
    const splatData = atomsToSplats(proteinWithH.atoms);
    
    // Should only have 2 atoms (N and CA), not 3
    expect(splatData.count).toBe(2);
  });

  it('should include hydrogen atoms when requested', () => {
    const pdbWithH = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
ATOM      2  H   ALA A   1       1.500   2.500   3.500  1.00  0.00           H
ATOM      3  CA  ALA A   1       2.000   3.000   4.000  1.00  0.00           C
    `;
    
    const proteinWithH = parsePDB(pdbWithH);
    const splatData = atomsToSplats(proteinWithH.atoms, { includeHydrogens: true });
    
    // Should have all 3 atoms
    expect(splatData.count).toBe(3);
  });

  it('should use custom color function', () => {
    const customColorFn = (atom) => {
      if (atom.element === 'N') return [255, 0, 0]; // Red for nitrogen
      return [0, 255, 0]; // Green for others
    };
    
    const splatData = atomsToSplats(protein.atoms, { 
      colorMode: 'custom',
      customColorFn,
      opacity: 1.0,
    });
    
    // Nitrogen should be red
    expect(splatData.colors[0]).toBeCloseTo(255 / 255);
    expect(splatData.colors[1]).toBeCloseTo(0 / 255);
    expect(splatData.colors[2]).toBeCloseTo(0 / 255);
    
    // Carbon should be green
    expect(splatData.colors[4]).toBeCloseTo(0 / 255);
    expect(splatData.colors[5]).toBeCloseTo(255 / 255);
    expect(splatData.colors[6]).toBeCloseTo(0 / 255);
  });

  it('should use chain color mode', () => {
    const pdbTwoChains = `
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
ATOM      2  N   GLY B   1       2.000   3.000   4.000  1.00  0.00           N
    `;
    
    const proteinTwoChains = parsePDB(pdbTwoChains);
    const splatData = atomsToSplats(proteinTwoChains.atoms, { colorMode: 'chain' });
    
    // Chain A and Chain B should have different colors
    const chainAColor = [splatData.colors[0], splatData.colors[1], splatData.colors[2]];
    const chainBColor = [splatData.colors[4], splatData.colors[5], splatData.colors[6]];
    
    // Colors should be different
    expect(chainAColor).not.toEqual(chainBColor);
  });

  it('should handle empty atoms array', () => {
    const splatData = atomsToSplats([]);
    
    expect(splatData.count).toBe(0);
    expect(splatData.positions.length).toBe(0);
    expect(splatData.scales.length).toBe(0);
    expect(splatData.rotations.length).toBe(0);
    expect(splatData.colors.length).toBe(0);
  });

  it('should use default options', () => {
    const splatData = atomsToSplats(protein.atoms);
    
    // Default radiusScale is 0.5
    // Nitrogen vdW radius is 1.55, scaled by 0.5 = 0.775
    expect(splatData.scales[0]).toBeCloseTo(0.775);
    
    // Default opacity is 0.9
    expect(splatData.colors[3]).toBeCloseTo(0.9);
  });
});
