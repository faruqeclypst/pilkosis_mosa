import React, { useState, useEffect } from 'react';
import { ClassConfig } from '../../../types';
import { Trash2 } from 'lucide-react';

interface ClassConfigSectionProps {
  classConfigs: ClassConfig[];
  onSaveConfigs: (configs: ClassConfig[]) => Promise<void>;
}

const ClassConfigSection: React.FC<ClassConfigSectionProps> = ({
  classConfigs,
  onSaveConfigs
}) => {
  const [localConfigs, setLocalConfigs] = useState<ClassConfig[]>(classConfigs);
  const [newClassName, setNewClassName] = useState('');
  const [newStudentCount, setNewStudentCount] = useState(30);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalConfigs(classConfigs);
  }, [classConfigs]);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newClassName.trim()) {
      if (localConfigs.some(config => config.name.toLowerCase() === newClassName.trim().toLowerCase())) {
        alert('Nama kelas sudah ada!');
        return;
      }

      const newConfig = {
        id: `temp-${Date.now()}`,
        name: newClassName.trim(),
        studentCount: newStudentCount
      };

      const updatedConfigs = [...localConfigs, newConfig];
      setLocalConfigs(updatedConfigs);
      setNewClassName('');
      setNewStudentCount(30);

      try {
        setIsSaving(true);
        await onSaveConfigs(updatedConfigs);
      } catch (error) {
        console.error('Error saving class configs:', error);
        setLocalConfigs(localConfigs);
        alert('Gagal menyimpan konfigurasi kelas');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleRemoveClass = async (index: number) => {
    if (window.confirm('Yakin ingin menghapus kelas ini?')) {
      const updatedConfigs = localConfigs.filter((_, i) => i !== index);
      
      try {
        setIsSaving(true);
        await onSaveConfigs(updatedConfigs);
        setLocalConfigs(updatedConfigs);
      } catch (error) {
        console.error('Error removing class:', error);
        alert('Gagal menghapus kelas');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Konfigurasi Kelas</h3>
      
      {/* Form Tambah Kelas */}
      <form onSubmit={handleAddClass} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSaving}
              className="mobile-button bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            >
              Tambah
            </button>
          </div>
        </div>
      </form>

      {/* Daftar Kelas */}
      <div className="space-y-3">
        {localConfigs.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Belum ada kelas yang ditambahkan</p>
        ) : (
          localConfigs.map((config, index) => (
            <div 
              key={config.id || index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <h4 className="font-medium">{config.name}</h4>
                <p className="text-sm text-gray-500">{config.studentCount} siswa</p>
              </div>
              <button
                onClick={() => handleRemoveClass(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Hapus Kelas"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClassConfigSection; 