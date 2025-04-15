module.exports = (pool) => {
    const router = require('express').Router();
    
    // Get all schedules
    router.get('/', async (req, res) => {
      try {
        const result = await pool.query('SELECT * FROM schedules ORDER BY start_time');
        res.json({ schedules: result.rows });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Get schedule by id
    router.get('/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM schedules WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Schedule not found' });
        }
        
        res.json({ schedule: result.rows[0] });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Add new schedule
    router.post('/', async (req, res) => {
      try {
        const { title, description, start_time, end_time, instructor, location } = req.body;
        
        const result = await pool.query(
          `INSERT INTO schedules (title, description, start_time, end_time, instructor, location) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [title, description || null, start_time, end_time, instructor || null, location || null]
        );
        
        res.status(201).json({ 
          message: 'Schedule added successfully', 
          schedule: result.rows[0] 
        });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Update schedule
    router.put('/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { title, description, start_time, end_time, instructor, location } = req.body;
        
        const result = await pool.query(
          `UPDATE schedules SET 
           title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           instructor = COALESCE($5, instructor),
           location = COALESCE($6, location)
           WHERE id = $7 RETURNING *`,
          [title, description, start_time, end_time, instructor, location, id]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Schedule not found' });
        }
        
        res.json({ 
          message: 'Schedule updated successfully', 
          schedule: result.rows[0] 
        });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // Delete schedule
    router.delete('/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM schedules WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Schedule not found' });
        }
        
        res.json({ 
          message: 'Schedule deleted successfully', 
          schedule: result.rows[0] 
        });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    return router;
  };