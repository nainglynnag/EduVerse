import db from "../config/db.js";

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
