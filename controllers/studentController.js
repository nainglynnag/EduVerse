import Student from '../models/studentModel.js';
import {
  createCourse,
  getAllInstructors,
  getAllCategories,
  getAllDifficulties,
} from '../models/adminModel.js';

// Error Handler
const errorHandler = (res, error, operation, message = 'Internal server error') => {
  console.error(`Controller error in ${operation}:`, error);
  try {
    if (res && !res.headersSent) {
      res.status(500).send({ error: String(error), message });
    }
  } catch (e) {
    console.error('Failed to send error response:', e);
  }
};

// Get all students (with optional pagination & search)
export const getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = (req.query.search || '').trim();

    const filter = {};
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { email: re }, { course: re }];
    }

    const [students, totalStudents] = await Promise.all([
      Student.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Student.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalStudents / limit));

    res.render('admin/students/index', {
      layout: 'admin/layouts/layout',
      active: 'students',
      title: 'Students',
      students,
      totalStudents,
      currentPage: page,
      limit,
      totalPages,
      search,
    });
  } catch (error) {
    errorHandler(res, error, 'getAllStudents', 'Failed to retrieve students');
  }
};

// Get a single student by ID (show edit form)
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) {
      return res.status(404).render('admin/404', { message: 'Student not found' });
    }

    res.render('admin/students/update', {
      layout: 'admin/layouts/layout',
      active: 'students',
      title: 'Edit Student',
      form: student,
    });
  } catch (error) {
    errorHandler(res, error, 'getStudentById', 'Failed to retrieve student');
  }
};

// Create a new student
export const createStudent = async (req, res) => {
  try {
    const { name, email, course } = req.body;

    if (!name || !email || !course) {
      return res.render('admin/students/create', {
        layout: 'admin/layouts/layout',
        active: 'students',
        title: 'Create Student',
        error: 'Please provide name, email and course.',
        form: { name, email, course },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.render('admin/students/create', {
        layout: 'admin/layouts/layout',
        active: 'students',
        title: 'Create Student',
        error: 'Please provide a valid email address.',
        form: { name, email, course },
      });
    }

    const existing = await Student.findOne({ email }).lean();
    if (existing) {
      return res.render('admin/students/create', {
        layout: 'admin/layouts/layout',
        active: 'students',
        title: 'Create Student',
        error: 'A student with this email already exists.',
        form: { name, email, course },
      });
    }

    const newStudent = new Student({ name, email, course });
    await newStudent.save();

    if (req.flash) req.flash('success', 'Successfully created student');
    res.redirect('/admin/students');
  } catch (error) {
    if (req && req.flash) req.flash('error', 'Failed to create student');
    errorHandler(res, error, 'createStudent');
  }
};

// Update a student
export const updateStudent = async (req, res) => {
  try {
    const { name, email, course } = req.body;

    if (!name || !email || !course) {
      const student = await Student.findById(req.params.id).lean();
      return res.render('admin/students/update', {
        layout: 'admin/layouts/layout',
        active: 'students',
        title: 'Edit Student',
        error: 'Please provide name, email and course.',
        form: { ...student, name, email, course },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const student = await Student.findById(req.params.id).lean();
      return res.render('admin/students/update', {
        layout: 'admin/layouts/layout',
        active: 'students',
        title: 'Edit Student',
        error: 'Please provide a valid email address.',
        form: { ...student, name, email, course },
      });
    }

    const duplicate = await Student.findOne({ email, _id: { $ne: req.params.id } }).lean();
    if (duplicate) {
      const student = await Student.findById(req.params.id).lean();
      return res.render('admin/students/update', {
        layout: 'admin/layouts/layout',
        active: 'students',
        title: 'Edit Student',
        error: 'Another student with this email already exists.',
        form: { ...student, name, email, course },
      });
    }

    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      { name, email, course },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).render('admin/404', { message: 'Student not found' });
    }

    if (req.flash) req.flash('success', 'Successfully updated student');
    res.redirect('/admin/students');
  } catch (error) {
    if (req && req.flash) req.flash('error', 'Failed to update student');
    errorHandler(res, error, 'updateStudent');
  }
};

// Delete a student
export const deleteStudent = async (req, res) => {
  try {
    const removed = await Student.findByIdAndDelete(req.params.id).lean();
    if (!removed) {
      if (req.flash) req.flash('error', 'Student not found');
      return res.redirect('/admin/students');
    }

    if (req.flash) req.flash('success', 'Successfully deleted student');
    res.redirect('/admin/students');
  } catch (error) {
    if (req && req.flash) req.flash('error', 'Failed to delete student');
    errorHandler(res, error, 'deleteStudent');
  }
};

// Show create course form for students
export const showCreateCourseForm = async (req, res) => {
  try {
    const [instructors, categories, difficulties] = await Promise.all([
      getAllInstructors(),
      getAllCategories(),
      getAllDifficulties(),
    ]);

    res.render('students/course/create', {
      title: 'Create Course',
      instructors,
      categories,
      difficulties,
      form: {},
    });
  } catch (error) {
    errorHandler(res, error, 'showCreateCourseForm', 'Failed to load create course form');
  }
};

// Handle student course creation
export const createCourseHandler = async (req, res) => {
  try {
    // Reuse admin createCourse which handles objectives/prereqs/lessons and transaction
    await createCourse(req.body);

    if (req.flash) req.flash('success', 'Course created successfully');
    res.redirect('/students');
  } catch (error) {
    if (req && req.flash) req.flash('error', 'Failed to create course');
    // Re-render form with existing input
    try {
      const [instructors, categories, difficulties] = await Promise.all([
        getAllInstructors(),
        getAllCategories(),
        getAllDifficulties(),
      ]);
      res.render('students/course/create', {
        title: 'Create Course',
        instructors,
        categories,
        difficulties,
        error: String(error),
        form: req.body,
      });
    } catch (err) {
      errorHandler(res, err, 'createCourseHandler', 'Failed to render create form after error');
    }
  }
};
