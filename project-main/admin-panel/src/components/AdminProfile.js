import React, { useState } from 'react';
import axios from 'axios';
import { Save, User, Mail, ShieldCheck } from 'lucide-react';
import { ADMIN_ENDPOINTS } from '../config/api';

export default function AdminProfile({ admin, onUpdateAdmin }) {
  const [username, setUsername] = useState(admin?.username || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.put(ADMIN_ENDPOINTS.updateProfile(admin._id), {
        username: username.trim(),
        email: email.trim(),
      });

      const updated = response?.data?.admin;
      if (updated && onUpdateAdmin) {
        onUpdateAdmin(updated);
      }
      setMessage('Profile updated successfully.');
    } catch (err) {
      const offlineFallbackAdmin = {
        ...admin,
        username: username.trim(),
        email: email.trim().toLowerCase(),
      };

      if (onUpdateAdmin) {
        onUpdateAdmin(offlineFallbackAdmin);
      }

      const backendMessage = err.response?.data?.message || '';
      if (backendMessage) {
        setMessage(`Backend unavailable (${backendMessage}). Profile saved locally for this session.`);
      } else {
        setMessage('Backend unavailable. Profile saved locally for this session.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div
        className="bg-white rounded-2xl border shadow-sm p-7"
        style={{ borderColor: 'var(--border-color)', boxShadow: '0 10px 26px rgba(15, 47, 33, 0.08)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-dark)', fontFamily: "'DM Serif Display', serif" }}>
              Admin Profile
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
              Update your profile details
            </p>
          </div>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderColor: 'var(--border-color)' }}
          >
            {(admin?.username || 'A')[0].toUpperCase()}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-dark)' }}>
              <User size={16} /> Name
            </label>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your name"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-dark)' }}>
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-dark)' }}>
              <ShieldCheck size={16} /> Role
            </label>
            <input type="text" className="input-field" value={admin?.role || 'admin'} disabled />
          </div>

          {error && (
            <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#fecaca', background: '#fff1f1', color: '#b91c1c' }}>
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#cfe2d5', background: '#e9f3ed', color: '#155131' }}>
              {message}
            </div>
          )}

          <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={loading}>
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
