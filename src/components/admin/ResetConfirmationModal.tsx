// src/components/admin/ResetConfirmationModal.tsx

import React from 'react';

interface ResetConfirmationModalProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({ show, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Konfirmasi Reset Data</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              Apakah Anda yakin ingin mereset semua data? Tindakan ini akan menghapus semua kandidat dan tidak dapat dipulihkan.
            </p>
          </div>
          <div className="items-center px-4 py-3">
            <button
              id="ok-btn"
              className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
              onClick={onConfirm}
            >
              Ya, Reset Data
            </button>
            <button
              id="cancel-btn"
              className="mt-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={onCancel}
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetConfirmationModal;