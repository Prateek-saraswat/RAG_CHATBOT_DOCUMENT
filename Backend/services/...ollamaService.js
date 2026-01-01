const axios = require('axios');
require('dotenv').config();

class OllamaService {
  constructor() {
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.apiKey = process.env.GROQ_API_KEY;

    this.model = process.env.OLLAMA_MODEL || 'llama-3.1-8b-instant';

    this.MAX_CONTEXT_CHUNKS = 10;
    this.MAX_CHUNK_LENGTH = 1200;
    this.REQUEST_TIMEOUT = 120000;
  }

  async generateResponse(query, contextChunks = []) {
    try {
      const safeContext = this.prepareContext(contextChunks);
      const messages = this.buildMessages(query, safeContext);

      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages,
          temperature: 0.3
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.REQUEST_TIMEOUT
        }
      );

      return response.data.choices[0].message.content.trim();

    } catch (error) {
      console.error(
        'LLM generation failed:',
        error.response?.data || error.message
      );
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

  buildMessages(query, contextChunks) {
    const hasContext = contextChunks.length > 0;

    const systemPrompt = `
You are a friendly, intelligent AI assistant like ChatGPT.

Rules:
- Respond naturally to greetings (hi, hello, hey).
- Answer general knowledge questions normally.
- If document context exists, use it FIRST.
- If partially relevant, combine document info + general knowledge.
- If not relevant, answer using general knowledge and clearly say:
  "This answer is based on general knowledge, not the uploaded document."
`;

    const messages = [
      { role: 'system', content: systemPrompt.trim() }
    ];

    if (hasContext) {
      messages.push({
        role: 'system',
        content: `Document Context:\n${contextChunks.join('\n\n---\n\n')}`
      });
    }

    messages.push({
      role: 'user',
      content: query
    });

    return messages;
  }

  async checkStatus() {
    return {
      status: 'running',
      provider: 'groq',
      model: this.model
    };
  }
}

module.exports = new OllamaService();
