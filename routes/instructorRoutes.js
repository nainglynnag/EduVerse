import express from 'express';
import {
  getInstructorSignIn,
  postInstructorSignIn,
  instructorSignOut,
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

const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (req.session.user && req.session.user.roleId === 2) {
    return next();
  } else {
    res.redirect("/instructor/signin");
  }
};

// Authentication routes (no middleware)
router.get('/signin', getInstructorSignIn);
router.post('/signin', express.urlencoded({ extended: true }), postInstructorSignIn);
router.get('/signout', instructorSignOut);

// Main instructor routes
router.get('/', isLoggedIn, (req, res) => res.redirect('/instructor/dashboard'));

router.use(getInstructorData);

// Dashboard Routes
router.get('/dashboard',  isLoggedIn, getInstructorDashboard);

// Course Management Routes
router.get('/courses',  isLoggedIn, getInstructorCoursesList);
router.get('/courses/create',  isLoggedIn, getCreateCoursePage);
router.post('/courses/create',  isLoggedIn, createCourse);
router.get('/courses/:courseId',  isLoggedIn, getCourseDetail);
router.get('/courses/:courseId/edit',  isLoggedIn, getEditCoursePage);
router.post('/courses/:courseId/edit',  isLoggedIn, updateCourse);
router.delete('/courses/:courseId',  isLoggedIn, deleteCourse);

// Lesson Management Routes
router.delete('/courses/:courseId/lessons/:lessonId',  isLoggedIn, deleteLesson);

// Student Management Routes
router.get('/students',  isLoggedIn, getInstructorStudentsPage);

// Profile Management Routes
router.get('/profile/edit',  isLoggedIn, getEditProfilePage);
router.post('/profile/edit',  isLoggedIn, updateProfile);

export default router;
