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

app.get("/courses", async (req, res) => {
  // courses listing page with server-side data
  try {
    const db = (await import("./config/db.js")).default;
    
    const query = `
      SELECT 
        c.*,
        cat.name as category_name,
        cat.title as category_title,
        cat.display_name as category_display_name,
        cat.description as category_description,
        cat.color_theme as category_color,
        dl.name as difficulty_name,
        dl.description as difficulty_description,
        u.name as instructor_name,
        u.email as instructor_email,
        COUNT(e.id) as enrollment_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN difficulty_levels dl ON c.difficulty_id = dl.id
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.status = 'published'
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    const [results] = await db.execute(query);
    
    res.render("courses", { 
      courses: results || [],
      layout: false
    });
  } catch (error) {
    console.error('Error loading courses:', error);
    res.render("courses", { 
      courses: [],
      layout: false
    });
  }
});

app.use("/admin", adminRoutes);
app.use("/instructor", instructorRoutes);
app.use("/api/courses", courseRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
