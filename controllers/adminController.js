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
  getAllStudents,
  getStudentDetails,
  getAllStudentPlans,
  createStudent,
  updateStudent,
  deleteStudent,
  getCourseDetails,
  updateCourse,
  deleteCourse,
  getAllInstructorsByParams,
  getAllCategoriesByParams,
} from "../models/adminModel.js";

// Error Handler
const errorHandler = (
  res,
  error,
  operation,
  message = "Internal server error",
) => {
  console.log(`Controller error in ${operation}: `, error);
  res.status(500).send({ error, message });
};

// Controllers for Courses
export const listCourses = async (req, res) => {
  try {
    // Pagination and search params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "all";
    const search = req.query.search || "";

    const { courses, totalCourses } = await getAllCourses(
      page,
      limit,
      status,
      search,
    );

    // Calculate total number of pages
    const totalPages = Math.ceil(totalCourses / limit);

    // console.log("totalCourses", totalCourses);
    // console.log("totalPages", totalPages);

    res.render("admin/courses/index", {
      layout: "admin/layouts/layout",
      active: "courses",
      title: "Courses",
      courses,
      totalCourses,
      currentPage: page,
      limit,
      totalPages,
      status,
      search,
    });
  } catch (error) {
    errorHandler(res, error, "listCourses", "Courses not found.");
  }
};

export const showCourseDetail = async (req, res) => {
  const [course] = await getCourseDetails(req.params.id);

  // console.log(course);

  // preprocess embed URL
  course.lessons.map((lesson, index) => {
    if (lesson.video_url.includes("youtube.com/watch?v=")) {
      const videoId = lesson.video_url.split("v=")[1];
      course.lessons[index].embed_url =
        `https://www.youtube.com/embed/${videoId}`;
    } else if (lesson.video_url.includes("youtu.be/")) {
      const videoId = lesson.video_url.split("youtu.be/")[1];
      course.lessons[index].embed_url =
        `https://www.youtube.com/embed/${videoId}`;
    } else {
      course.lessons[index].video_url;
    }
  });

  // console.log("course : ", course);

  try {
    // const course = await getCourseDetails(req.params.id);
    res.render("admin/courses/courseDetail", {
      layout: "admin/layouts/layout",
      active: "courses",
      title: "Courses",
      course,
    });
  } catch (error) {
    errorHandler(res, error, "showCourseDetail");
  }
};

export const showcreateCourseForm = async (req, res) => {
  try {
    const instructors = await getAllInstructors();
    const categories = await getAllCategories();
    const difficulties = await getAllDifficulties();
    // const statuses = ["published", "draft"];

    res.render("admin/courses/create", {
      layout: "admin/layouts/layout",
      active: "courses",
      title: "Courses",
      instructors,
      categories,
      difficulties,
    });
  } catch (error) {
    errorHandler(res, error, "showcreateCourseForm");
  }
};

export const createCourseHandler = async (req, res) => {
  try {
    // console.log(req.body);

    const {
      courseTitle,
      instructorId,
      courseCategory,
      courseDifficulty,
      coursePrice,
      courseDescription,
      status,
      courseObjectives,
      coursePrerequisites,
    } = req.body;

    // Helper to normalize multi-line Objectives and Prerequisites text into array items
    const parseList = (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value !== "string") return [];
      return value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/^[-•]\s*/, ""));
    };
    if (!courseTitle || !courseCategory || !courseDescription) {
      const instructors = await getAllInstructors();
      const categories = await getAllCategories();
      const difficulties = await getAllDifficulties();

      return res.render("admin/courses/create", {
        layout: "admin/layouts/layout",
        active: "courses",
        title: "Courses",
        instructors,
        categories,
        difficulties,
        error: "Please provide Basic Information of the course!",
        form: {
          courseTitle,
          instructorId,
          courseCategory,
          courseDifficulty,
          coursePrice,
          courseDescription,
          status,
          courseObjectives,
          coursePrerequisites,
        },
      });
    }

    // Normalize fields to arrays so drafts match publish format
    req.body.courseObjectives = parseList(courseObjectives);
    req.body.coursePrerequisites = parseList(coursePrerequisites);

    await createCourse(req.body);
    req.flash("success", "Successfully created course!");
    res.redirect("/admin/courses");
  } catch (error) {
    req.flash("error", "Failed to create course!");
    errorHandler(res, error, "createCourseHandler");
  }
};

