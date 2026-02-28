const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

async function buildLogin(req, res, next) {
  res.render('login', { title: 'Login' });
}

async function buildSignup(req, res, next) {
  res.render('signup', { title: 'Sign Up', messages: req.flash() });
}

async function accountLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    req.flash('error', 'Email and password are required');
    return res.status(400).render('login', { title: 'Login', messages: req.flash(), email });
  }

  try {
    const users = await userModel.getAccountByEmail(email);
    if (!users || users.length === 0) {
      req.flash('error', 'Invalid email or password');
      return res.status(401).render('login', { title: 'Login', messages: req.flash(), email });
    }

    const account = users[0];
    console.log('Account fetched:', { id: account.id, email: account.email, role: account.role || account.usertype });
    const isPasswordValid = await bcrypt.compare(password, account.password || '');
    console.log('isPasswordValid:', isPasswordValid);
    if (!isPasswordValid) {
      req.flash('error', 'Invalid email or password');
      return res.status(401).render('login', { title: 'Login', messages: req.flash(), email });
    }

    // set session user and save before redirect
    req.session.user = { id: account.id, email: account.email, role: account.role || account.usertype };
    req.session.save((err) => {
      if (err) console.error('Session save error:', err);

      const token = jwt.sign(
        { id: account.id, usertype: account.role || account.usertype },
        process.env.ACCESS_TOKEN_SECRET || 'dev_secret',
        { expiresIn: '1h' }
      );
      // for dev ensure cookie is set
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: (req.secure || process.env.NODE_ENV === 'production'),
        sameSite: 'lax',
        maxAge: 3600 * 1000
      });

      req.flash('success', 'Login successful');
      return res.redirect('/dashboard');
    });

  } catch (error) {
    console.error('Error during login:', error);
    req.flash('error', 'An error occurred during login');
    return res.status(500).render('login', { title: 'Login', messages: req.flash() });
  }
}

async function signup(req, res, next) {
  const { name, email, password } = req.body;
  const role = (req.body.role || 'user').toString().toLowerCase();
  const allowedRoles = ['user', 'staff', 'admin'];
  const chosenRole = allowedRoles.includes(role) ? role : 'user';
  try {
    const existing = await userModel.findUserByEmail(email);
    if (existing && existing.length) {
      req.flash('error', 'Email already registered');
      return res.status(409).render('signup', { title: 'Sign Up', messages: req.flash(), name, email });
    }

    const result = await userModel.createUser(name, email, password, chosenRole);
    if (result) {
      req.flash('success', 'Account created successfully. Please login');
      return res.status(201).redirect('/account/login');
    }
    req.flash('error', 'An error occurred. Please try again');
    return res.status(500).render('signup', { title: 'Sign Up', messages: req.flash(), name, email });
  } catch (error) {
    console.error('Error creating account:', error);
    req.flash('error', 'An error occurred. Please try again');
    return res.status(500).render('signup', { title: 'Sign Up', messages: req.flash(), name, email });
  }
}

async function userDashBoard(req, res, next) {
  if (!req.session || !req.session.user) {
    req.flash('notice', 'Please login to view this page');
    return res.redirect('/account/login');
  }
  return res.render('dashboard', { title: 'Dashboard', user: req.session.user });
}

async function logout(req, res, next) {
  try {
    res.clearCookie('jwt', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).send('Unable to log out. Please try again.');
        }
        res.set('Cache-Control', 'no-store');
        return res.redirect('/account/login');
      });
    } else {
      return res.redirect('/account/login');
    }
  } catch (error) {
    console.error('Logout error:', error);
    return next(error);
  }
}

async function refreshToken(req, res) {
  const refreshToken = req.cookies && req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const accountData = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refresh_dev_secret');
    delete accountData.iat;
    delete accountData.exp;
    const newAccessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET || 'dev_secret', { expiresIn: '1h' });
    res.cookie('jwt', newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 3600 * 1000 });
    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Error refreshing token', error);
    return res.status(403).json({ message: 'Forbidden' });
  }
}

module.exports = {
  buildLogin,
  buildSignup,
  accountLogin,
  signup,
  userDashBoard,
  logout,
  refreshToken,
};