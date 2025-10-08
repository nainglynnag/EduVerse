import dotenv from "dotenv";
import db from "../config/db.js";

dotenv.config();

// Helper function for database errors
const handleDbError = (error, operation) => {
  console.error(`Database error in ${operation}:`, error);
  throw new Error(`Database operation failed: ${operation}`);
};

// Helper function to validate instructor ID
const validateInstructorId = (instructorId) => {
  if (!instructorId || isNaN(parseInt(instructorId))) {
    throw new Error('Invalid instructor ID');
  }
  return parseInt(instructorId);
};

// Instructor Profile Functions
export const getInstructorById = async (instructorId) => {
  try {
    const validId = validateInstructorId(instructorId);
    
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.status,
        u.joined_date,
        COALESCE(ip.specialization, 'General') as specialization,
        COALESCE(ip.bio, '') as bio,
        COALESCE(ip.rating, 0.0) as rating
      FROM users u
      LEFT JOIN instructor_profiles ip ON u.id = ip.user_id
      WHERE u.id = ? AND u.role_id = 2
    `;

    const [results] = await db.promise().query(query, [validId]);
    return results[0] || { 
      id: validId,
      name: 'Instructor', 
      email: '', 
      status: 'active',
      rating: 0.0,
      specialization: 'General',
      bio: ''
    };
  } catch (error) {
    handleDbError(error, 'getInstructorById');
  }
};

// Course Management Functions
export const getInstructorCourses = async (instructorId) => {
  try {
    console.log('Model - getInstructorCourses called with instructorId:', instructorId);
    console.log('Model - instructorId type:', typeof instructorId);
    
    if (!instructorId) {
      console.log('Model - No instructor ID provided, returning empty array');
      return [];
    }
    
    const validId = validateInstructorId(instructorId);
    console.log('Model - Valid instructor ID:', validId);
    
    const query = `
      SELECT 
        c.*,
        cat.name as category_name,
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

    console.log('Model - Executing query for instructor:', validId);
    const [results] = await db.promise().query(query, [validId]);
    console.log('Model - Query results type:', typeof results);
    console.log('Model - Query results is array:', Array.isArray(results));
    console.log('Model - Query results length:', results ? results.length : 'null/undefined');
    
    // Ensure we always return an array
    if (Array.isArray(results)) {
      console.log('Model - Returning array with', results.length, 'courses');
      return results;
    } else if (results && typeof results === 'object') {
      console.log('Model - Results is object, converting to array');
      return [results];
    } else {
      console.log('Model - Results is not array or object, returning empty array');
      return [];
    }
  } catch (error) {
    console.error('Model - Error in getInstructorCourses:', error);
    console.error('Model - Error details:', error.message);
    console.error('Model - Error stack:', error.stack);
    // Don't throw the error, return empty array instead
    return [];
  }
};

