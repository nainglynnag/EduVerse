import dotenv from "dotenv";
import db from "../config/db.js";

dotenv.config();

// Helper function for database errors
const handleDbError = (error, operation) => {
  console.error(`Database error in ${operation}:`, error);
  throw new Error(`Database operation failed: ${operation}`);
};

// Instructor Profile Functions
export const getInstructorById = async (instructorId) => {
  try {
    const query = `
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

    const [results] = await db.execute(query, [instructorId]);
    return results[0] || { 
      name: 'Instructor', 
      email: '', 
      status: 'active',
      rating: 0.0
    };
  } catch (error) {
    handleDbError(error, 'getInstructorById');
  }
};

// Course Management Functions
export const getInstructorCourses = async (instructorId) => {
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
    return results || [];
  } catch (error) {
    handleDbError(error, 'getInstructorCourses');
  }
};

export const getCourseByIdAndInstructor = async (courseId, instructorId) => {
  try {
    const query = `
      SELECT 
        c.*,
        cat.name as category_name,
        cat.display_name as category_display_name,
        dl.name as difficulty_name,
        COUNT(e.id) as enrollment_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN difficulty_levels dl ON c.difficulty_id = dl.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.id = ? AND c.instructor_id = ?
      GROUP BY c.id
    `;

    const [results] = await db.execute(query, [courseId, instructorId]);
    return results[0] || null;
  } catch (error) {
    handleDbError(error, 'getCourseByIdAndInstructor');
  }
};

export const createCourse = async (courseData) => {
  try {
    const {
      title,
      category_id,
      difficulty_id,
      price,
      description,
      status,
      instructor_id
    } = courseData;

    const query = `
      INSERT INTO courses (title, category_id, difficulty_id, price, description, status, instructor_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await db.execute(query, [
      title,
      category_id,
      difficulty_id,
      price,
      description,
      status,
      instructor_id
    ]);

    return result.insertId;
  } catch (error) {
    handleDbError(error, 'createCourse');
  }
};

export const updateCourse = async (courseId, instructorId, courseData) => {
  try {
    const {
      title,
      category_id,
      difficulty_id,
      price,
      description,
      status
    } = courseData;

    const query = `
      UPDATE courses 
      SET title = ?, category_id = ?, difficulty_id = ?, price = ?, description = ?, status = ?, updated_at = NOW()
      WHERE id = ? AND instructor_id = ?
    `;

    const [result] = await db.execute(query, [
      title,
      category_id,
      difficulty_id,
      price,
      description,
      status,
      courseId,
      instructorId
    ]);

    return result.affectedRows > 0;
  } catch (error) {
    handleDbError(error, 'updateCourse');
  }
};

// Student Management Functions
export const getInstructorTotalStudents = async (instructorId) => {
  try {
    const query = `
      SELECT COUNT(DISTINCT e.student_id) as total_students
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.instructor_id = ?
    `;

    const [results] = await db.execute(query, [instructorId]);
    return results[0]?.total_students || 0;
  } catch (error) {
    handleDbError(error, 'getInstructorTotalStudents');
  }
};

export const getInstructorStudents = async (instructorId) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.joined_date,
        COUNT(DISTINCT e.course_id) as courses_enrolled,
        GROUP_CONCAT(DISTINCT c.title SEPARATOR ', ') as enrolled_courses,
        COALESCE(SUM(DISTINCT cl.duration_minutes), 0) as total_study_time_minutes,
        COUNT(DISTINCT lp.id) as lessons_completed,
        COALESCE(SUM(CASE WHEN lp.completed = 1 THEN cl.duration_minutes ELSE 0 END), 0) as completed_lessons_time
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN course_lessons cl ON c.id = cl.course_id
      LEFT JOIN lesson_progress lp ON u.id = lp.student_id AND cl.id = lp.lesson_id
      WHERE c.instructor_id = ? AND u.role_id = (SELECT id FROM roles WHERE name = 'student')
      GROUP BY u.id, u.name, u.email, u.joined_date
      ORDER BY courses_enrolled DESC, u.name
    `;

    const [results] = await db.execute(query, [instructorId]);
    return results || [];
  } catch (error) {
    handleDbError(error, 'getInstructorStudents');
  }
};

// Category and Difficulty Functions
export const getAllCategories = async () => {
  try {
    const query = `
      SELECT id, name, title, display_name, description, color_theme
      FROM categories
      ORDER BY display_name
    `;

    const [results] = await db.execute(query);
    return results || [];
  } catch (error) {
    handleDbError(error, 'getAllCategories');
  }
};

export const getAllDifficultyLevels = async () => {
  try {
    const query = `
      SELECT id, name, description
      FROM difficulty_levels
      ORDER BY id
    `;

    const [results] = await db.execute(query);
    return results || [];
  } catch (error) {
    handleDbError(error, 'getAllDifficultyLevels');
  }
};
