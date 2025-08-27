import {
  getAllCategories,
  getAllCourses,
  createCourse,
  getAllDifficulties,
  getAllInstructors,
  getAllInstructorsDetails,
  createInstructor,
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

export const showcreateCourseForm = async (req, res) => {
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
export const listInstructors = async (req, res) => {
  const instructors = await getAllInstructorsDetails();
  // console.log(instructors);

  res.render("admin/instructors/index", {
    layout: "admin/layouts/layout",
    active: "instructors",
    title: "Instructors",
    instructors,
  });
};

export const showInstructorDetail = async (req, res) => {
  const instructors = await getAllInstructorsDetails();
  const currentInstructor = instructors.find((instructor) => {
    return instructor.user_id == req.params.id;
  });
  // console.log(currentInstructor);

  res.render("admin/instructors/instructorDetail", {
    layout: "admin/layouts/layout",
    active: "instructors",
    title: "Instructors",
    currentInstructor,
  });
};

export const showCreateInstructorForm = (req, res) => {
  res.render("admin/instructors/create", {
    layout: "admin/layouts/layout",
    active: "instructors",
    title: "Instructors",
  });
};

export const createInstructorHandler = async (req, res) => {
  const { name, email, password, specialization, bio } = req.body;

  // simple server-side email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    // re-render form with a simple message in flash (if available) or inline
    return res.render("admin/instructors/create", {
      layout: "admin/layouts/layout",
      active: "instructors",
      title: "Instructors",
      error: "Please provide a valid email address.",
      // preserve previous values so user doesn't need to retype
      form: { name, email, password, specialization, bio },
    });
  }

  // console.log(req.body);
  await createInstructor(req.body);
  res.redirect("/admin/instructors");
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
