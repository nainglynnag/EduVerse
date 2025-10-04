import db from '../config/db.js';

// Error Handler
const errorHandler = (error, operation, dataFailed) => {
  console.error(`Database operation failed in ${operation}:`, error);
  throw new Error(`Could not ${dataFailed} data.`);
};

export const getAllStudents = async (page = 1, limit = 10, search = '') => {
  try {
    const offset = (Number(page) - 1) * Number(limit);

    let where = '';
    const params = [];
    if (search && String(search).trim() !== '') {
      where = `WHERE name LIKE ? OR email LIKE ? OR course LIKE ?`;
      const q = `%${String(search).trim()}%`;
      params.push(q, q, q);
    }

    const [students] = await db
      .promise()
      .query(`SELECT id, name, email, course, createdAt FROM users ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...params, Number(limit), Number(offset)]);

    const [countRows] = await db
      .promise()
      .query(`SELECT COUNT(*) AS total FROM users ${where}`, params);

    const totalStudents = countRows[0]?.total || 0;

    return { students, totalStudents };
  } catch (error) {
    errorHandler(error, 'getAllStudents', 'retrieve all students');
  }
};

export const getStudentById = async (id) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT id, name, email, course, createdAt FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    errorHandler(error, 'getStudentById', 'retrieve student');
  }
};

export const getStudentByEmail = async (email) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT id, name, email, course, createdAt FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  } catch (error) {
    errorHandler(error, 'getStudentByEmail', 'retrieve student by email');
  }
};

export const createStudent = async (data) => {
  try {
    const { name, email, course } = data;
    const [result] = await db
      .promise()
      .query(`INSERT INTO users (name, email, course, role_id, createdAt) VALUES (?, ?, ?, ?, ?)`, [
        name,
        email,
        course,
        1, // assuming role_id 1 == student
        new Date(),
      ]);

    // return the new record
    const id = result.insertId;
    return await getStudentById(id);
  } catch (error) {
    errorHandler(error, 'createStudent', 'create student');
  }
};

export const updateStudent = async (id, updates) => {
  try {
    const fields = [];
    const params = [];
    if (updates.name !== undefined) {
      fields.push('name = ?');
      params.push(updates.name);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      params.push(updates.email);
    }
    if (updates.course !== undefined) {
      fields.push('course = ?');
      params.push(updates.course);
    }

    if (fields.length === 0) return await getStudentById(id);

    params.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await db.promise().query(sql, params);

    return await getStudentById(id);
  } catch (error) {
    errorHandler(error, 'updateStudent', 'update student');
  }
};

export const deleteStudent = async (id) => {
  try {
    const [rows] = await db.promise().query(`SELECT id FROM users WHERE id = ? LIMIT 1`, [id]);
    if (!rows[0]) return null;

    await db.promise().query(`DELETE FROM users WHERE id = ?`, [id]);
    return { id: Number(id) };
  } catch (error) {
    errorHandler(error, 'deleteStudent', 'delete student');
  }
};

export default {
  getAllStudents,
  getStudentById,
  getStudentByEmail,
  createStudent,
  updateStudent,
  deleteStudent,
};
