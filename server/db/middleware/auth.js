const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.warn("[AUTH] Authenticated request:", decoded.userid, "\nPath:", req.path, "\n");
    next();  // Pass to next (load data)
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};