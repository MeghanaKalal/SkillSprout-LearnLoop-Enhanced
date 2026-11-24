const jwt = require('jsonwebtoken');
function authenticate(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'skillsprout' });
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}
function allowRoles(...roles) {
  return (req, res, next) => roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: 'You do not have permission to do that.' });
}
module.exports = { authenticate, allowRoles };
