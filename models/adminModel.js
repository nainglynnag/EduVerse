import db from "../config/db.js";
import bcrypt from "bcrypt";

// Queries of Courses
export const getAllCourses = async () => {
  const [courses] = await db.promise().query(`
    SELECT cr.*, u.name AS instructor_name, c.name AS category_name, COUNT(e.student_id) AS students, d.name AS difficulty_level
    FROM courses cr
    LEFT JOIN users u ON cr.instructor_id = u.id
    LEFT JOIN categories c ON cr.category_id = c.id
    LEFT JOIN difficulty_levels d ON cr.difficulty_id = d.id
    LEFT JOIN enrollments e ON cr.id = e.course_id
    GROUP BY cr.id, u.name, c.name, d.name
    `);

  return courses;
};

export const createCourse = async (data) => {
  const {
    title,
    instructor_id,
    category_id,
    difficulty_id,
    price,
    description,
    status,
  } = data;

  // console.log(data);

  await db.promise().query(
    `INSERT INTO courses (title, instructor_id, category_id, difficulty_id, price, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      instructor_id || null,
      category_id,
      difficulty_id,
      price,
      description,
      status,
    ]
  );
};

// Queries for Instructors
export const getAllInstructors = async () => {
  const [instructors] = await db.promise().query(`SELECT u.* FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE r.name = "instructor"`);
  return instructors;
};

export const getAllInstructorsDetails = async () => {
  const [instructors] = await db.promise().query(`
    SELECT ip.*, u.name, u.email, u.status, u.joined_date, JSON_ARRAYAGG(c.title) AS courses, COUNT(DISTINCT e.student_id) AS total_students
    FROM instructor_profiles ip
    LEFT JOIN users u ON ip.user_id = u.id
    LEFT JOIN courses c ON ip.user_id = c.instructor_id
    LEFT JOIN enrollments e ON c.id = e.course_id
    GROUP BY ip.user_id;
    `);
  return instructors;
};

export const createInstructor = async (data) => {
  try {
    const { name, email, password, specialization, bio } = data;

    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log(name, email, hashedPassword, specialization, bio);

    const [result] = await db.promise().query(
      `INSERT INTO users (name, email, password_hash, role_id)
      VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, 2]
    );

    const userId = result.insertId;

    await db.promise().query(
      `
      INSERT INTO instructor_profiles (user_id, specialization, bio)
      VALUES (?, ?, ?)`,
      [userId, specialization, bio]
    );
  } catch (error) {
    console.log("Database operation failed in createInstructor :", error);
    throw new Error("Could not create instructor data.");
  }
};

// Queries for Categories
export const getAllCategories = async () => {
  const [categories] = await db.promise().query("SELECT * FROM categories");
  return categories;
};

// Queries for Difficulty Levels
export const getAllDifficulties = async () => {
  const [difficulties] = await db
    .promise()
    .query("SELECT * FROM difficulty_levels");
  return difficulties;
};
