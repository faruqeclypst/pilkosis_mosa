import React, { useState } from 'react';
import { ClassConfig } from '../../../types';
import { X, Trash2 } from 'lucide-react';

interface ClassConfigModalProps {
  classConfigs: ClassConfig[];
  setClassConfigs: (configs: ClassConfig[]) => Promise<void>;
  onClose: () => void;
}

const ClassConfigModal: React.FC<ClassConfigModalProps> = ({ 
  classConfigs: initialClassConfigs, 
  setClassConfigs, 
  onClose 
}) => {
  const [localClassConfigs, setLocalClassConfigs] = useState([...initialClassConfigs]);
  const [newClassName, setNewClassName] = useState('');
  const [newStudentCount, setNewStudentCount] = useState(30);
  const [isSaving, setIsSaving] = useState(false);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const addClass = () => {
    if (newClassName.trim()) {
      if (localClassConfigs.some(config => config.name.toLowerCase() === newClassName.trim().toLowerCase())) {
        alert('Nama kelas sudah ada!');
        return;
      }

      setLocalClassConfigs(prev => [...prev, { 
        id: `temp-${Date.now()}`,
        name: newClassName.trim(), 
        studentCount: newStudentCount 
      }]);
      setNewClassName('');
      setNewStudentCount(30);
    }
  };

  const removeClass = (index: number) => {
    if (window.confirm('Yakin ingin menghapus kelas ini?')) {
      setLocalClassConfigs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (localClassConfigs.length === 0) {
      if (!window.confirm('Tidak ada kelas yang dikonfigurasi. Lanjutkan menyimpan?')) {
        return;
      }
    }

    try {
      setIsSaving(true);
      await setClassConfigs(localClassConfigs);
      onClose();
    } catch (error) {
      console.error('Error saving class configs:', error);
      alert('Gagal menyimpan konfigurasi kelas');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800">Konfigurasi Kelas</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={(e) => {
            e.preventDefault();
            addClass();
          }} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  placeholder="Contoh: X-1"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="mobile-input w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Siswa
                </label>
                <input
                  type="number"
                  value={newStudentCount}
                  onChange={(e) => setNewStudentCount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="mobile-input w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mobile-button w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tambah Kelas
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {localClassConfigs.map((config, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{config.name}</h4>
                  <p className="text-sm text-gray-500">{config.studentCount} siswa</p>
                </div>
                <button
                  onClick={() => removeClass(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="mobile-button px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mobile-button px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassConfigModal; 