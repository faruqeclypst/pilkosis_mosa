// src/components/admin/ActionButtons.tsx

import React from 'react';

interface ActionButtonsProps {
  onExportPDF: () => void;
  onResetVotes: () => void;
  onDeleteAll: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onExportPDF, onResetVotes, onDeleteAll }) => {
    return (
      <div className="mt-8 flex justify-end items-center space-x-4">
        <button
          onClick={onExportPDF}
          className="admin-btn admin-btn-primary"
        >
          Export PDF
        </button>
        
        <button
          onClick={onResetVotes}
          className="admin-btn admin-btn-warning"
        >
          Reset Votes
        </button>
        
        <button
          onClick={onDeleteAll}
          className="admin-btn admin-btn-danger"
        >
          Delete All
        </button>
      </div>
    );
  };
  
  export default ActionButtons;