import db from "../config/db.js";
import bcrypt from "bcrypt";

// Error Handler
const errorHandler = (error, operation, dataFailed) => {
  console.log(`Database operation failed in ${operation}:`, error);
  throw new Error(`Could not ${dataFailed} data.`);
};

// Queries of Courses
export const getAllCourses = async (page = 1, limit = 10, search) => {
  try {
    // Pagination params
    const offset = (page - 1) * limit;

    // Get all courses with pagination
    const [courses] = await db.promise().query(
      `
    SELECT cr.*, u.name AS instructor_name, c.name AS category_name, COUNT(e.student_id) AS students, d.name AS difficulty_level
    FROM courses cr
    LEFT JOIN users u ON cr.instructor_id = u.id
    LEFT JOIN categories c ON cr.category_id = c.id
    LEFT JOIN difficulty_levels d ON cr.difficulty_id = d.id
    LEFT JOIN enrollments e ON cr.id = e.course_id
    WHERE cr.title LIKE ? OR cr.description LIKE ? OR u.name LIKE ? OR c.name LIKE ? OR d.name LIKE ?
    GROUP BY cr.id, u.name, c.name, d.name
    LIMIT ? OFFSET ?
    `,
      [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        limit,
        offset,
      ]
    );

    const [totalCourses] = await db.promise().query(
      `SELECT COUNT(DISTINCT cr.id) AS total
        FROM courses cr
        LEFT JOIN users u ON cr.instructor_id = u.id
        LEFT JOIN categories c ON cr.category_id = c.id
        LEFT JOIN difficulty_levels d ON cr.difficulty_id = d.id
        LEFT JOIN enrollments e ON cr.id = e.course_id
        WHERE cr.title LIKE ? OR cr.description LIKE ? OR u.name LIKE ? OR c.name LIKE ? OR d.name LIKE ?
      `,
      [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      ]
    );

    return { courses, totalCourses: totalCourses[0].total };
  } catch (error) {
    errorHandler(error, "getAllCourses", "get course");
  }
};

export const getCourseDetails = async (courseId) => {
  try {
    // Get course basic details
    const [courseData] = await db.promise().query(
      `
      SELECT c.*, u.id AS instructor_id, u.name AS instructor_name, cat.name AS category_name, d.name AS difficulty_level,
             COUNT(e.student_id) AS total_students
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN difficulty_levels d ON c.difficulty_id = d.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.id = ?
      GROUP BY c.id
    `,
      [courseId]
    );

    // Get course objectives
    const [objectives] = await db
      .promise()
      .query(`SELECT objective FROM course_objectives WHERE course_id = ?`, [
        courseId,
      ]);

    const [prerequisites] = await db
      .promise()
      .query(
        `SELECT prerequisite FROM course_prerequisites WHERE course_id = ?`,
        [courseId]
      );

    // Get course lessons with video URLs
    const [lessons] = await db.promise().query(
      `SELECT id, lesson_no, title, duration_mins, description, video_url 
       FROM course_lessons 
       WHERE course_id = ? 
       ORDER BY lesson_no`,
      [courseId]
    );

    const course = courseData[0];
    if (course) {
      course.objectives = objectives.map((obj) => obj.objective).join(" | ");
      course.prerequisites = prerequisites
        .map((prereq) => prereq.prerequisite)
        .join(" | ");
      course.lessons = lessons;
    }

    return [course];
  } catch (error) {
    errorHandler(error, "getCourseDetails", "get course details");
  }
};

