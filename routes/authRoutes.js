import express from "express";
import { getSignIn, getSignUp, postSignIn, postSignUp, signOut } from "../controllers/authController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index", { layout: false });
});

// Sign in routes 
router.get("/signin", getSignIn);
router.post("/signin", express.urlencoded({ extended: true }), postSignIn);

// Sign up routes
router.get("/signup", getSignUp);
router.post("/signup", express.urlencoded({ extended: true }), postSignUp);


// Sign out route
router.get("/signout", signOut);

export default router;
