import express from "express";
import { adminDashboard, listCourses } from "../controllers/adminController.js";

const router = express.Router();
// Use admin-specific layout for all routes in this router
router.use((req, res, next) => {
  res.locals.layout = "admin/layouts/layout";
  next();
});

router.get("/", adminDashboard);
router.get("/courses", listCourses);

export default router;
