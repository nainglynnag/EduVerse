import {
  getStudentEnrolledCourses,
  getStudentProgressSummary,
  getRecommendedCourses,
} from "../models/studentDashboardModel.js";

// error handler
const errorHandler = (res, error, operation, message = "Internal server error") => {
  console.error(`Controller error in ${operation}:`, error);
  if (res && !res.headersSent) {
    res.status(500).send({ error: String(error), message });
  }
};

export const studentDashboard = async (req, res) => {
  try {
    // If using admin guard, req.session.admin exists; for a real student session you'd use req.session.student
    const studentId = req.session?.admin?.id || req.query.studentId || null;
    let enrolledCourses = [];
    let progressSummary = [];
    let recommended = [];

    try {
      const ec = await getStudentEnrolledCourses(studentId);
      const ps = await getStudentProgressSummary(studentId);
      const rc = await getRecommendedCourses(studentId);
      enrolledCourses = ec?.[0] || [];
      progressSummary = ps?.[0] || [];
      recommended = rc?.[0] || [];
    } catch (innerErr) {
      // Log and continue with empty data so dashboard page still renders
      console.error('Student dashboard: failed to load some data, rendering fallback view', innerErr);
      // Optionally set a flash message to inform admins during dev
      if (req && req.flash) req.flash('error', 'Some dashboard data could not be loaded (DB error)');
    }

    res.render("students/dashboard/index", {
      title: "Student Dashboard",
      layout: "admin/layouts/layout",
      active: "dashboard",
      enrolledCourses,
      progressSummary,
      recommended,
    });
  } catch (error) {
    errorHandler(res, error, "studentDashboard");
  }
};
