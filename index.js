const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Folder where images will be saved
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Save file with unique name
  }
});

const upload = multer({ storage: storage });

// Middleware to parse JSON data (not necessary for multipart but kept for completeness)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper function to read/write JSON data
const getData = () => {
  if (fs.existsSync('data.json')) {
    const data = fs.readFileSync('data.json', 'utf-8');
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return []; // Return an empty array if JSON is invalid
    }
  }
  return [];
};

const saveData = (data) => {
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
};

// POST route to create a new entry
app.post('/api/data', upload.single('image'), (req, res) => {
  // Log the entire req.body to check the parsed fields
  console.log('req.body:', req.body); // Make sure to see the actual content

  const { title, githubUrl, websiteLink } = req.body;
  const image = req.file ? req.file.path : null;

  if (!title || !githubUrl || !websiteLink || !image) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const newData = {
    id: Date.now(),
    title,
    githubUrl,
    websiteLink,
    image
  };

  const data = getData();
  data.push(newData);
  saveData(data);

  res.status(201).json({ message: 'Data saved successfully!', data: newData });
});

// GET route to retrieve all entries
app.get('/api/data', (req, res) => {
  const data = getData();
  res.json(data);
});

app.delete('/api/data', (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  const data = getData();
  const newData = data.filter(item => item.id !== id);

  if (data.length === newData.length) {
    return res.status(404).json({ error: 'Item not found' });
  }

  saveData(newData);
  res.status(200).json({ message: 'Item deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
