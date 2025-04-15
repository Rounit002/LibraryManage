module.exports = (pool) => {
    const router = require('express').Router();
    
    // Get all students
    router.get('/', async (req, res) => {
      try {
        const result = await pool.query('SELECT * FROM students ORDER BY name');
        res.json({ students: result.rows });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Get active students
    router.get('/active', async (req, res) => {
      try {
        const result = await pool.query(
          'SELECT * FROM students WHERE status = $1 ORDER BY name',
          ['active']
        );
        res.json({ students: result.rows });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Get expired memberships
    router.get('/expired', async (req, res) => {
      try {
        const result = await pool.query(
          'SELECT * FROM students WHERE status = $1 ORDER BY name',
          ['expired']
        );
        res.json({ students: result.rows });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Get expiring soon (30 days)
    router.get('/expiring-soon', async (req, res) => {
      try {
        const result = await pool.query(
          `SELECT * FROM students 
           WHERE status = 'active' 
           AND membership_end BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
           ORDER BY membership_end`
        );
        res.json({ students: result.rows });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Get student by id
    router.get('/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json({ student: result.rows[0] });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Add new student
    router.post('/', async (req, res) => {
      try {
        const { name, email, phone, address, membership_start, membership_end } = req.body;
        
        // Check if email already exists
        const emailCheck = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        
        const result = await pool.query(
          `INSERT INTO students (name, email, phone, address, status, membership_start, membership_end) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [name, email, phone || null, address || null, 'active', membership_start, membership_end]
        );
        
        res.status(201).json({ 
          message: 'Student added successfully', 
          student: result.rows[0] 
        });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Update student
    router.put('/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { name, email, phone, address, status, membership_start, membership_end } = req.body;
        
        // Check if email already exists for another student
        if (email) {
          const emailCheck = await pool.query('SELECT * FROM students WHERE email = $1 AND id != $2', [email, id]);
          if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email already in use by another student' });
          }
        }
        
        const result = await pool.query(
          `UPDATE students SET 
           name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           status = COALESCE($5, status),
           membership_start = COALESCE($6, membership_start),
           membership_end = COALESCE($7, membership_end)
           WHERE id = $8 RETURNING *`,
          [name, email, phone, address, status, membership_start, membership_end, id]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json({ 
          message: 'Student updated successfully', 
          student: result.rows[0] 
        });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Delete student
    router.delete('/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json({ 
          message: 'Student deleted successfully', 
          student: result.rows[0] 
        });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Renew membership
    router.post('/:id/renew', async (req, res) => {
      try {
        const { id } = req.params;
        const { membership_start, membership_end } = req.body;
        
        const result = await pool.query(
          `UPDATE students SET 
           membership_start = $1,
           membership_end = $2,
           status = 'active'
           WHERE id = $3 RETURNING *`,
          [membership_start, membership_end, id]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json({ 
          message: 'Membership renewed successfully', 
          student: result.rows[0] 
        });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Get dashboard stats
    router.get('/stats/dashboard', async (req, res) => {
      try {
        const totalStudents = await pool.query('SELECT COUNT(*) FROM students');
        
        const activeStudents = await pool.query(
          "SELECT COUNT(*) FROM students WHERE status = 'active'"
        );
        
        const expiredMemberships = await pool.query(
          "SELECT COUNT(*) FROM students WHERE status = 'expired'"
        );
        
        res.json({ 
          totalStudents: parseInt(totalStudents.rows[0].count),
          activeStudents: parseInt(activeStudents.rows[0].count),
          expiredMemberships: parseInt(expiredMemberships.rows[0].count)
        });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    return router;
  };