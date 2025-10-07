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
             pl.id AS plan_id,
             COUNT(e.course_id) AS total_courses
        FROM users u
        LEFT JOIN student_profiles sp ON sp.user_id = u.id
        LEFT JOIN student_plans pl ON sp.plan_id = pl.id
        LEFT JOIN enrollments e ON u.id = e.student_id
        WHERE u.id = ?
        GROUP BY u.id, pl.name, pl.id
    `;

    const [results] = await db.promise().query(query, [validId]);
    console.log("Student query results:", results);
    
    if (results && results.length > 0) {
      return results[0];
    } else {
      // Return fallback data if no student found
      return { 
        id: validId,
        name: 'Student', 
        email: 'student@example.com', 
        status: 'active',
        student_code: `s${String(validId).padStart(7, '0')}`,
        plan: 'Basic Plan',
        plan_id: 1,
        total_courses: 0
      };
    }

  } catch (error) {
    console.error("Error in getStudentById:", error);
    // Return fallback data on error
    return { 
      id: studentId,
      name: 'Student', 
      email: 'student@example.com', 
      status: 'active',
      student_code: `s${String(studentId).padStart(7, '0')}`,
      plan: 'Basic Plan',
      plan_id: 1,
      total_courses: 0
    };
  }
};

export const getStudentEnrolledCourses = async (studentId) => {
  try {
    // If no studentId provided, return an empty list
    if (!studentId) return [];

    const [rows] = await db.promise().query(
      `
      SELECT c.id, c.title, c.description, c.price, e.enrolled_at, cat.name as category_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `,
      [studentId]
    );

    return rows;
  } catch (error) {
    handleDbError(error, "getStudentEnrolledCourses");
  }
};

export const getStudentProgressSummary = async (studentId) => {
  try {
    if (!studentId) {
      console.log('❌ No studentId provided to getStudentProgressSummary');
      return [];
    }

    console.log('🔍 Getting progress for student:', studentId);

    // Try to get real progress data from lesson_progress table
    try {
      const [rows] = await db.promise().query(
        `
        SELECT 
          c.id AS course_id, 
          c.title, 
          COUNT(cl.id) AS total_lessons,
          COUNT(lp.id) AS completed_lessons,
          ROUND(COUNT(lp.id) / COUNT(cl.id) * 100, 1) AS progress_percent
        FROM courses c
        JOIN course_lessons cl ON c.id = cl.course_id
        LEFT JOIN lesson_progress lp ON lp.course_id = c.id AND lp.student_id = ? AND lp.completed = TRUE
        WHERE c.id IN (
          SELECT course_id FROM enrollments WHERE student_id = ?
        )
        GROUP BY c.id, c.title
        ORDER BY progress_percent DESC
      `,
        [studentId, studentId]
      );

      console.log('🔍 Progress query result:', rows);
      return rows;
    } catch (dbError) {
      console.log('⚠️ Database tables not found, using fallback progress data');
      
      // Fallback: Get enrolled courses and return basic progress data
      const [enrolledCourses] = await db.promise().query(
        'SELECT course_id FROM enrollments WHERE student_id = ?',
        [studentId]
      );
      
      // Return basic progress data (0% for all courses)
      return enrolledCourses.map(enrollment => ({
        course_id: enrollment.course_id,
        title: 'Course',
        total_lessons: 0,
        completed_lessons: 0,
        progress_percent: 0
      }));
    }
  } catch (error) {
    console.error('❌ Error in getStudentProgressSummary:', error);
    return [];
  }
};

export const markLessonComplete = async (studentId, courseId, lessonId) => {
  try {
    const validStudentId = validateStudentId(studentId);
    
    // Check if lesson completion already exists
    const [existing] = await db.promise().query(
      `SELECT id FROM lesson_progress 
       WHERE student_id = ? AND course_id = ? AND lesson_id = ?`,
      [validStudentId, courseId, lessonId]
    );
    
    if (existing.length > 0) {
      // Update existing record
      await db.promise().query(
        `UPDATE lesson_progress 
         SET completed = TRUE, completed_at = NOW() 
         WHERE student_id = ? AND course_id = ? AND lesson_id = ?`,
        [validStudentId, courseId, lessonId]
      );
    } else {
      // Insert new record
      await db.promise().query(
        `INSERT INTO lesson_progress (student_id, course_id, lesson_id, completed, completed_at) 
         VALUES (?, ?, ?, TRUE, NOW())`,
        [validStudentId, courseId, lessonId]
      );
    }
    
    return { success: true };
  } catch (error) {
    handleDbError(error, "markLessonComplete");
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

    return rows;
  } catch (error) {
    handleDbError(error, "getRecommendedCourses");
  }
};

// CRUD Operations for Students

// CREATE - Enroll in a course
export const enrollInCourse = async (studentId, courseId) => {
  try {
    const validStudentId = validateStudentId(studentId);
    const validCourseId = parseInt(courseId);
    
    if (!validCourseId) {
      throw new Error('Invalid course ID');
    }

    // Check if course exists and is published
    const [courseCheck] = await db.promise().query(
      'SELECT id, title, status FROM courses WHERE id = ?',
      [validCourseId]
    );

    if (courseCheck.length === 0) {
      throw new Error('Course not found');
    }

    if (courseCheck[0].status !== 'published') {
      throw new Error('Cannot enroll in draft courses. Only published courses are available for enrollment.');
    }

    // Check if already enrolled
    const [existing] = await db.promise().query(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [validStudentId, validCourseId]
    );

    if (existing.length > 0) {
      throw new Error('Already enrolled in this course');
    }

    // Enroll student
    const [result] = await db.promise().query(
      'INSERT INTO enrollments (student_id, course_id, enrolled_at) VALUES (?, ?, NOW())',
      [validStudentId, validCourseId]
    );

    return { success: true, enrollmentId: result.insertId };
  } catch (error) {
    handleDbError(error, "enrollInCourse");
  }
};

// READ - Get student's enrollment status for a course
export const getEnrollmentStatus = async (studentId, courseId) => {
  try {
    const validStudentId = validateStudentId(studentId);
    const validCourseId = parseInt(courseId);
    
    const [rows] = await db.promise().query(
      'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
      [validStudentId, validCourseId]
    );

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    handleDbError(error, "getEnrollmentStatus");
  }
};

// UPDATE - Update student profile
export const updateStudentProfile = async (studentId, updates) => {
  try {
    const validStudentId = validateStudentId(studentId);
    
    const userFields = {};
    const profileFields = {};
    
    // Separate user fields from profile fields
    const userColumns = ['name', 'email', 'status'];
    const profileColumns = ['plan_id'];
    
    Object.keys(updates).forEach(key => {
      if (userColumns.includes(key)) {
        userFields[key] = updates[key];
      } else if (profileColumns.includes(key)) {
        profileFields[key] = updates[key];
      }
    });
    
    // Update user table
    if (Object.keys(userFields).length > 0) {
      const userSetClause = Object.keys(userFields)
        .map(key => `${key} = ?`)
        .join(', ');
      
      await db.promise().query(
        `UPDATE users SET ${userSetClause} WHERE id = ?`,
        [...Object.values(userFields), validStudentId]
      );
    }
    
    // Update student profile
    if (Object.keys(profileFields).length > 0) {
      const profileSetClause = Object.keys(profileFields)
        .map(key => `${key} = ?`)
        .join(', ');
      
      await db.promise().query(
        `UPDATE student_profiles SET ${profileSetClause} WHERE user_id = ?`,
        [...Object.values(profileFields), validStudentId]
      );
    }
    
    return { success: true };
  } catch (error) {
    handleDbError(error, "updateStudentProfile");
  }
};

// DELETE - Unenroll from a course
export const unenrollFromCourse = async (studentId, courseId) => {
  try {
    const validStudentId = validateStudentId(studentId);
    const validCourseId = parseInt(courseId);
    
    if (!validCourseId) {
      throw new Error('Invalid course ID');
    }

    const [result] = await db.promise().query(
      'DELETE FROM enrollments WHERE student_id = ? AND course_id = ?',
      [validStudentId, validCourseId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Enrollment not found');
    }

    return { success: true };
  } catch (error) {
    handleDbError(error, "unenrollFromCourse");
  }
};

// DELETE - Delete student account (soft delete)
export const deleteStudentAccount = async (studentId) => {
  try {
    const validStudentId = validateStudentId(studentId);
    
    // Soft delete by updating status
    await db.promise().query(
      'UPDATE users SET status = "deleted" WHERE id = ?',
      [validStudentId]
    );
    
    return { success: true };
  } catch (error) {
    handleDbError(error, "deleteStudentAccount");
  }
};
