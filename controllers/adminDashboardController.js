import { getDashboardData } from "../models/adminDashboardModel.js";

const errorHandler = (
  res,
  error,
  operation,
  message = "Internal server error"
) => {
  console.log(`Controller error in ${operation}: `, error);
  res.status(500).send({ error, message });
};

export const adminDashboard = async (req, res) => {
  try {
    const data = await getDashboardData();
    console.log("getDashboardData", data);

    const total_revenue = data.course_prices.reduce(
      (pv, { price, total_students }) =>
        Number(price) * Number(total_students) + pv,
      0
    );
    // console.log(total_revenue);

    const courseNames = data.popular_courses.map((r) => r.title);
    const enrollments = data.popular_courses.map((r) => r.total_enrollments);

    res.render("admin/dashboard/index", {
      layout: "admin/layouts/layout",
      active: "dashboard",
      title: "Dashboard",
      ...data,
      total_revenue,
      courseNames,
      enrollments,
    });
  } catch (error) {
    errorHandler(res, error, "adminDashboard");
  }
};
