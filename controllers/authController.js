import bcrypt from "bcrypt";
import { createUser, findUserByEmail } from "../models/userModel.js";

// GET /signin - Render sign in page
export const getSignIn = (req, res) => {
  try {
    res.render("auth/signin", {
      layout: false,
      error: req.query.error,
    });
  } catch (error) {
    console.error("Error in getSignIn:", error);
    res.status(500).send("Internal Server Error");
  }
};

// POST /signin - Handle sign in form submission
export const postSignIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    // Validate input
    if (!email || !password) {
      return res.redirect(
        "/signin?error=Please provide both email and password",
      );
    }

    // Find user by email
    const user = await findUserByEmail(email);
    // console.log(user);
    if (!user) {
      // return res.redirect("/signin?error=Invalid credentials");
      return res.render("auth/signin", {
        layout: false,
        error: "Invalid Email or password!",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.render("auth/signin", {
        layout: false,
        error: "Invalid Email or password!",
      });
    }
    
    if(user.status === "suspended"){
      return res.render("auth/signin", {
        layout: false,
        error: "Your account has been suspended!",
      });
    }

    // Determine redirect based on user role
    let redirectUrl;
    switch (user.role_id) {
      case 1: // Student
        redirectUrl = "/student";
        break;
      case 2: // Instructor
        redirectUrl = "/instructor";
        break;
      case 3: // Admin
        redirectUrl = "/admin/dashboard";
        break;
      default:
        redirectUrl = "/";
    }

    // Set user session data
    req.session.user = {
      userId: user.id,
      roleId: user.role_id,
      email: user.email,
      name: user.name,
    };

    // console.log("req user :", req.session.user);
    // console.log("redirectUrl :", redirectUrl);

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error in postSignIn:", error);
    res.redirect("/signin?error=An error occurred during sign in");
  }
};

// GET /signup - Render sign up page
export const getSignUp = (req, res) => {
  try {
    res.render("auth/signup", {
      layout: false,
      error: req.query.error,
    });
  } catch (error) {
    console.error("Error in getSignUp:", error);
    res.status(500).send("Internal Server Error");
  }
};

// POST /signup - Handle sign up form submission
export const postSignUp = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;
    // console.log(req.body);

    const name = `${firstName} ${lastName}`;

    if (!name || !email || !password || !confirmPassword) {
      return res.redirect("/signup?error=All fields are required");
    }

    if (password !== confirmPassword) {
      return res.redirect("/signup?error=Passwords do not match");
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.redirect("/signup?error=Email already registered");
    }

    // console.log("Existing user check passed :", existingUser);

    const hashedPassword = await bcrypt.hash(password, 10);

    // Default role = 1 (Student)
    const newUser = await createUser({
      name,
      email,
      password_hash: hashedPassword,
      role_id: 1,
    });

    // Auto login after signup
    // req.session = {
    //     userId: newUser.id,
    //     roleId: newUser.role_id,
    //     email: newUser.email,
    //     name: newUser.name
    // };

    res.redirect("/signin");
  } catch (error) {
    console.error("Error in postSignUp:", error);
    res.redirect("/signup?error=An error occurred during sign up");
  }
};

// GET /signout - Handle user sign out
export const signOut = (req, res) => {
  try {
    // Properly destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.redirect("/");
      }
      // Clear the session cookie
      res.clearCookie("connect.sid");
      res.redirect("/signin");
    });
  } catch (error) {
    console.error("Error in signOut:", error);
    res.redirect("/");
  }
};
