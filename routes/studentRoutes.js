import express from 'express';
import { 
  getStudent, 
  getStudentCourses, 
  getCourseDetail, 
  enrollInCourse,
  unenrollFromCourseController,
  getEnrollmentStatusController,
  updateStudentProfileController,
  showProfile,
  editProfile,
  updateProfile,
  completeLesson
} from '../controllers/studentController.js';
import { listInstructors, showCreateInstructorForm, createInstructorRequest, viewInstructorDetail } from '../controllers/studentInstructorController.js';

const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (req.session.user && req.session.user.roleId === 1) {
    return next();
  } else {
    res.redirect("/signin");
  }
};

// Middleware to pass student data to all student routes
const setStudentData = async (req, res, next) => {
  try {
    if (req.session.user && req.session.user.roleId === 1) {
      const { getStudentById } = await import('../models/studentModel.js');
      const studentId = req.session.user.userId;
      const student = await getStudentById(studentId);
      res.locals.student = student;
      console.log('setStudentData middleware: student data set in res.locals:', student ? student.name : 'null');
    } else {
      console.log('setStudentData middleware: No user session or not a student role');
    }
    next();
  } catch (error) {
    console.error('Error setting student data:', error);
    next();
  }
};

// Profile routes (must come before parameterized routes)
router.get('/profile', isLoggedIn, setStudentData, showProfile);
router.get('/profile/edit', isLoggedIn, setStudentData, editProfile);
router.post('/profile/edit', isLoggedIn, setStudentData, updateProfile);

// Instructor routes
router.get('/instructors', isLoggedIn, setStudentData, listInstructors);
router.get('/instructors/create', isLoggedIn, setStudentData, showCreateInstructorForm);
router.post('/instructors/create', isLoggedIn, setStudentData, createInstructorRequest);
router.get('/instructor/:id', isLoggedIn, setStudentData, viewInstructorDetail);

// Main routes
router.get('/', isLoggedIn, setStudentData, getStudent);
router.get('/dashboard', isLoggedIn, setStudentData, getStudent);
router.get('/courses', isLoggedIn, setStudentData, getStudentCourses);
router.get('/mycourses', isLoggedIn, setStudentData, getStudentCourses);
router.get('/progress', isLoggedIn, setStudentData, getStudent);
router.get('/assignments', isLoggedIn, setStudentData, getStudent);
router.get('/certificates', isLoggedIn, setStudentData, getStudent);
router.get('/calendar', isLoggedIn, setStudentData, getStudent);

// Course routes (parameterized routes must come last)
router.get('/course/:id', isLoggedIn, setStudentData, getCourseDetail);
router.get('/course/:id/learn', isLoggedIn, setStudentData, getStudent);
router.get('/course/:id/progress', isLoggedIn, setStudentData, getStudent);
router.post('/course/:id/enroll', isLoggedIn, setStudentData, enrollInCourse);
router.delete('/course/:id/unenroll', isLoggedIn, setStudentData, unenrollFromCourseController);
router.get('/course/:id/enrollment-status', isLoggedIn, setStudentData, getEnrollmentStatusController);

// Additional CRUD routes
router.put('/profile/update', isLoggedIn, setStudentData, updateStudentProfileController);

// Lesson completion route
router.post('/lesson/complete', isLoggedIn, setStudentData, completeLesson);

export default router;