export const showEditCourseForm = async (req, res) => {
  try {
    const instructors = await getAllInstructors();
    const categories = await getAllCategories();
    const difficulties = await getAllDifficulties();
    const [course] = await getCourseDetails(req.params.id);

    // console.log(course);

    res.render("admin/courses/update", {
      layout: "admin/layouts/layout",
      active: "courses",
      title: "Courses",
      instructors,
      categories,
      difficulties,
      form: { ...course },
    });
  } catch (error) {
    errorHandler(res, error, "showEditCourseForm");
  }
};

export const updateCourseHandler = async (req, res) => {
  try {
    const courseId = req.params.id;

    // Fetch select lists for potential re-render
    const [instructors, categories, difficulties, [current]] =
      await Promise.all([
        getAllInstructors(),
        getAllCategories(),
        getAllDifficulties(),
        getCourseDetails(courseId),
      ]);

    if (!current) {
      return res.status(404).send({ message: "Course not found" });
    }

    const {
      courseTitle,
      instructorId,
      courseCategory,
      courseDifficulty,
      coursePrice,
      courseDescription,
      status,
      courseObjectives,
      coursePrerequisites,
      lessonTitle,
      lessonDuration,
      lessonDescription,
      videoUrl,
    } = req.body;

    // Normalize helpers
    const toArray = (value) => {
      if (value === undefined || value === null) return [];
      if (Array.isArray(value)) return value;
      return [value];
    };
    const cleanString = (s) => (s == null ? "" : `${s}`.trim());
    const toNumberOrNull = (v) => {
      if (v === undefined || v === null || `${v}`.trim() === "") return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };

    // Submitted normalized
    const submitted = {
      title: cleanString(courseTitle),
      instructor_id: instructorId ? Number(instructorId) : null,
      category_id: courseCategory ? Number(courseCategory) : null,
      difficulty_id: courseDifficulty ? Number(courseDifficulty) : null,
      price:
        coursePrice !== undefined &&
        coursePrice !== null &&
        `${coursePrice}` !== ""
          ? Number(coursePrice)
          : 0,
      description: cleanString(courseDescription),
      status: status === "published" ? "published" : "draft",
      objectives: toArray(courseObjectives)
        .map((s) => cleanString(s))
        .filter((s) => s.length > 0),
      prerequisites: toArray(coursePrerequisites)
        .map((s) => cleanString(s))
        .filter((s) => s.length > 0),
      lessons: (() => {
        const titles = toArray(lessonTitle);
        const durations = toArray(lessonDuration);
        const descriptions = toArray(lessonDescription);
        const videos = toArray(videoUrl);
        const maxLen = Math.max(
          titles.length,
          durations.length,
          descriptions.length,
          videos.length,
        );
        const rows = [];
        for (let i = 0; i < maxLen; i++) {
          const t = cleanString(titles[i] || "");
          if (!t) continue; // require title to consider a lesson row
          rows.push({
            lesson_no: i + 1,
            title: t,
            duration_mins: toNumberOrNull(durations[i]),
            description: cleanString(descriptions[i] || ""),
            video_url: cleanString(videos[i] || ""),
          });
        }
        return rows;
      })(),
    };

    // Current normalized
    const currentNormalized = {
      title: cleanString(current.title),
      instructor_id: current.instructor_id
        ? Number(current.instructor_id)
        : null,
      category_id: current.category_id ? Number(current.category_id) : null,
      difficulty_id: current.difficulty_id
        ? Number(current.difficulty_id)
        : null,
      price:
        current.price !== undefined &&
        current.price !== null &&
        `${current.price}` !== ""
          ? Number(current.price)
          : 0,
      description: cleanString(current.description),
      status:
        cleanString(current.status) === "published" ? "published" : "draft",
      objectives: cleanString(current.objectives)
        .split("|")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      prerequisites: cleanString(current.prerequisites)
        .split("|")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      lessons: Array.isArray(current.lessons)
        ? current.lessons
            .slice()
            .sort((a, b) => a.lesson_no - b.lesson_no)
            .map((l, idx) => ({
              lesson_no: idx + 1,
              title: cleanString(l.title),
              duration_mins: toNumberOrNull(l.duration_mins),
              description: cleanString(l.description),
              video_url: cleanString(l.video_url),
            }))
        : [],
    };

    const arraysEqual = (a, b) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    };

    const lessonsEqual = (a, b) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        const la = a[i];
        const lb = b[i];
        if (
          la.title !== lb.title ||
          (la.duration_mins || null) !== (lb.duration_mins || null) ||
          la.description !== lb.description ||
          la.video_url !== lb.video_url
        ) {
          return false;
        }
      }
      return true;
    };

    const hasChanges =
      currentNormalized.title !== submitted.title ||
      currentNormalized.instructor_id !== submitted.instructor_id ||
      currentNormalized.category_id !== submitted.category_id ||
      currentNormalized.difficulty_id !== submitted.difficulty_id ||
      currentNormalized.price !== submitted.price ||
      currentNormalized.description !== submitted.description ||
      currentNormalized.status !== submitted.status ||
      !arraysEqual(currentNormalized.objectives, submitted.objectives) ||
      !arraysEqual(currentNormalized.prerequisites, submitted.prerequisites) ||
      !lessonsEqual(currentNormalized.lessons, submitted.lessons);

    if (!hasChanges) {
      return res.render("admin/courses/update", {
        layout: "admin/layouts/layout",
        active: "courses",
        title: "Courses",
        instructors,
        categories,
        difficulties,
        error: "No changes are detected.",
        form: {
          ...current,
          title: submitted.title,
          instructor_id: submitted.instructor_id,
          category_id: submitted.category_id,
          difficulty_id: submitted.difficulty_id,
          price: submitted.price,
          description: submitted.description,
          status: submitted.status,
          objectives: submitted.objectives.join(" | "),
          prerequisites: submitted.prerequisites.join(" | "),
          lessons:
            submitted.lessons.length > 0 ? submitted.lessons : current.lessons,
        },
      });
    }

    await updateCourse(courseId, submitted);
    req.flash("success", "Successfully updated course");
    res.redirect("/admin/courses");
  } catch (error) {
    req.flash("error", "Failed to update course");
    errorHandler(res, error, "updateCourseHandler");
  }
};

