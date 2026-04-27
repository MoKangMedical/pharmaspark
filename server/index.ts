import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parsePDB } from '../src/core/pdb-parser';
import { parseSDF } from '../src/core/sdf-parser';
import { atomsToSplats, moleculeToSplats } from '../src/core/atom-to-splat';
import { splatsToPLY } from '../src/core/ply-export';

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'pharmaspark-api',
    version: '0.1.1',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PharmaSpark API',
    version: '0.1.1',
    endpoints: {
      health: '/health',
      parse: '/api/v1/parse',
      convert: '/api/v1/convert',
      samples: '/api/v1/samples',
    },
  });
});

// Parse PDB file
app.post('/api/v1/parse/pdb', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdbText = req.file.buffer.toString('utf-8');
    const protein = parsePDB(pdbText);

    res.json({
      success: true,
      data: {
        atoms: protein.atoms.length,
        residues: protein.residues.length,
        chains: protein.chains.length,
        helices: protein.helices.length,
        sheets: protein.sheets.length,
        protein: {
          atoms: protein.atoms.slice(0, 100), // Limit for preview
          residues: protein.residues,
          chains: protein.chains,
        },
      },
    });
  } catch (error) {
    console.error('PDB parsing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse PDB file',
      details: error.message,
    });
  }
});

// Parse SDF file
app.post('/api/v1/parse/sdf', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const sdfText = req.file.buffer.toString('utf-8');
    const molecule = parseSDF(sdfText);

    res.json({
      success: true,
      data: {
        name: molecule.name,
        atoms: molecule.atoms.length,
        bonds: molecule.bonds.length,
        molecule: {
          atoms: molecule.atoms.slice(0, 100), // Limit for preview
          bonds: molecule.bonds,
        },
      },
    });
  } catch (error) {
    console.error('SDF parsing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse SDF file',
      details: error.message,
    });
  }
});

// Convert PDB to splat data
app.post('/api/v1/convert/pdb', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdbText = req.file.buffer.toString('utf-8');
    const protein = parsePDB(pdbText);

    // Get options from request body
    const options = {
      colorMode: req.body.colorMode || 'element',
      radiusScale: parseFloat(req.body.radiusScale) || 0.5,
      opacity: parseFloat(req.body.opacity) || 0.9,
      includeHydrogens: req.body.includeHydrogens === 'true',
    };

    // Convert to splats
    const splatData = atomsToSplats(protein.atoms, options);

    // Convert to PLY
    const plyText = splatsToPLY(splatData);

    res.json({
      success: true,
      data: {
        splatCount: splatData.count,
        ply: plyText,
        options,
      },
    });
  } catch (error) {
    console.error('PDB conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert PDB file',
      details: error.message,
    });
  }
});

// Convert SDF to splat data
app.post('/api/v1/convert/sdf', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const sdfText = req.file.buffer.toString('utf-8');
    const molecule = parseSDF(sdfText);

    // Get options from request body
    const options = {
      colorMode: req.body.colorMode || 'element',
      radiusScale: parseFloat(req.body.radiusScale) || 0.5,
      opacity: parseFloat(req.body.opacity) || 0.9,
      includeHydrogens: req.body.includeHydrogens === 'true',
    };

    // Convert to splats
    const splatData = moleculeToSplats(molecule, options);

    // Convert to PLY
    const plyText = splatsToPLY(splatData);

    res.json({
      success: true,
      data: {
        splatCount: splatData.count,
        ply: plyText,
        options,
      },
    });
  } catch (error) {
    console.error('SDF conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert SDF file',
      details: error.message,
    });
  }
});

// Get sample molecules
app.get('/api/v1/samples', (req, res) => {
  res.json({
    success: true,
    data: {
      pdb: [
        { id: '1crn', name: 'Crambin', atoms: 327, residues: 46 },
        { id: '4hhb', name: 'Hemoglobin', atoms: 5746, residues: 574 },
        { id: '1ubq', name: 'Ubiquitin', atoms: 660, residues: 76 },
      ],
      sdf: [
        { id: 'aspirin', name: 'Aspirin', formula: 'C9H8O4', atoms: 21 },
        { id: 'caffeine', name: 'Caffeine', formula: 'C8H10N4O2', atoms: 24 },
      ],
    },
  });
});

// Get sample PDB file
app.get('/api/v1/samples/pdb/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch from RCSB
    const response = await fetch(`https://files.rcsb.org/download/${id}.pdb`);
    
    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: `PDB file ${id} not found`,
      });
    }

    const pdbText = await response.text();
    const protein = parsePDB(pdbText);

    res.json({
      success: true,
      data: {
        id,
        pdb: pdbText,
        atoms: protein.atoms.length,
        residues: protein.residues.length,
        chains: protein.chains.length,
      },
    });
  } catch (error) {
    console.error('Sample PDB error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sample PDB',
      details: error.message,
    });
  }
});

// Get sample SDF file
app.get('/api/v1/samples/sdf/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Sample SDF data
    const samples = {
      aspirin: `
     RDKit          3D

 13 13  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.2500    1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    2.5981    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    2.5981    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7500    1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.2500   -1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.7500   -1.2990    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000   -2.5981    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    3.7500    1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.5000    2.5981    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    4.5000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    6.0000    2.5981    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0
  2  3  2  0
  3  4  1  0
  4  5  2  0
  5  6  1  0
  6  1  2  0
  2  7  1  0
  7  8  2  0
  7  9  1  0
  3 10  1  0
 10 11  2  0
 10 12  1  0
 11 13  1  0
M  END`,
      caffeine: `
     RDKit          3D

 14 15  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    2.2500    1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    2.5981    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    2.5981    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7500    1.2990    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    3.7500    1.2990    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    4.5000    2.5981    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.7500    3.8971    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    2.2500    3.8971    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.0000    2.5981    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -2.2500    1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000   -1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.5000    5.1962    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0
  2  3  1  0
  3  4  1  0
  4  5  1  0
  5  6  1  0
  6  1  1  0
  3  7  1  0
  7  8  1  0
  8  9  1  0
  9 10  1  0
 10  4  1  0
  8 11  2  0
  6 12  1  0
  2 13  1  0
  9 14  1  0
M  END`,
    };

    if (!samples[id]) {
      return res.status(404).json({
        success: false,
        error: `Sample SDF ${id} not found`,
      });
    }

    const sdfText = samples[id];
    const molecule = parseSDF(sdfText);

    res.json({
      success: true,
      data: {
        id,
        sdf: sdfText,
        name: molecule.name,
        atoms: molecule.atoms.length,
        bonds: molecule.bonds.length,
      },
    });
  } catch (error) {
    console.error('Sample SDF error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sample SDF',
      details: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message,
  });
});

// Start server
app.listen(port, () => {
  console.log(`PharmaSpark API server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API documentation: http://localhost:${port}/`);
});

export default app;
