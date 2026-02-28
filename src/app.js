const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const SQLiteStore = require('connect-sqlite3')(session);

const authRoutes = require('./routes/authRoutes');
const saleRoutes = require('./routes/saleRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const baseRoutes = require('./routes/baseRoute');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Serve static assets from project-level `public` folder
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: './src/config' }),
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

// Flash middleware
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// expose session user to all views so templates can hide/show UI
app.use((req, res, next) => {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  next();
});


// Default route → login page
app.get('/', (req, res) => {
  res.render('login', { title: 'Login' });
});

// Mount base routes (contains /dashboard, /signup, etc.)
app.use('/', baseRoutes);
// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);

// Mount web auth routes at root so /account/* is available
app.use('/', authRoutes);

// Mount web routes for sales and expenses pages
app.use('/', saleRoutes);
app.use('/', expenseRoutes);
// Settings pages
app.use('/', settingsRoutes);

// Logout shortcut (rendered links point to /logout)
const authController = require('./controllers/authsController');
app.get('/logout', authController.logout);

module.exports = app;
