import * as pdfjsLib from '/lib/pdfjs/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/lib/pdfjs/pdf.worker.mjs';

let pdf = null;
let currentPage = 1;
let totalPages = 0;

function renderPage(pageNumber) {
    const container = document.getElementById('pdfViewer');
    container.innerHTML = ''; // Clear previous content

    pdf.getPage(pageNumber).then((page) => {
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderTask = page.render({
            canvasContext: context,
            viewport: viewport,
        });

        renderTask.promise.then(() => {
            console.log(`Page ${pageNumber} rendered`);
            document.getElementById('currentPage').textContent = currentPage;
        });
    });
}

function loadPdf(url) {
    const container = document.getElementById('pdfViewer');
    container.innerHTML = 'Loading...'; // Display loading message

    const loadingTask = pdfjsLib.getDocument(url);
    loadingTask.promise
        .then((loadedPdf) => {
            pdf = loadedPdf;
            totalPages = pdf.numPages;
            document.getElementById('totalPages').textContent = totalPages;
            renderPage(currentPage);
        })
        .catch((error) => {
            console.error('Error loading PDF:', error);
            alert('Failed to load PDF.');
        });
}

// Event listeners for navigation
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage <= 1) return;
    currentPage--;
    renderPage(currentPage);
});

document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage >= totalPages) return;
    currentPage++;
    renderPage(currentPage);
});

// Handle file upload and pass the path to loadPdf
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a PDF file.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/file/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            alert('File upload failed.');
            return;
        }

        const data = await response.json();
        loadPdf(data.path);
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('An error occurred while uploading the file.');
    }
});
