import {
  getAllInstructors as adminGetAllInstructors,
  getAllInstructorsDetails,
  createInstructor as adminCreateInstructor,
} from "../models/adminModel.js";

const errorHandler = (res, error, operation, message = "Internal server error") => {
  console.error(`Controller error in ${operation}:`, error);
  if (res && !res.headersSent) res.status(500).send({ error: String(error), message });
};

export const listInstructors = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const search = req.query.search || "";

    // Reuse admin model to fetch instructors (admin model returns appropriate structure)
    const instructors = await adminGetAllInstructors(page, limit, search);

    res.render("students/instructor/index", {
      layout: "admin/layouts/layout",
      title: "Instructors",
      active: "instructors",
      instructors,
    });
  } catch (error) {
    errorHandler(res, error, "listInstructors");
  }
};

export const showCreateInstructorForm = async (req, res) => {
  try {
    res.render("students/instructor/create", {
      layout: "admin/layouts/layout",
      title: "Request Instructor",
      form: {},
    });
  } catch (error) {
    errorHandler(res, error, "showCreateInstructorForm");
  }
};

export const createInstructorRequest = async (req, res) => {
  try {
    const { name, email, specialization, bio } = req.body;
    if (!name || !email || !specialization) {
      return res.render("students/instructor/create", {
        layout: "admin/layouts/layout",
        title: "Request Instructor",
        error: "Please provide name, email and specialization.",
        form: req.body,
      });
    }

    // For now, we'll reuse adminCreateInstructor to actually create the instructor account.
    // In a production flow, this might instead create a request ticket.
    await adminCreateInstructor({ name, email, specialization, bio, password: "changeme123" });

    if (req.flash) req.flash("success", "Instructor request submitted successfully");
    res.redirect("/students/instructors");
  } catch (error) {
    console.error(error);
    if (req && req.flash) req.flash("error", "Failed to submit instructor request");
    errorHandler(res, error, "createInstructorRequest");
  }
};

export const viewInstructorDetail = async (req, res) => {
  try {
    const [instructor] = await getAllInstructorsDetails(req.params.id);
    if (!instructor) return res.status(404).render("admin/404", { message: "Instructor not found" });

    res.render("students/instructor/detail", {
      layout: "admin/layouts/layout",
      title: "Instructor",
      instructor,
    });
  } catch (error) {
    errorHandler(res, error, "viewInstructorDetail");
  }
};
