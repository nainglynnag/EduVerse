import express from "express";
import {
  createCourse,
  getAllCourses,
  getCoursesByInstructor,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCategories,
  getDifficultyLevels,
  getInstructorProfile,
  getCourseEnrollments,
  getInstructorById
} from "../controllers/courseController.js";

const router = express.Router();

// Course CRUD operations
router.post("/", createCourse);
router.get("/", getAllCourses);
router.get("/instructor/:instructor_id", getCoursesByInstructor);
router.get("/:id", getCourseById);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

// Additional course-related endpoints
router.get("/categories", getCategories);
router.get("/difficulty-levels", getDifficultyLevels);
router.get("/instructor/:instructor_id/profile", getInstructorProfile);
router.get("/:course_id/enrollments", getCourseEnrollments);
router.get("/instructor/:instructor_id/info", getInstructorById);

export default router;
