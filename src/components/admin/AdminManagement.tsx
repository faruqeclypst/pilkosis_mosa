// src/components/admin/AdminManagement.tsx

import React, { useState } from 'react';
import { Admin } from '../../types';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface AdminManagementProps {
  admins: Admin[];
  onAddAdmin: (newAdmin: Omit<Admin, 'id'>) => Promise<void>;
  onUpdateAdmin: (adminId: string, updatedAdmin: Partial<Admin>) => Promise<void>;
  onDeleteAdmin: (adminId: string) => Promise<void>;
}

const AdminManagement: React.FC<AdminManagementProps> = ({ admins, onAddAdmin, onUpdateAdmin, onDeleteAdmin }) => {
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdmin.username && newAdmin.password) {
      await onAddAdmin(newAdmin);
      setNewAdmin({ username: '', password: '' });
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAdmin) {
      await onUpdateAdmin(editingAdmin.id, {
        username: editingAdmin.username,
        password: editingAdmin.password
      });
      setEditingAdmin(null);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      await onDeleteAdmin(adminId);
    }
  };

  return (
    <div id="admin-management" className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Management</h2>

      {/* Add New Admin Form */}
      <form onSubmit={handleAddAdmin} className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Username"
            value={newAdmin.username}
            onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
            className="flex-grow px-3 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={newAdmin.password}
            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
            className="flex-grow px-3 py-2 border rounded"
          />
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Add Admin
          </button>
        </div>
      </form>

      {/* Admin List */}
      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Username
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {admin.username}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <button
                    onClick={() => setEditingAdmin(admin)}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteAdmin(admin.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-5 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4">Edit Admin</h3>
            <form onSubmit={handleEditAdmin}>
              <input
                type="text"
                value={editingAdmin.username}
                onChange={(e) => setEditingAdmin({ ...editingAdmin, username: e.target.value })}
                className="mb-2 w-full px-3 py-2 border rounded"
              />
              <input
                type="password"
                value={editingAdmin.password}
                onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })}
                className="mb-2 w-full px-3 py-2 border rounded"
              />
              <div className="flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Save
                </button>
                <button
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;