import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { readFileSync } from 'fs';

// Get the directory where the executable is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read all files at build time
const files = {
    '/': readFileSync(join(__dirname, 'dist/index.html')),
    '/assets/index.js': readFileSync(join(__dirname, 'dist/assets/index.js')),
    '/assets/index.css': readFileSync(join(__dirname, 'dist/assets/index.css')),
    // Add other files as needed
};

const server = createServer((req, res) => {
    const file = files[req.url] || files['/'];
    
    if (file) {
        res.writeHead(200, {
            'Content-Type': getContentType(req.url)
        });
        res.end(file);
    } else {
        res.writeHead(404);
        res.end('File not found');
    }
});

function getContentType(path) {
    const ext = path.split('.').pop().toLowerCase();
    const types = {
        'html': 'text/html',
        'js': 'text/javascript',
        'css': 'text/css',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon'
    };
    return types[ext] || 'application/octet-stream';
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    // Open the default browser
    const url = `http://localhost:${PORT}`;
    const command = process.platform === 'win32' 
        ? `start ${url}`
        : process.platform === 'darwin'
            ? `open ${url}`
            : `xdg-open ${url}`;
    exec(command);
}); 