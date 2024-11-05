const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 4000;

mongoose.connect('mongodb+srv://imran:USZBOsb6wIvGUc4J@cluster0.kvkdxte.mongodb.net/portfolio?retryWrites=true&w=majority&appName=Cluster0').then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

const DataSchema = new mongoose.Schema({
  title: String,
  githubUrl: String,
  websiteLink: String,
  image: String,
});

const DataModel = mongoose.model('ProjectsData', DataSchema);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/data', upload.single('image'), async (req, res) => {
  const { title, githubUrl, websiteLink } = req.body;
  const image = req.file ? req.file.path : null;

  if (!title || !githubUrl || !websiteLink || !image) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const newData = new DataModel({
      title,
      githubUrl,
      websiteLink,
      image,
    });

    await newData.save();
    res.status(201).json({ message: 'Data saved successfully!', data: newData });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save data.' });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    const data = await DataModel.find();
    res.json(data);
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ error: 'Failed to retrieve data.' });
  }
});

app.delete('/api/data', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    const result = await DataModel.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
