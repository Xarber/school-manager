const jwt = require('jsonwebtoken');
const router = require('express').Router();

function connectionTest(req, res) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    //set debug metrics
    let authenticated = false;
    let requestTime = new Date().getTime();

    if (token) try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        authenticated = true;
    } catch (err) {
        authenticated = 'invalid token';
    }
    return res.json({
        success: true,
        authenticated,
        serverTime: requestTime,
        //add more debug data if needed
    });
}

router.get('/connectiontest', connectionTest);
router.get('/', connectionTest);

router.post('/connectiontest', connectionTest);
router.post('/', connectionTest);

module.exports = router;