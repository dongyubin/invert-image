
// DOM elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadContent = document.getElementById('uploadContent'); // The initial drag/drop text and icon
const uploadedImagePreview = document.getElementById('uploadedImagePreview'); // New image preview in upload area
const clearUploadBtn = document.getElementById('clearUploadBtn'); // New clear button in upload area

const processingSection = document.getElementById('processingSection');
const resultSection = document.getElementById('resultSection');
const originalImg = document.getElementById('originalImage'); // Original image in result section
const canvas = document.getElementById('canvas');
const downloadBtn = document.getElementById('downloadBtn');
const newFileBtn = document.getElementById('newFileBtn');
const processBtn = document.getElementById('processBtn');
const originalImagePlaceholder = document.getElementById('originalImagePlaceholder');
const processedImagePlaceholder = document.getElementById('processedImagePlaceholder');

// Checkboxes for options
const invertCheck = document.getElementById('invertCheck');
const flipHorizontalCheck = document.getElementById('flipHorizontalCheck');
const flipVerticalCheck = document.getElementById('flipVerticalCheck');
const grayscaleCheck = document.getElementById('grayscaleCheck');

// Event listeners
fileInput.addEventListener('change', handleImageUpload);
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
processBtn.addEventListener('click', processImage);
downloadBtn.addEventListener('click', downloadResult);
newFileBtn.addEventListener('click', resetInterface);
clearUploadBtn.addEventListener('click', resetInterface); // Clear button in upload area also resets

// Function to update option card active state based on checkbox
document.querySelectorAll('.option-card').forEach(card => {
  const checkbox = card.querySelector('input[type="checkbox"]');
  // Set initial active state based on default checkbox state
  card.classList.toggle('active', checkbox.checked);

  card.addEventListener('click', function (e) {
    // Prevent toggling if the click target is the checkbox or its direct label
    if (e.target.tagName !== 'INPUT' && !e.target.closest('.checkbox-container')) {
      checkbox.checked = !checkbox.checked;
    }
    // Update active class immediately after checkbox state changes
    this.classList.toggle('active', checkbox.checked);
  });

  // Also listen to checkbox change directly for robustness (e.g., keyboard navigation)
  checkbox.addEventListener('change', function () {
    card.classList.toggle('active', this.checked);
  });
});

// Initial state: process button disabled, placeholders visible
processBtn.disabled = true;
originalImagePlaceholder.style.display = 'block';
processedImagePlaceholder.style.display = 'block';
canvas.style.display = 'none'; // Hide canvas initially
originalImg.style.display = 'none'; // Hide original image in result section initially

let originalImageSrc = ''; // To store the base64 URL of the original image

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file || !file.type.match('image.*')) {
    // If no file or invalid file, reset and return
    resetUploadAreaState();
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    originalImageSrc = e.target.result;

    // Update the preview in the upload area
    uploadedImagePreview.src = originalImageSrc;
    uploadedImagePreview.style.display = 'block';
    uploadContent.classList.add('hidden'); // Hide original upload content
    clearUploadBtn.style.display = 'block'; // Show clear button

    // Update the original image in the result section (hidden until resultSection is shown)
    originalImg.src = originalImageSrc;
    originalImg.style.display = 'block'; // Ensure it's ready when result section shows
    originalImagePlaceholder.style.display = 'none'; // Hide placeholder

    processBtn.disabled = false; // Enable process button

    // Hide result section if a new image is uploaded after processing
    resultSection.classList.add('section-hidden');
    canvas.style.display = 'none'; // Hide processed canvas
    processedImagePlaceholder.style.display = 'block'; // Show processed placeholder
  };
  reader.readAsDataURL(file);
}

function handleDragOver(e) {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
}

function handleDragLeave() {
  uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');

  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files; // Assign dropped files to input
    handleImageUpload({ target: fileInput }); // Trigger the handler
  }
}

// Process the image with selected options
function processImage() {
  if (!originalImageSrc) {
    alert('Please upload an image first!');
    return;
  }

  // Ensure canvas is visible and placeholder is hidden
  canvas.style.display = 'block';
  processedImagePlaceholder.style.display = 'none';

  const img = new Image();
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    // Clear canvas for new drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply flip transformations first
    ctx.save();

    // Apply horizontal flip
    if (flipHorizontalCheck.checked) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Apply vertical flip
    if (flipVerticalCheck.checked) {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    }

    // Draw the original image
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // Get image data for color processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply invert and grayscale
    for (let i = 0; i < data.length; i += 4) {
      // Apply invert colors
      if (invertCheck.checked) {
        data[i] = 255 - data[i]; // Red
        data[i + 1] = 255 - data[i + 1]; // Green
        data[i + 2] = 255 - data[i + 2]; // Blue
      }

      // Apply grayscale (luminance method for better visual accuracy)
      if (grayscaleCheck.checked) {
        const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        data[i] = avg;     // Red
        data[i + 1] = avg; // Green
        data[i + 2] = avg; // Blue
      }
    }

    // Put the processed image data back to canvas
    ctx.putImageData(imageData, 0, 0);

    // Show the result section
    resultSection.classList.remove('section-hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });
  };
  img.src = originalImageSrc;
}

// Download the result
function downloadResult() {
  if (!canvas.width || !canvas.height) {
    alert('No processed image to download!');
    return;
  }
  const link = document.createElement('a');
  link.download = 'processed-image.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Helper function to reset the upload area to its initial state
function resetUploadAreaState() {
  fileInput.value = ''; // Clear file input
  originalImageSrc = ''; // Clear stored image data

  uploadedImagePreview.src = ''; // Clear preview image src
  uploadedImagePreview.style.display = 'none'; // Hide preview image
  uploadContent.classList.remove('hidden'); // Show original upload content
  clearUploadBtn.style.display = 'none'; // Hide clear button

  processBtn.disabled = true; // Disable process button
}

// Reset interface (for "Process Another" or "Clear Image" button)
function resetInterface() {
  resetUploadAreaState(); // Reset upload area first

  originalImg.src = ''; // Clear original image in result section
  originalImg.style.display = 'none'; // Hide it
  originalImagePlaceholder.style.display = 'block'; // Show placeholder

  // Clear canvas
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 0; // Reset canvas dimensions
  canvas.height = 0;
  canvas.style.display = 'none'; // Hide canvas
  processedImagePlaceholder.style.display = 'block'; // Show processed placeholder

  resultSection.classList.add('section-hidden');

  // Reset checkboxes to default
  invertCheck.checked = true;
  flipHorizontalCheck.checked = false;
  flipVerticalCheck.checked = false;
  grayscaleCheck.checked = false;

  // Re-apply active state to option cards based on reset checkbox states
  document.querySelectorAll('.option-card').forEach(card => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    card.classList.toggle('active', checkbox.checked);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}