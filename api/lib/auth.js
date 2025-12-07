const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { query } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

async function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function getUserFromToken(token) {
  const decoded = await verifyToken(token);
  if (!decoded) return null;
  
  const users = await query(
    `SELECT u.id, u.email, p.name, p.role, p.department, p.position, p.join_date, 
            p.balance, p.has_project, p.created_at, p.updated_at
     FROM users u
     LEFT JOIN profiles p ON u.id = p.id
     WHERE u.id = @userId`,
    { userId: { type: sql.UniqueIdentifier, value: decoded.userId } }
  );
  
  if (users.length === 0) return null;
  
  const user = users[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'Collaborator',
    department: user.department,
    position: user.position,
    leader_name: user.leader_name || null,
    join_date: user.join_date,
    balance: user.balance || 0,
    has_project: user.has_project || false,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

function validateEmailDomain(email) {
  const allowedDomain = '@forteinnovation.mx';
  return email.toLowerCase().endsWith(allowedDomain.toLowerCase());
}

module.exports = { generateToken, verifyToken, getUserFromToken, validateEmailDomain };

