import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Shield, Bell, LogOut, Trash2, ArrowLeft } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, updateUserProfile, deleteAccount, logout } = useApp();
  const navigate = useNavigate();
  
  // Default Image URL provided
  const DEFAULT_AVATAR = "https://tse3.mm.bing.net/th/id/OIP.YUggaE09mu25UYFxl-BLjQAAAA?w=171&h=197&c=7&r=0&o=7&pid=1.7&rm=3";

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '' // Optional password change
  });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('account');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(user.userId, formData);
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update profile.' });
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure? This will delete your account and all portfolio data permanently.")) {
      try {
        await deleteAccount(user.userId);
        navigate('/');
      } catch (err) {
        alert("Failed to delete account");
      }
    }
  };

  return (
    <div className="profile-container">
      {/* Sidebar Navigation */}
      <div className="profile-sidebar">
        <button onClick={() => navigate('/dashboard')} className="sidebar-item">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <div className={`sidebar-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
          <User size={20} /> Account
        </div>
        <div className="sidebar-item">
          <Shield size={20} /> Security
        </div>
        <div className="sidebar-item">
          <Bell size={20} /> Notifications
        </div>
        <div className="sidebar-item" onClick={logout} style={{marginTop: 'auto', color: '#dc2626'}}>
          <LogOut size={20} /> Logout
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        
        {/* Header Section */}
        <div className="profile-header">
          <img src={DEFAULT_AVATAR} alt="Profile" className="profile-avatar" />
          <div className="profile-info">
            <h2>{user?.username}</h2>
            <span className="profile-role">Investor</span>
            <p style={{color: '#64748b', fontSize: '0.9rem', marginTop: '4px'}}>{user?.email}</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="profile-card">
          <div className="card-header">
            <h3>Profile Details</h3>
          </div>

          {msg.text && (
            <div style={{
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              backgroundColor: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: msg.type === 'success' ? '#166534' : '#991b1b'
            }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleUpdate}>
            <div className="form-grid">
              <div className="input-group">
                <label>Username / Display Name</label>
                <input 
                  type="text" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleChange} 
                />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                />
              </div>
              <div className="input-group">
                <label>Change Password (Optional)</label>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Enter new password"
                  value={formData.password} 
                  onChange={handleChange} 
                />
              </div>
              <div className="input-group">
                <label>Timezone</label>
                <select style={{padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px'}}>
                  <option>India (IST)</option>
                  <option>New York (EST)</option>
                  <option>London (GMT)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-save">Save Changes</button>
          </form>

          {/* Delete Section */}
          <div className="danger-zone">
            <h4 style={{color: '#dc2626', marginBottom: '8px'}}>Delete Account</h4>
            <p style={{color: '#64748b', fontSize: '0.9rem', marginBottom: '16px'}}>
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button onClick={handleDelete} className="btn-delete">
              <Trash2 size={18} style={{verticalAlign: 'middle', marginRight: '8px'}}/>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;