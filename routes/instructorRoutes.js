import express from 'express';
import {
  getInstructorData,
  getInstructorDashboard,
  getInstructorCoursesList,
  getCreateCoursePage,
  createCourse,
  getCourseDetail,
  getEditCoursePage,
  updateCourse,
  deleteCourse,
  deleteLesson,
  getInstructorStudentsPage,
  getEditProfilePage,
  updateProfile
} from '../controllers/instructorController.js';
import {
  instructorLogin,
  instructorLoginHandler,
  instructorLogout
} from '../controllers/instructorAuthController.js';

const router = express.Router();

// Authentication middleware
const isLoggedIn = (req, res, next) => {
  console.log('Auth middleware - Session:', req.session);
  console.log('Auth middleware - Instructor session:', req.session.instructor);
  
  if (req.session.instructor) {
    console.log('User is logged in, proceeding...');
    return next();
  } else {
    console.log('User not logged in, redirecting to login...');
    res.redirect("/instructor");
  }
};

// Login routes (no middleware)
router.get('/', instructorLogin);
router.post('/', instructorLoginHandler);
router.get('/logout', instructorLogout);

// Apply instructor middleware to all protected routes
router.use(isLoggedIn);
router.use(getInstructorData);

// Dashboard Routes
router.get('/dashboard', getInstructorDashboard);

// Course Management Routes
router.get('/courses', getInstructorCoursesList);
router.get('/courses/create', getCreateCoursePage);
router.post('/courses/create', createCourse);
router.get('/courses/:courseId', getCourseDetail);
router.get('/courses/:courseId/edit', getEditCoursePage);
router.post('/courses/:courseId/edit', updateCourse);
router.delete('/courses/:courseId', deleteCourse);

// Lesson Management Routes
router.delete('/courses/:courseId/lessons/:lessonId', deleteLesson);

// Student Management Routes
router.get('/students', getInstructorStudentsPage);

// Profile Management Routes
router.get('/profile/edit', getEditProfilePage);
router.post('/profile/edit', updateProfile);

export default router;
