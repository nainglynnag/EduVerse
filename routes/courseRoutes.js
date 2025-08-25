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

// Course CRUD routes
router.post("/", createCourse);
router.get("/", getAllCourses);
router.get("/categories", getCategories);
router.get("/difficulty-levels", getDifficultyLevels);
router.get("/instructor/:instructor_id/profile", getInstructorProfile);
router.get("/instructor/:instructor_id/info", getInstructorById);
router.get("/instructor/:instructor_id", getCoursesByInstructor);
router.get("/:id/enrollments", getCourseEnrollments);
router.get("/:id", getCourseById);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

export default router;
