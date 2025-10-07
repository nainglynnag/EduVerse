import express from 'express';
import { getStudent, getStudentCourses } from '../controllers/studentController.js';

const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (req.session.user && req.session.user.roleId === 1) {
    return next();
  } else {
    res.redirect("/signin");
  }
};

router.get('/', isLoggedIn, getStudent);
router.get('/mycourses', isLoggedIn, getStudentCourses);

export default router;