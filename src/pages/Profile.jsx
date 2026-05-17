import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import { NIGERIAN_STATES, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [addrForm, setAddrForm] = useState({ label: 'Home', fullName: '', phone: '', street: '', city: '', state: '', country: 'Nigeria', postalCode: '', isDefault: false });

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile(profileForm);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(getErrorMessage(err)); }
    setSaving(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await userAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(getErrorMessage(err)); }
    setSaving(false);
  };

  const addAddress = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userAPI.addAddress(addrForm);
      updateUser({ addresses: data.addresses });
      toast.success('Address added!');
      setAddrForm({ label: 'Home', fullName: '', phone: '', street: '', city: '', state: '', country: 'Nigeria', postalCode: '', isDefault: false });
    } catch (err) { toast.error(getErrorMessage(err)); }
    setSaving(false);
  };

  const deleteAddress = async (id) => {
    try {
      const { data } = await userAPI.deleteAddress(id);
      updateUser({ addresses: data.addresses });
      toast.success('Address removed');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const TABS = [
    { key: 'profile', label: '👤 Profile' },
    { key: 'password', label: '🔒 Password' },
    { key: 'addresses', label: '📍 Addresses' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-8" style={{ fontFamily: 'Sora, sans-serif' }}>My Account</h1>

      {/* Avatar header */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#e85d04] rounded-3xl p-6 text-white flex items-center gap-5 mb-8">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold shrink-0">
          {user?.name?.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <p className="text-white/70 text-sm">{user?.email}</p>
          <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full mt-1 inline-block capitalize">{user?.role}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === key ? 'bg-[#e85d04] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#e85d04] hover:text-[#e85d04]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="space-y-5 max-w-md">
            <h2 className="font-bold text-lg text-[#1a1a2e]">Personal Information</h2>
            {[
              { label: 'Full Name', key: 'name', type: 'text' },
              { label: 'Phone Number', key: 'phone', type: 'tel' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>
                <input type={type} value={profileForm[key]} onChange={(e) => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04]" />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email (cannot change)</label>
              <input type="email" value={user?.email} disabled className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400" />
            </div>
            <button type="submit" disabled={saving} className="bg-[#e85d04] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#c44d03] transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={changePassword} className="space-y-5 max-w-md">
            <h2 className="font-bold text-lg text-[#1a1a2e]">Change Password</h2>
            {[
              { label: 'Current Password', key: 'currentPassword' },
              { label: 'New Password', key: 'newPassword' },
              { label: 'Confirm New Password', key: 'confirm' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>
                <input type="password" value={passwordForm[key]} onChange={(e) => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04]" />
              </div>
            ))}
            <button type="submit" disabled={saving} className="bg-[#e85d04] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#c44d03] transition-colors disabled:opacity-60">
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}

        {tab === 'addresses' && (
          <div>
            <h2 className="font-bold text-lg text-[#1a1a2e] mb-5">My Addresses</h2>
            {user?.addresses?.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {user.addresses.map((addr) => (
                  <div key={addr._id} className={`border-2 rounded-2xl p-4 relative ${addr.isDefault ? 'border-[#e85d04] bg-orange-50' : 'border-gray-200'}`}>
                    {addr.isDefault && <span className="absolute top-3 right-3 text-xs bg-[#e85d04] text-white px-2 py-0.5 rounded-full font-medium">Default</span>}
                    <p className="font-semibold text-sm mb-1">{addr.label}</p>
                    <p className="text-sm text-gray-600">{addr.fullName}</p>
                    <p className="text-sm text-gray-600">{addr.phone}</p>
                    <p className="text-sm text-gray-600">{addr.street}</p>
                    <p className="text-sm text-gray-600">{addr.city}, {addr.state}</p>
                    <button onClick={() => deleteAddress(addr._id)} className="mt-3 text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                ))}
              </div>
            )}

            <h3 className="font-semibold text-gray-800 mb-4">Add New Address</h3>
            <form onSubmit={addAddress} className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Label', key: 'label', placeholder: 'Home, Work...' },
                { label: 'Full Name', key: 'fullName', placeholder: 'Recipient name' },
                { label: 'Phone', key: 'phone', placeholder: '+234...' },
                { label: 'Street', key: 'street', placeholder: 'Street address', full: true },
                { label: 'City', key: 'city', placeholder: 'City' },
                { label: 'Postal Code', key: 'postalCode', placeholder: '100001' },
              ].map(({ label, key, placeholder, full }) => (
                <div key={key} className={full ? 'sm:col-span-2' : ''}>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
                  <input type="text" value={addrForm[key]} onChange={(e) => setAddrForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#e85d04]" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">State</label>
                <select value={addrForm.state} onChange={(e) => setAddrForm(f => ({ ...f, state: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#e85d04] bg-white">
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={addrForm.isDefault} onChange={(e) => setAddrForm(f => ({ ...f, isDefault: e.target.checked }))} className="rounded" />
                <label htmlFor="isDefault" className="text-sm text-gray-600">Set as default address</label>
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={saving} className="bg-[#e85d04] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#c44d03] transition-colors disabled:opacity-60">
                  {saving ? 'Adding...' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
