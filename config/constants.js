// Application Constants
export const APP_CONFIG = {
  // Database
  DB_CONFIG: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eduverse_db',
  },

  // Authentication (TODO: Replace with session-based auth)
  AUTH: {
    DEFAULT_INSTRUCTOR_ID: 4,
    DEFAULT_STUDENT_ID: 1,
  },

  // Layouts
  LAYOUTS: {
    INSTRUCTOR: 'instructors/layouts/layout',
    STUDENT: 'students/layouts/layout',
    ADMIN: 'admin/layouts/layout',
    DEFAULT: 'layouts/layout',
  },

  // Course Status
  COURSE_STATUS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
  },

  // User Roles
  USER_ROLES: {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin',
  },

  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // File Upload
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  // Database
  DB_CONNECTION_FAILED: 'Database connection failed',
  DB_OPERATION_FAILED: 'Database operation failed',
  
  // Authentication
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_CREDENTIALS: 'Invalid credentials',
  
  // Course
  COURSE_NOT_FOUND: 'Course not found',
  COURSE_CREATE_FAILED: 'Failed to create course',
  COURSE_UPDATE_FAILED: 'Failed to update course',
  COURSE_DELETE_FAILED: 'Failed to delete course',
  
  // Validation
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_INPUT: 'Invalid input data',
  
  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  COURSE_CREATED: 'Course created successfully',
  COURSE_UPDATED: 'Course updated successfully',
  COURSE_DELETED: 'Course deleted successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};
