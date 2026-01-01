import axios from 'axios';

const API_BASE_URL =  'http://localhost:5000/api';

const apiService = {
  // Upload document
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('document', file);

    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Query document
  queryDocument: async (documentId, query) => {
    const response = await axios.post(`${API_BASE_URL}/query`, {
      documentId,
      query,
    });

    return response.data;
  },

  // Get all documents
  getDocuments: async () => {
    const response = await axios.get(`${API_BASE_URL}/documents`);
    return response.data;
  },

  // Get document details
  getDocument: async (documentId) => {
    const response = await axios.get(`${API_BASE_URL}/documents/${documentId}`);
    return response.data;
  },

  // Delete document
  deleteDocument: async (documentId) => {
    const response = await axios.delete(`${API_BASE_URL}/documents/${documentId}`);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  },
};

export default apiService;