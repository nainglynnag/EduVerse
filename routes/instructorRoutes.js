import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Instructor Dashboard
router.get("/", (req, res) => {
  res.render("instructors/index", { layout: false });
});

// Instructor Courses
router.get("/courses", (req, res) => {
  res.render("instructors/index", { layout: false });
});

// Create Course
router.get("/create-course", (req, res) => {
  res.render("instructors/index", { layout: false });
});

// Edit Course
router.get("/edit-course/:id", (req, res) => {
  res.render("instructors/index", { layout: false });
});

// Instructor Profile
router.get("/profile", (req, res) => {
  res.render("instructors/index", { layout: false });
});

// Analytics
router.get("/analytics", (req, res) => {
  res.render("instructors/index", { layout: false });
});

// Students
router.get("/students", (req, res) => {
  res.render("instructors/index", { layout: false });
});

// Earnings
router.get("/earnings", (req, res) => {
  res.render("instructors/index", { layout: false });
});

// Messages
router.get("/messages", (req, res) => {
  res.render("instructors/index", { layout: false });
});

export default router;
