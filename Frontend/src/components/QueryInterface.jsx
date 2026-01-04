import React, { useState, useRef, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import '../styles/QueryInterface.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ConfirmModal from './ConfirmModal';
import { 
  Send, 
  FileText, 
  Loader, 
  Copy, 
  Check,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Brain,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  User,
  Bot,
  ArrowDown,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Share,
  BookOpen,
  Zap
} from 'lucide-react';

function QueryInterface({ selectedDocument }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedChunks, setExpandedChunks] = useState({});
  const [responseTime, setResponseTime] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [feedback, setFeedback] = useState({});
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [showClearModal , setShowClearModal] = useState(false)

  useEffect(() => {
    const savedChats = localStorage.getItem('documentChats');
    if (savedChats && selectedDocument) {
      try {
        const chats = JSON.parse(savedChats);
        const documentChats = chats[selectedDocument.id] || [];
        setMessages(documentChats);
      } catch (err) {
        console.error('Error loading chat history:', err);
      }
    }
  }, [selectedDocument]);

  const saveChatToHistory = useCallback((newMessages) => {
    if (!selectedDocument) return;
    
    try {
      const savedChats = localStorage.getItem('documentChats');
      const chats = savedChats ? JSON.parse(savedChats) : {};
      chats[selectedDocument.id] = newMessages;
      localStorage.setItem('documentChats', JSON.stringify(chats));
    } catch (err) {
      console.error('Error saving chat history:', err);
    }
  }, [selectedDocument]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [query]);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [messages, autoScroll]);

  const handleChatScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }

    if (!selectedDocument) {
      setError('Please select a document first');
      return;
    }

    const startTime = Date.now();
    setLoading(true);
    setError(null);
    setAutoScroll(true);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveChatToHistory(updatedMessages);

    const currentQuery = query;
    setQuery('');

    try {
      const result = await apiService.queryDocument(selectedDocument.id, currentQuery);
      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: result.response || result.answer || 'No response received',
        relevantChunks: result.relevantChunks || result.sources || [],
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
        responseTime: endTime - startTime
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      saveChatToHistory(finalMessages);
      
    } catch (err) {
      console.error('Query error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to process your question';
      setError(errorMessage);
      
      const errorMsg = {
        id: Date.now() + 1,
        type: 'error',
        content: errorMessage,
        timestamp: new Date().toISOString()
      };
      const errorMessages = [...updatedMessages, errorMsg];
      setMessages(errorMessages);
      saveChatToHistory(errorMessages);
    } finally {
      setLoading(false);
    }
  };

  const confirmClearChat = async (e)=> {
    setMessages([]);

  if (selectedDocument) {
    const savedChats = localStorage.getItem('documentChats');
    const chats = savedChats ? JSON.parse(savedChats) : {};
    delete chats[selectedDocument.id];
    localStorage.setItem('documentChats', JSON.stringify(chats));
  }

  setShowClearModal(false);

  }
  const handleCopy = (messageId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (messageId, type) => {
    setFeedback(prev => ({
      ...prev,
      [messageId]: type
    }));
    console.log(`Feedback ${type} for message ${messageId}`);
  };

  const toggleChunks = (messageId) => {
    setExpandedChunks(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const formatResponseTime = (ms) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getConfidenceColor = (confidence) => {
    if (!confidence) return '#6b7280';
    if (confidence > 0.8) return '#10b981';
    if (confidence > 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setAutoScroll(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestedQuestions = [
    'What is this document about?',
    'Can you summarize the key points?',
    'What are the main conclusions?',
    'Extract important data points',
    'Explain the methodology used'
  ];

  return (
    <div className="query-interface">
      <div className="query-header">
        <div className="header-left">
          <div className="header-icon-wrapper">
            {/* <MessageSquare size={24} /> */}
                <img src="/excellence.jpg" width="50px" alt="" />

          </div>
          <div className="header-content">
            <h2>Document Chat</h2>
            {selectedDocument && (
              <div className="document-indicator">
                <FileText size={14} />
                <span className="document-name">{selectedDocument.original_name}</span>
                <span className="status-dot ready"></span>
              </div>
            )}
          </div>
        </div>
        
        <div className="header-actions">
          {responseTime && (
            <div className="performance-badge">
              <Clock size={14} />
              <span>{formatResponseTime(responseTime)}</span>
            </div>
          )}
          
          <button 
            className="btn-secondary small"
            onClick={()=> setShowClearModal(true)}
            disabled={messages.length === 0}
            title="Clear chat history"
          >
            <Trash2 size={16} />
            Clear Chat
          </button>
        </div>
      </div>

      <div className="query-container">
        {!selectedDocument ? (
          <div className="empty-state">
            <div className="empty-icon">
              <BookOpen size={48} />
            </div>
            <h3>Select a Document</h3>
            <p>Choose a document from your library to start chatting</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <div className="welcome-card">
              <div className="welcome-icon">
                <Sparkles size={48} />
              </div>
              <h3>Chat with your document</h3>
              <p>Ask questions about your document and get AI-powered insights</p>
              
              <div className="suggestions-section">
                <h4>Try asking:</h4>
                <div className="suggestions-grid">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="suggestion-chip"
                      onClick={() => setQuery(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="capabilities">
                <div className="capability">
                  <Zap size={16} />
                  <span>Quick analysis</span>
                </div>
                <div className="capability">
                  <Brain size={16} />
                  <span>Smart insights</span>
                </div>
                <div className="capability">
                  <FileText size={16} />
                  <span>Document context</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div 
              className="chat-messages"
              ref={chatContainerRef}
              onScroll={handleChatScroll}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.type}`}
                >
                  <div className="message-avatar">
                    {message.type === 'user' ? (
                      <div className="avatar user">
                        <User size={16} />
                      </div>
                    ) : message.type === 'error' ? (
                      <div className="avatar error">
                        <AlertCircle size={16} />
                      </div>
                    ) : (
                      <div className="avatar ai">
                        <Bot size={16} />
                      </div>
                    )}
                  </div>
                  
                  <div className="message-content-wrapper">
                    <div className="message-header">
                      <div className="message-sender">
                        {message.type === 'user' ? 'You' : 
                         message.type === 'error' ? 'Error' : 
                         'Excellence Ai'}
                      </div>
                      <div className="message-time">
                        {formatMessageTime(message.timestamp)}
                      </div>
                    </div>
                    
                   <div className="message-content">
  {message.type === 'error' ? (
    <div className="error-message">
      <AlertCircle size={16} />
      <span>{message.content}</span>
    </div>
  ) : message.type === 'ai' ? (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
        h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
        h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
        p: ({ children }) => <p className="md-p">{children}</p>,
        li: ({ children }) => <li className="md-li">{children}</li>,
        strong: ({ children }) => <strong className="md-strong">{children}</strong>,
        em: ({ children }) => <em className="md-em">{children}</em>,
        code: ({ children }) => (
          <code className="md-inline-code">{children}</code>
        ),
        pre: ({ children }) => (
          <pre className="md-code-block">{children}</pre>
        )
      }}
    >
      {message.content}
    </ReactMarkdown>
  ) : (
    <p>{message.content}</p>
  )}
</div>

                    
                    {message.type === 'ai' && (
                      <div className="message-footer">
                        <div className="footer-actions">
                          <button
                            className="btn-icon small"
                            onClick={() => handleCopy(message.id, message.content)}
                            title="Copy answer"
                          >
                            {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          
                          <button
                            className={`btn-icon small ${feedback[message.id] === 'like' ? 'active' : ''}`}
                            onClick={() => handleFeedback(message.id, 'like')}
                            title="Helpful"
                          >
                            <ThumbsUp size={14} />
                          </button>
                          
                          <button
                            className={`btn-icon small ${feedback[message.id] === 'dislike' ? 'active' : ''}`}
                            onClick={() => handleFeedback(message.id, 'dislike')}
                            title="Not helpful"
                          >
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                        
                        {message.confidence && (
                          <div 
                            className="confidence-badge"
                            style={{ 
                              backgroundColor: getConfidenceColor(message.confidence),
                              color: 'white'
                            }}
                          >
                            Confidence: {(message.confidence * 100).toFixed(0)}%
                          </div>
                        )}
                        
                        {message.responseTime && (
                          <div className="response-time-badge">
                            <Clock size={12} />
                            {formatResponseTime(message.responseTime)}
                          </div>
                        )}
                        
                        {/* {message.relevantChunks && message.relevantChunks.length > 0 && (
                          <div className="sources-section">
                            <button
                              className="sources-toggle"
                              onClick={() => toggleChunks(message.id)}
                            >
                              <Brain size={14} />
                              <span>
                                {expandedChunks[message.id] ? 'Hide' : 'Show'} Sources
                                <span className="count">({message.relevantChunks.length})</span>
                              </span>
                              {expandedChunks[message.id] ? 
                               <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            
                            {expandedChunks[message.id] && (
                              <div className="sources-list">
                                {message.relevantChunks.map((chunk, index) => (
                                  <div key={index} className="source-card">
                                    <div className="source-header">
                                      <span className="source-index">Source {index + 1}</span>
                                      {chunk.relevance && (
                                        <span 
                                          className="relevance-score"
                                          style={{ 
                                            backgroundColor: `rgba(16, 185, 129, ${chunk.relevance})`
                                          }}
                                        >
                                          {(chunk.relevance * 100).toFixed(0)}% relevant
                                        </span>
                                      )}
                                    </div>
                                    <div className="source-content">
                                      {chunk.text}
                                    </div>
                                    {chunk.page && (
                                      <div className="source-footer">
                                        <span className="page-number">Page {chunk.page}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )} */}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="message ai">
                  <div className="message-avatar">
                    <div className="avatar ai">
                      <Bot size={16} />
                    </div>
                  </div>
                  <div className="message-content-wrapper">
                    <div className="message-header">
                      <div className="message-sender">Excellence AI</div>
                      <div className="message-time">Now</div>
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {!autoScroll && (
              <button className="scroll-bottom-btn" onClick={scrollToBottom}>
                <ArrowDown size={16} />
                <span>Scroll to latest</span>
              </button>
            )}
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="query-form">
        <div className="input-wrapper">
          <div className="textarea-container">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedDocument ? 
                "Ask anything about your document... (Press Enter to send)" : 
                "Select a document to start chatting..."
              }
              className="query-input"
              rows={1}
              disabled={!selectedDocument || loading}
            />
            <div className="input-actions">
              <div className="char-count">
                {query.length}/2000
              </div>
              <button
                type="button"
                className="btn-text small"
                onClick={() => setQuery('')}
                disabled={!query || loading}
              >
                Clear
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            className="send-button"
            disabled={!selectedDocument || loading || !query.trim()}
          >
            {loading ? (
              <Loader size={18} className="spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        
        <div className="form-hint">
          <div className="hint-item">
            <Sparkles size={12} />
            <span>Excellence document analysis</span>
          </div>
          <div className="hint-item">
            <Brain size={12} />
            <span></span>
          </div>
        </div>
      </form>
      <ConfirmModal
  isOpen={showClearModal}
  title="Clear chat history?"
  message="This will permanently delete all messages for this document."
  onCancel={() => setShowClearModal(false)}
  onConfirm={confirmClearChat}
/>
    </div>
  );
}

export default QueryInterface;