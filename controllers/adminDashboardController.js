import bcrypt from "bcrypt";

import {
  getDashboardData,
  getLogInAdmin,
} from "../models/adminDashboardModel.js";

const errorHandler = (
  res,
  error,
  operation,
  message = "Internal server error"
) => {
  console.log(`Controller error in ${operation}: `, error);
  res.status(500).send({ error, message });
};

export const adminLogin = (req, res) => {
  try {
    res.render("admin/login");
  } catch (error) {
    errorHandler(res, error, "login");
  }
};

export const adminLoginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(email, password);
    const logInAdmin = await getLogInAdmin(email);
    // console.log(logInAdmin);

    if (
      logInAdmin &&
      (await bcrypt.compare(password, logInAdmin[0].password_hash))
    ) {
      req.session.admin = {
        id: logInAdmin[0].id,
        name: logInAdmin[0].name,
        email: logInAdmin[0].email,
      };

      res.redirect("/admin/dashboard");
    } else {
      res.render("admin/login", {
        error: "Invalid email or password",
      });
    }
  } catch (error) {
    errorHandler(res, error, "adminLoginHandler");
  }
};

export const adminLogout = (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    errorHandler(res, error, "adminLogout");
  }
};

export const adminDashboard = async (req, res) => {
  try {
    const data = await getDashboardData();
    // console.log("getDashboardData", data);

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
