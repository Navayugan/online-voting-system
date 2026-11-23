import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader, Card, Input, Btn, Alert, LoadingState, SectionTitle, useToast } from '../../components/ui';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState({ username: '', full_name: '', email: '', role: '' });
  const [pwd, setPwd] = useState({ current: '', new_pwd: '', confirm: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [error, setError] = useState('');
  const [pwdError, setPwdError] = useState('');
  const { show, ToastContainer } = useToast();

  useEffect(() => {
    api.get('/api/admin/profile')
      .then(r => setProfile(r.data.admin))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true); setError('');
    try {
      await api.put('/api/admin/profile', { full_name: profile.full_name, email: profile.email });
      show('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePwdUpdate = async (e) => {
    e.preventDefault();
    if (pwd.new_pwd !== pwd.confirm) { setPwdError('New passwords do not match.'); return; }
    if (pwd.new_pwd.length < 6) { setPwdError('Password must be at least 6 characters.'); return; }
    setSavingPwd(true); setPwdError('');
    try {
      await api.post('/api/admin/profile/change-password', { current_password: pwd.current, new_password: pwd.new_pwd });
      show('Password changed successfully.');
      setPwd({ current: '', new_pwd: '', confirm: '' });
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPwd(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <style>{`
        .profile-nav-wrapper {
          width: 100%;
        }

        .profile-nav-wrapper .input {
          display: flex;
          flex-direction: column;
          width: 100%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          gap: 4px;
        }

        .profile-nav-wrapper .value {
          background-color: transparent;
          border: none;
          padding: 12px 16px;
          color: #64748b;
          display: flex;
          align-items: center;
          position: relative;
          gap: 12px;
          cursor: pointer;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          text-align: left;
          transition: all 0.15s ease;
          width: 100%;
        }

        .profile-nav-wrapper .value:hover {
          background-color: #f8fafc;
          color: #0f172a;
        }

        .profile-nav-wrapper .value.active {
          background-color: #eff6ff;
          color: #1e40af;
          font-weight: 600;
          outline: none;
        }

        .profile-nav-wrapper .value::before {
          content: "";
          position: absolute;
          top: 15%;
          left: 0px;
          width: 3px;
          height: 70%;
          background-color: #1e40af;
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .profile-nav-wrapper .value.active::before {
          opacity: 1;
        }

        .profile-nav-wrapper .value svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .profile-nav-wrapper .value svg path {
          fill: #64748b;
          transition: fill 0.15s ease;
        }

        .profile-nav-wrapper .value.active svg path {
          fill: #1e40af;
        }
      `}</style>

      <PageHeader title="Admin Profile" subtitle="Manage your profile information and account password" />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px', alignItems: 'start' }}>
        {/* Left Side: Styled Profile Radio Menu */}
        <div className="profile-nav-wrapper">
          <div className="input">
            <button
              type="button"
              className={`value ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="m1.5 13v1a.5.5 0 0 0 .3379.4731 18.9718 18.9718 0 0 0 6.1621 1.0269 18.9629 18.9629 0 0 0 6.1621-1.0269.5.5 0 0 0 .3379-.4731v-1a6.5083 6.5083 0 0 0 -4.461-6.1676 3.5 3.5 0 1 0 -4.078 0 6.5083 6.5083 0 0 0 -4.461 6.1676zm4-9a2.5 2.5 0 1 1 2.5 2.5 2.5026 2.5026 0 0 1 -2.5-2.5zm2.5 3.5a5.5066 5.5066 0 0 1 5.5 5.5v.6392a18.08 18.08 0 0 1 -11 0v-.6392a5.5066 5.5066 0 0 1 5.5-5.5z" />
              </svg>
              Public profile
            </button>

            <button
              type="button"
              className={`value ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" id="Line">
                <path d="m17.074 30h-2.148c-1.038 0-1.914-.811-1.994-1.846l-.125-1.635c-.687-.208-1.351-.484-1.985-.824l-1.246 1.067c-.788.677-1.98.631-2.715-.104l-1.52-1.52c-.734-.734-.78-1.927-.104-2.715l1.067-1.246c-.34-.635-.616-1.299-.824-1.985l-1.634-.125c-1.035-.079-1.846-.955-1.846-1.993v-2.148c0-1.038.811-1.914 1.846-1.994l1.635-.125c.208-.687.484-1.351.824-1.985l-1.068-1.247c-.676-.788-.631-1.98.104-2.715l1.52-1.52c.734-.734 1.927-.779 2.715-.104l1.246 1.067c.635-.34 1.299-.616 1.985-.824l.125-1.634c.08-1.034.956-1.845 1.994-1.845h2.148c1.038 0 1.914.811 1.994 1.846l.125 1.635c.687.208 1.351.484 1.985.824l1.246-1.067c.787-.676 1.98-.631 2.715.104l1.52 1.52c.734.734.78 1.927.104 2.715l-1.067 1.246c.34.635.616 1.299.824 1.985l1.634.125c1.035.079 1.846.955 1.846 1.993v2.148c0 1.038-.811 1.914-1.846 1.994l-1.635.125c-.208.687-.484 1.351-.824 1.985l1.067 1.246c.677.788.631 1.98-.104 2.715l-1.52 1.52c-.734.734-1.928.78-2.715.104l-1.246-1.067c-.635.34-1.299.616-1.985.824l-.125 1.634c-.079 1.035-.955 1.846-1.993 1.846zm-5.835-6.373c.848.53 1.768.912 2.734 1.135.426.099.739.462.772.898l.18 2.341 2.149-.001.18-2.34c.033-.437.347-.8.772-.898.967-.223 1.887-.604 2.734-1.135.371-.232.849-.197 1.181.089l1.784 1.529 1.52-1.52-1.529-1.784c-.285-.332-.321-.811-.089-1.181.53-.848.912-1.768 1.135-2.734.099-.426.462-.739.898-.772l2.341-.18h-.001v-2.148l-2.34-.18c-.437-.033-.8-.347-.898-.772-.223-.967-.604-1.887-1.135-2.734-.232-.37-.196-.849.089-1.181l1.529-1.784-1.52-1.52-1.784 1.529c-.332.286-.81.321-1.181.089-.848-.53-1.768-.912-2.734-1.135-.426-.099-.739-.462-.772-.898l-.18-2.341-2.148.001-.18 2.34c-.033.437-.347.8-.772.898-.967.223-1.887.604-2.734 1.135-.37.232-.849.197-1.181-.089l-1.785-1.529-1.52 1.52 1.529 1.784c.285.332.321.811.089 1.181-.53.848-.912 1.768-1.135 2.734-.099.426-.462.739-.898.772l-2.341.18.002 2.148 2.34.18c.437.033.8.347.898.772.223.967.604 1.887 1.135 2.734.232.37.196.849-.089 1.181l-1.529 1.784 1.52 1.52 1.784-1.529c.332-.287.813-.32 1.18-.089z" id="XMLID_1646_" />
                <path d="m16 23c-3.859 0-7-3.141-7-7s3.141-7 7-7 7 3.141 7 7-3.141 7-7 7zm0-12c-2.757 0-5 2.243-5 5s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" id="XMLID_1645_" />
              </svg>
              Account
            </button>
          </div>
        </div>

        {/* Right Side: Exact Previous Content Form */}
        <div>
          {activeTab === 'profile' && (
            <Card>
              <SectionTitle>Profile Information</SectionTitle>
              <form onSubmit={handleProfileUpdate}>
                {error && <Alert type="error">{error}</Alert>}
                <Input label="Username" value={profile.username} disabled />
                <Input label="Full Name" value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} required />
                <Input label="Email Address" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} required />
                <div style={{ textAlign: 'right', marginTop: '16px' }}>
                  <Btn type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Update Profile'}</Btn>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'account' && (
            <Card>
              <SectionTitle>Change Password</SectionTitle>
              <form onSubmit={handlePwdUpdate}>
                {pwdError && <Alert type="error">{pwdError}</Alert>}
                <Input label="Current Password" type="password" value={pwd.current} onChange={e => setPwd({ ...pwd, current: e.target.value })} required />
                <Input label="New Password" type="password" value={pwd.new_pwd} onChange={e => setPwd({ ...pwd, new_pwd: e.target.value })} required />
                <Input label="Confirm New Password" type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} required />
                <div style={{ textAlign: 'right', marginTop: '16px' }}>
                  <Btn type="submit" variant="warning" disabled={savingPwd}>{savingPwd ? 'Changing...' : 'Change Password'}</Btn>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}

