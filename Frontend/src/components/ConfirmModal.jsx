import React from 'react';
import '../styles/ConfirmModal.css';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <AlertTriangle size={20} />
          <h3>{title}</h3>
          <button className="close-btn" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <p className="modal-message">{message}</p>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            Clear Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
