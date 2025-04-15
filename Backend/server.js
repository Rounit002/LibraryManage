const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const pgSession = require('connect-pg-simple')(session);
const fs = require('fs'); // Add fs module for file checks
require('dotenv').config(); // Load environment variables from .env

const app = express();

// Enable CORS for requests from the frontend
app.use(cors({
  origin: 'http://localhost:8080', // Update to your production domain later
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Allow cookies for session management
}));

// Database connection using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'), // Default to 5432 if not set
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'))); // Serve public assets

// Serve React build files with higher priority
app.use(express.static(path.join(__dirname, 'dist')));

// Session middleware with PostgreSQL store using environment variables
app.use(
  session({
    store: new pgSession({
      pool: pool,
      ttl: 24 * 60 * 60, // Session TTL: 24 hours
    }),
    secret: process.env.SESSION_SECRET || 'secret', // Fallback to default if not set
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // Cookie expires in 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

// Authentication middleware
const authenticateUser = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Import routes
const authRoutes = require('./routes/auth')(pool, bcrypt);
const userRoutes = require('./routes/users')(pool, bcrypt);
const studentRoutes = require('./routes/students')(pool);
const scheduleRoutes = require('./routes/schedules')(pool);

// API Routes (mounted before catch-all)
app.use('/api/auth', authRoutes); // Mount auth routes
app.use('/api/users', userRoutes); // Mount user-specific routes
app.use('/api/students', authenticateUser, studentRoutes);
app.use('/api/schedules', authenticateUser, scheduleRoutes);

// API index route
app.get('/api', (req, res) => {
  res.json({ message: 'Student Management API' });
});

// Serve React app only for client-side routes
app.get('/*', (req, res) => { // Changed from '*' to '/*' for clarity
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Index.html not found in dist folder');
  }
});

// Server initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Add default admin user if none exists
  createDefaultAdmin();
});

// Create default admin user if none exists
async function createDefaultAdmin() {
  try {
    const userCount = await pool.query('SELECT COUNT(*) FROM users');

    if (parseInt(userCount.rows[0].count) === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await pool.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('Default admin user created');
    }
  } catch (err) {
    console.error('Error creating default admin:', err);
  }
}