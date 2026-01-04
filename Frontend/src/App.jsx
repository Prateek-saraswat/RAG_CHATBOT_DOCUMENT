import React, { useState, useEffect } from 'react';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import QueryInterface from './components/QueryInterface';
import apiService from './services/api';
import './App.css';
import { 
  Upload, 
  Database, 
  Cpu, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  FileText,
  Bell,
  User,
  Menu,
  X,
  Home,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function App() {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [healthStatus, setHealthStatus] = useState({ status: 'checking', details: {} });
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('query');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
      const checkHealth = async () => {
    try {
      const status = await apiService.healthCheck();
      setHealthStatus({ status: 'healthy', details: status });
    } catch (error) {
      setHealthStatus({ 
        status: 'error', 
        details: { error: error.message } 
      });
    }
  };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);



  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUploadSuccess = (result) => {
    showNotification(`"${result.filename}" uploaded successfully!`, 'success');
  };

  const handleUploadError = (error) => {
    showNotification(`Upload failed: ${error.message}`, 'error');
  };

  const handleSelectDocument = (document) => {
    setSelectedDocument(document);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
    if (activeTab !== 'query') {
      setActiveTab('query');
    }
  };

  const getHealthIcon = () => {
    switch (healthStatus.status) {
      case 'healthy': return <CheckCircle size={16} />;
      case 'error': return <AlertCircle size={16} />;
      default: return <Cpu size={16} />;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'query':
        return (
          <div className="main-layout">
            {!isMobile && (
              <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                  {!sidebarCollapsed && <h3>Documents</h3>}
                  <button 
                    className="sidebar-toggle"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                  </button>
                </div>
                <div className="sidebar-content">
                  <DocumentList
                    onSelectDocument={handleSelectDocument}
                    selectedDocument={selectedDocument}
                    viewMode="compact"
                  />
                </div>
              </div>
            )}
            
            <div className="main-content">
              <QueryInterface selectedDocument={selectedDocument} />
            </div>
          </div>
        );
        
      case 'library':
        return (
          <div className="full-page">
            <DocumentList
              onSelectDocument={handleSelectDocument}
              selectedDocument={selectedDocument}
              viewMode="full"
            />
          </div>
        );
        
      case 'upload':
        return (
          <div className="full-page centered">
            <DocumentUpload 
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'query', icon: <MessageSquare size={20} />, label: 'Chat' },
    { id: 'library', icon: <FileText size={20} />, label: 'Library' },
    { id: 'upload', icon: <Upload size={20} />, label: 'Upload' },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="logo">
              <div className="logo-icon">
                <MessageSquare size={28} />
                <img src="../public/excellence.jpg" width="50px" alt="" />
              </div>
              <div className="logo-text">
                <h1>Excellence AI</h1>
                <p className="tagline">Excellence Document Assistant</p>
              </div>
            </div>
          </div>

          {!isMobile && (
            <nav className="main-nav">
              {navItems.map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          )}

          <div className="header-right">
            <div className={`status-badge ${healthStatus.status}`}>
              {getHealthIcon()}
              <div className="status-info">
                <span className="status-label">System Status</span>
                <span className="status-text">
                  {healthStatus.status === 'healthy' ? 'Operational' : 
                   healthStatus.status === 'error' ? 'Issues' : 'Checking'}
                </span>
              </div>
            </div>

            {/* <div className="header-actions">
              <button className="btn-icon" title="Notifications">
                <Bell size={20} />
              </button>
              <button className="btn-icon profile" title="Profile">
                <User size={20} />
              </button>
            </div> */}
          </div>
        </div>

        {isMobile && (
          <div className="mobile-nav">
            <div className="mobile-nav-items">
              {navItems.map(item => (
                <button
                  key={item.id}
                  className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen && isMobile && activeTab === 'query' && (
        <div className="mobile-sidebar-overlay">
          <div className="mobile-sidebar">
            <div className="mobile-sidebar-header">
              <h3>Documents</h3>
              <button 
                className="btn-icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mobile-sidebar-content">
              <DocumentList
                onSelectDocument={handleSelectDocument}
                selectedDocument={selectedDocument}
                viewMode="compact"
              />
            </div>
          </div>
        </div>
      )}

      <main className="main">
        {renderContent()}
      </main>

      {notification && (
        <div className={`notification ${notification.type}`}>
          <div className="notification-content">
            {notification.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            className="notification-close"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="tech-stack">
              <span className="tech-item">
                <Database size={14} />
                <span>ChromaDB</span>
              </span>
              <span className="tech-item">
                <Cpu size={14} />
                <span>Ollama</span>
              </span>
              <span className="tech-item">MySQL</span>
              <span className="tech-item">React</span>
            </div>
          </div>
          
          <div className="footer-center">
            <span className="copyright">
              { "2025"} Excellence AI
            </span>
          </div>
          
          <div className="footer-right">
            <div className="footer-links">
              <button className="btn-text small">
                <HelpCircle size={14} />
                <span>Help</span>
              </button>
              <button className="btn-text small">
                <Settings size={14} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;