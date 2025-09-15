import dotenv from "dotenv";
import db from "../config/db.js";

dotenv.config();

// Get all published courses with category, difficulty, instructor, and enrollment information
export const getAllPublishedCourses = async () => {
  try {
    const query = `
      SELECT 
        c.*,
        cat.name as category_name,
        cat.description as category_description,
        cat.color_theme as category_color,
        dl.name as difficulty_name,
        dl.description as difficulty_description,
        u.name as instructor_name,
        u.email as instructor_email,
        COUNT(e.id) as enrollment_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN difficulty_levels dl ON c.difficulty_id = dl.id
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.status = 'published'
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    const [results] = await db.execute(query);
    return results || [];
  } catch (error) {
    console.error('Error fetching published courses:', error);
    throw error;
  }
};

export default db;
