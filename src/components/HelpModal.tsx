import React from 'react';
import './HelpModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-body">{children}</div>
        <div className="help-modal-footer">
          <button className="help-modal-ok-button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
