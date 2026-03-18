const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Authentication middleware
const authMiddleware = (req, res, next) => {
    // Simple token-based auth (in production, use proper JWT/session)
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== 'Bearer openclaw-dashboard-token') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Markdown files API
app.get('/api/md/files', authMiddleware, (req, res) => {
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

app.get('/api/md/read', authMiddleware, (req, res) => {
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

app.post('/api/md/write', authMiddleware, (req, res) => {
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
            timestamp: new Date().toISOString(),
            message: 'File saved successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to write markdown file' });
    }
});

// Routes
app.get('/', (req, res) => {
    const dashboardPath = '/root/.openclaw/workspace/dashboard.html';
    
    console.log('Trying to serve:', dashboardPath);
    console.log('File exists:', fs.existsSync(dashboardPath));
    
    if (fs.existsSync(dashboardPath)) {
        // Read file and send as HTML
        fs.readFile(dashboardPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                res.status(500).send('Error reading dashboard file');
            } else {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.send(data);
            }
        });
    } else {
        console.error('Dashboard file not found:', dashboardPath);
        res.status(404).send('Dashboard file not found');
    }
});

// API Routes for dashboard data
app.get('/api/status', authMiddleware, (req, res) => {
    try {
        // Get OpenClaw status
        try {
            const statusOutput = execSync('openclaw status', { encoding: 'utf8' });
            const uptimeOutput = execSync('uptime', { encoding: 'utf8' });
            const memoryOutput = execSync('free -h', { encoding: 'utf8' });
            
            res.json({
                openclaw: parseOpenClawStatus(statusOutput),
                system: {
                    uptime: uptimeOutput.trim(),
                    memory: memoryOutput.trim()
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.json({
                error: 'Failed to get system status',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/security', authMiddleware, (req, res) => {
    try {
        const firewallStatus = execSync('/usr/sbin/ufw status', { encoding: 'utf8' });
        const fail2banStatus = execSync('fail2ban-client status', { encoding: 'utf8' });
        
        res.json({
            firewall: firewallStatus.includes('Status: active'),
            fail2ban: fail2banStatus.includes('Status: active'),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get security status' });
    }
});

app.get('/api/logs', authMiddleware, (req, res) => {
    try {
        const logs = [];
        
        // Get Fail2Ban logs if available
        try {
            const fail2banLogs = execSync('tail -20 /var/log/fail2ban.log 2>/dev/null || echo "No logs found"', { encoding: 'utf8' });
            logs.push({
                source: 'fail2ban',
                content: fail2banLogs.trim()
            });
        } catch (e) {
            logs.push({
                source: 'fail2ban',
                content: 'No logs available'
            });
        }
        
        // Get auth logs
        try {
            const authLogs = execSync('tail -20 /var/log/auth.log 2>/dev/null || echo "No logs found"', { encoding: 'utf8' });
            logs.push({
                source: 'auth',
                content: authLogs.trim()
            });
        } catch (e) {
            logs.push({
                source: 'auth',
                content: 'No logs available'
            });
        }
        
        res.json({
            logs: logs,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get logs' });
    }
});

app.get('/api/system/info', authMiddleware, (req, res) => {
    try {
        const osInfo = execSync('uname -a', { encoding: 'utf8' });
        const cpuInfo = execSync('lscpu', { encoding: 'utf8' });
        const nodeVersion = execSync('node --version', { encoding: 'utf8' });
        const gitVersion = execSync('git --version', { encoding: 'utf8' });
        
        res.json({
            os: osInfo.trim(),
            cpu: cpuInfo,
            node: nodeVersion.trim(),
            git: gitVersion.trim(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get system info' });
    }
});

// Helper function to parse OpenClaw status
function parseOpenClawStatus(statusOutput) {
    const lines = statusOutput.split('\n');
    const status = {
        gateway: 'Unknown',
        dashboard: 'Unknown',
        agents: 'Unknown',
        sessions: 'Unknown',
        memory: 'Unknown'
    };
    
    lines.forEach(line => {
        if (line.includes('Gateway')) {
            status.gateway = line.includes('unreachable') ? 'Unreachable' : 'Online';
        }
        if (line.includes('Dashboard')) {
            const match = line.match(/Dashboard:\s*(.+)/);
            if (match) status.dashboard = match[1].trim();
        }
        if (line.includes('Agents')) {
            const match = line.match(/Agents:\s*(.+)/);
            if (match) status.agents = match[1].trim();
        }
        if (line.includes('Sessions')) {
            const match = line.match(/Sessions:\s*(.+)/);
            if (match) status.sessions = match[1].trim();
        }
        if (line.includes('Memory')) {
            const match = line.match(/Memory:\s*(.+)/);
            if (match) status.memory = match[1].trim();
        }
    });
    
    return status;
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 OpenClaw Dashboard running on port ${PORT}`);
    console.log(`📊 Access: http://localhost:${PORT}`);
    console.log(`🔐 Default login: admin / openclaw2024`);
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});