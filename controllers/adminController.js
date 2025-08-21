export const adminDashboard = (req, res) => {
  res.render("admin/dashboard/index", {
    layout: "admin/layouts/layout",
    active: "dashboard",
    title: "Admin Dashboard",
  });
};

export const listCourses = (req, res) => {
  res.render("admin/courses/index", {
    layout: "admin/layouts/layout",
    active: "courses",
    title: "Courses",
  });
};

export const listInstructors = (req, res) => {
  res.render("admin/instructors/index", {
    layout: "admin/layouts/layout",
    active: "instructors",
    title: "Instructors",
  });
};

export const listUsers = (req, res) => {
  res.render("admin/users/index", {
    layout: "admin/layouts/layout",
    active: "users",
    title: "Users",
  });
};

export const listCategories = (req, res) => {
  res.render("admin/categories/index", {
    layout: "admin/layouts/layout",
    active: "categories",
    title: "Categories",
  });
};
