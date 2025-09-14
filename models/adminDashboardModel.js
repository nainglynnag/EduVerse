import db from "../config/db.js";

// Error Handler
const errorHandler = (error, operation, dataFailed) => {
  console.log(`Database operation failed in ${operation}:`, error);
  throw new Error(`Could not ${dataFailed} data.`);
};

// Overall Queries for Dashboard
export const getDashboardData = async () => {
  try {
    const [total_instructors] = await db
      .promise()
      .query(
        `SELECT COUNT(DISTINCT id) AS total_instructors FROM users WHERE role_id = 2`
      );

    const [total_students] = await db
      .promise()
      .query(
        `SELECT COUNT(DISTINCT id) AS total_students FROM users WHERE role_id = 1`
      );

    const [total_active_students] = await db
      .promise()
      .query(
        `SELECT COUNT(DISTINCT id) AS total_active_students FROM users WHERE role_id = 1 AND status = "active"`
      );

    const [total_courses] = await db
      .promise()
      .query(`SELECT COUNT(DISTINCT id) AS total_courses FROM courses`);

    const [total_published_courses] = await db
      .promise()
      .query(
        `SELECT COUNT(DISTINCT id) AS total_published_courses FROM courses WHERE status = "published"`
      );

    const [total_draft_courses] = await db
      .promise()
      .query(
        `SELECT COUNT(DISTINCT id) AS total_draft_courses FROM courses WHERE status = "draft"`
      );

    const [course_prices] = await db.promise().query(`
      SELECT c.price, COUNT(DISTINCT e.student_id) AS total_students
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      GROUP BY c.id
    `);

    const [popular_courses] = await db.promise().query(`
      SELECT c.title, COUNT(e.id) AS total_enrollments
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      GROUP BY c.id
      ORDER BY total_enrollments DESC
      LIMIT 5
    `);

    const [revenue_data] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(e.enrolled_at, '%M') AS month_name,
        DATE_FORMAT(e.enrolled_at, '%Y') AS year,
        COUNT(e.id) AS total_enrollments,
        CASE 
            WHEN COUNT(e.id) > 0 THEN SUM(c.price)
            ELSE 0
        END AS total_revenue
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE c.price > 0
          AND YEAR(e.enrolled_at) = YEAR(CURDATE())   -- current year only
        GROUP BY MONTH(e.enrolled_at), DATE_FORMAT(e.enrolled_at, '%M'), DATE_FORMAT(e.enrolled_at, '%Y')
        ORDER BY MONTH(e.enrolled_at);
    `);

    const [students_growth] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(s.joined_date, '%M') AS month_name,
        DATE_FORMAT(s.joined_date, '%Y') AS year,
        COUNT(s.id) AS students
        FROM users s
        WHERE role_id = 1 AND YEAR(s.joined_date) = YEAR(CURDATE())
        GROUP BY MONTH(s.joined_date), DATE_FORMAT(s.joined_date, '%M'), DATE_FORMAT(s.joined_date, '%Y')
        ORDER BY MONTH(s.joined_date);
    `);

    const [top3_instructors] = await db.promise().query(`
      SELECT 
        i.id AS instructor_id,
        i.name AS instructor_name,
        COUNT(DISTINCT e.student_id) AS total_students
        FROM courses c
        JOIN users i ON c.instructor_id = i.id
        JOIN enrollments e ON c.id = e.course_id
        WHERE i.role_id = (SELECT id FROM roles WHERE name = 'instructor')
        GROUP BY i.id, i.name
        ORDER BY total_students DESC
        LIMIT 3;
    `);

    const [top3_students] = await db.promise().query(`
      SELECT 
        u.id AS student_id,
        u.name AS student_name,
        COUNT(DISTINCT e.course_id) AS total_courses_enrolled
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        WHERE u.role_id = (SELECT id FROM roles WHERE name = 'student')
        GROUP BY u.id, u.name
        ORDER BY total_courses_enrolled DESC
        LIMIT 3;
    `);

    const [top3_course_categories] = await db.promise().query(`
      SELECT 
        ct.id AS category_id,
        ct.name AS category_name,
        COUNT(DISTINCT e.student_id) AS total_students_enrolled
        FROM categories ct
        JOIN courses c ON ct.id = c.category_id
        JOIN enrollments e ON c.id = e.course_id
        GROUP BY ct.id, ct.name
        ORDER BY total_students_enrolled DESC
        LIMIT 3;
    `);

    const data = {
      total_instructors: total_instructors[0].total_instructors,
      total_students: total_students[0].total_students,
      total_active_students: total_active_students[0].total_active_students,
      total_courses: total_courses[0].total_courses,
      total_published_courses:
        total_published_courses[0].total_published_courses,
      total_draft_courses: total_draft_courses[0].total_draft_courses,
      course_prices,
      popular_courses,
      revenue_data,
      students_growth,
      top3_course_categories,
      top3_instructors,
      top3_students,
    };

    return data;
  } catch (error) {
    errorHandler(error, "getDashboardData", "get data for dashboard");
  }
};
