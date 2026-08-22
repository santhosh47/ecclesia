import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  Shield,
  Key,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Sparkles,
  Users,
  Lock,
  X,
  Mail,
  UserCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { useLocalization } from '../context/LocalizationContext';
import { User, UserCreatePayload } from '../types';

const systemDefaultRoles: { id: string; name: string }[] = [
  { id: 'super_admin', name: 'Super Administrator' },
  { id: 'pastor', name: 'Pastor / Senior Clergy' },
  { id: 'treasurer', name: 'Treasurer & Accountant' },
  { id: 'elder', name: 'Elder / Council Member' },
  { id: 'sub_admin', name: 'Sub-Administrator (Staff)' },
  { id: 'ministry_leader', name: 'Ministry / Department Leader' },
];

export const UserManagementView: React.FC = () => {
  const { roles } = useLocalization();
  const availableRoles = roles && roles.length > 0 ? roles : systemDefaultRoles;
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // New user form state
  const [newUser, setNewUser] = useState<UserCreatePayload>({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'sub_admin',
  });

  // Edit user state
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    role: '',
    is_active: true,
    new_password: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.email) return;

    try {
      await api.createUser(newUser);
      showToast(`User account for "${newUser.full_name}" created successfully!`);
      setNewUser({ full_name: '', username: '', email: '', password: '', role: 'sub_admin' });
      setShowCreateModal(false);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user account');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await api.updateUser(editingUser.id, {
        full_name: editFormData.full_name,
        email: editFormData.email,
        role: editFormData.role,
        is_active: editFormData.is_active,
        password: editFormData.new_password || undefined,
      });
      showToast(`User "${editingUser.username}" updated successfully!`);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user account');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete login account "${user.username}"?`)) return;

    try {
      await api.deleteUser(user.id);
      showToast(`User "${user.username}" deleted.`);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const getRoleDisplayName = (roleId: string) => {
    const found = roles.find((r) => r.id === roleId);
    return found ? found.name : roleId.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div>
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--emerald)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13.5px',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} color="var(--gold-400)" />
            <span>Staff & Leader User Accounts</span>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--gold-400)', fontWeight: 600 }}>
              {users.length} Logins
            </span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Create individual login credentials for pastors, treasurers, elders, and staff with distinct read/write role permissions
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <UserPlus size={16} />
          <span>Create User Login</span>
        </button>
      </div>

      {/* User Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Username</th>
                <th>Assigned Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading user accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No users found. Click "Create User Login" to add accounts.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="person-cell">
                        <div
                          className="avatar"
                          style={{
                            background: u.role === 'super_admin' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--bg-card)',
                            color: u.role === 'super_admin' ? '#fff' : 'var(--gold-400)',
                            fontWeight: 700,
                          }}
                        >
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="person-name">{u.full_name || u.username}</div>
                          <div className="person-meta">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', padding: '2px 6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
                        {u.username}
                      </code>
                    </td>
                    <td>
                      <span
                        className="status-pill"
                        style={{
                          background: u.role === 'super_admin' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          color: u.role === 'super_admin' ? 'var(--gold-400)' : '#818cf8',
                          fontWeight: 700,
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        {u.role === 'super_admin' ? '👑 ' : '★ '}
                        {getRoleDisplayName(u.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${u.is_active ? 'status-active' : 'status-inactive'}`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never logged in'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-icon btn-secondary btn-sm"
                          onClick={() => {
                            setEditingUser(u);
                            setEditFormData({
                              full_name: u.full_name,
                              email: u.email,
                              role: u.role,
                              is_active: u.is_active,
                              new_password: '',
                            });
                          }}
                          title="Edit User Login"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-icon btn-danger btn-sm"
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.role === 'super_admin' && users.filter((x) => x.role === 'super_admin').length <= 1}
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE USER */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserPlus size={20} color="var(--gold-400)" />
                <h3 className="modal-title">Create New Staff / Leader Login</h3>
              </div>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-content">
                <div className="form-grid">
                  <div className="form-group-full">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Pastor Samuel Thomas"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Login Username *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. samuel_pastor"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="e.g. samuel@ecclesia.org"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Initial Password *</label>
                    <input
                      type="password"
                      required
                      className="form-input"
                      placeholder="Minimum 4 characters"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Assigned Access Role *</label>
                    <select
                      className="form-select"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      {availableRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit2 size={20} color="var(--gold-400)" />
                <h3 className="modal-title">Edit User Account: {editingUser.username}</h3>
              </div>
              <button className="btn btn-icon btn-secondary" onClick={() => setEditingUser(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="modal-content">
                <div className="form-grid">
                  <div className="form-group-full">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.full_name}
                      onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Assigned Role</label>
                    <select
                      className="form-select"
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    >
                      {availableRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Reset Password (Optional)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Leave blank to keep current"
                      value={editFormData.new_password}
                      onChange={(e) => setEditFormData({ ...editFormData, new_password: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Account Status</label>
                    <select
                      className="form-select"
                      value={editFormData.is_active ? '1' : '0'}
                      onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === '1' })}
                    >
                      <option value="1">Active Account</option>
                      <option value="0">Deactivated / Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save User Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
