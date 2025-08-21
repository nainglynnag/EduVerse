import express from "express";
import {
  adminDashboard,
  listCategories,
  listCourses,
  listInstructors,
  listUsers,
} from "../controllers/adminController.js";

const router = express.Router();

// Use admin-specific layout for all routes in this router
router.use((req, res, next) => {
  res.locals.layout = "admin/layouts/layout";
  next();
});

router.get("/", adminDashboard);
router.get("/courses", listCourses);
router.get("/instructors", listInstructors);
router.get("/users", listUsers);
router.get("/categories", listCategories);

export default router;
