import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Create database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eduverse_db',
});

// Middleware to fetch instructor data for layout
export const getInstructorData = async (req, res, next) => {
  try {
    const instructorId = 4; // In real app, get from session

    const instructorQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.status,
        u.joined_date,
        ip.specialization,
        ip.bio,
        ip.rating
      FROM users u
      LEFT JOIN instructor_profiles ip ON u.id = ip.user_id
      WHERE u.id = ? AND u.role_id = (SELECT id FROM roles WHERE name = 'instructor')
    `;

    const [instructorResults] = await db.execute(instructorQuery, [instructorId]);
    const instructor = instructorResults[0] || { name: 'Instructor', email: '', status: 'active' };
    
    // Make instructor data available to all routes
    res.locals.instructor = instructor;
    next();
  } catch (error) {
    console.error('Error fetching instructor data:', error);
    // Set default instructor data
    res.locals.instructor = { name: 'Instructor', email: '', status: 'active' };
    next();
  }
};

// Get instructor dashboard data
export const getInstructorDashboard = async (req, res) => {
  try {
    // For now, we'll use instructor ID 4 as shown in the current code
    // In a real application, this would come from the authenticated user session
    const instructorId = 4;

    // Get instructor's courses
    const coursesQuery = `
      SELECT 
        c.*,
        cat.name as category_name,
        cat.title as category_title,
        cat.display_name as category_display_name,
        cat.description as category_description,
        cat.color_theme as category_color,
        dl.name as difficulty_name,
        dl.description as difficulty_description,
        COUNT(e.id) as enrollment_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN difficulty_levels dl ON c.difficulty_id = dl.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.instructor_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    // Get total students enrolled in instructor's courses
    const studentsQuery = `
      SELECT COUNT(DISTINCT e.student_id) as total_students
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.instructor_id = ?
    `;

    // Execute queries using async/await
    const [coursesResults] = await db.execute(coursesQuery, [instructorId]);
    const [studentsResults] = await db.execute(studentsQuery, [instructorId]);

    const courses = coursesResults || [];
    const totalStudents = studentsResults[0]?.total_students || 0;
    const totalCourses = courses.length;
    const avgRating = parseFloat(res.locals.instructor.rating) || 0.0;

    // Render the dashboard with data
    res.render("instructors/dashboard/index", { 
      layout: "instructors/layouts/layout",
      instructor: res.locals.instructor,
      courses,
      stats: {
        totalCourses,
        totalStudents,
        avgRating
      }
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).render('error', { 
      message: 'Internal server error',
      layout: "instructors/layouts/layout"
    });
  }
};

// Get instructor courses list
export const getInstructorCourses = async (req, res) => {
  try {
    const instructorId = 4; // In real app, get from session

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
        COUNT(e.id) as enrollment_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN difficulty_levels dl ON c.difficulty_id = dl.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.instructor_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    const [results] = await db.execute(query, [instructorId]);

    res.render("instructors/courses/index", { 
      layout: "instructors/layouts/layout",
      instructor: res.locals.instructor,
      courses: results || []
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).render('error', { 
      message: 'Internal server error',
      layout: "instructors/layouts/layout"
    });
  }
};

// Get create course page with categories and difficulty levels
export const getCreateCoursePage = async (req, res) => {
  try {
    const categoriesQuery = `
      SELECT 
        id, 
        name, 
        title, 
        display_name, 
        description, 
        color_theme 
      FROM categories 
      ORDER BY name
    `;

    const difficultyQuery = `
      SELECT 
        id, 
        name, 
        description 
      FROM difficulty_levels 
      ORDER BY id
    `;

    const [categoriesResults] = await db.execute(categoriesQuery);
    const [difficultyResults] = await db.execute(difficultyQuery);

    res.render("instructors/courses/create", { 
      layout: "instructors/layouts/layout",
      instructor: res.locals.instructor,
      categories: categoriesResults || [],
      difficultyLevels: difficultyResults || []
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).render('error', { 
      message: 'Internal server error',
      layout: "instructors/layouts/layout"
    });
  }
};

// Create a new course
export const createCourse = async (req, res) => {
  try {
    const {
      courseTitle: title,
      courseCategory: category_id,
      courseDifficulty: difficulty_id,
      coursePrice: price,
      courseDescription: description,
      status = 'draft'
    } = req.body;

    const instructorId = 4; // In real app, get from session

    // Validate required fields
    if (!title || !category_id || !difficulty_id) {
      return res.status(400).render('error', {
        message: 'Missing required fields: title, category, difficulty level',
        layout: "instructors/layouts/layout"
      });
    }

    const query = `
      INSERT INTO courses (title, instructor_id, category_id, difficulty_id, price, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [title, instructorId, category_id, difficulty_id, price || 0.00, description, status];

    const [result] = await db.execute(query, values);

    // Redirect to courses list with success message
    res.redirect('/instructor/courses?success=Course created successfully!');

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).render('error', { 
      message: 'Error creating course. Please try again.',
      layout: "instructors/layouts/layout"
    });
  }
};

// Get edit course page
export const getEditCoursePage = async (req, res) => {
  try {
    const courseId = req.params.id;
    const instructorId = 4; // In real app, get from session

    // Get course data
    const courseQuery = `
      SELECT * FROM courses 
      WHERE id = ? AND instructor_id = ?
    `;
    const [courseResults] = await db.execute(courseQuery, [courseId, instructorId]);
    const course = courseResults[0];

    if (!course) {
      return res.render("instructors/courses/edit", { 
        layout: "instructors/layouts/layout",
        instructor: res.locals.instructor,
        course: null,
        categories: [],
        difficultyLevels: []
      });
    }

    // Get categories
    const categoriesQuery = `
      SELECT id, name, title, display_name, description, color_theme 
      FROM categories 
      ORDER BY name
    `;

    // Get difficulty levels
    const difficultyQuery = `
      SELECT id, name, description 
      FROM difficulty_levels 
      ORDER BY id
    `;

    const [categoriesResults] = await db.execute(categoriesQuery);
    const [difficultyResults] = await db.execute(difficultyQuery);

    res.render("instructors/courses/edit", { 
      layout: "instructors/layouts/layout",
      instructor: res.locals.instructor,
      course,
      categories: categoriesResults || [],
      difficultyLevels: difficultyResults || []
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).render('error', { 
      message: 'Error loading course. Please try again.',
      layout: "instructors/layouts/layout"
    });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const instructorId = 4; // In real app, get from session
    const {
      courseTitle: title,
      courseCategory: category_id,
      courseDifficulty: difficulty_id,
      coursePrice: price,
      courseDescription: description,
      courseStatus: status
    } = req.body;

    // Validate required fields
    if (!title || !category_id || !difficulty_id) {
      return res.status(400).render('error', {
        message: 'Missing required fields: title, category, difficulty level',
        layout: "instructors/layouts/layout"
      });
    }

    // Check if course exists and belongs to instructor
    const checkQuery = `
      SELECT id FROM courses 
      WHERE id = ? AND instructor_id = ?
    `;
    const [checkResults] = await db.execute(checkQuery, [courseId, instructorId]);
    
    if (checkResults.length === 0) {
      return res.status(404).render('error', {
        message: 'Course not found or you do not have permission to edit it.',
        layout: "instructors/layouts/layout"
      });
    }

    // Update course
    const updateQuery = `
      UPDATE courses 
      SET title = ?, category_id = ?, difficulty_id = ?, price = ?, description = ?, status = ?
      WHERE id = ? AND instructor_id = ?
    `;

    const values = [title, category_id, difficulty_id, price || 0.00, description, status, courseId, instructorId];
    await db.execute(updateQuery, values);

    // Redirect to courses list with success message
    res.redirect('/instructor/courses?success=Course updated successfully!');

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).render('error', { 
      message: 'Error updating course. Please try again.',
      layout: "instructors/layouts/layout"
    });
  }
};
