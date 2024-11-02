const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import the file system module

const app = express();
const PORT = 8080; // Use port 8080

// Middleware to serve static files from the current directory
app.use(express.static(path.join(__dirname))); // Serve static files

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the upload directory
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Preserve the original filename
    }
});

const upload = multer({ storage: storage });

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sample clipboard history data
let clipboardHistory = [];
let fileHistory = [];

// Endpoint for uploading files
app.post('/upload', upload.single('file'), (req, res) => {
    fileHistory.unshift(req.file.originalname); // Add to file history at the top
    res.send({ message: 'File uploaded successfully!', filename: req.file.originalname });
});

// Endpoint to save clipboard data
app.post('/clipboard', (req, res) => {
    const { text } = req.body;
    clipboardHistory.unshift(text); // Add to history at the top
    res.sendStatus(200);
});

// Endpoint to retrieve clipboard history
app.get('/clipboard/history', (req, res) => {
    res.json({ history: clipboardHistory });
});

// Endpoint to retrieve file history
app.get('/files', (req, res) => {
    res.json({ files: fileHistory });
});

// Endpoint to remove uploaded files
app.delete('/files/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', fileName);
    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).send('Failed to delete file');
        }
        fileHistory = fileHistory.filter(file => file !== fileName); // Remove file from history
        res.sendStatus(200); // OK response
    });
});

// Endpoint to clear clipboard history
app.delete('/clipboard/history', (req, res) => {
    clipboardHistory = []; // Clear the history
    res.sendStatus(200); // OK response
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});