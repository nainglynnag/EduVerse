import {
  getInstructorById,
  getAllCategories,
  getAllDifficultyLevels,
} from "../models/instructorModel.js";
import {
  getAllInstructors,
  getAllInstructorsByParams,
  getAllInstructorsDetails,
  createInstructor,
} from "../models/adminModel.js";
import { getStudentById } from "../models/studentModel.js";

const errorHandler = (res, error, operation, message = "Internal server error") => {
  console.error(`Controller error in ${operation}:`, error);
  if (res && !res.headersSent) res.status(500).send({ error: String(error), message });
};

// Helper function to get student ID from session
const getStudentId = (req) => {
  return req.session.user?.userId || 1;
};

export const listInstructors = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const search = req.query.search || "";

    // Get student data
    const studentId = getStudentId(req);
    const student = await getStudentById(studentId);

    // Use admin model to fetch instructors with proper structure
    const result = await getAllInstructorsByParams(page, limit, search);

    res.render("students/instructor/index", {
      layout: "students/layout/studentLayout",
      title: "Instructors",
      active: "instructors",
      instructors: result.instructors,
      totalInstructors: result.totalInstructors,
      currentPage: page,
      totalPages: Math.ceil(result.totalInstructors / limit),
      student,
    });
  } catch (error) {
    errorHandler(res, error, "listInstructors");
  }
};

export const showCreateInstructorForm = async (req, res) => {
  try {
    // Get student data
    const studentId = getStudentId(req);
    const student = await getStudentById(studentId);

    res.render("students/instructor/create", {
      layout: "students/layout/studentLayout",
      title: "Request Instructor",
      form: {},
      student,
    });
  } catch (error) {
    errorHandler(res, error, "showCreateInstructorForm");
  }
};

export const createInstructorRequest = async (req, res) => {
  try {
    const { name, email, specialization, bio } = req.body;
    if (!name || !email || !specialization) {
      // Get student data
      const studentId = getStudentId(req);
      const student = await getStudentById(studentId);

      return res.render("students/instructor/create", {
        layout: "students/layout/studentLayout",
        title: "Request Instructor",
        error: "Please provide name, email and specialization.",
        form: req.body,
        student,
      });
    }

    // For now, we'll use createInstructor to actually create the instructor account.
    // In a production flow, this might instead create a request ticket.
    await createInstructor({ name, email, specialization, bio, password: "changeme123" });

    if (req.flash) req.flash("success", "Instructor request submitted successfully");
    res.redirect("/student/instructors");
  } catch (error) {
    console.error(error);
    if (req && req.flash) req.flash("error", "Failed to submit instructor request");
    errorHandler(res, error, "createInstructorRequest");
  }
};

export const viewInstructorDetail = async (req, res) => {
  try {
    const instructorId = req.params.id;
    const instructor = await getInstructorById(instructorId);
    
    // Get student data
    const studentId = getStudentId(req);
    const student = await getStudentById(studentId);
    
    if (!instructor) {
      return res.status(404).render("students/404", { 
        layout: "students/layout/studentLayout",
        message: "Instructor not found",
        student,
      });
    }

    res.render("students/instructor/detail", {
      layout: "students/layout/studentLayout",
      title: "Instructor Details",
      instructor,
      student,
    });
  } catch (error) {
    errorHandler(res, error, "viewInstructorDetail");
  }
};
