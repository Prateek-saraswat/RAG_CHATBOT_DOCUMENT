const axios = require('axios');
require('dotenv').config();

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.1:8b';

    this.MAX_CONTEXT_CHUNKS = 10;     
    this.MAX_CHUNK_LENGTH = 1200;
    this.REQUEST_TIMEOUT = 120000;
  }

  async generateResponse(query, contextChunks = []) {
    console.log(query , contextChunks)
    try {
      const safeContext = this.prepareContext(contextChunks);
      const prompt = this.buildPrompt(query, safeContext);

      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: this.model,
          prompt,
          stream: false
        },
        { timeout: this.REQUEST_TIMEOUT }
      );

      if (!response.data?.response) {
        throw new Error('Invalid response from Ollama');
      }

      return response.data.response.trim();
    } catch (error) {
      console.error('Ollama generation failed:', error.message);
      throw error;
    }
  }

  prepareContext(chunks = []) {
    if (!Array.isArray(chunks)) return [];

    return chunks
      .slice(0, this.MAX_CONTEXT_CHUNKS)
      .map(chunk =>
        chunk.length > this.MAX_CHUNK_LENGTH
          ? chunk.slice(0, this.MAX_CHUNK_LENGTH)
          : chunk
      );
  }

  buildPrompt(query, contextChunks) {
    console.log(query , contextChunks)
    const hasContext = contextChunks.length > 0;
    const contextText = contextChunks.join('\n\n---\n\n');

    return `
You are a friendly, intelligent AI assistant like ChatGPT.

Behavior rules:
- If the user greets (hi, hello, hey, good morning), respond politely.
- If the question is general knowledge or basic (not document-related), answer normally.
- If document context is provided, use it FIRST.
- If the document partially helps, combine document info with general knowledge.
- If the document does not contain the answer at all, answer using general knowledge and clearly say:
  "This answer is based on general knowledge, not the uploaded document."

${hasContext ? `Document Context:\n${contextText}` : ''}

User Question:
${query}

Answer clearly, naturally, and helpfully:
`.trim();
  }

  async checkStatus() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/tags`,
        { timeout: 5000 }
      );

      return {
        status: 'running',
        models: response.data?.models || []
      };
    } catch (error) {
      return {
        status: 'not running',
        error: error.message
      };
    }
  }
}

module.exports = new OllamaService();
