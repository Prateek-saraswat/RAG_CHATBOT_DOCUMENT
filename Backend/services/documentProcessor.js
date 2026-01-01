const fs = require('fs').promises;
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

class DocumentProcessor {
  constructor() {
   
    this.chunkSize = 600;          
    this.chunkOverlap = 100;
    this.MIN_CHUNK_LENGTH = 50;    
  }

  async extractText(filePath, fileType) {
    try {
      switch (fileType) {
        case 'application/pdf':
          return await this.extractFromPDF(filePath);

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractFromWord(filePath);

        case 'text/plain':
          return await this.extractFromText(filePath);

        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (err) {
      console.error('Text extraction failed:', err.message);
      throw err;
    }
  }

  async extractFromPDF(filePath) {
    const buffer = await fs.readFile(filePath);

    const data = await pdf(buffer, {
      max: 0,
      normalizeWhitespace: true,
      disableCombineTextItems: false
    });

    let text = data.text || '';

    text = text.replace(/\s+/g, ' ').trim();

    if (text.length < 100) {
      throw new Error('PDF text extraction failed or PDF is image-based');
    }

    return text;
  }

  async extractFromWord(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return (result.value || '').replace(/\s+/g, ' ').trim();
  }

  async extractFromText(filePath) {
    const text = await fs.readFile(filePath, 'utf-8');
    return text.replace(/\s+/g, ' ').trim();
  }

  *chunkGenerator(text) {
    let start = 0;
    const totalLength = text.length;

    while (start < totalLength) {
      let end = start + this.chunkSize;

      // Try sentence boundary
      if (end < totalLength) {
        const boundary =
          Math.max(
            text.lastIndexOf('. ', end),
            text.lastIndexOf('\n', end)
          );

        if (boundary > start + 100) {
          end = boundary + 1;
        }
      }

      const chunk = text.slice(start, end).trim();

      if (chunk.length >= this.MIN_CHUNK_LENGTH) {
        yield chunk;
      }

      start = end - this.chunkOverlap;
      if (start < 0) start = 0;
    }
  }

  async processDocument(filePath, fileType) {
    console.log(`Processing document: ${filePath}`);

    const text = await this.extractText(filePath, fileType);

    console.log(`Extracted ${text.length} characters`);

    return {
      chunkIterator: this.chunkGenerator(text),
      estimatedChunkCount: Math.ceil(text.length / this.chunkSize)
    };
  }
}

module.exports = new DocumentProcessor();
