module.exports = (req, res, next) => {
  try {
    if (req.session && req.session.user) return next();
    // preserve original requested url to redirect after login
    req.session.returnTo = req.originalUrl || req.url;
    return res.redirect('/');
  } catch (err) {
    console.error('authMiddleware error:', err);
    return res.redirect('/account/login');
  }
};
