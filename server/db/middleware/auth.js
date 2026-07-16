const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.warn("[AUTH] Authenticated request:", decoded.userid, "\nPath:", req.path, "\n");
    return next();  // Pass to next (load data)
  } catch (err) {
    return next();
  }
};