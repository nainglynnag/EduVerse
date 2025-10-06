import {
  getInstructorById,
  getInstructorCourses,
  getInstructorTotalStudents,
  getInstructorStudents,
  getAllCategories,
  getAllDifficultyLevels,
  createCourse as createCourseModel,
  getCourseByIdAndInstructor,
  updateCourse as updateCourseModel,
  getCourseLessons,
  getCourseObjectives,
  getCoursePrerequisites
} from "../models/instructorModel.js";
import db from "../config/db.js";

// Constants
const DEFAULT_LAYOUT = "instructors/layouts/layout";

// Helper function to get instructor ID from session
const getInstructorId = (req) => {
  return req.session.user?.userId || null;
};

// Helper function for error handling
const handleError = (res, error, message = 'Internal server error', statusCode = 500) => {
  console.error('Controller error:', error);
  
  if (res.headersSent) {
    return;
  }
  
  if (req.accepts('json')) {
    res.status(statusCode).json({ 
      success: false,
      message: message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  } else {
    res.status(statusCode).render('error', {
      layout: DEFAULT_LAYOUT,
      error: { message, status: statusCode }
    });
  }
};

// Helper function for successful responses
const renderSuccess = (res, view, data = {}) => {
  res.render(view, { 
    layout: DEFAULT_LAYOUT,
    instructor: res.locals.instructor,
    ...data
  });
};

// Helper function for JSON responses
const sendJsonResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    ...data
  });
};

// Validation helpers
const validateCourseData = (data) => {
  const errors = [];
  const { title, category_id, difficulty_id, description, price, objectives, prerequisites, lessonTitles } = data;
  
  if (!title?.trim()) errors.push('Course Title is required');
  if (!category_id) errors.push('Category is required');
  if (!difficulty_id) errors.push('Difficulty Level is required');
  if (!description?.trim()) errors.push('Description is required');
  if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) errors.push('Valid price is required');
  if (!objectives?.trim()) errors.push('Learning Objectives are required');
  if (!prerequisites?.trim()) errors.push('Prerequisites are required');
  if (!lessonTitles?.length || lessonTitles.every(title => !title?.trim())) {
    errors.push('At least one lesson is required');
  }
  
  return errors;
};

const validateLessonData = (lessonTitles, lessonDurations, lessonDescriptions, lessonVideoUrls) => {
  const errors = [];
  
  for (let i = 0; i < lessonTitles.length; i++) {
    if (lessonTitles[i]?.trim()) {
      if (!lessonDurations[i]?.trim()) errors.push(`Lesson ${i + 1}: Duration is required`);
      if (!lessonDescriptions[i]?.trim()) errors.push(`Lesson ${i + 1}: Description is required`);
      if (!lessonVideoUrls[i]?.trim()) errors.push(`Lesson ${i + 1}: Video URL is required`);
    }
  }
  
  return errors;
};

// Helper functions for course creation
const createCourseObjectives = async (courseId, objectives) => {
  if (!objectives?.trim()) return;
  
  const objectiveLines = objectives.split('\n').filter(line => line.trim());
  for (const objective of objectiveLines) {
    const cleanObjective = objective.trim().replace(/^[-•]\s*/, '');
    if (cleanObjective) {
      await db.execute(
        'INSERT INTO course_objectives (course_id, objective) VALUES (?, ?)',
        [courseId, cleanObjective]
      );
    }
  }
};

const createCoursePrerequisites = async (courseId, prerequisites) => {
  if (!prerequisites?.trim()) return;
  
  const prerequisiteLines = prerequisites.split('\n').filter(line => line.trim());
  for (const prerequisite of prerequisiteLines) {
    const cleanPrerequisite = prerequisite.trim().replace(/^[-•]\s*/, '');
    if (cleanPrerequisite) {
      await db.execute(
        'INSERT INTO course_prerequisites (course_id, prerequisite) VALUES (?, ?)',
        [courseId, cleanPrerequisite]
      );
    }
  }
};

const createCourseLessons = async (courseId, lessonTitles, lessonDurations, lessonDescriptions, lessonVideoUrls) => {
  if (!lessonTitles?.length) return;
  
  for (let i = 0; i < lessonTitles.length; i++) {
    if (lessonTitles[i]?.trim()) {
      const lessonNumber = i + 1;
      await db.execute(
        'INSERT INTO course_lessons (course_id, lesson_no, title, duration_mins, description, video_url) VALUES (?, ?, ?, ?, ?, ?)',
        [
          courseId,
          lessonNumber,
          lessonTitles[i].trim(),
          lessonDurations[i] ? parseInt(lessonDurations[i]) : null,
          lessonDescriptions[i]?.trim() || null,
          lessonVideoUrls[i]?.trim() || null
        ]
      );
    }
  }
};

