import db from "../config/db.js";

const errorHandler = (error, operation, dataFailed) => {
  console.log(`Database operation failed in ${operation}:`, error);
  throw new Error(`Could not ${dataFailed} data.`);
};

export const getStudentEnrolledCourses = async (studentId) => {
  try {
    // If no studentId provided, return an empty list
    if (!studentId) return [[]];

    const [rows] = await db.promise().query(
      `
      SELECT c.id, c.title, c.description, c.price, e.enrolled_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `,
      [studentId]
    );

    return [rows];
  } catch (error) {
    errorHandler(error, "getStudentEnrolledCourses", "get enrolled courses");
  }
};

export const getStudentProgressSummary = async (studentId) => {
  try {
    if (!studentId) return [[]];

    // A simple summary: completed lessons count per course
    const [rows] = await db.promise().query(
      `
      SELECT c.id AS course_id, c.title, COUNT(cl.id) AS completed_lessons
      FROM course_lessons cl
      JOIN courses c ON cl.course_id = c.id
      JOIN lesson_completions lc ON lc.lesson_id = cl.id AND lc.student_id = ?
      GROUP BY c.id, c.title
    `,
      [studentId]
    );

    return [rows];
  } catch (error) {
    errorHandler(error, "getStudentProgressSummary", "get progress summary");
  }
};

export const getRecommendedCourses = async (studentId) => {
  try {
    // Simple placeholder: top 5 popular courses
    const [rows] = await db.promise().query(
      `
      SELECT c.id, c.title, c.description, COUNT(e.id) AS enroll_count
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      GROUP BY c.id
      ORDER BY enroll_count DESC
      LIMIT 5
    `
    );

    return [rows];
  } catch (error) {
    errorHandler(error, "getRecommendedCourses", "get recommended courses");
  }
};

export default {
  getStudentEnrolledCourses,
  getStudentProgressSummary,
  getRecommendedCourses,
};
