const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Session middleware
app.use(session({
    secret: 'openclaw-dashboard-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};

// API Authentication middleware
const apiAuthMiddleware = (req, res, next) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};

// Serve login page
app.get('/', (req, res) => {
    if (req.session.isAuthenticated) {
        res.sendFile(path.join(__dirname, 'dashboard.html'));
    } else {
        res.sendFile(path.join(__dirname, 'login.html'));
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Simple authentication (in production, use database)
        if (username === 'admin' && password === 'openclaw2024') {
            req.session.isAuthenticated = true;
            req.session.user = { username: 'admin', role: 'admin' };
            
            res.json({ 
                success: true, 
                message: 'Login successful',
                user: { username: 'admin', role: 'admin' }
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Login failed' 
        });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Logout failed' });
        } else {
            res.json({ success: true, message: 'Logout successful' });
        }
    });
});

// Check auth status
app.get('/api/auth-status', (req, res) => {
    if (req.session.isAuthenticated) {
        res.json({ 
            authenticated: true, 
            user: req.session.user 
        });
    } else {
        res.json({ 
            authenticated: false 
        });
    }
});

// Protect dashboard routes
app.get('/dashboard.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Protect API routes
app.get('/api/md/files', apiAuthMiddleware, (req, res) => {
    try {
        const workspaceDir = '/root/.openclaw/workspace';
        const files = [];
        
        // Get markdown files from workspace (exclude node_modules)
        const mdFiles = execSync(`find ${workspaceDir} -maxdepth 2 -name "*.md" -type f ! -path "*/node_modules/*"`, { encoding: 'utf8' });
        
        if (mdFiles.trim()) {
            mdFiles.split('\n').forEach(file => {
                if (file.trim()) {
                    const stats = fs.statSync(file);
                    files.push({
                        path: file.replace(workspaceDir + '/', ''),
                        name: path.basename(file),
                        size: stats.size,
                        modified: stats.mtime,
                        fullPath: file
                    });
                }
            });
        }
        
        res.json({
            files: files.sort((a, b) => a.name.localeCompare(b.name)),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list markdown files' });
    }
});

app.get('/api/md/read', apiAuthMiddleware, (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }
        
        // Security: Only allow files within workspace directory
        const workspaceDir = '/root/.openclaw/workspace';
        const fullPath = path.join(workspaceDir, filePath);
        
        // Check if path is within workspace
        if (!fullPath.startsWith(workspaceDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Check if file exists and is markdown
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        if (!fullPath.endsWith('.md')) {
            return res.status(400).json({ error: 'Not a markdown file' });
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const stats = fs.statSync(fullPath);
        
        res.json({
            path: filePath,
            name: path.basename(fullPath),
            content: content,
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read markdown file' });
    }
});

app.post('/api/md/write', apiAuthMiddleware, (req, res) => {
    try {
        const { path: filePath, content } = req.body;
        
        if (!filePath || !content) {
            return res.status(400).json({ error: 'File path and content are required' });
        }
        
        // Security: Only allow files within workspace directory
        const workspaceDir = '/root/.openclaw/workspace';
        const fullPath = path.join(workspaceDir, filePath);
        
        // Check if path is within workspace
        if (!fullPath.startsWith(workspaceDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Ensure directory exists
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write file
        fs.writeFileSync(fullPath, content, 'utf8');
        
        const stats = fs.statSync(fullPath);
        
        res.json({
            path: filePath,
            name: path.basename(fullPath),
            size: stats.size,
            modified: stats.mtime,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to write markdown file' });
    }
});

// System info endpoint
app.get('/api/system/info', apiAuthMiddleware, (req, res) => {
    try {
        const cpuInfo = execSync('cat /proc/cpuinfo | grep "model name" | head -1 | cut -d: -f2', { encoding: 'utf8' }).trim();
        const memInfo = execSync('free -m | grep Mem | awk \'{print $2" "$3" "$4}\'', { encoding: 'utf8' }).trim().split(' ');
        const diskInfo = execSync('df -h / | awk \'NR==2{print $2" "$3" "$4" "$5}\'', { encoding: 'utf8' }).trim().split(' ');
        
        res.json({
            cpu: cpuInfo,
            memory: {
                total: parseInt(memInfo[0]),
                used: parseInt(memInfo[1]),
                free: parseInt(memInfo[2])
            },
            disk: {
                total: diskInfo[0],
                used: diskInfo[1],
                free: diskInfo[2],
                usage: diskInfo[3]
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get system info' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 OpenClaw Dashboard running on port ${PORT}`);
    console.log(`📊 Access: http://localhost:${PORT}`);
    console.log(`🔐 Default login: admin / openclaw2024`);
});