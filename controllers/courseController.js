import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Create database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eduverse_db',
});

// Create a new course
export const createCourse = async (req, res) => {
  try {
    const {
      title,
      instructor_id,
      category_id,
      difficulty_id,
      price,
      description,
      status = 'draft'
    } = req.body;

    // Validate required fields
    if (!title || !instructor_id || !category_id || !difficulty_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, instructor_id, category_id, difficulty_id"
      });
    }

    const query = `
      INSERT INTO courses (title, instructor_id, category_id, difficulty_id, price, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [title, instructor_id, category_id, difficulty_id, price || 0.00, description, status];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: "Error creating course",
          error: err.message
        });
      }

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        courseId: result.insertId,
        data: {
          id: result.insertId,
          title,
          instructor_id,
          category_id,
          difficulty_id,
          price: price || 0.00,
          description,
          status
        }
      });
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all courses
export const getAllCourses = async (req, res) => {
  try {
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
        ip.specialization as instructor_specialization,
        ip.bio as instructor_bio,
        ip.rating as instructor_rating,
        COUNT(e.id) as enrollment_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN difficulty_levels dl ON c.difficulty_id = dl.id
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN instructor_profiles ip ON u.id = ip.user_id
      LEFT JOIN enrollments e ON c.id = e.course_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: "Error fetching courses",
          error: err.message
        });
      }

      res.status(200).json({
        success: true,
        count: results.length,
        data: results
      });
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get courses by instructor
export const getCoursesByInstructor = async (req, res) => {
  try {
    const { instructor_id } = req.params;

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

    db.query(query, [instructor_id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: "Error fetching instructor courses",
          error: err.message
        });
      }

      res.status(200).json({
        success: true,
        count: results.length,
        data: results
      });
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get single course by ID
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

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
        ip.specialization as instructor_specialization,
        ip.bio as instructor_bio,
        ip.rating as instructor_rating,
        COUNT(e.id) as enrollment_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN difficulty_levels dl ON c.difficulty_id = dl.id
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN instructor_profiles ip ON u.id = ip.user_id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.id = ?
      GROUP BY c.id
    `;

    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: "Error fetching course",
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      res.status(200).json({
        success: true,
        data: results[0]
      });
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category_id,
      difficulty_id,
      price,
      description,
      status
    } = req.body;

    const query = `
      UPDATE courses 
      SET title = ?, category_id = ?, difficulty_id = ?, price = ?, description = ?, status = ?
      WHERE id = ?
    `;

    const values = [title, category_id, difficulty_id, price, description, status, id];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: "Error updating course",
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      res.status(200).json({
        success: true,
        message: "Course updated successfully"
      });
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const query = "DELETE FROM courses WHERE id = ?";

    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: "Error deleting course",
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      res.status(200).json({
        success: true,
        message: "Course deleted successfully"
      });
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get categories for dropdown
export const getCategories = async (req, res) => {
  try {
    const query = `
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

    db.query(query, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: "Error fetching categories",
          error: err.message
        });
      }

      res.status(200).json({
        success: true,
        data: results
      });
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get difficulty levels for dropdown
export const getDifficultyLevels = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        name, 
        description 
      FROM difficulty_levels 
      ORDER BY id
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: "Error fetching difficulty levels",
          error: err.message
        });
      }

      res.status(200).json({
        success: true,
        data: results
      });
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get instructor profile information
export const getInstructorProfile = async (req, res) => {
  try {
    const { instructor_id } = req.params;

    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.status,
        u.joined_date,
        ip.specialization,
        ip.bio,
        ip.rating,
        COUNT(c.id) as total_courses,
        COUNT(CASE WHEN c.status = 'published' THEN 1 END) as published_courses,
        COUNT(CASE WHEN c.status = 'draft' THEN 1 END) as draft_courses,
        SUM(CASE WHEN c.status = 'published' THEN c.price ELSE 0 END) as total_revenue
      FROM users u
      LEFT JOIN instructor_profiles ip ON u.id = ip.user_id
      LEFT JOIN courses c ON u.id = c.instructor_id
      WHERE u.id = ? AND u.role_id = (SELECT id FROM roles WHERE name = 'instructor')
      GROUP BY u.id
    `;

    db.query(query, [instructor_id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: "Error fetching instructor profile",
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Instructor not found"
        });
      }

      res.status(200).json({
        success: true,
        data: results[0]
      });
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get course enrollments
export const getCourseEnrollments = async (req, res) => {
  try {
    const { course_id } = req.params;

    const query = `
      SELECT 
        e.id,
        e.enrolled_at,
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        sp.plan_id,
        spl.name as plan_name
      FROM enrollments e
      LEFT JOIN users u ON e.student_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN student_plans spl ON sp.plan_id = spl.id
      WHERE e.course_id = ?
      ORDER BY e.enrolled_at DESC
    `;

    db.query(query, [course_id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: "Error fetching enrollments",
          error: err.message
        });
      }

      res.status(200).json({
        success: true,
        count: results.length,
        data: results
      });
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get instructor information by ID
export const getInstructorById = async (req, res) => {
  try {
    const { instructor_id } = req.params;

    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        ip.specialization,
        ip.bio,
        ip.rating
      FROM users u
      LEFT JOIN instructor_profiles ip ON u.id = ip.user_id
      WHERE u.id = ?
    `;

    db.query(query, [instructor_id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: "Error fetching instructor information",
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Instructor not found"
        });
      }

      res.status(200).json({
        success: true,
        data: results[0]
      });
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
