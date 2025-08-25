import express from "express";
import expressLayouts from "express-ejs-layouts";
import path from "path";
import { fileURLToPath } from "url";
import "./config/db.js";

import adminRoutes from "./routes/adminRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
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

app.get("/courses", (req, res) => {
  // courses listing page
  res.render("courses"); // no layout because default is false
});

app.use("/admin", adminRoutes);
app.use("/instructor", instructorRoutes);
app.use("/api/courses", courseRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
