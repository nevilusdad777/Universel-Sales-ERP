const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });
};

const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      const tokenHash = hashToken(refreshToken);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt
        }
      });

      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: accessToken,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  try {
    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(refreshToken, secret);

    const tokenHash = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const newAccessToken = generateAccessToken(decoded.id);
    res.json({ token: newAccessToken });
  } catch (error) {
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (refreshToken) {
    try {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.deleteMany({ where: { tokenHash } });
    } catch (e) {
      // Ignore cleanup error on logout
    }
  }

  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  res.json({ message: 'Logged out successfully' });
};

