const { Pinecone } = require("@pinecone-database/pinecone");
const axios = require("axios");
require("dotenv").config();

class PineconeService {
  constructor() {
    this.pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });

    this.indexName = process.env.PINECONE_INDEX_NAME;
    this.index = null;

    this.EMBED_DELAY_MS = 150;
  }


  async initialize() {
    this.index = this.pc.index(this.indexName);
    console.log("✓ Pinecone index connected");
  }


  async generateEmbedding(text, { allowShort = false } = {}) {
    if (!text || text.trim().length === 0) {
      throw new Error("Empty text cannot be embedded");
    }

    if (!allowShort && text.trim().length < 20) {
      throw new Error("Chunk too small for embedding");
    }

    const response = await axios.post(
      `${process.env.OLLAMA_HOST}/api/embeddings`,
      {
        model: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
        prompt: text
      },
      { timeout: 120000 }
    );

    if (!response.data?.embedding) {
      throw new Error("Invalid embedding response from Ollama");
    }
    console.log(response.data.embedding)
    return response.data.embedding;
  }


  async addSingleChunk(documentId, text, index) {
    if (!text || text.trim().length < 20) {
      console.log(`⚠️ Skipping tiny chunk ${index}`);
      return;
    }

    const embedding = await this.generateEmbedding(text);

    await this.index.upsert([
      {
        id: `${documentId}_chunk_${index}`,
        values: embedding,
        metadata: {
          document_id: documentId,
          chunk_index: index,
          text
        }
      }
    ]);

    await this.sleep(this.EMBED_DELAY_MS);
  }


  async queryDocuments(documentId, queryText, topK = 10) {
    const queryEmbedding = await this.generateEmbedding(queryText, {
      allowShort: true
    });

    const results = await this.index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: {
        document_id: documentId
      }
    });

    return {
      documents: results.matches.map(m => m.metadata.text),
      distances: results.matches.map(m => m.score)
    };
  }


  async deleteDocument(documentId) {
  try {
    console.log("Deleting vectors for document:", documentId);

    await this.index.delete({
      ids: [],
      deleteAll: false,
      filter: {
        document_id: documentId
      }
    });

  } catch (err) {
    console.error("Pinecone delete failed:", err.message);

  
  }
}


  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new PineconeService();