// Middleware to fetch instructor data for layout
export const getInstructorData = async (req, res, next) => {
  try {
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }
    
    const instructor = await getInstructorById(instructorId);
    res.locals.instructor = instructor;
    next();
  } catch (error) {
    console.error('Error fetching instructor data:', error);
    res.locals.instructor = { 
      name: 'Instructor', 
      email: '', 
      status: 'active',
      rating: 0.0
    };
    next();
  }
};

// Dashboard Controllers
export const getInstructorDashboard = async (req, res) => {
  try {
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }

    // Fetch all required data in parallel for better performance
    const [courses, totalStudents, students] = await Promise.all([
      getInstructorCourses(instructorId),
      getInstructorTotalStudents(instructorId),
      getInstructorStudents(instructorId)
    ]);

    const totalCourses = courses.length;
    const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrollment_count || 0), 0);
    const avgRating = parseFloat(res.locals.instructor?.rating) || 0.0;

    renderSuccess(res, "instructors/dashboard/index", {
      courses,
      students,
      stats: {
        totalCourses,
        totalStudents,
        totalEnrollments,
        avgRating
      }
    });

  } catch (error) {
    handleError(res, error, 'Failed to load dashboard');
  }
};

// Course Controllers
export const getInstructorCoursesList = async (req, res) => {
  try {
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }
    
    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    
    // Get total count for pagination
    const [totalCountResult] = await db.execute(
      'SELECT COUNT(*) as total FROM courses WHERE instructor_id = ?',
      [instructorId]
    );
    const totalCount = totalCountResult[0].total;
    
    // Get all courses first, then apply pagination
    const allCourses = await getInstructorCourses(instructorId);
    const courses = allCourses.slice(offset, offset + limit);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    const pagination = {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    };

    renderSuccess(res, "instructors/courses/index", { 
      courses,
      pagination,
      query: req.query // Pass query parameters for form preservation
    });

  } catch (error) {
    handleError(res, error, 'Failed to load courses');
  }
};

export const getCreateCoursePage = async (req, res) => {
  try {
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }

    const [categories, difficultyLevels] = await Promise.all([
      getAllCategories(),
      getAllDifficultyLevels()
    ]);

    renderSuccess(res, "instructors/courses/create", {
      categories,
      difficultyLevels
    });

  } catch (error) {
    handleError(res, error, 'Failed to load create course page');
  }
};

export const createCourse = async (req, res) => {
  try {
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }

    const {
      courseTitle: title,
      courseCategory: category_id,
      courseDifficulty: difficulty_id,
      coursePrice: price,
      courseDescription: description,
      courseObjectives: objectivesText,
      coursePrerequisites: prerequisitesText,
      lessonTitles = [],
      lessonDurations = [],
      lessonDescriptions = [],
      lessonVideoUrls = [],
      courseStatus: status = 'draft'
    } = req.body;

    // Handle both single text field and array formats
    let objectives = objectivesText;
    let prerequisites = prerequisitesText;
    
    // If arrays are provided (from create form), use them instead
    if (req.body['courseObjectives[]'] && Array.isArray(req.body['courseObjectives[]'])) {
      objectives = req.body['courseObjectives[]'].join('\n');
    }
    if (req.body['coursePrerequisites[]'] && Array.isArray(req.body['coursePrerequisites[]'])) {
      prerequisites = req.body['coursePrerequisites[]'].join('\n');
    }

    // Validate course data
    const courseData = {
      title,
      category_id,
      difficulty_id,
      price,
      description,
      objectives,
      prerequisites,
      lessonTitles
    };
    
    const validationErrors = validateCourseData(courseData);
    const lessonErrors = validateLessonData(lessonTitles, lessonDurations, lessonDescriptions, lessonVideoUrls);
    const allErrors = [...validationErrors, ...lessonErrors];
    
    // Handle validation errors
    if (allErrors.length > 0) {
      const [categories, difficultyLevels] = await Promise.all([
        getAllCategories(),
        getAllDifficultyLevels()
      ]);
      
      return res.status(400).render('instructors/courses/create', {
        layout: DEFAULT_LAYOUT,
        instructor: res.locals.instructor,
        categories,
        difficultyLevels,
        error: `Please fix the following errors: ${allErrors.join(', ')}`,
        form: req.body
      });
    }
    
    // Prepare course data
    const finalCourseData = {
      title: title.trim(),
      category_id: parseInt(category_id),
      difficulty_id: parseInt(difficulty_id),
      price: parseFloat(price) || 0,
      description: description.trim(),
      status,
      instructor_id: instructorId
    };

    // Create the course
    const newCourseId = await createCourseModel(finalCourseData);

    if (!newCourseId) {
      throw new Error('Failed to create course');
    }

    // Create course objectives, prerequisites, and lessons
    await Promise.all([
      createCourseObjectives(newCourseId, objectives),
      createCoursePrerequisites(newCourseId, prerequisites),
      createCourseLessons(newCourseId, lessonTitles, lessonDurations, lessonDescriptions, lessonVideoUrls)
    ]);

    // Redirect with success message
    const redirectUrl = status === 'draft' 
      ? '/instructor/courses?draft_saved=true'
      : '/instructor/courses?course_published=true';
    
    res.redirect(redirectUrl);

  } catch (error) {
    handleError(res, error, 'Error creating course');
  }
};

