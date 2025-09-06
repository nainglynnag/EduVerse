import {
  getAllCategories,
  getAllCourses,
  createCourse,
  getAllDifficulties,
  getAllInstructors,
  getAllInstructorsDetails,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../models/adminModel.js";

export const adminDashboard = (req, res) => {
  res.render("admin/dashboard/index", {
    layout: "admin/layouts/layout",
    active: "dashboard",
    title: "Dashboard",
  });
};

// Controllers for Courses
export const listCourses = async (req, res) => {
  const courses = await getAllCourses();
  res.render("admin/courses/index", {
    layout: "admin/layouts/layout",
    active: "courses",
    title: "Courses",
    courses,
  });
};

export const showcreateCourseForm = async (req, res) => {
  const instructors = await getAllInstructors();
  const categories = await getAllCategories();
  const difficulties = await getAllDifficulties();
  const statuses = ["published", "draft"];

  res.render("admin/courses/create", {
    layout: "admin/layouts/layout",
    active: "courses",
    title: "Courses",
    instructors,
    categories,
    difficulties,
    statuses,
  });
};

export const createCourseHandler = async (req, res) => {
  // console.log(req.body);
  await createCourse(req.body);
  res.redirect("/admin/courses");
};

// Controllers for Instructors
export const listInstructors = async (req, res) => {
  const instructors = await getAllInstructorsDetails();
  // console.log(instructors);

  res.render("admin/instructors/index", {
    layout: "admin/layouts/layout",
    active: "instructors",
    title: "Instructors",
    instructors,
  });
};

export const showInstructorDetail = async (req, res) => {
  const instructors = await getAllInstructorsDetails();
  const currentInstructor = instructors.find((instructor) => {
    return instructor.user_id == req.params.id;
  });
  // console.log(currentInstructor);

  res.render("admin/instructors/instructorDetail", {
    layout: "admin/layouts/layout",
    active: "instructors",
    title: "Instructors",
    currentInstructor,
  });
};

export const showCreateInstructorForm = (req, res) => {
  res.render("admin/instructors/create", {
    layout: "admin/layouts/layout",
    active: "instructors",
    title: "Instructors",
  });
};

export const createInstructorHandler = async (req, res) => {
  const { name, email, password, specialization, bio } = req.body;

  // simple server-side email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    // re-render form with a simple message in flash (if available) or inline
    return res.render("admin/instructors/create", {
      layout: "admin/layouts/layout",
      active: "instructors",
      title: "Instructors",
      error: "Please provide a valid email address.",
      // preserve previous values so user doesn't need to retype
      form: { name, email, password, specialization, bio },
    });
  }

  // console.log(req.body);
  await createInstructor(req.body);
  res.redirect("/admin/instructors");
};

export const showEditInstructorForm = async (req, res) => {
  const instructors = await getAllInstructorsDetails();
  const { user_id, name, email, specialization, bio } = instructors.find(
    (instructor) => {
      return instructor.user_id == req.params.id;
    }
  );
  // console.log(name, email, specialization, bio);

  res.render("admin/instructors/update", {
    layout: "admin/layouts/layout",
    active: "instructors",
    title: "Instructors",
    form: { user_id, name, email, specialization, bio },
  });
};

export const updateInstructorHandler = async (req, res) => {
  const { name, email, password, specialization, bio } = req.body;
  const user_id = req.params.id;

  // simple server-side email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    // re-render form with a simple message in flash (if available) or inline
    return res.render("admin/instructors/update", {
      layout: "admin/layouts/layout",
      active: "instructors",
      title: "Instructors",
      error: "Please provide a valid email address.",
      // preserve previous values so user doesn't need to retype
      form: { user_id, name, email, specialization, bio },
    });
  }

  // Checking if data is updated
  const instructors = await getAllInstructorsDetails();
  const currentInstructor = instructors.find((instructor) => {
    return instructor.user_id == user_id;
  });

  const updates = {};
  if (currentInstructor.name !== name) updates.name = name;
  if (currentInstructor.email !== email) updates.email = email;
  if (password !== "") updates.password_hash = password;
  if (currentInstructor.specialization !== specialization)
    updates.specialization = specialization;
  if (currentInstructor.bio !== bio) updates.bio = bio;

  // console.log(updates);

  if (Object.keys(updates).length > 0) {
    await updateInstructor(user_id, updates);
  } else {
    return res.render("admin/instructors/update", {
      layout: "admin/layouts/layout",
      active: "instructors",
      title: "Instructors",
      error: "No changes are detected",
      form: { user_id, name, email, specialization, bio },
    });
  }

  res.redirect("/admin/instructors");
};

export const deleteInstructorHandler = async (req, res) => {
  const user_id = req.params.id;

  await deleteInstructor(user_id);
  res.redirect("/admin/instructors");
};

