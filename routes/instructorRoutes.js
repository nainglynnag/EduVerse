import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { 
  getInstructorData,
  getInstructorDashboard, 
  getInstructorCourses, 
  getCreateCoursePage,
  createCourse,
  getEditCoursePage,
  updateCourse
} from "../controllers/instructorController.js";
import { deleteCourse } from "../controllers/courseController.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Apply instructor data middleware to all routes
router.use(getInstructorData);

// Instructor Dashboard - now uses direct database queries
router.get("/dashboard", getInstructorDashboard);

// Instructor Courses List - now uses direct database queries
router.get("/courses", getInstructorCourses);

// Create Course - now includes categories and difficulty levels from database
router.get("/courses/create", getCreateCoursePage);
router.post("/courses/create", createCourse);

// Delete Course
router.delete("/courses/:id", deleteCourse);

// Edit Course
router.get("/courses/:id/edit", getEditCoursePage);
router.post("/courses/:id/edit", updateCourse);

// Instructor Profile
router.get("/profile", (req, res) => {
  res.render("instructors/index", { 
    layout: false,
    instructor: res.locals.instructor
  });
});

// Default instructor route redirects to dashboard
router.get("/", (req, res) => {
  res.redirect("/instructor/dashboard");
});

export default router;
