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
   CREATE DATABASE <your DB_NAME>;
   USE <your DB_NAME>;

   -- Tables
   CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
   );
   ```

INSERT INTO roles (name) VALUES ('student'), ('instructor'), ('admin');

CREATE TABLE users (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(150) UNIQUE NOT NULL,
password_hash VARCHAR(255) NOT NULL,
role_id INT NOT NULL,
status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE student_plans (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(50) NOT NULL UNIQUE,
description TEXT
);

CREATE TABLE student_profiles (
user_id INT PRIMARY KEY,
plan_id INT,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (plan_id) REFERENCES student_plans(id) ON DELETE SET NULL
);

CREATE TABLE instructor_profiles (
user_id INT PRIMARY KEY,
specialization VARCHAR(150),
bio TEXT,
rating DECIMAL(3,2) DEFAULT 0.00,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE categories (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL,
color_theme VARCHAR(20),
description TEXT
);

CREATE TABLE difficulty_levels (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(50) NOT NULL UNIQUE,
description TEXT
);

CREATE TABLE courses (
id INT AUTO_INCREMENT PRIMARY KEY,
title VARCHAR(150) NOT NULL,
instructor_id INT NULL, -- Nullable now
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

CREATE TABLE enrollments (
id INT AUTO_INCREMENT PRIMARY KEY,
student_id INT NOT NULL,
course_id INT NOT NULL,
enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
UNIQUE (student_id, course_id)
);

````

4. Seed some sample data for quicker testing:

   ```sql

INSERT INTO student_plans (name) VALUES ('Free'), ('Premium'), ('Pro');

INSERT INTO difficulty_levels (name) VALUES ('Beginner'), ('Intermediate'), ('Advanced');
   `
````

### Run the App

```bash
npm run start
```

The server runs at `http://localhost:3000`.
