import React, { useState, useRef } from 'react';
import apiService from '../services/api';
import '../styles/DocumentUpload.css';
import { 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  X,
  File,
  Loader
} from 'lucide-react';

function DocumentUpload({ onUploadSuccess, onUploadError }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (selectedFile) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'application/json',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.json', '.csv', '.xls', '.xlsx'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(selectedFile.type) && 
        !allowedExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext))) {
      throw new Error('Please select a valid file (PDF, DOC, DOCX, TXT, MD, JSON, CSV, XLS, XLSX)');
    }

    if (selectedFile.size > maxSize) {
      throw new Error('File size must be less than 50MB');
    }

    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFile(selectedFile);
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    try {
      validateFile(selectedFile);
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    } catch (err) {
      setError(err.message);
      setFile(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const result = await apiService.uploadDocument(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(result);
      
      setTimeout(() => {
        setFile(null);
        setSuccess(null);
        setProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to upload document');
      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="document-upload">
      <div className="upload-card">
        <div className="upload-header">
          <h2>
            <Upload size={20} />
            Upload Document
          </h2>
          <p className="upload-subtitle">
            Upload documents to process and analyze with AI
          </p>
        </div>

        {success && (
          <div className="alert success">
            <CheckCircle size={20} />
            <div className="alert-content">
              <strong>Upload Successful!</strong>
              <p>{success.message || 'Your document is being processed and will be ready soon.'}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="alert error">
            <AlertCircle size={20} />
            <div className="alert-content">
              <strong>Upload Failed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div 
          className={`dropzone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xls,.xlsx"
            disabled={uploading}
            hidden
          />
          
          <div className="dropzone-content">
            {file ? (
              <div className="file-preview">
                <div className="file-icon">
                  <File size={40} />
                </div>
                <div className="file-info">
                  <div className="file-name" title={file.name}>
                    {file.name}
                  </div>
                  <div className="file-size">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <button 
                  className="btn-icon remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  disabled={uploading}
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <>
                <div className="upload-icon">
                  <Upload size={48} />
                </div>
                <div className="upload-text">
                  <h4>Drag & drop your file here</h4>
                  <p>or click to browse</p>
                </div>
                <div className="upload-hint">
                  Supports PDF, DOC, DOCX, TXT, MD, JSON, CSV, XLS, XLSX (Max 50MB)
                </div>
              </>
            )}
          </div>
        </div>

        {uploading && progress > 0 && (
          <div className="upload-progress">
            <div className="progress-header">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="upload-actions">
          <button
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="btn-secondary"
            disabled={uploading}
          >
            Browse Files
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary"
          >
            {uploading ? (
              <>
                <Loader size={16} className="spin" />
                Uploading...
              </>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>

        {uploading && (
          <div className="processing-state">
            <div className="processing-content">
              <div className="spinner"></div>
              <div className="processing-text">
                <p>Processing your document...</p>
                <small>This may take a moment depending on file size</small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentUpload;