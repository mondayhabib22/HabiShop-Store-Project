import { useEffect, useState } from 'react';
import { couponAPI } from '../../utils/api';
import { formatDate, formatPrice, getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const INITIAL = {
  code: '', description: '', type: 'percentage', value: '',
  minOrderAmount: '', maxDiscount: '', usageLimit: '',
  isActive: true, expiresAt: '',
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(INITIAL);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await couponAPI.getAll();
      setCoupons(data.coupons);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleEdit = (coupon) => {
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value.toString(),
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
    });
    setEditing(coupon._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value || !form.expiresAt) {
      toast.error('Code, value and expiry date are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        value: Number(form.value),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount: Number(form.maxDiscount) || 0,
        usageLimit: Number(form.usageLimit) || 0,
        expiresAt: new Date(form.expiresAt).toISOString(),
      };

      if (editing) {
        await couponAPI.update(editing, payload);
        toast.success('Coupon updated!');
      } else {
        await couponAPI.create(payload);
        toast.success('Coupon created!');
      }
      setForm(INITIAL);
      setEditing(null);
      setShowForm(false);
      fetchCoupons();
    } catch (err) { toast.error(getErrorMessage(err)); }
    setSaving(false);
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await couponAPI.delete(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const toggleActive = async (coupon) => {
    try {
      await couponAPI.update(coupon._id, { isActive: !coupon.isActive });
      toast.success(coupon.isActive ? 'Coupon deactivated' : 'Coupon activated');
      fetchCoupons();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const resetForm = () => { setForm(INITIAL); setEditing(null); setShowForm(false); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a2e]">Coupons</h1>
          <p className="text-sm text-gray-500">{coupons.length} coupons</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#e85d04] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#c44d03] transition-colors text-sm"
        >
          ➕ Create Coupon
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1a1a2e] mb-5">{editing ? 'Edit Coupon' : 'Create New Coupon'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Coupon Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. WELCOME10"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04] font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Discount Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04] bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₦)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe what this coupon does"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Discount Value * {form.type === 'percentage' ? '(%)' : '(₦)'}
                </label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === 'percentage' ? '10' : '500'}
                  required
                  min="0"
                  max={form.type === 'percentage' ? '100' : undefined}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Min. Order (₦)</label>
                <input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]"
                />
              </div>
              {form.type === 'percentage' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Max Discount (₦)</label>
                  <input
                    type="number"
                    value={form.maxDiscount}
                    onChange={(e) => setForm(f => ({ ...f, maxDiscount: e.target.value }))}
                    placeholder="0 = no limit"
                    min="0"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]"
                  />
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Usage Limit (0 = unlimited)</label>
                <input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Expiry Date *</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 accent-[#e85d04]"
              />
              <span className="text-sm font-medium text-gray-700">Active (usable by customers)</span>
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#e85d04] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#c44d03] transition-colors text-sm disabled:opacity-60"
              >
                {saving ? 'Saving...' : editing ? '💾 Update Coupon' : '🎟️ Create Coupon'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:border-gray-300 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="text-left p-4 font-semibold">Code</th>
                <th className="text-left p-4 font-semibold">Discount</th>
                <th className="text-left p-4 font-semibold">Min. Order</th>
                <th className="text-left p-4 font-semibold">Usage</th>
                <th className="text-left p-4 font-semibold">Expires</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array(5).fill(null).map((_, i) => (
                    <tr key={i}>
                      {Array(7).fill(null).map((_, j) => (
                        <td key={j} className="p-4"><div className="skeleton h-4 rounded-lg" /></td>
                      ))}
                    </tr>
                  ))
                : coupons.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <div className="text-4xl mb-2">🎟️</div>
                      <p>No coupons yet. Create your first one!</p>
                    </td>
                  </tr>
                )
                : coupons.map((coupon) => {
                  const isExpired = new Date(coupon.expiresAt) < new Date();
                  return (
                    <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-bold text-[#1a1a2e] bg-gray-100 px-2.5 py-1 rounded-lg text-xs">
                          {coupon.code}
                        </span>
                        {coupon.description && (
                          <p className="text-xs text-gray-400 mt-1">{coupon.description}</p>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-[#e85d04]">
                        {coupon.type === 'percentage'
                          ? `${coupon.value}%`
                          : formatPrice(coupon.value)}
                        {coupon.maxDiscount > 0 && (
                          <p className="text-xs text-gray-400 font-normal">max {formatPrice(coupon.maxDiscount)}</p>
                        )}
                      </td>
                      <td className="p-4 text-gray-600">
                        {coupon.minOrderAmount > 0 ? formatPrice(coupon.minOrderAmount) : '—'}
                      </td>
                      <td className="p-4">
                        <span className="text-gray-800 font-medium">{coupon.usedCount}</span>
                        <span className="text-gray-400"> / {coupon.usageLimit === 0 ? '∞' : coupon.usageLimit}</span>
                      </td>
                      <td className={`p-4 text-xs font-medium ${isExpired ? 'text-red-500' : 'text-gray-600'}`}>
                        {isExpired ? '⚠️ Expired' : ''} {formatDate(coupon.expiresAt)}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleActive(coupon)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${coupon.isActive && !isExpired ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {coupon.isActive && !isExpired ? '● Active' : '○ Inactive'}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(coupon._id, coupon.code)}
                            className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
