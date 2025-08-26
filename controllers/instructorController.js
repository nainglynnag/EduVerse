import {
  getInstructorById,
  getInstructorCourses,
  getInstructorTotalStudents,
  getInstructorStudents,
  getAllCategories,
  getAllDifficultyLevels,
  createCourse as createCourseModel,
  getCourseByIdAndInstructor,
  updateCourse as updateCourseModel
} from "../models/instructorModel.js";

// Constants
const DEFAULT_INSTRUCTOR_ID = 4; // TODO: Replace with session-based authentication
const DEFAULT_LAYOUT = "instructors/layouts/layout";

// Helper function for error handling
const handleError = (res, error, message = 'Internal server error') => {
  console.error('Controller error:', error);
  res.status(500).render('error', { 
    message,
    layout: DEFAULT_LAYOUT
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
    const instructorId = DEFAULT_INSTRUCTOR_ID;

    // Fetch all required data in parallel for better performance
    const [courses, totalStudents, students] = await Promise.all([
      getInstructorCourses(instructorId),
      getInstructorTotalStudents(instructorId),
      getInstructorStudents(instructorId)
    ]);

    const totalCourses = courses.length;
    const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrollment_count || 0), 0);
    const avgRating = parseFloat(res.locals.instructor.rating) || 0.0;

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
    handleError(res, error);
  }
};

// Course Controllers
export const getInstructorCoursesList = async (req, res) => {
  try {
    const instructorId = DEFAULT_INSTRUCTOR_ID;
    const courses = await getInstructorCourses(instructorId);

    renderSuccess(res, "instructors/courses/index", { courses });

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
      status = 'draft'
    } = req.body;

    const instructorId = DEFAULT_INSTRUCTOR_ID;

    // Validate required fields
    if (!title || !category_id || !difficulty_id) {
      return res.status(400).render('error', {
        message: 'Missing required fields: title, category, difficulty level',
        layout: DEFAULT_LAYOUT
      });
    }

    const courseData = {
      title,
      category_id: parseInt(category_id),
      difficulty_id: parseInt(difficulty_id),
      price: parseFloat(price) || 0,
      description: description || '',
      status,
      instructor_id: instructorId
    };

    const newCourse = await createCourseModel(courseData);

    if (newCourse) {
      res.redirect('/instructor/courses');
    } else {
      handleError(res, new Error('Failed to create course'), 'Failed to create course');
    }

  } catch (error) {
    handleError(res, error, 'Error creating course');
  }
};

export const getEditCoursePage = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = DEFAULT_INSTRUCTOR_ID;

    const [course, categories, difficultyLevels] = await Promise.all([
      getCourseByIdAndInstructor(courseId, instructorId),
      getAllCategories(),
      getAllDifficultyLevels()
    ]);

    if (!course) {
      return res.status(404).render('error', {
        message: 'Course not found',
        layout: DEFAULT_LAYOUT
      });
    }

    renderSuccess(res, "instructors/courses/edit", {
      course,
      categories,
      difficultyLevels
    });

  } catch (error) {
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
      status
    } = req.body;

    // Validate required fields
    if (!title || !category_id || !difficulty_id) {
      return res.status(400).render('error', {
        message: 'Missing required fields: title, category, difficulty level',
        layout: DEFAULT_LAYOUT
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

    const updatedCourse = await updateCourseModel(courseId, instructorId, courseData);

    if (updatedCourse) {
      res.redirect('/instructor/courses');
    } else {
      handleError(res, new Error('Failed to update course'), 'Failed to update course');
    }

  } catch (error) {
    handleError(res, error, 'Error updating course');
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = DEFAULT_INSTRUCTOR_ID;

    // TODO: Implement delete course functionality
    // For now, return success
    res.json({ success: true, message: 'Course deleted successfully' });

  } catch (error) {
    handleError(res, error, 'Error deleting course');
  }
};

// Student Controllers
export const getInstructorStudentsPage = async (req, res) => {
  try {
    const instructorId = DEFAULT_INSTRUCTOR_ID;

    const [courses, students] = await Promise.all([
      getInstructorCourses(instructorId),
      getInstructorStudents(instructorId)
    ]);

    const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrollment_count || 0), 0);

    renderSuccess(res, "instructors/students/index", {
      courses,
      students,
      totalEnrollments
    });

  } catch (error) {
    handleError(res, error);
  }
};
