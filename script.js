// Select elements
const clipboardInput = document.getElementById('clipboard');
const historyList = document.getElementById('history-list');
const fileList = document.getElementById('file-list');
const fileSizeLabel = document.getElementById('file-size');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const currentDate = document.getElementById('current-date');
const currentTime = document.getElementById('current-time');

// Function to update date and time
function updateDateTime() {
    const now = new Date();
    const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    currentDate.innerText = now.toLocaleDateString('en-US', dateOptions);
    currentTime.innerText = now.toLocaleTimeString('en-US');
}

// Function to save clipboard text
async function saveClipboard() {
    const text = clipboardInput.value;
    if (text) {
        await fetch('/clipboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        clipboardInput.value = ''; // Clear the input after saving
        loadClipboardHistory(); // Refresh the clipboard history
    }
}

// Function to load clipboard history
async function loadClipboardHistory() {
    const response = await fetch('/clipboard/history');
    const data = await response.json();
    historyList.innerHTML = '';
    data.history.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        historyList.appendChild(li);
    });
}

// Function to load file history
async function loadFileHistory() {
    const response = await fetch('/files');
    const data = await response.json();
    fileList.innerHTML = '';
    data.files.forEach(file => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="/uploads/${file}" download>${file}</a> <button onclick="removeFile('${file}')">Remove</button>`;
        fileList.appendChild(li);
    });
}

// Clear history function
async function clearHistory() {
    await fetch('/clipboard/history', { method: 'DELETE' });
    loadClipboardHistory(); // Refresh the history after clearing
}

// Function to remove uploaded files
async function removeFile(fileName) {
    const response = await fetch(`/files/${fileName}`, { method: 'DELETE' });
    if (response.ok) {
        loadFileHistory(); // Refresh the file history after removing
    } else {
        alert('Failed to remove file');
    }
}

// Event listener for saving clipboard on button click
document.getElementById('save-button').addEventListener('click', saveClipboard);

// Event listener for file size display
document.getElementById('file-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const size = file.size; // Size in bytes
        if (size < 1024) {
            fileSizeLabel.textContent = `Size: ${size} Bytes`;
        } else if (size < 1048576) {
            fileSizeLabel.textContent = `Size: ${(size / 1024).toFixed(2)} KB`;
        } else if (size < 1073741824) {
            fileSizeLabel.textContent = `Size: ${(size / 1048576).toFixed(2)} MB`;
        } else {
            fileSizeLabel.textContent = `Size: ${(size / 1073741824).toFixed(2)} GB`;
        }
    } else {
        fileSizeLabel.textContent = 'Size: 0 KB';
    }
});

// Event listener for uploading files
document.getElementById('upload-form').addEventListener('submit', async(event) => {
    event.preventDefault(); // Prevent default form submission
    const formData = new FormData();
    const fileInput = document.getElementById('file-input');
    formData.append('file', fileInput.files[0]);

    // Create a new XMLHttpRequest to handle the upload and progress
    const xhr = new XMLHttpRequest();

    // Set up the request
    xhr.open('POST', '/upload', true);

    // Update the progress bar during the upload
    xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            progressBar.style.width = percentComplete + '%';
            progressText.textContent = Math.round(percentComplete) + '%';
        }
    });

    // When upload is complete
    xhr.onload = () => {
        if (xhr.status === 200) {
            alert('File uploaded successfully!'); // Notify user of upload success
            loadFileHistory(); // Refresh the file history
            progressBar.style.width = '0%'; // Reset the progress bar
            progressText.textContent = '0%'; // Reset the text
        } else {
            alert('Upload failed!'); // Notify user of upload failure
        }
    };

    // Send the request with the file
    xhr.send(formData);
});

// Function to periodically load new entries
setInterval(() => {
    loadClipboardHistory(); // Check for new clipboard entries
    loadFileHistory(); // Check for new uploaded files
    updateDateTime(); // Update date and time
}, 1000); // Update every second

// Load the clipboard and file history when the page is loaded
loadClipboardHistory();
loadFileHistory();
updateDateTime(); // Set initial date and time

// Event listener for clearing clipboard history
document.getElementById('clear-history').addEventListener('click', clearHistory);