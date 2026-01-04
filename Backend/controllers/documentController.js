const { pool } = require('../config/database');
const documentProcessor = require('../services/documentProcessor');
const pineconeService = require('../services/pineconeService');
const ollamaService = require('../services/ollamaService');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

class DocumentController {

  //fuc for uploading docs or pdf files

  async uploadDocument(req, res) {
    let documentId = null;

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { filename, originalname, mimetype, size, path: filePath } = req.file;
      documentId = uuidv4();

      await pool.query(
        `INSERT INTO documents
         (id, filename, original_name, file_type, file_size, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [documentId, filename, originalname, mimetype, size, 'processing']
      );

      const { chunkIterator } =
        await documentProcessor.processDocument(filePath, mimetype);

      res.json({
        success: true,
        message: 'Document uploaded. Processing started.',
        documentId,
        filename : originalname,
        status: 'processing'
      });

      setImmediate(async () => {
        let chunkCount = 0;

        try {
          for (const chunk of chunkIterator) {
            await pineconeService.addSingleChunk(
              documentId,
              chunk,
              chunkCount
            );
            chunkCount++;
          }

          await pool.query(
            'UPDATE documents SET status = ?, chunk_count = ? WHERE id = ?',
            ['completed', chunkCount, documentId]
          );

          console.log(`Document processed: ${documentId} (${chunkCount} chunks)`);

        } catch (err) {
          console.error('Background processing failed:', err);

          await pool.query(
            'UPDATE documents SET status = ? WHERE id = ?',
            ['failed', documentId]
          );
        }
      });

    } catch (error) {
      console.error('Upload error:', error);

      if (documentId) {
        await pool.query(
          'UPDATE documents SET status = ? WHERE id = ?',
          ['failed', documentId]
        ).catch(() => {});
      }

      res.status(500).json({
        error: 'Failed to upload document',
        details: error.message
      });
    }
  }
  async queryDocument(req, res) {
    try {
      const { documentId, query } = req.body;

      if (!documentId || !query) {
        return res.status(400).json({
          error: 'Document ID and query are required'
        });
      }

      const [docs] = await pool.query(
        'SELECT status FROM documents WHERE id = ?',
        [documentId]
      );

      if (!docs.length || docs[0].status !== 'completed') {
        return res.status(400).json({
          error: 'Document is not ready yet'
        });
      }

      const { documents: chunks, distances } =
        await pineconeService.queryDocuments(documentId, query, 12);

      if (!chunks || chunks.length === 0) {
        return res.status(404).json({
          error: 'No relevant content found'
        });
      }

      const response =
        await ollamaService.generateResponse(query, chunks);

      await pool.query(
        `INSERT INTO queries (document_id, query_text, response_text)
         VALUES (?, ?, ?)`,
        [documentId, query, response]
      );

      res.json({
        query,
        response,
        sources: chunks.map((text, i) => ({
          text,
          relevance: 1 - (distances?.[i] ?? 0)
        }))
      });

    } catch (error) {
      console.error('Query error:', error);
      res.status(500).json({
        error: 'Failed to process query',
        details: error.message
      });
    }
  }

  async getDocuments(req, res) {
    try {
      const [documents] = await pool.query(
        `SELECT id, original_name, file_type, file_size,
                upload_date, status, chunk_count
         FROM documents
         ORDER BY upload_date DESC`
      );

      res.json({ documents });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }


  async getDocument(req, res) {
    try {
      const { id } = req.params;

      const [documents] = await pool.query(
        'SELECT * FROM documents WHERE id = ?',
        [id]
      );

      if (!documents.length) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const [queries] = await pool.query(
        `SELECT query_text, response_text, query_date
         FROM queries
         WHERE document_id = ?
         ORDER BY query_date DESC`,
        [id]
      );

      res.json({
        document: documents[0],
        queries
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }


  async deleteDocument(req, res) {
    try {
      const { id } = req.params;

      const [docs] = await pool.query(
        'SELECT filename FROM documents WHERE id = ?',
        [id]
      );

      if (!docs.length) {
        return res.status(404).json({ error: 'Document not found' });
      }

      await pineconeService.deleteDocument(id);
      await pool.query('DELETE FROM documents WHERE id = ?', [id]);

      const filePath =
        path.join(process.env.UPLOAD_DIR || './uploads', docs[0].filename);

      await fs.unlink(filePath).catch(() => {});

      res.json({ message: 'Document deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }


  async healthCheck(req, res) {
    try {
      await pool.query('SELECT 1');
      const ollama = await ollamaService.checkStatus();

      res.json({
        status: 'healthy',
        services: {
          mysql: 'connected',
          pinecone: 'connected',
          ollama: ollama.status
        }
      });
    } catch (err) {
      res.status(500).json({
        status: 'unhealthy',
        error: err.message
      });
    }
  }
}

module.exports = new DocumentController();
