const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'your_secret_key_change_this',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));
db.initializeDatabase();

app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard.html');
    } else {
        res.redirect('/login.html');
    }
});

app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, username, password, confirmPassword } = req.body;
    if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    try {
        const existingUser = db.getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = db.createUser(firstName, lastName, email, username, hashedPassword);
        req.session.userId = userId;
        req.session.username = username;
        res.json({ success: true, message: 'Registration successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const user = db.getUserByUsername(username);
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ success: true, message: 'Login successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

app.get('/api/user', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = db.getUserById(req.session.userId);
    res.json(user);
});

app.post('/api/tasks', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const { title, description, dueDate, subject, priority } = req.body;
    if (!title || !dueDate) {
        return res.status(400).json({ error: 'Title and due date are required' });
    }
    try {
        const taskId = db.createTask(req.session.userId, title, description, dueDate, subject, priority);
        res.json({ success: true, taskId, message: 'Task created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/tasks', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const tasks = db.getTasksByUserId(req.session.userId);
        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/tasks/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const { id } = req.params;
    const { title, description, dueDate, subject, priority, completed } = req.body;
    try {
        const task = db.getTaskById(id);
        if (task.userId !== req.session.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        db.updateTask(id, title, description, dueDate, subject, priority, completed);
        res.json({ success: true, message: 'Task updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const { id } = req.params;
    try {
        const task = db.getTaskById(id);
        if (task.userId !== req.session.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        db.deleteTask(id);
        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
