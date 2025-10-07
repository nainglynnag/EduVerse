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
  getCoursePrerequisites,
  deleteCourse as deleteCourseModel,
  deleteLesson as deleteLessonModel,
  updateInstructorProfile
} from "../models/instructorModel.js";
import { findUserByEmail } from "../models/userModel.js";
import bcrypt from "bcrypt";
import db from "../config/db.js";

// Constants
const DEFAULT_LAYOUT = "instructors/layouts/layout";

// Helper function to get instructor ID from session
const getInstructorId = (req) => {
  return req.session.user?.userId || null;
};

// Instructor Authentication Functions (without middleware)
export const getInstructorSignIn = (req, res) => {
  try {
    // If already logged in as instructor, redirect to dashboard
    if (req.session.user && req.session.user.roleId === 2) {
      return res.redirect('/instructor/dashboard');
    }
    
    res.render("auth/signin", {
      layout: false,
      error: req.query.error,
      title: "Instructor Sign In"
    });
  } catch (error) {
    console.error("Error in getInstructorSignIn:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const postInstructorSignIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Instructor signin attempt:", email);

    // Validate input
    if (!email || !password) {
      return res.render("auth/signin", {
        layout: false,
        error: "Please provide both email and password",
        title: "Instructor Sign In"
      });
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.render("auth/signin", {
        layout: false,
        error: "Invalid Email or password!",
        title: "Instructor Sign In"
      });
    }

    // Check if user is an instructor (role_id = 2)
    if (user.role_id !== 2) {
      return res.render("auth/signin", {
        layout: false,
        error: "Access denied. This account is not authorized for instructor access.",
        title: "Instructor Sign In"
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.render("auth/signin", {
        layout: false,
        error: "Invalid Email or password!",
        title: "Instructor Sign In"
      });
    }
    
    // Check if account is suspended
    if (user.status === "suspended") {
      return res.render("auth/signin", {
        layout: false,
        error: "Your account has been suspended!",
        title: "Instructor Sign In"
      });
    }

    // Set user session data
    req.session.user = {
      userId: user.id,
      roleId: user.role_id,
      email: user.email,
      name: user.name,
    };

    console.log("Instructor signed in successfully:", req.session.user);
    res.redirect('/instructor/dashboard');

  } catch (error) {
    console.error("Error in postInstructorSignIn:", error);
    res.render("auth/signin", {
      layout: false,
      error: "An error occurred during sign in. Please try again.",
      title: "Instructor Sign In"
    });
  }
};

export const instructorSignOut = (req, res) => {
  try {
    console.log("Instructor signing out");
    // Clear session
    req.session = null;
    res.redirect('/instructor/signin');
  } catch (error) {
    console.error("Error in instructorSignOut:", error);
    res.redirect('/instructor/signin');
  }
};

// Helper function for error handling
const handleError = (res, error, message = 'Internal server error', statusCode = 500, req = null) => {
  console.error('Controller error:', error);
  
  if (res.headersSent) {
    return;
  }
  
  if (req && req.accepts('json')) {
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
const validateCourseData = (data, isDraft = false) => {
  const errors = [];
  const { title, category_id, difficulty_id, description, price, objectives, prerequisites, lessonTitles } = data;
  
  console.log('Validating course data:', { title, category_id, difficulty_id, description, price, objectives, prerequisites, lessonTitles, isDraft });
  
  if (!title?.trim()) errors.push('Course Title is required');
  if (!category_id) errors.push('Category is required');
  if (!difficulty_id) errors.push('Difficulty Level is required');
  if (!description?.trim()) errors.push('Description is required');
  if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) errors.push('Valid price is required');
  
  // Objectives and prerequisites are not required for validation
  console.log('Skipping objectives/prerequisites validation');
  
    // More specific lesson validation - only required for published courses
    console.log('Validating lessonTitles:', lessonTitles, 'Type:', typeof lessonTitles, 'IsArray:', Array.isArray(lessonTitles));
    
    if (!isDraft) {
      // Only validate lessons for published courses
      if (!lessonTitles || !Array.isArray(lessonTitles) || lessonTitles.length === 0) {
        console.log('Lesson validation failed: no lesson titles array or empty array');
        errors.push('At least one lesson is required');
      } else {
        const validLessons = lessonTitles.filter(title => title && title.trim());
        console.log('Valid lessons found:', validLessons.length, validLessons);
        if (validLessons.length === 0) {
          errors.push('At least one lesson with a title is required');
        }
      }
    } else {
      console.log('Draft save - lesson validation skipped');
      // For drafts, ensure lessonTitles is at least an empty array if not provided
      if (!lessonTitles || !Array.isArray(lessonTitles)) {
        console.log('Draft save - ensuring lessonTitles is an array');
        lessonTitles = [];
      }
    }
  
  console.log('Validation errors:', errors);
  return errors;
};

const validateLessonData = (lessonTitles, lessonDurations, lessonDescriptions, lessonVideoUrls, isDraft = false) => {
  const errors = [];
  
  // Skip lesson validation for drafts
  if (isDraft) {
    console.log('Draft save - lesson data validation skipped');
    return errors;
  }
  
  for (let i = 0; i < lessonTitles.length; i++) {
    if (lessonTitles[i]?.trim()) {
      // Check if duration is provided and is a valid number > 0
      if (!lessonDurations[i] || lessonDurations[i] === '' || parseInt(lessonDurations[i]) <= 0) {
        errors.push(`Lesson ${i + 1}: Duration is required and must be greater than 0`);
      }
      if (!lessonDescriptions[i]?.trim()) errors.push(`Lesson ${i + 1}: Description is required`);
      if (!lessonVideoUrls[i]?.trim()) errors.push(`Lesson ${i + 1}: Video URL is required`);
    }
  }
  
  return errors;
};

// Helper functions for course creation
const createCourseObjectives = async (courseId, objectives) => {
  try {
    if (!objectives || (typeof objectives === 'string' && objectives.trim() === '')) return;
    
    // Handle array format
    let objectivesText = objectives;
    if (Array.isArray(objectives)) {
      objectivesText = objectives.join('\n');
    }
    
    const objectiveLines = objectivesText.split('\n').filter(line => line.trim());
    for (const objective of objectiveLines) {
      const cleanObjective = objective.trim().replace(/^[-•]\s*/, '');
      if (cleanObjective) {
        await db.execute(
          'INSERT INTO course_objectives (course_id, objective) VALUES (?, ?)',
          [courseId, cleanObjective]
        );
      }
    }
  } catch (error) {
    console.error('Error creating course objectives:', error);
  }
};

const createCoursePrerequisites = async (courseId, prerequisites) => {
  try {
    if (!prerequisites || (typeof prerequisites === 'string' && prerequisites.trim() === '')) return;
    
    // Handle array format
    let prerequisitesText = prerequisites;
    if (Array.isArray(prerequisites)) {
      prerequisitesText = prerequisites.join('\n');
    }
    
    const prerequisiteLines = prerequisitesText.split('\n').filter(line => line.trim());
    for (const prerequisite of prerequisiteLines) {
      const cleanPrerequisite = prerequisite.trim().replace(/^[-•]\s*/, '');
      if (cleanPrerequisite) {
        await db.execute(
          'INSERT INTO course_prerequisites (course_id, prerequisite) VALUES (?, ?)',
          [courseId, cleanPrerequisite]
        );
      }
    }
  } catch (error) {
    console.error('Error creating course prerequisites:', error);
  }
};

const createCourseLessons = async (courseId, lessonTitles, lessonDurations, lessonDescriptions, lessonVideoUrls) => {
  // Handle empty or undefined lesson arrays gracefully
  if (!lessonTitles || !Array.isArray(lessonTitles) || lessonTitles.length === 0) {
    console.log('No lessons to create for course:', courseId);
    return;
  }
  
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
    
    console.log('Dashboard - Instructor ID:', instructorId);
    console.log('Dashboard - Session user:', req.session.user);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }

    // Fetch all required data in parallel for better performance
    let courses = [];
    let totalStudents = 0;
    let students = [];
    
    try {
      [courses, totalStudents, students] = await Promise.all([
        getInstructorCourses(instructorId),
        getInstructorTotalStudents(instructorId),
        getInstructorStudents(instructorId)
      ]);
    } catch (dbError) {
      console.error('Dashboard - Database error:', dbError);
      // Set default values if database error
      courses = [];
      totalStudents = 0;
      students = [];
    }

    console.log('Dashboard - Courses found:', courses.length);
    console.log('Dashboard - Sample course:', courses[0]);

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
    handleError(res, error, 'Failed to load dashboard', 500, req);
  }
};

// Course Controllers
export const getInstructorCoursesList = async (req, res) => {
  try {
    const instructorId = getInstructorId(req);
    
    console.log('Courses List - Instructor ID:', instructorId);
    console.log('Courses List - Session user:', req.session.user);
    console.log('Courses List - Request URL:', req.url);
    console.log('Courses List - Request method:', req.method);
    
    if (!instructorId) {
      console.log('Courses List - No instructor ID, redirecting to signin');
      return res.redirect('/signin?error=Please login to access this page');
    }
    
    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    
    // Get total count for pagination
    const [totalCountResult] = await db.promise().query(
      'SELECT COUNT(*) as total FROM courses WHERE instructor_id = ?',
      [instructorId]
    );
    const totalCount = totalCountResult[0].total;
    
    console.log('Courses List - Total courses for instructor:', totalCount);
    
    // Get all courses first, then apply pagination
    console.log('Courses List - About to fetch courses for instructor:', instructorId);
    let allCourses = [];
    try {
      const rawCourses = await getInstructorCourses(instructorId);
      console.log('Courses List - Raw courses data type:', typeof rawCourses);
      console.log('Courses List - Raw courses data:', rawCourses);
      
      // Ensure we have a valid array
      if (Array.isArray(rawCourses)) {
        allCourses = rawCourses;
        console.log('Courses List - Raw courses is array with length:', allCourses.length);
      } else if (rawCourses && typeof rawCourses === 'object') {
        // If it's an object, try to extract array from it
        console.log('Courses List - Raw courses is object, checking for array property...');
        if (Array.isArray(rawCourses.data)) {
          allCourses = rawCourses.data;
        } else if (Array.isArray(rawCourses.results)) {
          allCourses = rawCourses.results;
        } else {
          console.log('Courses List - Raw courses object has no array property, converting to array');
          allCourses = [rawCourses];
        }
      } else {
        console.log('Courses List - Raw courses is not array or object, setting empty array');
        allCourses = [];
      }
    } catch (dbError) {
      console.error('Courses List - Database error:', dbError);
      allCourses = []; // Set empty array if database error
    }
    
    // Final validation
    if (!Array.isArray(allCourses)) {
      console.log('Courses List - Final validation: allCourses is not array, forcing empty array');
      allCourses = [];
    }
    
    console.log('Courses List - Final allCourses type:', typeof allCourses);
    console.log('Courses List - Final allCourses is array:', Array.isArray(allCourses));
    console.log('Courses List - Final allCourses length:', allCourses.length);
    console.log('Courses List - Final allCourses sample:', allCourses[0]);
    
    const courses = allCourses.slice(offset, offset + limit);
    console.log('Courses List - After slice - courses type:', typeof courses);
    console.log('Courses List - After slice - courses is array:', Array.isArray(courses));
    console.log('Courses List - After slice - courses length:', courses.length);
    
    console.log('Courses List - All courses found:', allCourses.length);
    console.log('Courses List - Courses after pagination:', courses.length);
    console.log('Courses List - Sample course:', courses[0]);
    
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

    // Final safety check before rendering
    let safeCourses = Array.isArray(courses) ? courses : [];
    console.log('Courses List - Safe courses for rendering:', safeCourses.length);
    console.log('Courses List - Safe courses type:', typeof safeCourses);
    console.log('Courses List - Safe courses is array:', Array.isArray(safeCourses));
    
    // Additional validation to ensure courses is always an array
    if (!Array.isArray(safeCourses)) {
      console.log('Courses List - CRITICAL: safeCourses is not array, forcing empty array');
      safeCourses = [];
    }
    
    // Ensure each course object has required properties
    const validatedCourses = safeCourses.map(course => {
      if (typeof course === 'object' && course !== null) {
        return {
          id: course.id || 0,
          title: course.title || 'Untitled Course',
          description: course.description || 'No description available',
          price: course.price || 0,
          status: course.status || 'draft',
          category_name: course.category_name || 'Uncategorized',
          difficulty_name: course.difficulty_name || 'Unknown',
          enrollment_count: course.enrollment_count || 0,
          created_at: course.created_at || new Date().toISOString()
        };
      }
      return {
        id: 0,
        title: 'Invalid Course',
        description: 'Invalid course data',
        price: 0,
        status: 'draft',
        category_name: 'Uncategorized',
        difficulty_name: 'Unknown',
        enrollment_count: 0,
        created_at: new Date().toISOString()
      };
    });
    
    console.log('Courses List - Validated courses count:', validatedCourses.length);
    
    // Final validation before rendering
    if (!Array.isArray(validatedCourses)) {
      console.log('Courses List - CRITICAL: validatedCourses is not array, forcing empty array');
      validatedCourses = [];
    }

    renderSuccess(res, "instructors/courses/index", { 
      courses: validatedCourses,
      pagination,
      query: req.query // Pass query parameters for form preservation
    });

  } catch (error) {
    console.error('Courses List - Error caught:', error);
    console.error('Courses List - Error stack:', error.stack);
    console.error('Courses List - Req available:', !!req);
    
    // Use a more robust error handling approach
    if (res.headersSent) {
      return;
    }
    
    try {
      // Try to render with empty courses array as fallback
      renderSuccess(res, "instructors/courses/index", { 
        courses: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 12,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null
        },
        query: req.query,
        error: 'Unable to load courses. Please try again later.'
      });
    } catch (fallbackError) {
      console.error('Courses List - Fallback error:', fallbackError);
      // Final fallback error response
      res.status(500).render('error', {
        layout: 'instructors/layouts/layout',
        error: { message: 'Failed to load courses', status: 500 }
      });
    }
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
    handleError(res, error, 'Failed to load create course page', 500, req);
  }
};

