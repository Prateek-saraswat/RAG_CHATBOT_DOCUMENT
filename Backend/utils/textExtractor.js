import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';



const extractPdfText = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};


const extractDocxText = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX');
  }
};


const extractText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    switch (ext) {
      case '.pdf':
        return await extractPdfText(filePath);
      
      case '.docx':
      case '.doc':
        return await extractDocxText(filePath);
      
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
};


const cleanText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\r\n/g, '\n') 
    .replace(/\n{3,}/g, '\n\n') 
    .replace(/\t/g, ' ') 
    .replace(/\s{2,}/g, ' ') 
    .trim();
};

export {
  extractText,
  extractPdfText,
  extractDocxText,
  cleanText
};