// Controllers for Users
export const listStudents = (req, res) => {
  res.render("admin/students/index", {
    layout: "admin/layouts/layout",
    active: "students",
    title: "Students",
  });
};

export const createStudent = (req, res) => {
  res.render("admin/students/create", {
    layout: "admin/layouts/layout",
    active: "students",
    title: "Students",
  });
};

// Controllers for Categories
export const listCategories = async (req, res) => {
  const categories = await getAllCategories();
  // console.log(categories);

  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
  };

  res.render("admin/categories/index", {
    layout: "admin/layouts/layout",
    active: "categories",
    title: "Categories",
    categories,
    colorClasses,
  });
};

export const showCreateCategoryForm = (req, res) => {
  res.render("admin/categories/create", {
    layout: "admin/layouts/layout",
    active: "categories",
    title: "Categories",
  });
};

export const createCategoryHandler = async (req, res) => {
  // const newCategory = req.body;
  // console.log(newCategory);

  await createCategory(req.body);
  res.redirect("/admin/categories");
};

export const showEditCategoryForm = async (req, res) => {
  const categories = await getAllCategories();
  const { id, name, color_theme, description } = categories.find((category) => {
    return category.id == req.params.id;
  });
  // console.log(name, color_theme, description);

  const colorOptions = ["Blue", "Purple", "Green", "Yellow"];

  res.render("admin/categories/update", {
    layout: "admin/layouts/layout",
    active: "categories",
    title: "Categories",
    form: { id, name, color_theme, description },
    colorOptions,
  });
};

export const updateCategoryHandler = async (req, res) => {
  const updatedCategory = req.body;

  const categories = await getAllCategories();
  const { id, name, color_theme, description } = categories.find((category) => {
    return category.id == req.params.id;
  });

  const colorOptions = ["Blue", "Purple", "Green", "Yellow"];
  const updates = {};

  if (updatedCategory.name !== name) updates.name = updatedCategory.name;
  if (updatedCategory.color.toLowerCase() !== color_theme.toLowerCase())
    updates.color_theme = updatedCategory.color.toLowerCase();
  if (updatedCategory.description !== description)
    updates.description = updatedCategory.description;

  if (Object.keys(updates).length > 0) {
    await updateCategory(id, updates);
  } else {
    return res.render("admin/categories/update", {
      layout: "admin/layouts/layout",
      active: "categories",
      title: "Categories",
      error: "No changes are detected",
      form: { id, name, color_theme, description },
      colorOptions,
    });
  }

  res.redirect("/admin/categories");
};

export const deleteCategoryHandler = async (req, res) => {
  const id = req.params.id;

  await deleteCategory(id);
  res.redirect("/admin/categories");
};

// Controllers for Admins
export const listAdmins = async (req, res) => {
  const users = await getAllAdmins();

  res.render("admin/adminUsers/index", {
    layout: "admin/layouts/layout",
    active: "admins",
    title: "Admins",
    users,
  });
};

export const showCreateAdminForm = (req, res) => {
  res.render("admin/adminUsers/create", {
    layout: "admin/layouts/layout",
    active: "admins",
    title: "Admins",
  });
};

export const createAdminHandler = async (req, res) => {
  const { name, email } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.render("admin/adminUsers/create", {
      layout: "admin/layouts/layout",
      active: "admins",
      title: "Admins",
      error: "Invalid email address",
      form: { name, email },
    });
  }

  await createAdmin(req.body);
  res.redirect("/admin/admins");
};

export const showEditAdminForm = async (req, res) => {
  const users = await getAllAdmins();
  const { id, name, email } = users.find((user) => {
    return user.id == req.params.id;
  });

  res.render("admin/adminUsers/update", {
    layout: "admin/layouts/layout",
    active: "admins",
    title: "Admins",
    form: { id, name, email },
  });
};

export const updateAdminHandler = async (req, res) => {
  const { name, email, password } = req.body;
  const id = req.params.id;

  const users = await getAllAdmins();
  const currentAdmin = users.find((user) => {
    return user.id == id;
  });

  const updates = {};
  if (currentAdmin.name !== name) updates.name = name;
  if (currentAdmin.email !== email) updates.email = email;
  if (password !== "") updates.password_hash = password;

  if (Object.keys(updates).length > 0) {
    await updateAdmin(id, updates);
  } else {
    return res.render("admin/adminUsers/update", {
      layout: "admin/layouts/layout",
      active: "admins",
      title: "Admins",
      error: "No changes are detected",
      form: { id, name, email },
    });
  }

  res.redirect("/admin/admins");
};

export const deleteAdminHandler = async (req, res) => {
  const id = req.params.id;

  await deleteAdmin(id);
  res.redirect("/admin/admins");
};
