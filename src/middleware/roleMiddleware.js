module.exports = function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    try {
      const user = req.session && req.session.user;
      if (!user) {
        req.session.returnTo = req.originalUrl || req.url;
        return res.redirect('/');
      }
      const role = user.role || '';
      if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        if (allowedRoles.includes(role)) return next();
        return res.status(403).send('Forbidden: insufficient permissions');
      }
      return next();
    } catch (err) {
      console.error('requireRole error:', err);
      return res.status(500).send('Server error');
    }
  };
};
