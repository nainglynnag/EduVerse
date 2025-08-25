import {
  getAllCategories,
  getAllCourses,
  createCourse,
  getAllDifficulties,
  getAllInstructors,
} from "../models/adminModel.js";

export const adminDashboard = (req, res) => {
  res.render("admin/dashboard/index", {
    layout: "admin/layouts/layout",
    active: "dashboard",
    title: "Dashboard",
  });
};

// Routes for Courses
export const listCourses = async (req, res) => {
  const courses = await getAllCourses();
  res.render("admin/courses/index", {
    layout: "admin/layouts/layout",
    active: "courses",
    title: "Courses",
    courses,
  });
};

export const showcreateForm = async (req, res) => {
  const instructors = await getAllInstructors();
  const categories = await getAllCategories();
  const difficulties = await getAllDifficulties();
  const statuses = ["published", "draft"];

  res.render("admin/courses/create", {
    layout: "admin/layouts/layout",
    active: "courses",
    title: "Courses",
    instructors,
    categories,
    difficulties,
    statuses,
  });
};

export const createCourseHandler = async (req, res) => {
  // console.log(req.body);
  await createCourse(req.body);
  res.redirect("/admin/courses");
};

// Routes for Instructors
export const listInstructors = (req, res) => {
  res.render("admin/instructors/index", {
    layout: "admin/layouts/layout",
    active: "instructors",
    title: "Instructors",
  });
};

export const createInstructor = (req, res) => {
  res.render("admin/instructors/create", {
    layout: "admin/layouts/layout",
    active: "instructors",
    title: "Instructors",
  });
};

// Routes for Users
export const listUsers = (req, res) => {
  res.render("admin/users/index", {
    layout: "admin/layouts/layout",
    active: "users",
    title: "Users",
  });
};

export const createUser = (req, res) => {
  res.render("admin/users/create", {
    layout: "admin/layouts/layout",
    active: "users",
    title: "Users",
  });
};

// Routes for Categories
export const listCategories = (req, res) => {
  res.render("admin/categories/index", {
    layout: "admin/layouts/layout",
    active: "categories",
    title: "Categories",
  });
};

export const createCategories = (req, res) => {
  res.render("admin/categories/create", {
    layout: "admin/layouts/layout",
    active: "categories",
    title: "Categories",
  });
};