export const createCourse = async (data) => {
  try {
    const {
      courseTitle,
      instructorId,
      courseCategory,
      courseDifficulty,
      coursePrice,
      courseDescription,
      status,
      courseObjectives,
      coursePrerequisites,
      lessonTitle,
      lessonDuration,
      lessonDescription,
      videoUrl,
    } = data;
    // Normalize helpers
    const toArray = (value) => {
      if (value === undefined || value === null) return [];
      if (Array.isArray(value)) return value;
      return [value];
    };

    const objectives = toArray(courseObjectives)
      .map((s) => (typeof s === "string" ? s.trim() : s))
      .filter((s) => s && s.length > 0);

    const prerequisites = toArray(coursePrerequisites)
      .map((s) => (typeof s === "string" ? s.trim() : s))
      .filter((s) => s && s.length > 0);

    const lessonTitles = toArray(lessonTitle);
    const lessonDurations = toArray(lessonDuration);
    const lessonDescriptions = toArray(lessonDescription);
    const videoUrls = toArray(videoUrl);

    await db.promise().beginTransaction();

    // Insert into courses
    const [courseInsert] = await db.promise().query(
      `INSERT INTO courses (title, instructor_id, category_id, difficulty_id, price, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        courseTitle,
        instructorId ? Number(instructorId) : null,
        courseCategory ? Number(courseCategory) : null,
        courseDifficulty ? Number(courseDifficulty) : null,
        coursePrice !== undefined &&
        coursePrice !== null &&
        `${coursePrice}` !== ""
          ? Number(coursePrice)
          : 0,
        courseDescription || null,
        status === "published" ? "published" : "draft",
      ]
    );

    const courseId = courseInsert.insertId;

    // Insert objectives
    if (objectives.length > 0) {
      const values = objectives.flatMap((o) => [courseId, o]);
      const placeholders = objectives.map(() => "(?, ?)").join(", ");
      await db
        .promise()
        .query(
          `INSERT INTO course_objectives (course_id, objective) VALUES ${placeholders}`,
          values
        );
    }

    // Insert prerequisites
    if (prerequisites.length > 0) {
      const values = prerequisites.flatMap((p) => [courseId, p]);
      const placeholders = prerequisites.map(() => "(?, ?)").join(", ");

      // console.log("prerequisites", prerequisites);
      // console.log("values:", values);
      // console.log(placeholders);

      await db
        .promise()
        .query(
          `INSERT INTO course_prerequisites (course_id, prerequisite) VALUES ${placeholders}`,
          values
        );
    }

    // Prepare lessons rows (skip empty titles)
    const lessonRows = [];
    const maxLen = Math.max(
      lessonTitles.length,
      lessonDurations.length,
      lessonDescriptions.length,
      videoUrls.length
    );
    for (let i = 0; i < maxLen; i++) {
      const title = (lessonTitles[i] || "").toString().trim();
      if (!title) continue; // require title
      const durationRaw = lessonDurations[i];
      const duration =
        durationRaw === undefined ||
        durationRaw === null ||
        `${durationRaw}`.trim() === ""
          ? null
          : Number(durationRaw);
      const desc = lessonDescriptions[i] || null || null;
      const vurl = videoUrls[i] || null || null;
      lessonRows.push([courseId, i + 1, title, duration, desc, vurl]);
    }

    if (lessonRows.length > 0) {
      const placeholders = lessonRows
        .map(() => "(?, ?, ?, ?, ?, ?)")
        .join(", ");
      const flatValues = lessonRows.flat();
      await db.promise().query(
        `INSERT INTO course_lessons (course_id, lesson_no, title, duration_mins, description, video_url)
           VALUES ${placeholders}`,
        flatValues
      );
    }

    await db.promise().commit();
    return courseId;
  } catch (error) {
    try {
      await db.promise().rollback();
    } catch (_) {}
    errorHandler(error, "createCourse", "create course");
  }
};

export const updateCourse = async (courseId, data) => {
  try {
    const {
      title,
      instructor_id,
      category_id,
      difficulty_id,
      price,
      description,
      status,
      objectives,
      prerequisites,
      lessons,
    } = data;

    await db.promise().beginTransaction();

    // Update main course fields
    const courseUpdates = {
      title,
      instructor_id,
      category_id,
      difficulty_id,
      price,
      description,
      status,
    };

    const setClauses = Object.keys(courseUpdates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(courseUpdates), courseId];

    await db
      .promise()
      .query(`UPDATE courses SET ${setClauses} WHERE id = ?`, values);

    // Replace objectives
    await db
      .promise()
      .query(`DELETE FROM course_objectives WHERE course_id = ?`, [courseId]);
    if (objectives && objectives.length > 0) {
      const objValues = objectives.flatMap((o) => [courseId, o]);
      const objPlaceholders = objectives.map(() => `(?, ?)`).join(", ");
      await db
        .promise()
        .query(
          `INSERT INTO course_objectives (course_id, objective) VALUES ${objPlaceholders}`,
          objValues
        );
    }

    // Replace prerequisites
    await db
      .promise()
      .query(`DELETE FROM course_prerequisites WHERE course_id = ?`, [
        courseId,
      ]);
    if (prerequisites && prerequisites.length > 0) {
      const preValues = prerequisites.flatMap((p) => [courseId, p]);
      const prePlaceholders = prerequisites.map(() => `(?, ?)`).join(", ");
      await db
        .promise()
        .query(
          `INSERT INTO course_prerequisites (course_id, prerequisite) VALUES ${prePlaceholders}`,
          preValues
        );
    }

    // Replace lessons
    await db
      .promise()
      .query(`DELETE FROM course_lessons WHERE course_id = ?`, [courseId]);
    if (lessons && lessons.length > 0) {
      const lessonRows = lessons.map((l, idx) => [
        courseId,
        idx + 1,
        l.title,
        l.duration_mins === null ||
        l.duration_mins === undefined ||
        `${l.duration_mins}` === ""
          ? null
          : Number(l.duration_mins),
        l.description || null,
        l.video_url || null,
      ]);
      const placeholders = lessonRows
        .map(() => `(?, ?, ?, ?, ?, ?)`)
        .join(", ");
      const flat = lessonRows.flat();
      await db
        .promise()
        .query(
          `INSERT INTO course_lessons (course_id, lesson_no, title, duration_mins, description, video_url) VALUES ${placeholders}`,
          flat
        );
    }

    await db.promise().commit();
  } catch (error) {
    try {
      await db.promise().rollback();
    } catch (_) {}
    errorHandler(error, "updateCourse", "update course");
  }
};

export const deleteCourse = async (id) => {
  try {
    await db.promise().query(`DELETE FROM courses WHERE id = ?`, [id]);
  } catch (error) {
    errorHandler(error, "deleteCourse", "delete course");
  }
};

// Queries for Instructors
export const getAllInstructors = async (page = 1, limit = 10, search) => {
  try {
    const offset = (page - 1) * limit;

    const [instructors] = await db.promise().query(
      `SELECT ip.*, u.name, u.email, u.status, u.joined_date, JSON_ARRAYAGG(c.title) AS courses, COUNT(DISTINCT e.student_id) AS total_students
      FROM instructor_profiles ip
      LEFT JOIN users u ON ip.user_id = u.id
      LEFT JOIN courses c ON ip.user_id = c.instructor_id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE u.name LIKE ? OR u.email LIKE ? OR ip.specialization LIKE ?
      GROUP BY ip.user_id
      LIMIT ? OFFSET ?
    `,
      [`%${search}%`, `%${search}%`, `%${search}%`, limit, offset]
    );

    const [totalInstructors] = await db.promise().query(
      `SELECT COUNT(i.id) AS total
        FROM users i
        LEFT JOIN instructor_profiles ip ON i.id = ip.user_id
        WHERE role_id = 2 AND
         (i.name LIKE ? OR i.email LIKE ? OR ip.specialization LIKE ?)
        `,
      [`%${search}%`, `%${search}%`, `%${search}%`]
    );

    return { instructors, totalInstructors: totalInstructors[0].total };
  } catch (error) {
    errorHandler(error, "getAllInstructors", "get instructors");
  }
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
    errorHandler(error, "getAllInstructorsDetails", "get instructors details");
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
    errorHandler(
      error,
      "createInstructor",
      "create instructor account and profile"
    );
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
    errorHandler(error, "updateInstructor", "update instructor");
  }
};

export const deleteInstructor = async (user_id) => {
  try {
    await db.promise().query("DELETE FROM users WHERE id = ?", [user_id]);
  } catch (error) {
    errorHandler(error, "deleteInstructor", "delete instructor");
  }
};

// Queries for Students
export const getAllStudents = async (page = 1, limit = 10, search) => {
  try {
    const offset = (page - 1) * limit;

    const [students] = await db.promise().query(
      `
      SELECT id, student_code, name, email, status, joined_date, plan, total_courses
      FROM student_profiles_view
      WHERE name LIKE ? OR email LIKE ? OR plan LIKE ?
      LIMIT ? OFFSET ?
    `,
      [`%${search}%`, `%${search}%`, `%${search}%`, limit, offset]
    );

    const [totalStudents] = await db.promise().query(
      `SELECT COUNT(u.id) AS total
        FROM users u
        JOIN student_profiles sp ON sp.user_id = u.id
        LEFT JOIN student_plans pl ON sp.plan_id = pl.id
        WHERE role_id = 1 AND
        ( u.name LIKE ? OR u.email LIKE ? OR pl.name LIKE ?)
        `,
      [`%${search}%`, `%${search}%`, `%${search}%`]
    );

    return { students, totalStudents: totalStudents[0].total };
  } catch (error) {
    errorHandler(error, "getAllStudents", "get students");
  }
};

export const getStudentDetails = async (studentId) => {
  try {
    const [students] = await db.promise().query(
      `
      SELECT *
      FROM student_profiles_view
      WHERE id = ?
    `,
      [studentId]
    );

    return students;
  } catch (error) {
    errorHandler(error, "getStudentDetails", "get student details");
  }
};

export const createStudent = async ({ name, email, password, plan }) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.promise().query(
      `INSERT INTO users (name, email, password_hash, role_id)
      VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, 1]
    );

    const userId = result.insertId;

    await db.promise().query(
      `
      INSERT INTO student_profiles (user_id, plan_id)
      VALUES (?, ?)`,
      [userId, plan]
    );
  } catch (error) {
    errorHandler(error, "createStudent", "create student account");
  }
};

