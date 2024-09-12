const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');

// Set up express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files from the public folder
app.use(express.static('public'));

// Load the pre-trained TensorFlow model
let model;
(async () => {
    model = await tf.loadLayersModel('file://./model/model.json');
    console.log('Model loaded');
})();

// Function to process and classify an image
async function classifyImage(filePath) {
    const imageSize = 64;

    // Process the image: resize, grayscale, and normalize
    const imageBuffer = await sharp(filePath)
        .resize(imageSize, imageSize)
        .grayscale()
        .raw()
        .toBuffer();

    // Convert to a tensor
    const imageTensor = tf.tensor3d(new Uint8Array(imageBuffer), [imageSize, imageSize, 1], 'float32');
    const input = imageTensor.expandDims(0).div(255); // Add batch dimension and normalize

    // Perform prediction
    const prediction = model.predict(input);
    let score = prediction.dataSync()[0]; // Get the score (probability between 0 and 1)

    // Return score and label (porn or not porn)
score = scientificToDecimal(score);
  const label = score >= 0.587654 ?  'porn':'not porn';
    return { score, label };
}


function scientificToDecimal(scientific) {
  return parseFloat(scientific).toFixed(20); // adjust the toFixed value to change the decimal places
}
// Handle file upload and classification
app.post('/classify', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;

        // Classify the uploaded image
        const { score, label } = await classifyImage(filePath);

        // Delete the temp file after processing
        fs.unlinkSync(filePath);

        // Return the classification result (score and label)
        res.json({ score, label });
    } catch (err) {
        console.error('Error classifying image:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
