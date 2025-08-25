import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Instructor Dashboard
router.get("/dashboard", (req, res) => {
  res.render("instructors/dashboard/index", { layout: "instructors/layouts/layout" });
});

// Instructor Courses List
router.get("/courses", (req, res) => {
  res.render("instructors/courses/index", { layout: "instructors/layouts/layout" });
});

// Create Course
router.get("/courses/create", (req, res) => {
  res.render("instructors/courses/create", { layout: "instructors/layouts/layout" });
});

// Edit Course
router.get("/courses/:id/edit", (req, res) => {
  res.render("instructors/courses/edit", { layout: "instructors/layouts/layout" });
});

// Instructor Profile
router.get("/profile", (req, res) => {
  res.render("instructors/index", { layout: false });
});

// Default instructor route redirects to dashboard
router.get("/", (req, res) => {
  res.redirect("/instructor/dashboard");
});

export default router;