export const updateStudent = async (user_id, updates) => {
  try {
    // console.log("update student model", user_id, updates);

    if (updates.password_hash) {
      const password_hash = await bcrypt.hash(updates.password_hash, 10);

      updates.password_hash = password_hash;
    }

    const userFields = {};
    const studentProfileFields = {};

    const userColumns = ["name", "email", "password_hash", "status"];
    const studentProfileColumns = ["plan_id"];

    Object.entries(updates).map(([key, value]) => {
      if (userColumns.includes(key)) {
        userFields[key] = value;
      } else if (studentProfileColumns.includes(key)) {
        studentProfileFields[key] = value;
      }
    });

    const userSetClause = Object.keys(userFields)
      .map((key) => `u.${key} = ?`)
      .join(", ");

    const studentProfileSetClause = Object.keys(studentProfileFields)
      .map((key) => `sp.${key} = ?`)
      .join(", ");

    const setClauses = [userSetClause, studentProfileSetClause]
      .filter((clause) => clause)
      .join(", ");

    const values = [
      ...Object.values(userFields),
      ...Object.values(studentProfileFields),
      user_id,
    ];

    const query = `
      UPDATE users u
      JOIN student_profiles sp ON u.id = sp.user_id
      SET ${setClauses}
      WHERE u.id = ?
    `;

    return await db.promise().query(query, values);
  } catch (error) {
    errorHandler(error, "updateStudent", "update student");
  }
};