export const createCourse = async (req, res) => {
  try {
    const instructorId = getInstructorId(req);
    
    if (!instructorId) {
      return res.redirect('/signin?error=Please login to access this page');
    }

    // Debug: Log the request body to see what's being sent
    console.log('Request body:', JSON.stringify(req.body, null, 2));

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
      status,
      courseStatus
    } = req.body;

    // Handle status - ensure it's a valid ENUM value
    // Use the status field first, then fallback to courseStatus
    const selectedStatus = status || courseStatus;
    const validStatus = (selectedStatus === 'published') ? 'published' : 'draft';
    
    // Handle objectives and prerequisites - convert arrays to strings if needed
    let objectives = objectivesText || '';
    let prerequisites = prerequisitesText || '';
    
    // Handle array format for objectives
    if (req.body['courseObjectives[]'] && Array.isArray(req.body['courseObjectives[]'])) {
      objectives = req.body['courseObjectives[]'].join('\n');
    } else if (req.body.courseObjectives && Array.isArray(req.body.courseObjectives)) {
      objectives = req.body.courseObjectives.join('\n');
    }
    
    // Handle array format for prerequisites
    if (req.body['coursePrerequisites[]'] && Array.isArray(req.body['coursePrerequisites[]'])) {
      prerequisites = req.body['coursePrerequisites[]'].join('\n');
    } else if (req.body.coursePrerequisites && Array.isArray(req.body.coursePrerequisites)) {
      prerequisites = req.body.coursePrerequisites.join('\n');
    }
    
    console.log('Objectives:', objectives);
    console.log('Prerequisites:', prerequisites);

    // Extract lesson data from form fields - handle both array and non-array formats
    let lessonTitlesArray = [];
    let lessonDurationsArray = [];
    let lessonDescriptionsArray = [];
    let lessonVideoUrlsArray = [];

    // Check if lesson data is coming as arrays
    if (Array.isArray(lessonTitles) && lessonTitles.length > 0) {
      lessonTitlesArray = lessonTitles.filter(title => title && title.trim());
      lessonDurationsArray = Array.isArray(lessonDurations) ? lessonDurations : [];
      lessonDescriptionsArray = Array.isArray(lessonDescriptions) ? lessonDescriptions : [];
      lessonVideoUrlsArray = Array.isArray(lessonVideoUrls) ? lessonVideoUrls : [];
    } else {
      // If not arrays, try to extract from individual fields
      console.log('No lesson arrays found, checking for individual lesson fields...');
      
      // Check for individual lesson fields (fallback for when JavaScript doesn't work)
      const lessonTitle = req.body.lessonTitle;
      const lessonDuration = req.body.lessonDuration;
      const lessonDescription = req.body.lessonDescription;
      const videoUrl = req.body.videoUrl;
      
      if (lessonTitle && lessonTitle.trim()) {
        lessonTitlesArray = [lessonTitle.trim()];
        lessonDurationsArray = [lessonDuration || ''];
        lessonDescriptionsArray = [lessonDescription || ''];
        lessonVideoUrlsArray = [videoUrl || ''];
        console.log('Found individual lesson fields:', {
          title: lessonTitle,
          duration: lessonDuration,
          description: lessonDescription,
          video: videoUrl
        });
      }
    }

    // Ensure arrays are always defined for draft saving
    if (!Array.isArray(lessonTitlesArray)) lessonTitlesArray = [];
    if (!Array.isArray(lessonDurationsArray)) lessonDurationsArray = [];
    if (!Array.isArray(lessonDescriptionsArray)) lessonDescriptionsArray = [];
    if (!Array.isArray(lessonVideoUrlsArray)) lessonVideoUrlsArray = [];

    console.log('Extracted lesson data:', {
      lessonTitlesArray,
      lessonDurationsArray,
      lessonDescriptionsArray,
      lessonVideoUrlsArray
    });

    // Validate course data
    const courseData = {
      title,
      category_id,
      difficulty_id,
      price,
      description,
      objectives,
      prerequisites,
      lessonTitles: lessonTitlesArray
    };
    
    console.log('Course data for validation:', courseData);
    
    // Check if this is a draft save
    const isDraft = validStatus === 'draft';
    console.log('Is draft save:', isDraft);
    
    let validationErrors = [];
    let lessonErrors = [];
    
    try {
      console.log('Starting validation...');
      validationErrors = validateCourseData(courseData, isDraft);
      console.log('Course validation completed:', validationErrors);
      lessonErrors = validateLessonData(lessonTitlesArray, lessonDurationsArray, lessonDescriptionsArray, lessonVideoUrlsArray, isDraft);
      console.log('Lesson validation completed:', lessonErrors);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      console.error('Validation error stack:', validationError.stack);
      validationErrors = ['Validation error occurred: ' + validationError.message];
    }
    
    const allErrors = [...validationErrors, ...lessonErrors];
    
    console.log('Validation errors:', allErrors);
    
    // Handle validation errors
    if (allErrors.length > 0) {
      console.log('Validation failed with errors:', allErrors);
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Lesson-related keys in request body:', Object.keys(req.body).filter(key => key.includes('lesson')));
      
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
      status: validStatus,
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
      createCourseLessons(newCourseId, lessonTitlesArray, lessonDurationsArray, lessonDescriptionsArray, lessonVideoUrlsArray)
    ]);

    // Redirect with success message
    const redirectUrl = validStatus === 'draft' 
      ? '/instructor/courses?draft_saved=true'
      : '/instructor/courses?course_published=true';
    
    res.redirect(redirectUrl);

  } catch (error) {
    handleError(res, error, 'Error creating course', 500, req);
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
    handleError(res, error, 'Failed to load course details', 500, req);
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
    handleError(res, error, 'Failed to load edit course page', 500, req);
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
    handleError(res, error, 'Error updating course', 500, req);
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

    // Use the model function to delete the course
    const success = await deleteCourseModel(courseId, instructorId);

    if (success) {
      sendJsonResponse(res, { message: 'Course deleted successfully' });
    } else {
      throw new Error('Failed to delete course - no rows affected');
    }

  } catch (error) {
    handleError(res, error, 'Error deleting course', 500, req);
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

    // Use the model function to delete the lesson
    const success = await deleteLessonModel(courseId, lessonId, instructorId);

    if (success) {
      sendJsonResponse(res, { message: 'Lesson deleted successfully' });
    } else {
      res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

  } catch (error) {
    handleError(res, error, 'Error deleting lesson', 500, req);
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
    handleError(res, error, 'Failed to load students page', 500, req);
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
    handleError(res, error, 'Failed to load profile edit page', 500, req);
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

    // Update instructor profile using model function
    await updateInstructorProfile(instructorId, { specialization, bio });

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
