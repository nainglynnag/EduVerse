import dotenv from "dotenv";
import db from "../config/db.js";

dotenv.config();

export const getCourseById = async (courseId) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT c.*, 
              cat.name as category_name,
              u.name as instructor_name,
              COUNT(e.student_id) as total_students
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN users u ON c.instructor_id = u.id
       LEFT JOIN enrollments e ON c.id = e.course_id
       WHERE c.id = ?
       GROUP BY c.id`,
      [courseId]
    );
    return rows && rows.length ? rows[0] : null;
  } catch (error) {
    console.error("Error in getCourseById:", error);
    throw error;
  }
};

export const getCourseWithLessons = async (courseId) => {
  try {
    // Get course details
    const course = await getCourseById(courseId);
    if (!course) return null;

    // Get lessons for this course
    const [lessons] = await db.promise().query(
      `SELECT * FROM course_lessons 
       WHERE course_id = ? 
       ORDER BY lesson_no ASC`,
      [courseId]
    );

    // Add lessons to course object
    course.lessons = lessons || [];

    return course;
  } catch (error) {
    console.error("Error in getCourseWithLessons:", error);
    throw error;
  }
};

export const getAllCourses = async () => {
  try {
    const [rows] = await db.promise().query(
      `SELECT c.*, 
              cat.name as category_name,
              u.name as instructor_name,
              u.email as instructor_email,
              COUNT(e.student_id) as total_students
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN users u ON c.instructor_id = u.id
       LEFT JOIN enrollments e ON c.id = e.course_id
       WHERE c.status = 'published'
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    return rows || [];
  } catch (error) {
    console.error("Error in getAllCourses:", error);
    throw error;
  }
};

export default db;