export const deleteStudent = async (user_id) => {
  try {
    await db.promise().query("DELETE FROM users WHERE id = ?", [user_id]);
  } catch (error) {
    errorHandler(error, "deleteStudent", "delete student");
  }
};

// Queries for student plans
export const getAllStudentPlans = async () => {
  try {
    const [studentPlans] = await db.promise().query(`
      SELECT * FROM student_plans;
    `);

    return studentPlans;
  } catch (error) {
    errorHandler(error, "getAllStudentPlans", "get student plans");
  }
};

// Queries for Categories
export const getAllCategories = async (page, limit, search) => {
  try {
    const offset = (page - 1) * limit;

    const [categories] = await db.promise().query(
      `
      SELECT cat.*, COUNT(c.id) AS total_courses
      FROM categories cat
      LEFT JOIN courses c ON cat.id = c.category_id
      WHERE cat.name LIKE ?
      GROUP BY cat.id
      LIMIT ? OFFSET ?
    `,
      [`%${search}%`, limit, offset]
    );

    const [totalCategories] = await db.promise().query(
      `
      SELECT COUNT(*) AS total
      FROM categories
      WHERE name LIKE ?
    `,
      [`%${search}%`]
    );

    return { categories, totalCategories: totalCategories[0].total };
  } catch (error) {
    errorHandler(error, "getAllCategories", "get categories");
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
    errorHandler(error, "createCategory", "create category");
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
    errorHandler(error, "updateCategory", "update category");
  }
};

export const deleteCategory = async (id) => {
  try {
    await db.promise().query("DELETE FROM categories WHERE id = ?", [id]);
  } catch (error) {
    errorHandler(error, "deleteCategory", "delete category");
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
    errorHandler(error, "getAllDifficulties", "get difficulties levels");
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
    errorHandler(error, "getAllAdmins", "get admins");
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
    errorHandler(error, "createAdmin", "create admin account");
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
    errorHandler(error, "updateAdmin", "update admin");
  }
};

export const deleteAdmin = async (id) => {
  try {
    await db.promise().query("DELETE FROM users WHERE id = ?", [id]);
  } catch (error) {
    errorHandler(error, "deleteAdmin", "delete admin");
  }
};
