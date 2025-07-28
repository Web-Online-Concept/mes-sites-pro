import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Durée de validité du token (7 jours)
const TOKEN_EXPIRY = '7d';

// Générer un hash pour le mot de passe
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

// Vérifier un mot de passe
export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// Générer un token JWT
export function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// Vérifier un token JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Extraire l'userId d'un token
export function getUserIdFromToken(token) {
  const decoded = verifyToken(token);
  return decoded ? decoded.userId : null;
}

// Middleware pour extraire l'utilisateur de la requête
export async function getUserFromRequest(req) {
  const token = req.cookies['auth-token'];
  
  if (!token) {
    return null;
  }
  
  const userId = getUserIdFromToken(token);
  return userId;
}