import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { parsePDB } from '../src/core/pdb-parser';
import { parseSDF } from '../src/core/sdf-parser';
import { atomsToSplats, moleculeToSplats } from '../src/core/atom-to-splat';
import { splatsToPLY } from '../src/core/ply-export';

const app = express();
const port = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'pharmaspark-secret-key-2024';

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

// ============ In-Memory Database (Replace with real DB in production) ============

interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  createdAt: Date;
  subscription: 'free' | 'pro' | 'enterprise';
  apiCalls: number;
  apiLimit: number;
}

interface MoleculeRecord {
  id: string;
  userId: string;
  name: string;
  format: string;
  data: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  tags: string[];
}

interface AnalysisRecord {
  id: string;
  userId: string;
  moleculeId: string;
  type: string;
  result: any;
  createdAt: Date;
}

// In-memory storage (replace with database in production)
const users: Map<string, User> = new Map();
const molecules: Map<string, MoleculeRecord> = new Map();
const analyses: Map<string, AnalysisRecord> = new Map();

// ============ Authentication Middleware ============

interface AuthRequest extends express.Request {
  user?: User;
}

const authenticateToken = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============ Health Check ============

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'pharmaspark-api',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
  });
});

// ============ Root Endpoint ============

app.get('/', (req, res) => {
  res.json({
    message: 'PharmaSpark API',
    version: '0.2.0',
    documentation: '/api/docs',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
      },
      molecules: {
        list: 'GET /api/molecules',
        get: 'GET /api/molecules/:id',
        create: 'POST /api/molecules',
        update: 'PUT /api/molecules/:id',
        delete: 'DELETE /api/molecules/:id',
      },
      analysis: {
        analyze: 'POST /api/analysis',
        list: 'GET /api/analysis',
        get: 'GET /api/analysis/:id',
      },
      convert: {
        pdb: 'POST /api/convert/pdb',
        sdf: 'POST /api/convert/sdf',
      },
      samples: 'GET /api/samples',
    },
  });
});

// ============ Authentication Endpoints ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    // Check if user already exists
    for (const user of users.values()) {
      if (user.email === email) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (user.username === username) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user: User = {
      id: uuidv4(),
      email,
      username,
      password: hashedPassword,
      createdAt: new Date(),
      subscription: 'free',
      apiCalls: 0,
      apiLimit: 1000, // Free tier: 1000 API calls per month
    };

    users.set(user.id, user);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        subscription: user.subscription,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    let foundUser: User | null = null;
    for (const user of users.values()) {
      if (user.email === email) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: foundUser.id, email: foundUser.email, username: foundUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: foundUser.id,
        email: foundUser.email,
        username: foundUser.username,
        subscription: foundUser.subscription,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get profile
app.get('/api/auth/profile', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  // Find user in storage
  const storedUser = users.get(user.id);
  if (!storedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: storedUser.id,
      email: storedUser.email,
      username: storedUser.username,
      subscription: storedUser.subscription,
      apiCalls: storedUser.apiCalls,
      apiLimit: storedUser.apiLimit,
      createdAt: storedUser.createdAt,
    },
  });
});

// ============ Molecule Endpoints ============

// List molecules
app.get('/api/molecules', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const userMolecules = Array.from(molecules.values())
    .filter(m => m.userId === user.id || m.isPublic)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  res.json({
    molecules: userMolecules.map(m => ({
      id: m.id,
      name: m.name,
      format: m.format,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      isPublic: m.isPublic,
      tags: m.tags,
    })),
    total: userMolecules.length,
  });
});

// Get molecule
app.get('/api/molecules/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const molecule = molecules.get(req.params.id);
  if (!molecule) {
    return res.status(404).json({ error: 'Molecule not found' });
  }

  // Check access
  if (molecule.userId !== user.id && !molecule.isPublic) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({
    molecule: {
      id: molecule.id,
      name: molecule.name,
      format: molecule.format,
      data: molecule.data,
      createdAt: molecule.createdAt,
      updatedAt: molecule.updatedAt,
      isPublic: molecule.isPublic,
      tags: molecule.tags,
    },
  });
});

