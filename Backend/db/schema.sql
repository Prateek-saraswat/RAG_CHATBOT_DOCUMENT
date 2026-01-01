-- DO NOT CREATE DATABASE IN RAILWAY

DROP TABLE IF EXISTS queries;
DROP TABLE IF EXISTS documents;

CREATE TABLE documents (
  id VARCHAR(36) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(150) NOT NULL,
  file_size INT NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
  chunk_count INT DEFAULT 0
);

CREATE TABLE queries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id VARCHAR(36) NOT NULL,
  query_text TEXT NOT NULL,
  response_text TEXT,
  query_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_queries_document_id ON queries(document_id);


