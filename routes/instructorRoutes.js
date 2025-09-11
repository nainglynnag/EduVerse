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
  getInstructorStudentsPage
} from '../controllers/instructorController.js';

const router = express.Router();

// Apply instructor middleware to all routes
router.use(getInstructorData);

// Dashboard Routes
router.get('/', getInstructorDashboard);
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

export default router;
