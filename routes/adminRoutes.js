import express from "express";
import {
  adminDashboard,
  createCategoryHandler,
  createCourseHandler,
  createInstructorHandler,
  createUser,
  deleteCategoryHandler,
  deleteInstructorHandler,
  listCategories,
  listCourses,
  listInstructors,
  listUsers,
  showCreateCategoryForm,
  showcreateCourseForm,
  showCreateInstructorForm,
  showEditCategoryForm,
  showEditInstructorForm,
  showInstructorDetail,
  updateCategoryHandler,
  updateInstructorHandler,
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
router.get("/courses/create", showcreateCourseForm);
router.post("/courses/create", createCourseHandler);

// Routes for Instructors
router.get("/instructors", listInstructors);
router.get("/create-instructor", showCreateInstructorForm);
router.post("/create-instructor", createInstructorHandler);
router.get("/instructors/:id", showInstructorDetail);
router.get("/edit-instructor/:id", showEditInstructorForm);
router.post("/edit-instructor/:id", updateInstructorHandler);
router.get("/delete-instructor/:id", deleteInstructorHandler);
router.post("/delete-instructor/:id", deleteInstructorHandler);

// Routes for Users
router.get("/users", listUsers);
router.get("/users/create", createUser);

// Routes for Categories
router.get("/categories", listCategories);
router.get("/create-category", showCreateCategoryForm);
router.post("/create-category", createCategoryHandler);
router.get("/edit-category/:id", showEditCategoryForm);
router.post("/edit-category/:id", updateCategoryHandler);
router.get("/delete-category/:id", deleteCategoryHandler);
router.post("/delete-category/:id", deleteCategoryHandler);

export default router;
