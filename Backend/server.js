const express = require('express');
const cors = require('cors');
const multer = require('multer'); 
require('dotenv').config();

const chromaService = require('./services/pineconeService');
const documentRoutes = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); 

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});


app.use('/api', documentRoutes);


app.get('/', (req, res) => {
  res.json({
    message: 'RAG System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      upload: 'POST /api/upload',
      query: 'POST /api/query',
      documents: 'GET /api/documents',
      document: 'GET /api/documents/:id',
      delete: 'DELETE /api/documents/:id'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);

 
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});


app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


async function startServer() {
  try {
    console.log('Initializing services...');


    await chromaService.initialize();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API documentation available at http://localhost:${PORT}\n`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}


process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

startServer();
