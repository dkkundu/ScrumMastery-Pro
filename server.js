import 'dotenv/config'
import express from 'express'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const JWT_SECRET = process.env.JWT_SECRET || 'scrum-simulator-local-secret'
const PORT = parseInt(process.env.BACKEND_PORT) || 6001
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

// ─── SQLite Setup ─────────────────────────────────────────────────────────────
const db = new Database(join(__dirname, 'database.sqlite'))

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    is_admin    INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL,
    exam_id          TEXT,
    exam_title       TEXT,
    cert             TEXT,
    date             TEXT,
    score            REAL,
    passed           INTEGER,
    correct_count    INTEGER,
    time_used        INTEGER,
    question_results TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`)

// Add is_admin column if upgrading from old schema
try { db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`) } catch {}

// ─── Seed admin user ──────────────────────────────────────────────────────────
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL)
if (!existingAdmin) {
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10)
  db.prepare('INSERT INTO users (email, password, is_admin) VALUES (?, ?, 1)').run(ADMIN_EMAIL, hash)
  console.log(`  Admin user created: ${ADMIN_EMAIL}`)
} else {
  // Ensure existing admin account keeps is_admin=1
  db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(ADMIN_EMAIL)
}

// ─── Express Setup ────────────────────────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

// ─── Middleware ───────────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    // Always check DB so promotion takes effect without re-login
    const row = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(payload.id)
    if (!row?.is_admin) return res.status(403).json({ error: 'Admin access required' })
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  const hash = bcrypt.hashSync(password, 10)
  try {
    const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash)
    const user = { id: result.lastInsertRowid, email, is_admin: false }
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, user })
  } catch {
    res.status(400).json({ error: 'An account with this email already exists' })
  }
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!row || !bcrypt.compareSync(password, row.password)) {
    return res.status(400).json({ error: 'Invalid email or password' })
  }
  const user = { id: row.id, email: row.email, is_admin: row.is_admin === 1 }
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token, user })
})

// ─── Attempts Routes ──────────────────────────────────────────────────────────
app.get('/api/attempts', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM attempts WHERE user_id = ? ORDER BY date DESC').all(req.user.id)
  res.json(rows.map(parseAttempt))
})

app.post('/api/attempts', requireAuth, (req, res) => {
  const { examId, examTitle, cert, date, score, passed, correctCount, timeUsed, questionResults } = req.body
  const result = db.prepare(`
    INSERT INTO attempts (user_id, exam_id, exam_title, cert, date, score, passed, correct_count, time_used, question_results)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, examId, examTitle, cert, date, score, passed ? 1 : 0, correctCount, timeUsed, JSON.stringify(questionResults))
  res.json({ id: result.lastInsertRowid })
})

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// All users with attempt counts
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.email, u.is_admin, u.created_at,
           COUNT(a.id) AS attempt_count
    FROM users u
    LEFT JOIN attempts a ON a.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all()
  res.json(users.map(u => ({ ...u, is_admin: u.is_admin === 1 })))
})

// Toggle admin status (cannot demote yourself)
app.patch('/api/admin/users/:id/toggle-admin', requireAdmin, (req, res) => {
  const targetId = parseInt(req.params.id)
  if (targetId === req.user.id) return res.status(400).json({ error: 'You cannot change your own admin status' })

  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId)
  if (!target) return res.status(404).json({ error: 'User not found' })

  const newStatus = target.is_admin === 1 ? 0 : 1
  db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(newStatus, targetId)
  res.json({ id: targetId, is_admin: newStatus === 1 })
})

// All attempts across all users (admin report)
app.get('/api/admin/attempts', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, u.email AS user_email
    FROM attempts a
    JOIN users u ON u.id = a.user_id
    ORDER BY a.date DESC
  `).all()
  res.json(rows.map(r => ({ ...parseAttempt(r), userEmail: r.user_email })))
})

// ─── Helper ───────────────────────────────────────────────────────────────────
function parseAttempt(r) {
  return {
    id: r.id,
    examId: r.exam_id,
    examTitle: r.exam_title,
    cert: r.cert,
    date: r.date,
    score: r.score,
    passed: r.passed === 1,
    correctCount: r.correct_count,
    timeUsed: r.time_used,
    questionResults: JSON.parse(r.question_results || '[]')
  }
}

app.listen(PORT, () => {
  console.log(`\n  SQLite backend  →  http://localhost:${PORT}`)
  console.log(`  Admin login     →  ${ADMIN_EMAIL}\n`)
})