export const getCourseDetail = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }

    const [course, lessons, objectives, prerequisites] = await Promise.all([
      getCourseByIdAndInstructor(courseId, instructorId),
      getCourseLessons(courseId),
      getCourseObjectives(courseId),
      getCoursePrerequisites(courseId)
    ]);

    if (!course) {
      return res.status(404).render('error', {
        layout: DEFAULT_LAYOUT,
        error: { message: 'Course not found', status: 404 }
      });
    }

    renderSuccess(res, "instructors/courses/detail", {
      course,
      lessons,
      objectives,
      prerequisites
    });

  } catch (error) {
    handleError(res, error, 'Failed to load course details');
  }
};

export const getEditCoursePage = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }

    const [course, categories, difficultyLevels, lessons, objectives, prerequisites] = await Promise.all([
      getCourseByIdAndInstructor(courseId, instructorId),
      getAllCategories(),
      getAllDifficultyLevels(),
      getCourseLessons(courseId),
      getCourseObjectives(courseId),
      getCoursePrerequisites(courseId)
    ]);

    if (!course) {
      return res.status(404).render('error', {
        layout: DEFAULT_LAYOUT,
        error: { message: 'Course not found', status: 404 }
      });
    }

    renderSuccess(res, "instructors/courses/edit", {
      course,
      categories,
      difficultyLevels,
      lessons: lessons || [],
      objectives: objectives || [],
      prerequisites: prerequisites || []
    });

  } catch (error) {
    handleError(res, error, 'Failed to load edit course page');
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }

    const {
      courseTitle: title,
      courseCategory: category_id,
      courseDifficulty: difficulty_id,
      coursePrice: price,
      courseDescription: description,
      status,
      lessonTitles = [],
      lessonDurations = [],
      lessonDescriptions = [],
      lessonVideoUrls = [],
      lessonIds = [],
      courseObjectives: objectivesText,
      coursePrerequisites: prerequisitesText
    } = req.body;

    // Validate required fields
    if (!title?.trim() || !category_id || !difficulty_id) {
      return res.status(400).render('error', {
        layout: DEFAULT_LAYOUT,
        error: { message: 'Missing required fields: title, category, difficulty level', status: 400 }
      });
    }

    const courseData = {
      title: title.trim(),
      category_id: parseInt(category_id),
      difficulty_id: parseInt(difficulty_id),
      price: parseFloat(price) || 0,
      description: description?.trim() || '',
      status
    };

    const updatedCourse = await updateCourseModel(courseId, instructorId, courseData);

    if (!updatedCourse) {
      throw new Error('Failed to update course - course not found or no changes made');
    }

    // Handle lesson updates
    await updateCourseLessons(courseId, {
      lessonTitles,
      lessonDurations,
      lessonDescriptions,
      lessonVideoUrls,
      lessonIds
    });

    // Handle objectives and prerequisites updates
    await Promise.all([
      updateCourseObjectivesFromText(courseId, objectivesText),
      updateCoursePrerequisitesFromText(courseId, prerequisitesText)
    ]);

    res.redirect('/instructor/courses?course_updated=true');

  } catch (error) {
    handleError(res, error, 'Error updating course');
  }
};

