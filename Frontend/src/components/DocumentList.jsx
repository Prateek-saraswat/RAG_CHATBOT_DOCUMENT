import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../services/api';
import '../styles/DocumentList.css';
import { 
  FileText, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  Search,
  Calendar,
  HardDrive,
  Hash,
  File,
  ChevronRight,
  Check,
  X
} from 'lucide-react';

function DocumentList({ onSelectDocument, selectedDocument, viewMode = 'compact' }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0,
    totalSize: 0
  });
  const [isGridView, setIsGridView] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const result = await apiService.getDocuments();
      setDocuments(result.documents || []);
      calculateStats(result.documents || []);
      setError(null);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (docs) => {
    const newStats = {
      total: docs.length,
      completed: 0,
      processing: 0,
      failed: 0,
      totalSize: 0
    };

    docs.forEach(doc => {
      newStats.totalSize += doc.file_size || 0;
      if (doc.status === 'completed') newStats.completed++;
      if (doc.status === 'processing') newStats.processing++;
      if (doc.status === 'failed') newStats.failed++;
    });

    setStats(newStats);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (documentId) => {
    try {
      await apiService.deleteDocument(documentId);
      
      if (selectedDocument?.id === documentId) {
        onSelectDocument(null);
      }
      
      fetchDocuments();
      setShowDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete document');
      console.error('Delete error:', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        icon: <CheckCircle size={14} />,
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        label: 'Ready'
      },
      processing: {
        icon: <Clock size={14} />,
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        label: 'Processing'
      },
      failed: {
        icon: <XCircle size={14} />,
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        label: 'Failed'
      }
    };
    return configs[status] || configs.processing;
  };

  const getFileIcon = (filename) => {
    if (!filename) return <File size={20} />;
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      pdf: <FileText size={20} className="file-icon-pdf" />,
      doc: <FileText size={20} className="file-icon-doc" />,
      docx: <FileText size={20} className="file-icon-doc" />,
      txt: <FileText size={20} className="file-icon-txt" />,
      md: <FileText size={20} className="file-icon-txt" />,
      json: <FileText size={20} className="file-icon-json" />,
      csv: <FileText size={20} className="file-icon-csv" />,
      xls: <FileText size={20} className="file-icon-xls" />,
      xlsx: <FileText size={20} className="file-icon-xls" />,
      ppt: <FileText size={20} className="file-icon-ppt" />,
      pptx: <FileText size={20} className="file-icon-ppt" />
    };
    return icons[ext] || <File size={20} />;
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.original_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           doc.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [documents, searchTerm, filterStatus]);

  const sortedDocuments = useMemo(() => {
    return [...filteredDocuments].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.upload_date || 0) - new Date(a.upload_date || 0);
      } else if (sortBy === 'name') {
        return (a.original_name || '').localeCompare(b.original_name || '');
      } else if (sortBy === 'size') {
        return (b.file_size || 0) - (a.file_size || 0);
      }
      return 0;
    });
  }, [filteredDocuments, sortBy]);

  // const handleDownload = async (doc) => {
  //   try {
  //     const response = await apiService.downloadDocument(doc.id);
  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.setAttribute('download', doc.original_name || 'document');
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();
  //   } catch (err) {
  //     console.error('Download error:', err);
  //   }
  // };

  if (loading && documents.length === 0) {
    return (
      <div className="document-list">
        <div className="list-header">
          <div className="header-content">
            <h2 className="list-title">
              <FileText size={20} />
              <span>Documents</span>
            </h2>
          </div>
        </div>
        <div className="documents-container">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="document-card skeleton">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div className="document-list error-state">
        <div className="list-header">
          <div className="header-content">
            <h2 className="list-title">
              <FileText size={20} />
              <span>Documents</span>
            </h2>
          </div>
        </div>
        <div className="error-container">
          <AlertCircle size={48} />
          <h3>Unable to Load Documents</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchDocuments}>
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`document-list ${viewMode} ${isGridView ? 'grid-view' : 'list-view'}`}>
      <div className="list-header">
        <div className="header-left">
          <h2 className="list-title">
            <FileText size={20} />
            <span>Documents</span>
            {documents.length > 0 && (
              <span className="badge">{filteredDocuments.length}/{documents.length}</span>
            )}
          </h2>
          
          {viewMode === 'full' && documents.length > 0 && (
            <div className="view-toggle">
              <button 
                className={`view-btn ${!isGridView ? 'active' : ''}`}
                onClick={() => setIsGridView(false)}
                title="List view"
              >
                <span>List</span>
              </button>
              <button 
                className={`view-btn ${isGridView ? 'active' : ''}`}
                onClick={() => setIsGridView(true)}
                title="Grid view"
              >
                <span>Grid</span>
              </button>
            </div>
          )}
        </div>
        
        {/* <div className="header-right">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button 
            className="btn-icon"
            onClick={fetchDocuments}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div> */}
      </div>

      {viewMode === 'full' && documents.length > 0 && (
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Ready</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-value">{stats.processing}</div>
              <div className="stat-label">Processing</div>
            </div>
            <div className="stat-card error">
              <div className="stat-value">{stats.failed}</div>
              <div className="stat-label">Failed</div>
            </div>
            <div className="stat-card info">
              <div className="stat-value">{formatFileSize(stats.totalSize)}</div>
              <div className="stat-label">Total Size</div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'full' && documents.length > 0 && (
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">
                <Filter size={14} />
                Status Filter
              </label>
              <select 
                className="select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="completed">Ready</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">
                Sort By
              </label>
              <select 
                className="select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Newest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="size">Size (Large First)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="documents-container">
        {documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No documents yet</h3>
            <p>Upload your first document to get started</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <Search size={40} />
            <h3>No documents found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="btn-text" onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className={isGridView ? "documents-grid" : "documents-stack"}>
            {sortedDocuments.map((doc) => {
              const statusConfig = getStatusConfig(doc.status);
              const isSelected = selectedDocument?.id === doc.id;
              
              return (
                <div
                  key={doc.id}
                  className={`document-card ${isSelected ? 'selected' : ''} ${doc.status}`}
                  onClick={() => doc.status === 'completed' && onSelectDocument(doc)}
                >
                  <div className="card-header">
                    <div className="file-icon-wrapper">
                      {getFileIcon(doc.original_name)}
                    </div>
                    
                    <div className="card-actions">
                      
                        <>
                          <button
    className="btn-icon small"
    onClick={(e) => {
      e.stopPropagation();
      setShowDeleteConfirm(doc.id);
    }}
    title="Delete"
  >
    <Trash2 size={14} />
  </button>
                        </>
                     
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <h3 className="file-name" title={doc.original_name}>
                      {doc.original_name || 'Unnamed Document'}
                    </h3>
                    
                    <div className="file-meta">
                      <div className="meta-item">
                        <Calendar size={12} />
                        <span>{formatDate(doc.upload_date)}</span>
                      </div>
                      <div className="meta-item">
                        <HardDrive size={12} />
                        <span>{formatFileSize(doc.file_size)}</span>
                      </div>
                      {doc.chunk_count > 0 && (
                        <div className="meta-item">
                          <Hash size={12} />
                          <span>{doc.chunk_count} chunks</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="status-wrapper">
                      <div 
                        className="status-badge"
                        style={{
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color
                        }}
                      >
                        {statusConfig.icon}
                        <span>{statusConfig.label}</span>
                      </div>
                      
                      {doc.status === 'completed' && (
                        <button 
                          className={`select-btn ${isSelected ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDocument(doc);
                          }}
                        >
                          {isSelected ? (
                            <>
                              <Check size={14} />
                              <span>Selected</span>
                            </>
                          ) : (
                            <>
                              <span>Select</span>
                              <ChevronRight size={14} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <AlertCircle size={24} />
              <h3>Delete Document</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this document? This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentList;