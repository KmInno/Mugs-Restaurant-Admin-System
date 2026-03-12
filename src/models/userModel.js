const initializeDatabase = require('../config/db');
const bcrypt = require('bcrypt');

async function findUserByEmail(email) {
  const db = await initializeDatabase();
  console.log("Fetching user by email:", email);
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    console.log("Database response for findUserByEmail:", rows);
    return rows;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
};

async function createUser(name, email, password, role) {
  const db = await initializeDatabase();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
    const [results] = await db.execute(sql, [name, email, hashedPassword, role]);

    return results;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function getAccountByEmail(email) {
  const db = await initializeDatabase();
  console.log("Fetching account by email:", email);
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    console.log("Database response for getAccountByEmail:", rows);
    return rows;
  }
  catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }

}

async function getAccountById(id) {
  const db = await initializeDatabase();
  console.log("Fetching account by ID:", id);
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    console.log("Database response for getAccountById:", rows);
    return rows;
  }

  catch (error) {
    console.error('Error fetching user by id:', error);
    throw error;
  }
}

async function getAllUsers() {
  const db = await initializeDatabase();
  try {
    const [rows] = await db.execute('SELECT id, name, email, role FROM users ORDER BY id DESC');
    return rows;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
}

async function deleteUser(userId) {
  const db = await initializeDatabase();
  try {
    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    return result;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

module.exports = { findUserByEmail, createUser, getAccountByEmail, getAccountById, getAllUsers, deleteUser };