// Helper function to update course lessons
const updateCourseLessons = async (courseId, lessonData) => {
  try {
    const { lessonTitles, lessonDurations, lessonDescriptions, lessonVideoUrls, lessonIds } = lessonData;

    // First, delete all existing lessons for this course
    await db.execute('DELETE FROM course_lessons WHERE course_id = ?', [courseId]);

    // Then, insert the new/updated lessons
    if (lessonTitles && lessonTitles.length > 0) {
      for (let i = 0; i < lessonTitles.length; i++) {
        if (lessonTitles[i] && lessonTitles[i].trim()) {
          const lessonNumber = i + 1; // Automatically generate sequential lesson numbers
          await db.execute(
            'INSERT INTO course_lessons (course_id, lesson_no, title, duration_mins, description, video_url) VALUES (?, ?, ?, ?, ?, ?)',
            [
              courseId,
              lessonNumber,
              lessonTitles[i].trim(),
              lessonDurations[i] ? parseInt(lessonDurations[i]) : null,
              lessonDescriptions[i] ? lessonDescriptions[i].trim() : null,
              lessonVideoUrls[i] ? lessonVideoUrls[i].trim() : null
            ]
          );
        }
      }
    }

    console.log('Lessons updated successfully for course:', courseId);
  } catch (error) {
    console.error('Error updating course lessons:', error);
    throw error;
  }
};

// Helper function to update course objectives from text
const updateCourseObjectivesFromText = async (courseId, objectivesText) => {
  try {
    // First, delete all existing objectives for this course
    await db.execute('DELETE FROM course_objectives WHERE course_id = ?', [courseId]);

    // Then, insert the new objectives from text (split by newlines)
    if (objectivesText && objectivesText.trim()) {
      const objectives = objectivesText.split('\n').filter(line => line.trim());
      for (const objective of objectives) {
        if (objective.trim()) {
          // Remove bullet point and dash if present
          const cleanObjective = objective.trim().replace(/^[-•]\s*/, '');
          await db.execute(
            'INSERT INTO course_objectives (course_id, objective) VALUES (?, ?)',
            [courseId, cleanObjective]
          );
        }
      }
    }

    console.log('Objectives updated successfully for course:', courseId);
  } catch (error) {
    console.error('Error updating course objectives:', error);
    throw error;
  }
};

// Helper function to update course prerequisites from text
const updateCoursePrerequisitesFromText = async (courseId, prerequisitesText) => {
  try {
    // First, delete all existing prerequisites for this course
    await db.execute('DELETE FROM course_prerequisites WHERE course_id = ?', [courseId]);

    // Then, insert the new prerequisites from text (split by newlines)
    if (prerequisitesText && prerequisitesText.trim()) {
      const prerequisites = prerequisitesText.split('\n').filter(line => line.trim());
      for (const prerequisite of prerequisites) {
        if (prerequisite.trim()) {
          // Remove bullet point and dash if present
          const cleanPrerequisite = prerequisite.trim().replace(/^[-•]\s*/, '');
          await db.execute(
            'INSERT INTO course_prerequisites (course_id, prerequisite) VALUES (?, ?)',
            [courseId, cleanPrerequisite]
          );
        }
      }
    }

    console.log('Prerequisites updated successfully for course:', courseId);
  } catch (error) {
    console.error('Error updating course prerequisites:', error);
    throw error;
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this page'
      });
    }

    // First check if course exists and belongs to the instructor
    const course = await getCourseByIdAndInstructor(courseId, instructorId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or you do not have permission to delete it'
      });
    }

    // Delete related data first (foreign key constraints)
    await Promise.all([
      db.execute('DELETE FROM course_lessons WHERE course_id = ?', [courseId]),
      db.execute('DELETE FROM course_objectives WHERE course_id = ?', [courseId]),
      db.execute('DELETE FROM course_prerequisites WHERE course_id = ?', [courseId]),
      db.execute('DELETE FROM enrollments WHERE course_id = ?', [courseId]),
      db.execute('DELETE FROM lesson_progress WHERE course_id = ?', [courseId])
    ]);

    // Finally delete the course
    const [result] = await db.execute('DELETE FROM courses WHERE id = ? AND instructor_id = ?', [courseId, instructorId]);

    if (result.affectedRows > 0) {
      sendJsonResponse(res, { message: 'Course deleted successfully' });
    } else {
      throw new Error('Failed to delete course - no rows affected');
    }

  } catch (error) {
    handleError(res, error, 'Error deleting course');
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this page'
      });
    }

    // First check if course exists and belongs to the instructor
    const course = await getCourseByIdAndInstructor(courseId, instructorId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or you do not have permission to delete lessons from it'
      });
    }

    // Delete the lesson
    const [result] = await db.execute('DELETE FROM course_lessons WHERE id = ? AND course_id = ?', [lessonId, courseId]);

    if (result.affectedRows > 0) {
      sendJsonResponse(res, { message: 'Lesson deleted successfully' });
    } else {
      res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

  } catch (error) {
    handleError(res, error, 'Error deleting lesson');
  }
};

