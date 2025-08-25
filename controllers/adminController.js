export const adminDashboard = (req, res) => {
  res.render("admin/dashboard/index", {
    layout: "admin/layouts/layout",
    active: "dashboard",
    title: "Dashboard",
  });
};

// Routes for Courses
export const listCourses = (req, res) => {
  res.render("admin/courses/index", {
    layout: "admin/layouts/layout",
    active: "courses",
    title: "Courses",
  });
};

export const createCourse = (req, res) => {
  // const instructors = await getAllInstructors();
  // const categories = await getAllCategories();

  res.render("admin/courses/create", {
    layout: "admin/layouts/layout",
    active: "courses",
    title: "Courses",
    // instructors,
    // categories,
  });
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
