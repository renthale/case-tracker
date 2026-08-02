const crypto = require('crypto');

const generateToken = () => crypto.randomBytes(32).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const TOKEN_TTL_MS = {
  invitation: 48 * 60 * 60 * 1000,
  passwordReset: 60 * 60 * 1000
};

const expiresAt = (kind) => new Date(Date.now() + TOKEN_TTL_MS[kind] || 0);

module.exports = { generateToken, hashToken, expiresAt, TOKEN_TTL_MS };
