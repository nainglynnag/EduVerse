## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- MySQL 8+ (or compatible)

### Installation

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/nainglynnag/EduVerse.git
   cd EduVerse
   npm install
   ```

2. Create a `.env` file in the project root and configure database access.

3. Set up the database and tables:

   ```sql
   -- Create Database
   CREATE DATABASE IF NOT EXISTS eduverse_db;
   USE eduverse_db;

   -- Roles Table
   CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE
   );

   INSERT IGNORE INTO roles (name) VALUES ('student'), ('instructor'), ('admin');

   -- Users Table
   CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role_id INT NOT NULL,
      status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
      joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
   );

   -- Student Plans Table
   CREATE TABLE IF NOT EXISTS student_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      description TEXT
   );

   -- Student Profiles Table
   CREATE TABLE IF NOT EXISTS student_profiles (
      user_id INT PRIMARY KEY,
      plan_id INT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES student_plans(id) ON DELETE SET NULL
   );

   -- Instructor Profiles Table
   CREATE TABLE IF NOT EXISTS instructor_profiles (
      user_id INT PRIMARY KEY,
      specialization VARCHAR(150),
      bio TEXT,
      rating DECIMAL(3,2) DEFAULT 0.00,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   );

   -- Categories Table
   CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      color_theme VARCHAR(20),
      description TEXT
   );

   -- Difficulty Levels Table
   CREATE TABLE IF NOT EXISTS difficulty_levels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      description TEXT
   );

   -- Courses Table
   CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      instructor_id INT NULL,
      category_id INT,
      difficulty_id INT,
      price DECIMAL(10,2) DEFAULT 0.00,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('published', 'draft') DEFAULT 'draft',
      FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (difficulty_id) REFERENCES difficulty_levels(id) ON DELETE SET NULL
   );

   -- Course Objectives Table
   CREATE TABLE course_objectives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    objective TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
   );

   -- Course Prerequisites Table
   CREATE TABLE course_prerequisites (
   id INT AUTO_INCREMENT PRIMARY KEY,
   course_id INT NOT NULL,
   prerequisite TEXT NOT NULL,
   FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
   );

   -- Course Lessons Table
   CREATE TABLE course_lessons (
   id INT AUTO_INCREMENT PRIMARY KEY,
   course_id INT NOT NULL,
   lesson_no INT NOT NULL, -- Chapter / Lesson order
   title VARCHAR(150) NOT NULL,
   duration_hours DECIMAL(5,2), -- e.g. 1.50 = 1.5 hours
   description TEXT,
   video_url VARCHAR(255), -- embed link
   FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
   UNIQUE (course_id, lesson_no) -- prevent duplicate lesson numbers per course
   );

   -- Enrollments Table
   CREATE TABLE IF NOT EXISTS enrollments (
   id INT AUTO_INCREMENT PRIMARY KEY,
   student_id INT NOT NULL,
   course_id INT NOT NULL,
   enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
   FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
   UNIQUE (student_id, course_id)
   );

   -- Lesson Progress Table
   CREATE TABLE lesson_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      lesson_id INT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMP NULL,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id, course_id) REFERENCES enrollments(student_id, course_id) ON DELETE CASCADE
   );

   -- Seed Data
   INSERT IGNORE INTO student_plans (name) VALUES ('Free'), ('Premium'), ('Pro');
   INSERT IGNORE INTO difficulty_levels (name) VALUES ('Beginner'), ('Intermediate'), ('Advanced');

   -- Student Profiles View Table
   CREATE VIEW student_profiles_view AS
   SELECT
      u.id,
      CONCAT('S', LPAD(u.id, 7, '0')) AS student_code,
      u.name,
      u.email,
      u.password_hash,
      u.status,
      u.joined_date,
      pl.name AS plan,
      pl.description AS plan_description,
      COUNT(DISTINCT e.course_id) AS total_courses,

      JSON_ARRAYAGG(
         JSON_OBJECT(
               'course_id', c.id,
               'title', c.title,
               'enrolled_at', e.enrolled_at,
               'progress_percent', IFNULL(progress.progress_percent, 0)
         )
      ) AS courses_details

   FROM student_profiles spf
   LEFT JOIN users u ON spf.user_id = u.id
   LEFT JOIN student_plans pl ON spf.plan_id = pl.id
   LEFT JOIN enrollments e ON u.id = e.student_id
   LEFT JOIN courses c ON e.course_id = c.id

   -- Subquery: progress per student/course
   LEFT JOIN (
      SELECT
         lp.student_id,
         lp.course_id,
         ROUND(COALESCE(cl.completed_lessons,0) / total.total_lessons * 100, 1) AS progress_percent
      FROM enrollments lp
      JOIN (
         SELECT course_id, COUNT(*) AS total_lessons
         FROM course_lessons
         GROUP BY course_id
      ) total ON total.course_id = lp.course_id
      LEFT JOIN (
         SELECT student_id, course_id, COUNT(*) AS completed_lessons
         FROM lesson_progress
         WHERE completed = TRUE
         GROUP BY student_id, course_id
      ) cl ON cl.student_id = lp.student_id AND cl.course_id = lp.course_id
   ) progress ON progress.student_id = u.id AND progress.course_id = c.id

   GROUP BY u.id, u.name, u.email, pl.name, pl.description;

   ```

4. Seed some sample data for quicker testing:

```sql

   INSERT INTO student_plans (name) VALUES ('Free'), ('Premium'), ('Pro');

   INSERT INTO difficulty_levels (name) VALUES ('Beginner'), ('Intermediate'), ('Advanced');

```

### Run the App

```bash
npm run start
```

The server runs at `http://localhost:3000`.

```

```
