import express from "express";
import {
  adminDashboard,
  createAdminHandler,
  createCategoryHandler,
  createCourseHandler,
  createInstructorHandler,
  createStudentHandler,
  deleteAdminHandler,
  deleteCategoryHandler,
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
  showEditInstructorForm,
  showEditStudentForm,
  showInstructorDetail,
  showStudentDetails,
  updateAdminHandler,
  updateCategoryHandler,
  updateInstructorHandler,
  updateStudentHandler,
} from "../controllers/adminController.js";

const router = express.Router();

// Use admin-specific layout for all routes in this router
router.use((req, res, next) => {
  res.locals.layout = "admin/layouts/layout";
  next();
});

router.get("/", adminDashboard);

// Routes for Courses
router.get("/courses", listCourses);
router.get("/create-course", showcreateCourseForm);
router.post("/create-course", createCourseHandler);
router.get("/courses/:id", showCourseDetail);

// Routes for Instructors
router.get("/instructors", listInstructors);
router.get("/create-instructor", showCreateInstructorForm);
router.post("/create-instructor", createInstructorHandler);
router.get("/instructors/:id", showInstructorDetail);
router.get("/edit-instructor/:id", showEditInstructorForm);
router.post("/edit-instructor/:id", updateInstructorHandler);
router.get("/delete-instructor/:id", deleteInstructorHandler);
router.post("/delete-instructor/:id", deleteInstructorHandler);

// Routes for Students
router.get("/students", listStudents);
router.get("/create-student", showCreateStudentForm);
router.post("/create-student", createStudentHandler);
router.get("/students/:id", showStudentDetails);
router.get("/edit-student/:id", showEditStudentForm);
router.post("/edit-student/:id", updateStudentHandler);
router.get("/delete-student/:id", deleteStudentHandler);
router.post("/delete-student/:id", deleteStudentHandler);

// Routes for Categories
router.get("/categories", listCategories);
router.get("/create-category", showCreateCategoryForm);
router.post("/create-category", createCategoryHandler);
router.get("/edit-category/:id", showEditCategoryForm);
router.post("/edit-category/:id", updateCategoryHandler);
router.get("/delete-category/:id", deleteCategoryHandler);
router.post("/delete-category/:id", deleteCategoryHandler);

// Routes for Admins
router.get("/admins", listAdmins);
router.get("/create-admin", showCreateAdminForm);
router.post("/create-admin", createAdminHandler);
router.get("/edit-admin/:id", showEditAdminForm);
router.post("/edit-admin/:id", updateAdminHandler);
router.get("/delete-admin/:id", deleteAdminHandler);
router.post("/delete-admin/:id", deleteAdminHandler);

export default router;
