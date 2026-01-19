import React from 'react';
import './ConfirmModal.css';

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Remove', cancelText = 'Cancel' }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-buttons">
          <button className="confirm-modal-btn cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="confirm-modal-btn confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
