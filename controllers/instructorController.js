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
const DEFAULT_INSTRUCTOR_ID = 2; // John Smith - React instructor from seeded data
const DEFAULT_LAYOUT = "instructors/layouts/layout";

// Helper function for error handling
const handleError = (res, error, message = 'Internal server error') => {
  console.error('Controller error:', error);
  res.status(500).json({ 
    success: false,
    message: message,
    error: error.message
  });
};

// Helper function for successful responses
const renderSuccess = (res, view, data) => {
  res.render(view, { 
    layout: DEFAULT_LAYOUT,
    instructor: res.locals.instructor,
    ...data
  });
};

// Middleware to fetch instructor data for layout
export const getInstructorData = async (req, res, next) => {
  try {
    const instructorId = DEFAULT_INSTRUCTOR_ID;
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
    console.log('Getting instructor dashboard...');
    const instructorId = DEFAULT_INSTRUCTOR_ID;
    console.log('Instructor ID:', instructorId);

    // Fetch all required data in parallel for better performance
    console.log('Fetching data...');
    const [courses, totalStudents, students] = await Promise.all([
      getInstructorCourses(instructorId),
      getInstructorTotalStudents(instructorId),
      getInstructorStudents(instructorId)
    ]);

    console.log('Data fetched successfully:', {
      coursesCount: courses.length,
      totalStudents,
      studentsCount: students.length
    });

    const totalCourses = courses.length;
    const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrollment_count || 0), 0);
    const avgRating = parseFloat(res.locals.instructor.rating) || 0.0;

    console.log('Rendering dashboard...');
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
    console.error('Error in getInstructorDashboard:', error);
    handleError(res, error);
  }
};

// Course Controllers
export const getInstructorCoursesList = async (req, res) => {
  try {
    const instructorId = DEFAULT_INSTRUCTOR_ID;
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // 12 courses per page
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
      req: req // Pass request object to access query parameters
    });

  } catch (error) {
    handleError(res, error);
  }
};

export const getCreateCoursePage = async (req, res) => {
  try {
    const [categories, difficultyLevels] = await Promise.all([
      getAllCategories(),
      getAllDifficultyLevels()
    ]);

    renderSuccess(res, "instructors/courses/create", {
      categories,
      difficultyLevels
    });

  } catch (error) {
    handleError(res, error);
  }
};

export const createCourse = async (req, res) => {
  try {
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

    const instructorId = DEFAULT_INSTRUCTOR_ID;

    console.log('Course status received:', status);
    console.log('Course status type:', typeof status);

    // Validate required fields for both draft and published courses
    const missingFields = [];
    
    if (!title || title.trim() === '') {
      missingFields.push('Course Title');
    }
    if (!category_id) {
      missingFields.push('Category');
    }
    if (!difficulty_id) {
      missingFields.push('Difficulty Level');
    }
    if (!description || description.trim() === '') {
      missingFields.push('Description');
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      missingFields.push('Price');
    }
    if (!objectives || objectives.trim() === '') {
      missingFields.push('Learning Objectives');
    }
    if (!prerequisites || prerequisites.trim() === '') {
      missingFields.push('Prerequisites');
    }

    // Validate Course Lessons
    if (!lessonTitles || lessonTitles.length === 0) {
      missingFields.push('Course Lessons');
    } else {
      // Check if at least one lesson has all required fields
      let hasValidLesson = false;
      for (let i = 0; i < lessonTitles.length; i++) {
        const lessonTitle = lessonTitles[i] ? lessonTitles[i].trim() : '';
        const lessonDuration = lessonDurations[i] ? lessonDurations[i].trim() : '';
        const lessonDescription = lessonDescriptions[i] ? lessonDescriptions[i].trim() : '';
        const lessonVideoUrl = lessonVideoUrls[i] ? lessonVideoUrls[i].trim() : '';
        
        if (lessonTitle && lessonDuration && lessonDescription && lessonVideoUrl) {
          hasValidLesson = true;
          break;
        }
      }
      
      if (!hasValidLesson) {
        missingFields.push('Course Lessons (at least one complete lesson)');
      }
    }

    // For draft courses, show validation error but allow saving with defaults
    if (status === 'draft' && missingFields.length > 0) {
      return res.status(400).render('instructors/courses/create', {
        layout: DEFAULT_LAYOUT,
        instructor: res.locals.instructor,
        categories: await getAllCategories(),
        difficultyLevels: await getAllDifficultyLevels(),
        error: `Cannot save as draft. Please fill in the following required fields: ${missingFields.join(', ')}`,
        form: req.body // Preserve form data
      });
    }
    
    // For published courses, enforce all required fields
    if (status !== 'draft' && missingFields.length > 0) {
      return res.status(400).render('instructors/courses/create', {
        layout: DEFAULT_LAYOUT,
        instructor: res.locals.instructor,
        categories: await getAllCategories(),
        difficultyLevels: await getAllDifficultyLevels(),
        error: `Missing required fields: ${missingFields.join(', ')}`,
        form: req.body // Preserve form data
      });
    }
    
    // For draft courses, provide default values for empty required fields
    const finalTitle = title || 'Untitled Course';
    const finalCategoryId = category_id || 1; // Default to first category
    const finalDifficultyId = difficulty_id || 1; // Default to first difficulty level

    const courseData = {
      title: finalTitle,
      category_id: parseInt(finalCategoryId),
      difficulty_id: parseInt(finalDifficultyId),
      price: parseFloat(price) || 0,
      description: description || '',
      status,
      instructor_id: instructorId
    };

    const newCourseId = await createCourseModel(courseData);

    if (newCourseId) {
      // Create course objectives if provided
      if (objectives && objectives.trim()) {
        const objectiveLines = objectives.split('\n').filter(line => line.trim());
        for (const objective of objectiveLines) {
          // Remove bullet point and dash if present
          const cleanObjective = objective.trim().replace(/^[-•]\s*/, '');
          await db.execute(
            'INSERT INTO course_objectives (course_id, objective) VALUES (?, ?)',
            [newCourseId, cleanObjective]
          );
        }
      }

      // Create course prerequisites if provided
      if (prerequisites && prerequisites.trim()) {
        const prerequisiteLines = prerequisites.split('\n').filter(line => line.trim());
        for (const prerequisite of prerequisiteLines) {
          // Remove bullet point and dash if present
          const cleanPrerequisite = prerequisite.trim().replace(/^[-•]\s*/, '');
          await db.execute(
            'INSERT INTO course_prerequisites (course_id, prerequisite) VALUES (?, ?)',
            [newCourseId, cleanPrerequisite]
          );
        }
      }

      // Create course lessons if provided
      if (lessonTitles && lessonTitles.length > 0) {
        for (let i = 0; i < lessonTitles.length; i++) {
          if (lessonTitles[i] && lessonTitles[i].trim()) {
            const lessonNumber = i + 1; // Automatically generate sequential lesson numbers
            await db.execute(
              'INSERT INTO course_lessons (course_id, lesson_no, title, duration_mins, description, video_url) VALUES (?, ?, ?, ?, ?, ?)',
              [
                newCourseId,
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

      // Redirect with success message
      if (status === 'draft') {
        res.redirect('/instructor/courses?draft_saved=true');
      } else {
        res.redirect('/instructor/courses?course_published=true');
      }
    } else {
      handleError(res, new Error('Failed to create course'), 'Failed to create course');
    }

  } catch (error) {
    handleError(res, error, 'Error creating course');
  }
};

export const getCourseDetail = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = DEFAULT_INSTRUCTOR_ID;

    const [course, lessons, objectives, prerequisites] = await Promise.all([
      getCourseByIdAndInstructor(courseId, instructorId),
      getCourseLessons(courseId),
      getCourseObjectives(courseId),
      getCoursePrerequisites(courseId)
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    renderSuccess(res, "instructors/courses/detail", {
      course,
      lessons,
      objectives,
      prerequisites
    });

  } catch (error) {
    handleError(res, error);
  }
};

export const getEditCoursePage = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = DEFAULT_INSTRUCTOR_ID;

    console.log('Getting edit page for course:', courseId);

    const [course, categories, difficultyLevels, lessons, objectives, prerequisites] = await Promise.all([
      getCourseByIdAndInstructor(courseId, instructorId),
      getAllCategories(),
      getAllDifficultyLevels(),
      getCourseLessons(courseId),
      getCourseObjectives(courseId),
      getCoursePrerequisites(courseId)
    ]);


    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const templateData = {
      course,
      categories,
      difficultyLevels,
      lessons: lessons || [],
      objectives: objectives || [],
      prerequisites: prerequisites || []
    };


    renderSuccess(res, "instructors/courses/edit", templateData);

  } catch (error) {
    console.error('Error in getEditCoursePage:', error);
    handleError(res, error);
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = DEFAULT_INSTRUCTOR_ID;

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
    if (!title || !category_id || !difficulty_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, category, difficulty level'
      });
    }

    const courseData = {
      title,
      category_id: parseInt(category_id),
      difficulty_id: parseInt(difficulty_id),
      price: parseFloat(price) || 0,
      description: description || '',
      status
    };

    console.log('Course data to update:', courseData);

    const updatedCourse = await updateCourseModel(courseId, instructorId, courseData);

    if (updatedCourse) {
      // Handle lesson updates
      await updateCourseLessons(courseId, {
        lessonTitles,
        lessonDurations,
        lessonDescriptions,
        lessonVideoUrls,
        lessonIds
      });

      // Handle objectives updates
      await updateCourseObjectivesFromText(courseId, objectivesText);

      // Handle prerequisites updates
      await updateCoursePrerequisitesFromText(courseId, prerequisitesText);

      res.redirect('/instructor/courses');
    } else {
      console.log('Update failed - no rows affected');
      handleError(res, new Error('Failed to update course - course not found or no changes made'), 'Failed to update course');
    }

  } catch (error) {
    console.error('Error in updateCourse controller:', error);
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
    const instructorId = DEFAULT_INSTRUCTOR_ID;

    console.log('Delete course request:', { courseId, instructorId });

    // First check if course exists and belongs to the instructor
    const course = await getCourseByIdAndInstructor(courseId, instructorId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or you do not have permission to delete it'
      });
    }

    // Delete related data first (foreign key constraints)
    await db.execute('DELETE FROM course_lessons WHERE course_id = ?', [courseId]);
    await db.execute('DELETE FROM course_objectives WHERE course_id = ?', [courseId]);
    await db.execute('DELETE FROM course_prerequisites WHERE course_id = ?', [courseId]);
    await db.execute('DELETE FROM enrollments WHERE course_id = ?', [courseId]);
    await db.execute('DELETE FROM lesson_progress WHERE course_id = ?', [courseId]);

    // Finally delete the course
    const [result] = await db.execute('DELETE FROM courses WHERE id = ? AND instructor_id = ?', [courseId, instructorId]);

    if (result.affectedRows > 0) {
      console.log('Course deleted successfully:', courseId);
      res.json({ success: true, message: 'Course deleted successfully' });
    } else {
      console.log('Failed to delete course - no rows affected');
      res.status(500).json({
        success: false,
        message: 'Failed to delete course'
      });
    }

  } catch (error) {
    console.error('Error in deleteCourse controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const instructorId = DEFAULT_INSTRUCTOR_ID;

    console.log('Delete lesson request:', { courseId, lessonId, instructorId });

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
      console.log('Lesson deleted successfully:', lessonId);
      res.json({ success: true, message: 'Lesson deleted successfully' });
    } else {
      console.log('Failed to delete lesson - no rows affected');
      res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

  } catch (error) {
    console.error('Error in deleteLesson controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lesson',
      error: error.message
    });
  }
};

// Student Controllers
export const getInstructorStudentsPage = async (req, res) => {
  try {
    const instructorId = DEFAULT_INSTRUCTOR_ID;
    
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
    const instructorId = DEFAULT_INSTRUCTOR_ID;
    const instructor = await getInstructorById(instructorId);
    
    // Check for success parameter from redirect
    const success = req.query.success === 'true';
    
    renderSuccess(res, "instructors/profile/edit", {
      instructor,
      form: instructor, // Pass instructor data as form data for pre-filling
      success: success
    });

  } catch (error) {
    handleError(res, error);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const instructorId = DEFAULT_INSTRUCTOR_ID;
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
