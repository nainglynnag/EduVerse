import {
  getAllStudents as studentModelGetAll,
  getStudentById as studentModelGetById,
  createStudent as studentModelCreate,
  updateStudent as studentModelUpdate,
  deleteStudent as studentModelDelete,
} from "../models/studentModel.js";

const errorHandler = (res, error, operation, message = "Internal server error") => {
  console.error(`Controller error in ${operation}:`, error);
  if (res && !res.headersSent) res.status(500).send({ error: String(error), message });
};

export const listStudentsForStudentsArea = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";

    const { students, totalStudents } = await studentModelGetAll(page, limit, search);

    res.render("students/student/index", {
      layout: "students/layout/studentLayout",
      title: "Students",
      students,
      totalStudents,
    });
  } catch (error) {
    errorHandler(res, error, "listStudentsForStudentsArea");
  }
};

export const showCreateStudentFormForStudentsArea = (req, res) => {
  res.render("students/student/create", { layout: "students/layouts/layout", title: "Create Student", form: {} });
};

export const createStudentFromStudentsArea = async (req, res) => {
  try {
    await studentModelCreate(req.body);
    if (req.flash) req.flash('success', 'Student created');
    res.redirect('/students/students');
  } catch (error) {
    errorHandler(res, error, 'createStudentFromStudentsArea');
  }
};

export const showEditStudentFormForStudentsArea = async (req, res) => {
  try {
    const student = await studentModelGetById(req.params.id);
    if (!student) return res.status(404).render('admin/404', { message: 'Student not found' });
    res.render('students/student/update', { layout: 'admin/layouts/layout', student });
  } catch (error) {
    errorHandler(res, error, 'showEditStudentFormForStudentsArea');
  }
};

export const updateStudentFromStudentsArea = async (req, res) => {
  try {
    await studentModelUpdate(req.params.id, req.body);
    if (req.flash) req.flash('success', 'Student updated');
    res.redirect('/students/students');
  } catch (error) {
    errorHandler(res, error, 'updateStudentFromStudentsArea');
  }
};

export const deleteStudentFromStudentsArea = async (req, res) => {
  try {
    await studentModelDelete(req.params.id);
    if (req.flash) req.flash('success', 'Student deleted');
    res.redirect('/students/students');
  } catch (error) {
    errorHandler(res, error, 'deleteStudentFromStudentsArea');
  }
};

export const viewStudentDetailForStudentsArea = async (req, res) => {
  try {
    const student = await studentModelGetById(req.params.id);
    if (!student) return res.status(404).render('admin/404', { message: 'Student not found' });
    res.render('students/student/detail', { layout: 'admin/layouts/layout', student });
  } catch (error) {
    errorHandler(res, error, 'viewStudentDetailForStudentsArea');
  }
};
