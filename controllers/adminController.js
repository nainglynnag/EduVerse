export const adminDashboard = (req, res) => {
  res.render("admin/dashboard/index", {
    // layout is set globally in server.js
    active: "dashboard",
    title: "Admin Dashboard",
  });
};

export const listCourses = (req, res) => {
  res.render("admin/courses/index", {
    // layout is set globally in server.js
    active: "courses",
    title: "Courses",
  });
};
