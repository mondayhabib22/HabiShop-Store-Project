import { useEffect, useState } from 'react';
import { categoryAPI } from '../../utils/api';
import { getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const INITIAL = { name: '', description: '', icon: '🛍️', isActive: true, order: 0 };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(INITIAL);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await categoryAPI.getAll();
      setCategories(data.categories);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '🛍️', isActive: cat.isActive, order: cat.order || 0 });
    setEditing(cat._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await categoryAPI.update(editing, form);
        toast.success('Category updated!');
      } else {
        await categoryAPI.create(form);
        toast.success('Category created!');
      }
      setForm(INITIAL);
      setEditing(null);
      setShowForm(false);
      fetchCategories();
    } catch (err) { toast.error(getErrorMessage(err)); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await categoryAPI.delete(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const resetForm = () => {
    setForm(INITIAL);
    setEditing(null);
    setShowForm(false);
  };

  const EMOJI_SUGGESTIONS = ['🛍️', '💻', '👗', '🏠', '💄', '⚽', '📚', '🛒', '🧸', '🎮', '📱', '🚗', '🍕', '💊', '✈️'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a2e]">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} categories</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#e85d04] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#c44d03] transition-colors text-sm"
        >
          ➕ Add Category
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1a1a2e] mb-5">{editing ? 'Edit Category' : 'New Category'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Category Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Electronics"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Display Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Icon (Emoji)</label>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className="text-3xl">{form.icon}</span>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
                  className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#e85d04] text-center"
                  maxLength={4}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {EMOJI_SUGGESTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                    className={`text-xl p-2 rounded-lg hover:bg-orange-50 transition-colors ${form.icon === emoji ? 'bg-orange-100 ring-2 ring-[#e85d04]' : 'bg-gray-50'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 accent-[#e85d04]"
              />
              <span className="text-sm font-medium text-gray-700">Active (visible in store)</span>
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#e85d04] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#c44d03] transition-colors text-sm disabled:opacity-60"
              >
                {saving ? 'Saving...' : editing ? '💾 Update Category' : '➕ Create Category'}
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

      {/* Categories grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(null).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className={`bg-white border rounded-2xl p-5 shadow-sm flex items-start justify-between ${cat.isActive ? 'border-gray-100' : 'border-red-100 bg-red-50/30'}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{cat.icon}</span>
                <div>
                  <h3 className="font-bold text-[#1a1a2e]">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.description || 'No description'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {cat.isActive ? 'Active' : 'Hidden'}
                    </span>
                    <span className="text-xs text-gray-400">Order: {cat.order}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0 ml-3">
                <button
                  onClick={() => handleEdit(cat)}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cat._id, cat.name)}
                  className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && categories.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🗂️</div>
          <p className="font-medium">No categories yet</p>
          <p className="text-sm mt-1">Add your first category to get started</p>
        </div>
      )}
    </div>
  );
}