// Student Controllers
export const getInstructorStudentsPage = async (req, res) => {
  try {
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // 10 students per page
    const offset = (page - 1) * limit;

    const [courses, studentsResult] = await Promise.all([
      getInstructorCourses(instructorId),
      getInstructorStudents(instructorId)
    ]);

    // Get total count for pagination
    const totalCount = studentsResult.length;
    
    // Apply pagination to students
    const students = studentsResult.slice(offset, offset + limit);

    const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrollment_count || 0), 0);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    const pagination = {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    };

    renderSuccess(res, "instructors/students/index", {
      courses,
      students,
      totalEnrollments,
      pagination
    });

  } catch (error) {
    handleError(res, error);
  }
};

// Profile Management Controllers
export const getEditProfilePage = async (req, res) => {
  try {
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }
    
    const instructor = await getInstructorById(instructorId);
    
    // Check for success parameter from redirect
    const success = req.query.success === 'true';
    
    renderSuccess(res, "instructors/profile/edit", {
      instructor,
      form: instructor, // Pass instructor data as form data for pre-filling
      success: success
    });

  } catch (error) {
    handleError(res, error, 'Failed to load profile edit page');
  }
};

export const updateProfile = async (req, res) => {
  try {
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }
    const { name, email, specialization, bio, password } = req.body;

    // Validate required fields
    if (!name || !email || !specialization || !bio) {
      return res.status(400).render('instructors/profile/edit', {
        layout: DEFAULT_LAYOUT,
        instructor: res.locals.instructor,
        form: req.body,
        error: 'All fields except password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).render('instructors/profile/edit', {
        layout: DEFAULT_LAYOUT,
        instructor: res.locals.instructor,
        form: req.body,
        error: 'Please enter a valid email address'
      });
    }

    // Check if email is already taken by another user
    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, instructorId]
    );

    if (existingUser.length > 0) {
      return res.status(400).render('instructors/profile/edit', {
        layout: DEFAULT_LAYOUT,
        instructor: res.locals.instructor,
        form: req.body,
        error: 'Email address is already taken by another user'
      });
    }

    // Update user table
    const updateUserQuery = password 
      ? 'UPDATE users SET name = ?, email = ? WHERE id = ?'
      : 'UPDATE users SET name = ?, email = ? WHERE id = ?';
    
    const userParams = password 
      ? [name, email, instructorId]
      : [name, email, instructorId];

    await db.execute(updateUserQuery, userParams);

    // Update or insert instructor profile
    const [existingProfile] = await db.execute(
      'SELECT user_id FROM instructor_profiles WHERE user_id = ?',
      [instructorId]
    );

    if (existingProfile.length > 0) {
      // Update existing profile
      await db.execute(
        'UPDATE instructor_profiles SET specialization = ?, bio = ? WHERE user_id = ?',
        [specialization, bio, instructorId]
      );
    } else {
      // Insert new profile
      await db.execute(
        'INSERT INTO instructor_profiles (user_id, specialization, bio) VALUES (?, ?, ?)',
        [instructorId, specialization, bio]
      );
    }

    // If password is provided, update it
    if (password && password.trim()) {
      // In a real application, you would hash the password here
      // For now, we'll just update it directly (not recommended for production)
      await db.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [password, instructorId]
      );
    }

    // Redirect with success message
    res.redirect('/instructor/profile/edit?success=true');

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).render('instructors/profile/edit', {
      layout: DEFAULT_LAYOUT,
      instructor: res.locals.instructor,
      form: req.body,
      error: 'An error occurred while updating your profile. Please try again.'
    });
  }
};
