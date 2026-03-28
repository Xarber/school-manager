module.exports = (req, res, next) => {
    let lang = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
    if(lang) req.setLocale(lang);
    next();
};