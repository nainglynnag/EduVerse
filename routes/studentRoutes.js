import express from 'express';
import { requireStudent } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all student routes
router.use(requireStudent);


// Student routes will be added here
router.get('/', (req, res) => {
  res.render('students/index', { layout: 'students/layout' });
});

export default router;