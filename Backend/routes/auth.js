const router = require('express').Router();
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'your-secure-secret-key'; // Use an env variable in production

module.exports = (pool, bcrypt) => {
  // Login route
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: '1h' } // Token expires in 1 hour
      );

      console.log('Token generated:', token); // Debug
      return res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // Logout route (client-side only, no server-side session to destroy)
  router.get('/logout', (req, res) => {
    res.json({ message: 'Logout successful, please remove token on client-side' });
  });

  // Check auth status route
  router.get('/status', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer <token>"
    if (!token) {
      return res.json({ isAuthenticated: false });
    }
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      return res.json({ isAuthenticated: true, user: decoded });
    } catch (err) {
      console.error('Token verification failed:', err);
      return res.json({ isAuthenticated: false });
    }
  });

  return router;
};