export const deleteCourseHandler = async (req, res) => {
  try {
    await deleteCourse(req.params.id);
    req.flash("success", "Successfully deleted course");
    res.redirect("/admin/courses");
  } catch (error) {
    req.flash("error", "Failed to delete course");
    errorHandler(res, error, "deleteCourseHandler");
  }
};

// Controllers for Instructors
export const listInstructors = async (req, res) => {
  try {
    // Pagination and search params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const { instructors, totalInstructors } = await getAllInstructorsByParams(
      page,
      limit,
      search,
    );

    // Calculate total number of pages
    const totalPages = Math.ceil(totalInstructors / limit);
    // console.log(instructors);

    res.render("admin/instructors/index", {
      layout: "admin/layouts/layout",
      active: "instructors",
      title: "Instructors",
      instructors,
      totalInstructors,
      currentPage: page,
      limit,
      totalPages,
      search,
    });
  } catch (error) {
    errorHandler(res, error, "listInstructors", "Instructors not found.");
  }
};

export const showInstructorDetail = async (req, res) => {
  try {
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
  } catch (error) {
    errorHandler(res, error, "showInstructorDetail");
  }
};

export const showCreateInstructorForm = (req, res) => {
  try {
    res.render("admin/instructors/create", {
      layout: "admin/layouts/layout",
      active: "instructors",
      title: "Instructors",
    });
  } catch (error) {
    errorHandler(res, error, "showCreateInstructorForm");
  }
};

export const createInstructorHandler = async (req, res) => {
  try {
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
    req.flash("success", "Successfully created instructor");
    res.redirect("/admin/instructors");
  } catch (error) {
    req.flash("error", "Failed to create instructor");
    errorHandler(res, error, "createInstructorHandler");
  }
};

export const showEditInstructorForm = async (req, res) => {
  try {
    const instructors = await getAllInstructorsDetails();
    const { user_id, name, email, specialization, bio } = instructors.find(
      (instructor) => {
        return instructor.user_id == req.params.id;
      },
    );
    // console.log(name, email, specialization, bio);

    res.render("admin/instructors/update", {
      layout: "admin/layouts/layout",
      active: "instructors",
      title: "Instructors",
      form: { user_id, name, email, specialization, bio },
    });
  } catch (error) {
    errorHandler(res, error, "showEditInstructorForm");
  }
};

export const updateInstructorHandler = async (req, res) => {
  try {
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

      req.flash("success", "Successfully updated instructor");
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
  } catch (error) {
    req.flash("error", "Failed to update instructor");
    errorHandler(res, error, "updateInstructorHandler");
  }
};

export const deleteInstructorHandler = async (req, res) => {
  try {
    const user_id = req.params.id;

    await deleteInstructor(user_id);
    req.flash("success", "Successfully deleted instructor");
    res.redirect("/admin/instructors");
  } catch (error) {
    req.flash("error", "Failed to delete instructor");
    errorHandler(res, error, "deleteInstructorHandler");
  }
};

// Controllers for Students
export const listStudents = async (req, res) => {
  try {
    // Pagination and search params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "all";
    const search = req.query.search || "";

    const { students, totalStudents } = await getAllStudents(
      page,
      limit,
      status,
      search,
    );

    // Calculate total number of pages
    const totalPages = Math.ceil(totalStudents / limit);

    // console.log(students);

    res.render("admin/students/index", {
      layout: "admin/layouts/layout",
      active: "students",
      title: "Students",
      students,
      totalStudents,
      currentPage: page,
      limit,
      totalPages,
      status,
      search,
    });
  } catch (error) {
    errorHandler(res, error, "listStudents", "Students not found.");
  }
};

export const showStudentDetails = async (req, res) => {
  try {
    const [student] = await getStudentDetails(req.params.id);
    // console.log(student);

    res.render("admin/students/studentDetail", {
      layout: "admin/layouts/layout",
      active: "students",
      title: "Students",
      student,
    });
  } catch (error) {
    errorHandler(res, error, "showStudentDetails", "Student data not found.");
  }
};

export const showCreateStudentForm = async (req, res) => {
  try {
    const studentPlans = await getAllStudentPlans();

    res.render("admin/students/create", {
      layout: "admin/layouts/layout",
      active: "students",
      title: "Students",
      studentPlans,
    });
  } catch (error) {
    errorHandler(res, error, "showCreateStudentForm");
  }
};

export const createStudentHandler = async (req, res) => {
  try {
    const { name, email, plan } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      const studentPlans = await getAllStudentPlans();

      return res.render("admin/students/create", {
        layout: "admin/layouts/layout",
        active: "students",
        title: "Students",
        studentPlans,
        error: "Please provide a valid email address.",
        form: { name, email, plan },
      });
    }

    await createStudent(req.body);
    req.flash("success", "Successfully created student");
    res.redirect("/admin/students");
  } catch (error) {
    req.flash("error", "Failed to create student");
    errorHandler(res, error, "createStudentHandler");
  }
};

export const showEditStudentForm = async (req, res) => {
  try {
    const [student] = await getStudentDetails(req.params.id);
    const studentPlans = await getAllStudentPlans();
    const statuses = ["active", "inactive", "suspended"];

    res.render("admin/students/update", {
      layout: "admin/layouts/layout",
      active: "students",
      title: "Students",
      studentPlans,
      statuses,
      form: { ...student },
    });
  } catch (error) {
    errorHandler(res, error, "showEditStudentForm");
  }
};

export const updateStudentHandler = async (req, res) => {
  try {
    const { name, email, password, plan, status } = req.body;
    const id = req.params.id;

    const studentPlans = await getAllStudentPlans();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      const statuses = ["active", "inactive", "suspended"];

      return res.render("admin/students/create", {
        layout: "admin/layouts/layout",
        active: "students",
        title: "Students",
        studentPlans,
        statuses,
        error: "Please provide a valid email address.",
        form: { id, name, email, plan, status },
      });
    }

    const [student] = await getStudentDetails(req.params.id);

    const currentPlanId = studentPlans.find(
      (plan) => plan.name.toLowerCase() === student.plan.toLowerCase(),
    ).id;

    const updates = {};
    if (student.name !== name) updates.name = name;
    if (student.email !== email) updates.email = email;
    if (password !== "") updates.password_hash = password;
    if (currentPlanId !== Number(plan)) updates.plan_id = Number(plan);
    if (student.status !== status) updates.status = status;

    if (Object.keys(updates).length > 0) {
      await updateStudent(id, updates);

      req.flash("success", "Successfully updated student");
    } else {
      const statuses = ["active", "inactive", "suspended"];

      return res.render("admin/students/update", {
        layout: "admin/layouts/layout",
        active: "students",
        title: "Students",
        studentPlans,
        statuses,
        error: "No changes are detected.",
        form: { id, name, email, plan, status },
      });
    }

    res.redirect("/admin/students");
  } catch (error) {
    req.flash("error", "Failed to update student");
    errorHandler(res, error, "updateStudentHandler");
  }
};

export const deleteStudentHandler = async (req, res) => {
  try {
    const id = req.params.id;
    await deleteStudent(id);
    req.flash("success", "Successfully deleted student account");
    res.redirect("/admin/students");
  } catch (error) {
    req.flash("error", "Failed to delete student account");
    errorHandler(res, error, "deleteStudentHandler");
  }
};

// Controllers for Categories
export const listCategories = async (req, res) => {
  try {
    // Pagination and search params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const { categories, totalCategories } = await getAllCategoriesByParams(
      page,
      limit,
      search,
    );

    const totalPages = Math.ceil(totalCategories / limit);
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
      totalCategories,
      currentPage: page,
      limit,
      totalPages,
      search,
    });
  } catch (error) {
    errorHandler(res, error, "listCategories", "Categories not found.");
  }
};

