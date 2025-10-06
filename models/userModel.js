import db from "../config/db.js";

// Find a user by email
export const findUserByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows && rows.length ? rows[0] : null;
};

// Create a new user
export const createUser = async ({ name, email, password_hash, role_id }) => {
  const [result] = await db.query(
    "INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)",
    [name, email, password_hash, role_id]
  );

  return {
    id: result.insertId,
    name,
    email,
    password_hash,
    role_id,
  };
};