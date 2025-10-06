// Middleware to check if user is authenticated as an instructor
// Authentication middleware to check if user is logged in
export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/signin?error=Please login to access this page');
  }
  next();
};

// Middleware to check if user is an instructor
export const requireInstructor = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/signin?error=Please login to access this page');
  }
  
  if (req.session.user.roleId !== 2) {
    return res.redirect('/signin?error=Access denied. Instructor access required.');
  }
  
  next();
};

// Middleware to check if user is a student
export const requireStudent = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/signin?error=Please login to access this page');
  }
  
  if (req.session.user.roleId !== 1) {
    return res.redirect('/signin?error=Access denied. Student access required.');
  }
  
  next();
};

// Middleware to check if user is an admin
export const requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/signin?error=Please login to access this page');
  }
  
  if (req.session.user.roleId !== 3) {
    return res.redirect('/signin?error=Access denied. Admin access required.');
  }
  
  next();
};

// Middleware to set user data in locals for templates
export const setUserData = (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.isInstructor = req.session.user?.roleId === 2;
  res.locals.isStudent = req.session.user?.roleId === 1;
  res.locals.isAdmin = req.session.user?.roleId === 3;
  next();
};