export const showCreateCategoryForm = (req, res) => {
  try {
    try {
      res.render("admin/categories/create", {
        layout: "admin/layouts/layout",
        active: "categories",
        title: "Categories",
      });
    } catch (error) {
      errorHandler(res, error, "showCreateCategoryForm");
    }
  } catch (error) {
    errorHandler(res, error, "showCreateCategoryForm");
  }
};

export const createCategoryHandler = async (req, res) => {
  try {
    // const newCategory = req.body;
    // console.log(newCategory);

    await createCategory(req.body);
    req.flash("success", "Successfully created category");
    res.redirect("/admin/categories");
  } catch (error) {
    req.flash("error", "Failed to create category");
    errorHandler(res, error, "createCategoryHandler");
  }
};

export const showEditCategoryForm = async (req, res) => {
  try {
    const categories = await getAllCategories();
    const { id, name, color_theme, description } = categories.find(
      (category) => {
        return category.id == req.params.id;
      },
    );
    // console.log(name, color_theme, description);

    const colorOptions = ["Blue", "Purple", "Green", "Yellow"];

    res.render("admin/categories/update", {
      layout: "admin/layouts/layout",
      active: "categories",
      title: "Categories",
      form: { id, name, color_theme, description },
      colorOptions,
    });
  } catch (error) {
    errorHandler(res, error, "showEditCategoryForm");
  }
};

export const updateCategoryHandler = async (req, res) => {
  try {
    const updatedCategory = req.body;

    const categories = await getAllCategories();
    const { id, name, color_theme, description } = categories.find(
      (category) => {
        return category.id == req.params.id;
      },
    );

    const colorOptions = ["Blue", "Purple", "Green", "Yellow"];
    const updates = {};

    if (updatedCategory.name !== name) updates.name = updatedCategory.name;
    if (updatedCategory.color.toLowerCase() !== color_theme.toLowerCase())
      updates.color_theme = updatedCategory.color.toLowerCase();
    if (updatedCategory.description !== description)
      updates.description = updatedCategory.description;

    if (Object.keys(updates).length > 0) {
      await updateCategory(id, updates);

      req.flash("success", "Successfully updated category");
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
  } catch (error) {
    req.flash("error", "Failed to update category");
    errorHandler(res, error, "updateCategoryHandler");
  }
};

export const deleteCategoryHandler = async (req, res) => {
  try {
    const id = req.params.id;

    await deleteCategory(id);
    req.flash("success", "Successfully deleted category");
    res.redirect("/admin/categories");
  } catch (error) {
    req.flash("error", "Failed to delete category");
    errorHandler(res, error, "deleteCategoryHandler");
  }
};

// Controllers for Admins
export const listAdmins = async (req, res) => {
  try {
    const users = await getAllAdmins();

    res.render("admin/adminUsers/index", {
      layout: "admin/layouts/layout",
      active: "admins",
      title: "Admins",
      users,
    });
  } catch (error) {
    errorHandler(res, error, "listAdmins", "Admins not found.");
  }
};

export const showCreateAdminForm = (req, res) => {
  try {
    res.render("admin/adminUsers/create", {
      layout: "admin/layouts/layout",
      active: "admins",
      title: "Admins",
    });
  } catch (error) {
    errorHandler(res, error, "showCreateAdminForm");
  }
};

export const createAdminHandler = async (req, res) => {
  try {
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
    req.flash("success", "Successfully created admin account");
    res.redirect("/admin/admins");
  } catch (error) {
    req.flash("error", "Failed to create admin account!");
    errorHandler(res, error, "createAdminHandler");
  }
};

export const showEditAdminForm = async (req, res) => {
  try {
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
  } catch (error) {
    errorHandler(res, error, "showEditAdminForm");
  }
};

export const updateAdminHandler = async (req, res) => {
  try {
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

      req.flash("success", "Successfully updated admin account");
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
  } catch (error) {
    req.flash("error", "Failed to update admin account!");
    errorHandler(res, error, "updateAdminHandler");
  }
};

export const deleteAdminHandler = async (req, res) => {
  try {
    const id = req.params.id;

    await deleteAdmin(id);
    req.flash("success", "Successfully deleted admin account");
    res.redirect("/admin/admins");
  } catch (error) {
    req.flash("error", "Failed to delete admin account!");
    errorHandler(res, error, "deleteAdminHandler");
  }
};
