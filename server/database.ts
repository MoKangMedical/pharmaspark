// PharmaSpark — Database Module
// SQLite database for persistent storage

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'pharmaspark.db');

// Initialize database
let db: Database.Database;

export function initDatabase(): void {
  // Create data directory if it doesn't exist
  const dataDir = path.dirname(DB_PATH);
  import('fs').then(fs => {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  });

  // Initialize database
  db = new Database(DB_PATH);
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  
  // Create tables
  createTables();
  
  console.log(`Database initialized at: ${DB_PATH}`);
}

function createTables(): void {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      subscription TEXT DEFAULT 'free',
      api_calls INTEGER DEFAULT 0,
      api_limit INTEGER DEFAULT 1000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Molecules table
  db.exec(`
    CREATE TABLE IF NOT EXISTS molecules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      format TEXT NOT NULL,
      data TEXT NOT NULL,
      is_public BOOLEAN DEFAULT 0,
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Analyses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      molecule_id TEXT NOT NULL,
      type TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (molecule_id) REFERENCES molecules(id)
    )
  `);

  // API calls log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status_code INTEGER,
      response_time INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_molecules_user_id ON molecules(user_id);
    CREATE INDEX IF NOT EXISTS idx_molecules_is_public ON molecules(is_public);
    CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
    CREATE INDEX IF NOT EXISTS idx_analyses_molecule_id ON analyses(molecule_id);
    CREATE INDEX IF NOT EXISTS idx_api_calls_user_id ON api_calls(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_calls_created_at ON api_calls(created_at);
  `);
}

// ============ User Operations ============

export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  subscription: string;
  api_calls: number;
  api_limit: number;
  created_at: string;
  updated_at: string;
}

export function createUser(user: Omit<User, 'created_at' | 'updated_at'>): User {
  const stmt = db.prepare(`
    INSERT INTO users (id, email, username, password, subscription, api_calls, api_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(user.id, user.email, user.username, user.password, user.subscription, user.api_calls, user.api_limit);
  
  return getUserById(user.id)!;
}

export function getUserById(id: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | null;
}

export function getUserByEmail(email: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as User | null;
}

export function getUserByUsername(username: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) as User | null;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  const values = Object.values(updates).filter((_, i) => i < fields.length);
  
  if (fields.length === 0) return getUserById(id);
  
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const stmt = db.prepare(`
    UPDATE users 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(...values, id);
  
  return getUserById(id);
}

export function incrementApiCalls(userId: string): void {
  const stmt = db.prepare('UPDATE users SET api_calls = api_calls + 1 WHERE id = ?');
  stmt.run(userId);
}

export function resetApiCalls(userId: string): void {
  const stmt = db.prepare('UPDATE users SET api_calls = 0 WHERE id = ?');
  stmt.run(userId);
}

// ============ Molecule Operations ============

export interface Molecule {
  id: string;
  user_id: string;
  name: string;
  format: string;
  data: string;
  is_public: boolean;
  tags: string;
  created_at: string;
  updated_at: string;
}

export function createMolecule(molecule: Omit<Molecule, 'created_at' | 'updated_at'>): Molecule {
  const stmt = db.prepare(`
    INSERT INTO molecules (id, user_id, name, format, data, is_public, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    molecule.id,
    molecule.user_id,
    molecule.name,
    molecule.format,
    molecule.data,
    molecule.is_public ? 1 : 0,
    molecule.tags
  );
  
  return getMoleculeById(molecule.id)!;
}

export function getMoleculeById(id: string): Molecule | null {
  const stmt = db.prepare('SELECT * FROM molecules WHERE id = ?');
  const row = stmt.get(id) as any;
  if (row) {
    row.is_public = Boolean(row.is_public);
  }
  return row as Molecule | null;
}

export function getMoleculesByUserId(userId: string, limit = 50, offset = 0): Molecule[] {
  const stmt = db.prepare(`
    SELECT * FROM molecules 
    WHERE user_id = ? OR is_public = 1
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const rows = stmt.all(userId, limit, offset) as any[];
  return rows.map(row => ({
    ...row,
    is_public: Boolean(row.is_public),
  }));
}

export function updateMolecule(id: string, updates: Partial<Molecule>): Molecule | null {
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at' && k !== 'user_id');
  const values = Object.values(updates).filter((_, i) => i < fields.length);
  
  if (fields.length === 0) return getMoleculeById(id);
  
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const stmt = db.prepare(`
    UPDATE molecules 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(...values, id);
  
  return getMoleculeById(id);
}

export function deleteMolecule(id: string): boolean {
  const stmt = db.prepare('DELETE FROM molecules WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============ Analysis Operations ============

export interface Analysis {
  id: string;
  user_id: string;
  molecule_id: string;
  type: string;
  result: string;
  created_at: string;
}

export function createAnalysis(analysis: Omit<Analysis, 'created_at'>): Analysis {
  const stmt = db.prepare(`
    INSERT INTO analyses (id, user_id, molecule_id, type, result)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(analysis.id, analysis.user_id, analysis.molecule_id, analysis.type, analysis.result);
  
  return getAnalysisById(analysis.id)!;
}

export function getAnalysisById(id: string): Analysis | null {
  const stmt = db.prepare('SELECT * FROM analyses WHERE id = ?');
  return stmt.get(id) as Analysis | null;
}

export function getAnalysesByUserId(userId: string, limit = 50, offset = 0): Analysis[] {
  const stmt = db.prepare(`
    SELECT * FROM analyses 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  return stmt.all(userId, limit, offset) as Analysis[];
}

export function getAnalysesByMoleculeId(moleculeId: string, limit = 50, offset = 0): Analysis[] {
  const stmt = db.prepare(`
    SELECT * FROM analyses 
    WHERE molecule_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  return stmt.all(moleculeId, limit, offset) as Analysis[];
}

// ============ API Call Logging ============

export function logApiCall(
  userId: string | null,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number
): void {
  const stmt = db.prepare(`
    INSERT INTO api_calls (user_id, endpoint, method, status_code, response_time)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(userId, endpoint, method, statusCode, responseTime);
}

export function getApiCallsByUserId(userId: string, limit = 100): any[] {
  const stmt = db.prepare(`
    SELECT * FROM api_calls 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  
  return stmt.all(userId, limit);
}

export function getApiCallStats(userId: string): any {
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total_calls,
      AVG(response_time) as avg_response_time,
      SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
    FROM api_calls 
    WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
  `);
  
  return stmt.get(userId);
}

// ============ Database Utilities ============

export function getDatabase(): Database.Database {
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}

export function backupDatabase(backupPath: string): void {
  if (db) {
    db.backup(backupPath);
  }
}

// ============ Initialize on import ============

// Auto-initialize database when module is imported
try {
  initDatabase();
} catch (error) {
  console.error('Failed to initialize database:', error);
}
