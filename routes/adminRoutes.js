import express from "express";
import {
  adminDashboard,
  createCategories,
  createCourseHandler,
  createInstructor,
  createUser,
  listCategories,
  listCourses,
  listInstructors,
  listUsers,
  showcreateForm,
  showInstructorDetail,
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
router.get("/courses/create", showcreateForm);
router.post("/courses/create", createCourseHandler);

// Routes for Instructors
router.get("/instructors", listInstructors);
router.get("/instructors/:id", showInstructorDetail);
router.get("/instructors/create", createInstructor);

// Routes for Users
router.get("/users", listUsers);
router.get("/users/create", createUser);

// Routes for Categories
router.get("/categories", listCategories);
router.get("/categories/create", createCategories);

export default router;
