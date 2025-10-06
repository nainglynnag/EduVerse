import bcrypt from "bcrypt";
import { getLogInInstructor } from "../models/instructorModel.js";

const errorHandler = (res, error, message) => {
  console.error(`Error in ${message}:`, error);
  res.status(500).send({ error, message });
};

export const instructorLogin = async (req, res) => {
  try {
    res.render("instructors/login");
  } catch (error) {
    errorHandler(res, error, "instructorLogin");
  }
};

export const instructorLoginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password: password ? '***' : 'empty' });
    
    const logInInstructor = await getLogInInstructor(email);
    console.log('Found instructor:', logInInstructor.length > 0 ? 'Yes' : 'No');

    if (
      logInInstructor.length > 0 &&
      (await bcrypt.compare(password, logInInstructor[0].password_hash))
    ) {
      console.log('Password match! Creating session...');
      req.session.instructor = {
        id: logInInstructor[0].id,
        name: logInInstructor[0].name,
        email: logInInstructor[0].email,
      };
      console.log('Session created:', req.session.instructor);

      req.flash("success", "Successfully logged in");
      console.log('Redirecting to dashboard...');
      res.redirect("/instructor/dashboard");
    } else {
      console.log('Invalid credentials');
      res.render("instructors/login", {
        error: "Invalid email or password",
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    req.flash("error", "Failed to log in. Internal server error!");
    errorHandler(res, error, "instructorLoginHandler");
  }
};

export const instructorLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      return res.redirect("/instructor");
    }
    res.clearCookie("connect.sid");
    res.redirect("/instructor");
  });
};
