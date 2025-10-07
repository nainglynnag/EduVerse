import { 
  getStudentById, 
  getStudentEnrolledCourses, 
  enrollInCourse as enrollInCourseModel,
  unenrollFromCourse,
  getEnrollmentStatus,
  updateStudentProfile,
  markLessonComplete
} from "../models/studentModel.js";
import { getCourseById, getCourseWithLessons, getAllCourses } from "../models/courseModel.js";
import { updateStudent } from "../models/adminModel.js";




const DEFAULT_LAYOUT = "students/layout/studentLayout";

// Helper function to get student ID from session
const getStudentId = (req) => {
  return req.session.user?.userId || 1;
};


export const getStudent = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const student = await getStudentById(studentId);

    // Get enrolled courses for the dashboard
    const enrolledCourses = await getStudentEnrolledCourses(studentId);

    // Get progress data for each enrolled course
    const { getStudentProgressSummary } = await import('../models/studentModel.js');
    const progressData = await getStudentProgressSummary(studentId);

    // Get all courses from instructors
    const allCourses = await getAllCourses();
    console.log("Dashboard - All courses fetched:", allCourses);
    console.log("Dashboard - All courses count:", allCourses ? allCourses.length : 'null/undefined');

    if (student) {
      res.render("students/dashboard/index", {
        layout: DEFAULT_LAYOUT,
        active: "dashboard",
        title: "Dashboard",
        student,
        enrolledCourses,
        progressData,
        allCourses,
      });
    } else {
      // If student not found, render with default data
      res.render("students/dashboard/index", {
        layout: DEFAULT_LAYOUT,
        active: "dashboard",
        title: "Dashboard",
        student: { name: 'Student', total_courses: 0 },
        enrolledCourses: [],
        progressData: [],
        allCourses: [],
      });
    }
  } catch (error) {
    console.error("Error in get student data:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getStudentCourses = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const student = await getStudentById(studentId);

    // Get enrolled courses (same as dashboard)
    const enrolledCourses = await getStudentEnrolledCourses(studentId);

    // Get progress data for each enrolled course (same as dashboard)
    const { getStudentProgressSummary } = await import('../models/studentModel.js');
    const progressData = await getStudentProgressSummary(studentId);
    console.log('🔍 Progress Data for Student', studentId, ':', progressData);
    console.log('🔍 Progress Data length:', progressData ? progressData.length : 'null/undefined');

    // Merge course data with progress data (same logic as dashboard)
    const coursesWithProgress = enrolledCourses ? enrolledCourses.map(course => {
      const progress = progressData.find(p => p.course_id === course.id);
      const courseWithProgress = {
        ...course,
        progress_percent: progress ? progress.progress_percent : 0,
        completed_lessons: progress ? progress.completed_lessons : 0,
        total_lessons: progress ? progress.total_lessons : 0,
        category_name: course.category_name || 'Uncategorized'
      };
      console.log('🔍 Course Progress:', course.title, courseWithProgress.progress_percent, courseWithProgress.completed_lessons, courseWithProgress.total_lessons);
      return courseWithProgress;
    }) : [];

    // Get query parameters
    const status = req.query.status || 'all';
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate pagination
    const totalCourses = coursesWithProgress ? coursesWithProgress.length : 0;
    const totalPages = Math.ceil(totalCourses / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCourses = coursesWithProgress ? coursesWithProgress.slice(startIndex, endIndex) : [];

    res.render("students/course/index", {
      layout: DEFAULT_LAYOUT,
      active: "mycourses",
      title: "My Courses",
      student,
      enrolledCourses: paginatedCourses, // Match dashboard variable name
      progressData, // Add progressData like dashboard
      courses: paginatedCourses, // Keep for backward compatibility
      totalCourses: totalCourses,
      status: status,
      search: search,
      currentPage: page,
      totalPages: totalPages,
      limit: limit,
    });
  } catch (error) {
    console.error("Error in get student courses:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getCourseDetail = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = getStudentId(req);
    
    console.log("Getting course detail for course ID:", courseId);
    
    const course = await getCourseWithLessons(courseId);
    
    console.log("Course fetched:", course ? course.title : 'null');
    console.log("Lessons count:", course?.lessons?.length || 0);
    console.log("Lessons data:", course?.lessons);
    console.log("Full course object keys:", course ? Object.keys(course) : 'null');
    
    if (!course) {
      return res.status(404).send("Course not found");
    }
    
    // Get student data
    const student = await getStudentById(studentId);
    
    // Check if student is enrolled
    const enrolledCourses = await getStudentEnrolledCourses(studentId);
    const isEnrolled = enrolledCourses.some(c => c.id === parseInt(courseId));
    
    // Get progress data for this course
    const { getStudentProgressSummary } = await import('../models/studentModel.js');
    const progressData = await getStudentProgressSummary(studentId);
    const courseProgress = progressData ? progressData.find(p => p.course_id === parseInt(courseId)) : null;
    
    console.log("Student ID:", studentId);
    console.log("Course ID:", courseId);
    console.log("Enrolled courses:", enrolledCourses.map(c => c.id));
    console.log("Is enrolled:", isEnrolled);
    console.log("Course progress:", courseProgress);
    
    res.render("students/course/courseDetail", {
      layout: DEFAULT_LAYOUT,
      active: "courses",
      title: "Course Details",
      course: { 
        ...course, 
        is_enrolled: isEnrolled,
        progress_percent: courseProgress ? courseProgress.progress_percent : 0,
        completed_lessons: courseProgress ? courseProgress.completed_lessons : 0,
        total_lessons: courseProgress ? courseProgress.total_lessons : (course.lessons ? course.lessons.length : 0)
      },
      student,
    });
  } catch (error) {
    console.error("Error in get course detail:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const enrollInCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = getStudentId(req);
    
    const result = await enrollInCourseModel(studentId, courseId);
    
    if (result.success) {
      res.json({ success: true, message: "Successfully enrolled in course" });
    } else {
      res.status(400).json({ success: false, message: result.message || "Failed to enroll" });
    }
  } catch (error) {
    console.error("Error in enroll course:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

// NEW CRUD Operations

// Unenroll from course
export const unenrollFromCourseController = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = getStudentId(req);
    
    const result = await unenrollFromCourse(studentId, courseId);
    
    if (result.success) {
      res.json({ success: true, message: "Successfully unenrolled from course" });
    } else {
      res.status(400).json({ success: false, message: result.message || "Failed to unenroll" });
    }
  } catch (error) {
    console.error("Error in unenroll course:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

// Get enrollment status
export const getEnrollmentStatusController = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = getStudentId(req);
    
    const enrollment = await getEnrollmentStatus(studentId, courseId);
    
    res.json({ 
      success: true, 
      isEnrolled: !!enrollment,
      enrollment: enrollment 
    });
  } catch (error) {
    console.error("Error in get enrollment status:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

// Update student profile
export const updateStudentProfileController = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const updates = req.body;
    
    const result = await updateStudentProfile(studentId, updates);
    
    if (result.success) {
      res.json({ success: true, message: "Profile updated successfully" });
    } else {
      res.status(400).json({ success: false, message: result.message || "Failed to update profile" });
    }
  } catch (error) {
    console.error("Error in update profile:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

// PROFILE MANAGEMENT FUNCTIONS (moved from studentProfileController.js)

// Show student profile
export const showProfile = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const student = await getStudentById(studentId);

    res.render("students/profile/index", {
      layout: DEFAULT_LAYOUT,
      active: "profile",
      title: "Profile",
      student,
    });
  } catch (error) {
    console.error("Error in showProfile:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Show edit profile form
export const editProfile = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const student = await getStudentById(studentId);

    res.render("students/profile/edit", {
      layout: DEFAULT_LAYOUT,
      active: "profile",
      title: "Edit Profile",
      student,
      form: student,
    });
  } catch (error) {
    console.error("Error in editProfile:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Update student profile (form submission)
export const updateProfile = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { name, email, plan_id } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      req.flash("error", "Name and email are required");
      return res.redirect("/student/profile/edit");
    }

    // Update student profile
    const result = await updateStudentProfile(studentId, {
      name,
      email,
      plan_id: plan_id || null,
    });

    req.flash("success", "Profile updated successfully");
    res.redirect("/student/profile");
  } catch (error) {
    console.error("Error in updateProfile:", error);
    req.flash("error", `Failed to update profile: ${error.message}`);
    res.redirect("/student/profile/edit");
  }
};

export const completeLesson = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { courseId, lessonId } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({ 
        success: false, 
        message: "Course ID and Lesson ID are required" 
      });
    }

    const result = await markLessonComplete(studentId, courseId, lessonId);

    if (result.success) {
      res.json({ 
        success: true, 
        message: "Lesson marked as completed successfully" 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: "Failed to mark lesson as completed" 
      });
    }
  } catch (error) {
    console.error("Error completing lesson:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};