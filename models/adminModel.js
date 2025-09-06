import db from "../config/db.js";
import bcrypt from "bcrypt";

// Queries of Courses
export const getAllCourses = async () => {
  try {
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
  } catch (error) {
    console.log("Database operation failed in getAllCourses :", error);
    throw new Error("Could not get course data.");
  }
};

export const createCourse = async (data) => {
  try {
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
  } catch (error) {
    console.log("Database operation failed in createCourse :", error);
    throw new Error("Could not create course data.");
  }
};

// Queries for Instructors
export const getAllInstructors = async () => {
  const [instructors] = await db.promise().query(`SELECT u.* FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE r.name = "instructor"`);
  return instructors;
};

export const getAllInstructorsDetails = async () => {
  try {
    const [instructors] = await db.promise().query(`
    SELECT ip.*, u.name, u.email, u.status, u.joined_date, JSON_ARRAYAGG(c.title) AS courses, COUNT(DISTINCT e.student_id) AS total_students
    FROM instructor_profiles ip
    LEFT JOIN users u ON ip.user_id = u.id
    LEFT JOIN courses c ON ip.user_id = c.instructor_id
    LEFT JOIN enrollments e ON c.id = e.course_id
    GROUP BY ip.user_id;
    `);
    return instructors;
  } catch (error) {
    console.log(
      "Database operation failed in getAllInstructorsDetails :",
      error
    );
    throw new Error("Could not get instructor details data.");
  }
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

export const updateInstructor = async (user_id, updates) => {
  try {
    // const { name, email, password, specialization, bio } = updates;
    if (updates.password_hash) {
      const password_hash = await bcrypt.hash(updates.password_hash, 10);

      updates.password_hash = password_hash;
    }

    // console.log("Updates :", updates);

    const userFields = {};
    const instructorFields = {};

    const userColumns = ["name", "email", "password_hash"];
    const instructorColumns = ["specialization", "bio"];

    Object.entries(updates).map(([key, value]) => {
      if (userColumns.includes(key)) {
        userFields[key] = value;
      } else if (instructorColumns.includes(key)) {
        instructorFields[key] = value;
      }

      // console.log(userFields, instructorFields);
    });

    // Build dynamic SET clauses
    const userSetClause = Object.keys(userFields)
      .map((key) => `u.${key} = ?`)
      .join(", ");
    const instructorSetClause = Object.keys(instructorFields)
      .map((key) => `i.${key} = ?`)
      .join(", ");

    // Combine SET clauses
    const setClauses = [userSetClause, instructorSetClause]
      .filter((clause) => clause)
      .join(", ");

    // Build values array
    const values = [
      ...Object.values(userFields),
      ...Object.values(instructorFields),
      user_id,
    ];

    const query = `
      UPDATE users u
      JOIN instructor_profiles i ON u.id = i.user_id
      SET ${setClauses}
      WHERE u.id = ?
    `;

    return await db.promise().query(query, values);
  } catch (error) {
    console.log("Database operation failed in updateInstructor :", error);
    throw new Error("Could not update instructor data.");
  }
};

export const deleteInstructor = async (user_id) => {
  try {
    await db.promise().query("DELETE FROM users WHERE id = ?", [user_id]);
  } catch (error) {
    console.log("Database operation failed in deleteInstructor :", error);
    throw new Error("Could not delete instructor data.");
  }
};

// Queries for Categories
export const getAllCategories = async () => {
  try {
    const [categories] = await db.promise().query(`
      SELECT cat.*, COUNT(c.id) AS total_courses
      FROM categories cat
      LEFT JOIN courses c ON cat.id = c.category_id
      GROUP BY cat.id
    `);

    return categories;
  } catch (error) {
    console.log("Database operation failed in getAllCategories :", error);
    throw new Error("Could not get category data.");
  }
};

export const createCategory = async ({ name, color, description }) => {
  try {
    await db
      .promise()
      .query(
        `INSERT INTO categories (name, color_theme, description) VALUES (?, ?, ?)`,
        [name, color, description]
      );
  } catch (error) {
    console.log("Database operation failed in createCategory :", error);
    throw new Error("Could not create category data.");
  }
};

export const updateCategory = async (id, updates) => {
  try {
    // console.log("From updateCategory model :", id, updates);

    // Dynamic SET clauses
    const setClauses = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    // console.log("setClauses :", setClauses);

    const values = [...Object.values(updates), id];
    // console.log("values :", values);

    const query = `
      UPDATE categories
      SET ${setClauses}
      WHERE id = ?
    `;

    return await db.promise().query(query, values);
  } catch (error) {
    console.log("Database operation failed in updateCategory :", error);
    throw new Error("Could not update category data.");
  }
};

export const deleteCategory = async (id) => {
  try {
    await db.promise().query("DELETE FROM categories WHERE id = ?", [id]);
  } catch (error) {
    console.log("Database operation failed in deleteCategory :", error);
    throw new Error("Could not delete category data.");
  }
};

// Queries for Difficulty Levels
export const getAllDifficulties = async () => {
  try {
    const [difficulties] = await db
      .promise()
      .query("SELECT * FROM difficulty_levels");
    return difficulties;
  } catch (error) {
    console.log("Database operation failed in getAllDifficulties :", error);
    throw new Error("Could not get difficulty data.");
  }
};

// Queries for Admins
export const getAllAdmins = async () => {
  try {
    const [admins] = await db.promise().query(`SELECT u.* FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE r.name = "admin"`);
    return admins;
  } catch (error) {
    console.log("Database operation failed in getAllAdmins :", error);
    throw new Error("Could not get admin data.");
  }
};

export const createAdmin = async ({ name, email, password }) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db
      .promise()
      .query(
        "INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, 3]
      );
  } catch (error) {
    console.log("Database operation failed in createAdmin :", error);
    throw new Error("Could not create admin account.");
  }
};

export const updateAdmin = async (id, updates) => {
  try {
    if (updates.password_hash) {
      const password_hash = await bcrypt.hash(updates.password_hash, 10);

      updates.password_hash = password_hash;
    }

    // Dynamic SET clauses
    const setClauses = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    // console.log("setClauses :", setClauses);

    const values = [...Object.values(updates), id];
    // console.log("values :", values);

    const query = `
      UPDATE users
      SET ${setClauses}
      WHERE id = ?
    `;

    return await db.promise().query(query, values);
  } catch (error) {
    console.log("Database operation failed in updateAdmin :", error);
    throw new Error("Could not update admin data.");
  }
};

export const deleteAdmin = async (id) => {
  try {
    await db.promise().query("DELETE FROM users WHERE id = ?", [id]);
  } catch (error) {
    console.log("Database operation failed in deleteAdmin :", error);
    throw new Error("Could not delete admin data.");
  }
};
