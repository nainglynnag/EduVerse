import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eduverse_db',
});

// Test the connection
db.getConnection()
  .then(connection => {
    console.log("MySQL is connected successfully ...");
    connection.release();
  })
  .catch(err => {
    console.error("Database connection failed:", err);
  });

export default db;
