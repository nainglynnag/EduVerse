import express from "express";

import {
  adminDashboard,
  adminLogin,
  adminLoginHandler,
  adminLogout,
} from "../controllers/adminDashboardController.js";

import {
  createAdminHandler,
  createCategoryHandler,
  createCourseHandler,
  createInstructorHandler,
  createStudentHandler,
  deleteAdminHandler,
  deleteCategoryHandler,
  deleteCourseHandler,
  deleteInstructorHandler,
  deleteStudentHandler,
  listAdmins,
  listCategories,
  listCourses,
  listInstructors,
  listStudents,
  showCourseDetail,
  showCreateAdminForm,
  showCreateCategoryForm,
  showcreateCourseForm,
  showCreateInstructorForm,
  showCreateStudentForm,
  showEditAdminForm,
  showEditCategoryForm,
  showEditCourseForm,
  showEditInstructorForm,
  showEditStudentForm,
  showInstructorDetail,
  showStudentDetails,
  updateAdminHandler,
  updateCategoryHandler,
  updateCourseHandler,
  updateInstructorHandler,
  updateStudentHandler,
} from "../controllers/adminController.js";

const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    return next();
  } else {
    res.redirect("/admin");
  }
};

// Use admin-specific layout for all routes in this router
router.use((req, res, next) => {
  res.locals.layout = "admin/layouts/layout";
  next();
});

router.get("/", adminLogin);
router.post("/", adminLoginHandler);
router.get("/logout", adminLogout);

router.get("/dashboard", isLoggedIn, adminDashboard);

// Routes for Courses
router.get("/courses", isLoggedIn, listCourses);
router.get("/create-course", isLoggedIn, showcreateCourseForm);
router.post("/create-course", isLoggedIn, createCourseHandler);
router.get("/courses/:id", isLoggedIn, showCourseDetail);
router.get("/edit-course/:id", isLoggedIn, showEditCourseForm);
router.post("/edit-course/:id", isLoggedIn, updateCourseHandler);
router.get("/delete-course/:id", isLoggedIn, deleteCourseHandler);
router.post("/delete-course/:id", isLoggedIn, deleteCourseHandler);

// Routes for Instructors
router.get("/instructors", isLoggedIn, listInstructors);
router.get("/create-instructor", isLoggedIn, showCreateInstructorForm);
router.post("/create-instructor", isLoggedIn, createInstructorHandler);
router.get("/instructors/:id", isLoggedIn, showInstructorDetail);
router.get("/edit-instructor/:id", isLoggedIn, showEditInstructorForm);
router.post("/edit-instructor/:id", isLoggedIn, updateInstructorHandler);
router.get("/delete-instructor/:id", isLoggedIn, deleteInstructorHandler);
router.post("/delete-instructor/:id", isLoggedIn, deleteInstructorHandler);

// Routes for Students
router.get("/students", isLoggedIn, listStudents);
router.get("/create-student", isLoggedIn, showCreateStudentForm);
router.post("/create-student", isLoggedIn, createStudentHandler);
router.get("/students/:id", isLoggedIn, showStudentDetails);
router.get("/edit-student/:id", isLoggedIn, showEditStudentForm);
router.post("/edit-student/:id", isLoggedIn, updateStudentHandler);
router.get("/delete-student/:id", isLoggedIn, deleteStudentHandler);
router.post("/delete-student/:id", isLoggedIn, deleteStudentHandler);

// Routes for Categories
router.get("/categories", isLoggedIn, listCategories);
router.get("/create-category", isLoggedIn, showCreateCategoryForm);
router.post("/create-category", isLoggedIn, createCategoryHandler);
router.get("/edit-category/:id", isLoggedIn, showEditCategoryForm);
router.post("/edit-category/:id", isLoggedIn, updateCategoryHandler);
router.get("/delete-category/:id", isLoggedIn, deleteCategoryHandler);
router.post("/delete-category/:id", isLoggedIn, deleteCategoryHandler);

// Routes for Admins
router.get("/admins", isLoggedIn, listAdmins);
router.get("/create-admin", isLoggedIn, showCreateAdminForm);
router.post("/create-admin", isLoggedIn, createAdminHandler);
router.get("/edit-admin/:id", isLoggedIn, showEditAdminForm);
router.post("/edit-admin/:id", isLoggedIn, updateAdminHandler);
router.get("/delete-admin/:id", isLoggedIn, deleteAdminHandler);
router.post("/delete-admin/:id", isLoggedIn, deleteAdminHandler);

export default router;
