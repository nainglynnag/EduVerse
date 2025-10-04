import express from "express";
import session from "express-session";
import expressLayouts from "express-ejs-layouts";
import path from "path";
import { fileURLToPath } from "url";

// For toast
import flash from "connect-flash";

import adminRoutes from "./routes/adminRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

const app = express();
const PORT = 3001;

// Middlewares for User session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.locals.admin = req.session.admin || null;
  next();
});

// Middlewares for Toast
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Layouts (express-ejs-layouts)
app.use(expressLayouts);
// disable default: views render without layout unless overridden
app.set("layout", false);

// Routes
app.get("/", (req, res) => {
  // landing page will NOT use any layout
  res.render("index"); // no layout because default is false
});

app.use("/admin", adminRoutes);
app.use("/instructor", instructorRoutes);
app.use("/students", studentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
