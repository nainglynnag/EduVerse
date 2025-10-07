import db from "../config/db.js";

const handleDbError = (error, operation) => {
  console.error(`Database error in ${operation}:`, error);
  throw new Error(`Database operation failed: ${operation}`);
};

const validateStudentId = (studentId) => {
  if (!studentId || isNaN(parseInt(studentId))) {
    throw new Error('Invalid student ID');
  }
  return parseInt(studentId);
};

export const getStudentById = async (studentId) => {
  try {
    const validId = validateStudentId(studentId);
    
    const query = `
      SELECT u.id,
             CONCAT('s', LPAD(u.id, 7, '0')) AS student_code,
             u.name,
             u.email,
             u.status,
             u.joined_date,
             pl.name AS plan,
             COUNT(e.course_id) AS total_courses
        FROM users u
        JOIN student_profiles sp ON sp.user_id = u.id
        LEFT JOIN student_plans pl ON sp.plan_id = pl.id
        LEFT JOIN enrollments e ON u.id = e.student_id
        WHERE u.id = ?
    `;

    const [results] = await db.promise().query(query, [validId]);
    console.log("results :", results[0]);
    // return results[0] || { 
    //   id: validId,
    //   name: 'Student', 
    //   email: '', 
    //   status: 'active',
    // };
    return results[0];

  } catch (error) {
    handleDbError(error, 'getStudentById');
  }
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