// Create molecule
app.post('/api/molecules', authenticateToken, upload.single('file'), (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  // Check API limit
  const storedUser = users.get(user.id);
  if (!storedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (storedUser.apiCalls >= storedUser.apiLimit) {
    return res.status(429).json({ error: 'API limit exceeded' });
  }

  try {
    let name = req.body.name || 'Unnamed Molecule';
    let format = req.body.format || 'pdb';
    let data = '';
    let tags = req.body.tags ? JSON.parse(req.body.tags) : [];

    if (req.file) {
      // File upload
      data = req.file.buffer.toString('utf-8');
      const originalName = req.file.originalname;
      format = originalName.split('.').pop()?.toLowerCase() || 'pdb';
      name = req.body.name || originalName;
    } else if (req.body.data) {
      // Direct data
      data = req.body.data;
    } else {
      return res.status(400).json({ error: 'No file or data provided' });
    }

    // Create molecule record
    const molecule: MoleculeRecord = {
      id: uuidv4(),
      userId: user.id,
      name,
      format,
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: req.body.isPublic === 'true',
      tags,
    };

    molecules.set(molecule.id, molecule);

    // Update API calls
    storedUser.apiCalls++;
    users.set(user.id, storedUser);

    res.status(201).json({
      message: 'Molecule created successfully',
      molecule: {
        id: molecule.id,
        name: molecule.name,
        format: molecule.format,
        createdAt: molecule.createdAt,
        isPublic: molecule.isPublic,
        tags: molecule.tags,
      },
    });
  } catch (error) {
    console.error('Create molecule error:', error);
    res.status(500).json({ error: 'Failed to create molecule' });
  }
});

// Update molecule
app.put('/api/molecules/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const molecule = molecules.get(req.params.id);
  if (!molecule) {
    return res.status(404).json({ error: 'Molecule not found' });
  }

  // Check ownership
  if (molecule.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Update fields
  if (req.body.name) molecule.name = req.body.name;
  if (req.body.isPublic !== undefined) molecule.isPublic = req.body.isPublic;
  if (req.body.tags) molecule.tags = JSON.parse(req.body.tags);
  molecule.updatedAt = new Date();

  molecules.set(molecule.id, molecule);

  res.json({
    message: 'Molecule updated successfully',
    molecule: {
      id: molecule.id,
      name: molecule.name,
      format: molecule.format,
      updatedAt: molecule.updatedAt,
      isPublic: molecule.isPublic,
      tags: molecule.tags,
    },
  });
});

// Delete molecule
app.delete('/api/molecules/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const molecule = molecules.get(req.params.id);
  if (!molecule) {
    return res.status(404).json({ error: 'Molecule not found' });
  }

  // Check ownership
  if (molecule.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  molecules.delete(req.params.id);

  res.json({
    message: 'Molecule deleted successfully',
  });
});

// ============ Analysis Endpoints ============

// Analyze molecule
app.post('/api/analysis', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  // Check API limit
  const storedUser = users.get(user.id);
  if (!storedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (storedUser.apiCalls >= storedUser.apiLimit) {
    return res.status(429).json({ error: 'API limit exceeded' });
  }

  try {
    const { moleculeId, type, options } = req.body;

    // Get molecule
    const molecule = molecules.get(moleculeId);
    if (!molecule) {
      return res.status(404).json({ error: 'Molecule not found' });
    }

    // Check access
    if (molecule.userId !== user.id && !molecule.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Parse molecule
    let parsedMolecule;
    if (molecule.format === 'pdb') {
      const protein = parsePDB(molecule.data);
      parsedMolecule = {
        atoms: protein.atoms,
        residues: protein.chains.flatMap(c => c.residues),
        chains: protein.chains,
      };
    } else if (molecule.format === 'sdf') {
      parsedMolecule = parseSDF(molecule.data);
    } else {
      return res.status(400).json({ error: 'Unsupported format for analysis' });
    }

    // Perform analysis based on type
    let result: any = {};

    switch (type) {
      case 'basic':
        result = {
          atomCount: parsedMolecule.atoms?.length || 0,
          residueCount: parsedMolecule.residues?.length || 0,
          chainCount: parsedMolecule.chains?.length || 0,
          elements: [...new Set(parsedMolecule.atoms?.map((a: any) => a.element) || [])],
        };
        break;

      case 'splat':
        const splatData = atomsToSplats(parsedMolecule.atoms || [], options);
        result = {
          splatCount: splatData.count,
          hasPositions: splatData.positions.length > 0,
          hasColors: splatData.colors.length > 0,
        };
        break;

      case 'surface':
        // Generate surface analysis
        result = {
          estimatedSurfaceArea: (parsedMolecule.atoms?.length || 0) * 10, // Simplified
          estimatedVolume: (parsedMolecule.atoms?.length || 0) * 5,
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid analysis type' });
    }

    // Create analysis record
    const analysis: AnalysisRecord = {
      id: uuidv4(),
      userId: user.id,
      moleculeId,
      type,
      result,
      createdAt: new Date(),
    };

    analyses.set(analysis.id, analysis);

    // Update API calls
    storedUser.apiCalls++;
    users.set(user.id, storedUser);

    res.status(201).json({
      message: 'Analysis completed',
      analysis: {
        id: analysis.id,
        type: analysis.type,
        result: analysis.result,
        createdAt: analysis.createdAt,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// List analyses
app.get('/api/analysis', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const userAnalyses = Array.from(analyses.values())
    .filter(a => a.userId === user.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({
    analyses: userAnalyses.map(a => ({
      id: a.id,
      moleculeId: a.moleculeId,
      type: a.type,
      createdAt: a.createdAt,
    })),
    total: userAnalyses.length,
  });
});

// Get analysis
app.get('/api/analysis/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const analysis = analyses.get(req.params.id);
  if (!analysis) {
    return res.status(404).json({ error: 'Analysis not found' });
  }

  // Check access
  if (analysis.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({
    analysis: {
      id: analysis.id,
      moleculeId: analysis.moleculeId,
      type: analysis.type,
      result: analysis.result,
      createdAt: analysis.createdAt,
    },
  });
});

// ============ Convert Endpoints (Legacy) ============

// Parse PDB file
app.post('/api/convert/pdb', upload.single('file'), (req, res) => {
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
        residues: protein.chains.flatMap(c => c.residues).length,
        chains: protein.chains.length,
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
app.post('/api/convert/sdf', upload.single('file'), (req, res) => {
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

// ============ Sample Endpoints ============

app.get('/api/samples', (req, res) => {
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

// ============ Error Handling ============

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
  });
});

// ============ Start Server ============

app.listen(port, () => {
  console.log(`PharmaSpark API server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API documentation: http://localhost:${port}/`);
});

export default app;
