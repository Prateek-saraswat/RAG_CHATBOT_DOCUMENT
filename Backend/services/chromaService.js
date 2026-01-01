const { ChromaClient } = require('chromadb');
const axios = require('axios');
require('dotenv').config();

class ChromaService {
  constructor() {
    this.client = new ChromaClient({
      path: `http://${process.env.CHROMA_HOST || 'localhost'}:${process.env.CHROMA_PORT || 8000}`
    });

    this.collectionName = 'documents';
    this.collection = null;

    this.EMBED_DELAY_MS = 150;
  }

  async initialize() {
    this.collection = await this.client.getOrCreateCollection({
      name: this.collectionName,
      metadata: { 'hnsw:space': 'cosine' }
    });

    console.log('✓ ChromaDB collection initialized');
  }

  async generateEmbedding(text, { allowShort = false } = {}) {
    if (!text || text.trim().length === 0) {
      throw new Error('Empty text cannot be embedded');
    }

    if (!allowShort && text.trim().length < 20) {
      throw new Error('Chunk too small for embedding');
    }

    const response = await axios.post(
      `${process.env.OLLAMA_HOST}/api/embeddings`,
      {
        model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
        prompt: text
      },
      { timeout: 120000 }
    );

    if (!response.data?.embedding) {
      throw new Error('Invalid embedding response from Ollama');
    }

    return response.data.embedding;
  }

  async addSingleChunk(documentId, text, index) {
    if (!text || text.trim().length < 20) {
      console.log(` Skipping tiny chunk ${index}`);
      return;
    }

    const embedding = await this.generateEmbedding(text);

    await this.collection.add({
      ids: [`${documentId}_chunk_${index}`],
      embeddings: [embedding],
      documents: [text],
      metadatas: [{
        document_id: documentId,
        chunk_index: index
      }]
    });

    await this.sleep(this.EMBED_DELAY_MS);
  }
  async queryDocuments(documentId, queryText, topK = 10) {
    const queryEmbedding = await this.generateEmbedding(queryText, {
      allowShort: true 
    });

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: { document_id: documentId }
    });

    return {
      documents: results.documents?.[0] || [],
      distances: results.distances?.[0] || []
    };
  }

  async deleteDocument(documentId) {
    await this.collection.delete({
      where: { document_id: documentId }
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ChromaService();
