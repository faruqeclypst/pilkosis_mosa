// src/components/admin/AdminManagement.tsx

import React, { useState } from 'react';
import { Admin } from '../../types';
import { FaUserCog, FaCheck, FaTimes, FaTrash, FaEdit } from 'react-icons/fa';

interface AdminManagementProps {
  admins: Admin[];
  onAddAdmin: (newAdmin: Omit<Admin, 'id'>) => Promise<void>;
  onUpdateAdmin: (adminId: string, updatedAdmin: Partial<Admin>) => Promise<void>;
  onDeleteAdmin: (adminId: string) => Promise<void>;
}

const AdminManagement: React.FC<AdminManagementProps> = ({ 
  admins, 
  onAddAdmin, 
  onUpdateAdmin, 
  onDeleteAdmin 
}) => {
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ username: '', password: '' });

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdmin.username && newAdmin.password) {
      await onAddAdmin(newAdmin);
      setNewAdmin({ username: '', password: '' });
    }
  };

  const startEditing = (admin: Admin) => {
    setEditingId(admin.id);
    setEditForm({ 
      username: admin.username, 
      password: '' // Reset password field when editing
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ username: '', password: '' });
  };

  const handleSaveEdit = async (adminId: string) => {
    try {
      if (!editForm.username) return;
      
      const updateData: Partial<Admin> = {
        username: editForm.username
      };
      
      // Only include password if it was changed
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      await onUpdateAdmin(adminId, updateData);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating admin:', error);
    }
  };

  return (
    <div id="admin-management" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaUserCog className="text-2xl text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Manajemen Admin</h2>
      </div>

      {/* Add New Admin Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Admin Baru</h3>
        <form onSubmit={handleAddAdmin} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Username"
              value={newAdmin.username}
              onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={newAdmin.password}
              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tambah Admin
            </button>
          </div>
        </form>
      </div>

      {/* Admin List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Password
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === admin.id ? (
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="mobile-input w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <FaUserCog className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{admin.username}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === admin.id ? (
                      <input
                        type="password"
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        placeholder="Kosongkan jika tidak diubah"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">••••••••</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === admin.id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleSaveEdit(admin.id)}
                          className="inline-flex items-center p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                          title="Simpan"
                        >
                          <FaCheck size={16} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="inline-flex items-center p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                          title="Batal"
                        >
                          <FaTimes size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => startEditing(admin)}
                          className="inline-flex items-center p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus admin ${admin.username}?`)) {
                              onDeleteAdmin(admin.id);
                            }
                          }}
                          className="inline-flex items-center p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          title="Hapus"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <div className="space-y-4 p-4">
            {admins.map((admin) => (
              <div key={admin.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FaUserCog className="h-4 w-4 text-blue-600" />
                    </div>
                    {editingId === admin.id ? (
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="mobile-input w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{admin.username}</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {editingId === admin.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(admin.id)}
                          className="inline-flex items-center p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                          title="Simpan"
                        >
                          <FaCheck size={16} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="inline-flex items-center p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                          title="Batal"
                        >
                          <FaTimes size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(admin)}
                          className="inline-flex items-center p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus admin ${admin.username}?`)) {
                              onDeleteAdmin(admin.id);
                            }
                          }}
                          className="inline-flex items-center p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          title="Hapus"
                        >
                          <FaTrash size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {editingId === admin.id && (
                  <div className="mt-2">
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Kosongkan jika tidak mengubah password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;