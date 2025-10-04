import express from "express";
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  showCreateCourseForm,
  createCourseHandler,
} from "../controllers/studentController.js";
import { studentDashboard } from "../controllers/studentDashboardController.js";
import {
  listInstructors,
  showCreateInstructorForm,
  createInstructorRequest,
  viewInstructorDetail,
} from "../controllers/studentInstructorController.js";
import {
  listStudentsForStudentsArea,
  showCreateStudentFormForStudentsArea,
  createStudentFromStudentsArea,
  showEditStudentFormForStudentsArea,
  updateStudentFromStudentsArea,
  deleteStudentFromStudentsArea,
  viewStudentDetailForStudentsArea,
} from "../controllers/studentStudentController.js";

const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  res.redirect('/admin');
};

// Use admin-specific layout for all routes in this router
router.use((req, res, next) => {
  res.locals.layout = "admin/layouts/layout";
  next();
});

// List students
router.get('/', isLoggedIn, getAllStudents);

// Student dashboard
router.get('/dashboard', isLoggedIn, studentDashboard);

// Student-facing instructors
router.get('/instructors', isLoggedIn, listInstructors);
router.get('/instructors/create', isLoggedIn, showCreateInstructorForm);
router.post('/instructors/create', isLoggedIn, createInstructorRequest);
router.get('/instructors/:id', isLoggedIn, viewInstructorDetail);

// Student-facing students management area
router.get('/students', isLoggedIn, listStudentsForStudentsArea);
router.get('/students/create', isLoggedIn, showCreateStudentFormForStudentsArea);
router.post('/students/create', isLoggedIn, createStudentFromStudentsArea);
router.get('/students/edit/:id', isLoggedIn, showEditStudentFormForStudentsArea);
router.post('/students/edit/:id', isLoggedIn, updateStudentFromStudentsArea);
router.get('/students/delete/:id', isLoggedIn, deleteStudentFromStudentsArea);
router.get('/students/:id', isLoggedIn, viewStudentDetailForStudentsArea);

// Student create course (student-facing)
router.get('/create-course', isLoggedIn, showCreateCourseForm);
router.post('/create-course', isLoggedIn, createCourseHandler);

// The admin-style student create/edit/delete endpoints are handled under the
// students management area (routes with /students prefix) using the
// studentStudentController to keep consistency. Avoid duplicate routes here.

export default router;
