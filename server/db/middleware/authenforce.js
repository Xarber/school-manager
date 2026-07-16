const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: req.t("errors.no_token") });
  if (!req.user) return res.status(401).json({ error: req.t("errors.invalid_token") });

  return next();
};