export const getCourseByIdAndInstructor = async (courseId, instructorId) => {
  try {
    const validInstructorId = validateInstructorId(instructorId);
    const validCourseId = parseInt(courseId);
    
    if (!validCourseId || isNaN(validCourseId)) {
      throw new Error('Invalid course ID');
    }
    
    const query = `
      SELECT 
        c.*,
        cat.name as category_name,
        dl.name as difficulty_name,
        COUNT(e.id) as enrollment_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN difficulty_levels dl ON c.difficulty_id = dl.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.id = ? AND c.instructor_id = ?
      GROUP BY c.id
    `;

    const [results] = await db.promise().query(query, [validCourseId, validInstructorId]);
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
      INSERT INTO courses (title, category_id, difficulty_id, price, description, status, instructor_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.promise().query(query, [
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

    console.log('Updating course with data:', { courseId, instructorId, courseData });

    const query = `
      UPDATE courses 
      SET title = ?, category_id = ?, difficulty_id = ?, price = ?, description = ?, status = ?
      WHERE id = ? AND instructor_id = ?
    `;

    const [result] = await db.promise().query(query, [
      title,
      category_id,
      difficulty_id,
      price,
      description,
      status,
      courseId,
      instructorId
    ]);

    console.log('Update result:', result);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error in updateCourse:', error);
    handleDbError(error, 'updateCourse');
    return false;
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

    const [results] = await db.promise().query(query, [instructorId]);
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
        COALESCE(SUM(DISTINCT cl.duration_mins), 0) as total_study_time_minutes,
        COUNT(DISTINCT lp.id) as lessons_completed,
        COALESCE(SUM(CASE WHEN lp.completed = 1 THEN cl.duration_mins ELSE 0 END), 0) as completed_lessons_time
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN course_lessons cl ON c.id = cl.course_id
      LEFT JOIN lesson_progress lp ON u.id = lp.student_id AND cl.id = lp.lesson_id
      WHERE c.instructor_id = ? AND u.role_id = (SELECT id FROM roles WHERE name = 'student')
      GROUP BY u.id, u.name, u.email, u.joined_date
      ORDER BY courses_enrolled DESC, u.name
    `;

    const [results] = await db.promise().query(query, [instructorId]);
    return results || [];
  } catch (error) {
    handleDbError(error, 'getInstructorStudents');
  }
};

// Category and Difficulty Functions
export const getAllCategories = async () => {
  try {
    const query = `
      SELECT id, name, description, color_theme
      FROM categories
      ORDER BY name
    `;

    const [results] = await db.promise().query(query);
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

    const [results] = await db.promise().query(query);
    return results || [];
  } catch (error) {
    handleDbError(error, 'getAllDifficultyLevels');
  }
};

// Course Lessons and Objectives Functions
export const getCourseLessons = async (courseId) => {
  try {
    const query = `
      SELECT id, lesson_no, title, duration_mins, description, video_url
      FROM course_lessons
      WHERE course_id = ?
      ORDER BY lesson_no
    `;

    const [results] = await db.promise().query(query, [courseId]);
    return results || [];
  } catch (error) {
    console.error('Error in getCourseLessons:', error);
    return [];
  }
};

export const getCourseObjectives = async (courseId) => {
  try {
    const query = `
      SELECT id, objective
      FROM course_objectives
      WHERE course_id = ?
      ORDER BY id
    `;

    const [results] = await db.promise().query(query, [courseId]);
    return results || [];
  } catch (error) {
    console.error('Error in getCourseObjectives:', error);
    return [];
  }
};

export const getCoursePrerequisites = async (courseId) => {
  try {
    const query = `
      SELECT id, prerequisite
      FROM course_prerequisites
      WHERE course_id = ?
      ORDER BY id
    `;

    const [results] = await db.promise().query(query, [courseId]);
    return results || [];
  } catch (error) {
    console.error('Error in getCoursePrerequisites:', error);
    return [];
  }
};

// Course Management Functions
export const deleteCourse = async (courseId, instructorId) => {
  try {
    const validCourseId = parseInt(courseId);
    const validInstructorId = validateInstructorId(instructorId);
    
    if (!validCourseId || isNaN(validCourseId)) {
      throw new Error('Invalid course ID');
    }
    
    // First delete related data
    await Promise.all([
      db.promise().query('DELETE FROM course_objectives WHERE course_id = ?', [validCourseId]),
      db.promise().query('DELETE FROM course_prerequisites WHERE course_id = ?', [validCourseId]),
      db.promise().query('DELETE FROM course_lessons WHERE course_id = ?', [validCourseId]),
      db.promise().query('DELETE FROM enrollments WHERE course_id = ?', [validCourseId])
    ]);
    
    // Then delete the course
    const [result] = await db.promise().query(
      'DELETE FROM courses WHERE id = ? AND instructor_id = ?',
      [validCourseId, validInstructorId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    handleDbError(error, 'deleteCourse');
  }
};

export const deleteLesson = async (courseId, lessonId, instructorId) => {
  try {
    const validCourseId = parseInt(courseId);
    const validLessonId = parseInt(lessonId);
    const validInstructorId = validateInstructorId(instructorId);
    
    if (!validCourseId || !validLessonId || isNaN(validCourseId) || isNaN(validLessonId)) {
      throw new Error('Invalid course or lesson ID');
    }
    
    // Verify the course belongs to the instructor
    const [courseCheck] = await db.promise().query(
      'SELECT id FROM courses WHERE id = ? AND instructor_id = ?',
      [validCourseId, validInstructorId]
    );
    
    if (courseCheck.length === 0) {
      throw new Error('Course not found or access denied');
    }
    
    // Delete the lesson
    const [result] = await db.promise().query(
      'DELETE FROM course_lessons WHERE id = ? AND course_id = ?',
      [validLessonId, validCourseId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    handleDbError(error, 'deleteLesson');
  }
};

// Profile Management Functions
export const updateInstructorProfile = async (instructorId, profileData) => {
  try {
    const validId = validateInstructorId(instructorId);
    const { specialization, bio } = profileData;
    
    // Check if profile exists
    const [existingProfile] = await db.promise().query(
      'SELECT user_id FROM instructor_profiles WHERE user_id = ?',
      [validId]
    );
    
    if (existingProfile.length > 0) {
      // Update existing profile
      const [result] = await db.promise().query(
        'UPDATE instructor_profiles SET specialization = ?, bio = ? WHERE user_id = ?',
        [specialization, bio, validId]
      );
      return result.affectedRows > 0;
    } else {
      // Create new profile
      const [result] = await db.promise().query(
        'INSERT INTO instructor_profiles (user_id, specialization, bio) VALUES (?, ?, ?)',
        [validId, specialization, bio]
      );
      return result.affectedRows > 0;
    }
  } catch (error) {
    handleDbError(error, 'updateInstructorProfile');
  }
};

