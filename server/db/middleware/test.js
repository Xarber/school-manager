const jwt = require('jsonwebtoken');
const router = require('express').Router();

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  //set debug metrics
  let authenticated = false;
  let requestTime = new Date().getTime();

  if (token) try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    authenticated = true;
    
    //if request URL is /connectiontest, end the request with debug data
    if (req.path === '/connectiontest') {
      return res.json({
        success: true,
        authenticated,
        serverTime: requestTime,
        //add more debug data if needed
      });
    }

    next();  // Pass to next (load data)
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};