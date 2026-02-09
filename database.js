const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database('tasks.db');

function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        dueDate DATE NOT NULL,
        subject TEXT,
        priority TEXT DEFAULT 'medium',
        completed BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  });
}

function createUser(firstName, lastName, email, username, password) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (firstName, lastName, email, username, password) VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, email, username, password],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, firstName, lastName, email, username FROM users WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function createTask(userId, title, description, dueDate, subject, priority) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO tasks (userId, title, description, dueDate, subject, priority) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, description, dueDate, subject, priority || 'medium'],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getTasksByUserId(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM tasks WHERE userId = ? ORDER BY dueDate ASC`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

function getTaskById(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM tasks WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function updateTask(id, title, description, dueDate, subject, priority, completed) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tasks SET title = ?, description = ?, dueDate = ?, subject = ?, priority = ?, completed = ? WHERE id = ?`,
      [title, description, dueDate, subject, priority, completed ? 1 : 0, id],
      function(err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function deleteTask(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM tasks WHERE id = ?`, [id], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = {
  initializeDatabase,
  createUser,
  getUserById,
  getUserByUsername,
  createTask,
  getTasksByUserId,
  getTaskById,
  updateTask,
  deleteTask
};