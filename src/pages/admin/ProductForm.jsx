import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI, categoryAPI, uploadAPI } from '../../utils/api';
import { getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const INITIAL = {
  name: '', description: '', shortDescription: '', price: '', comparePrice: '',
  costPrice: '', category: '', brand: '', stock: '', sku: '', weight: '',
  isFeatured: false, isNew: false, isActive: true, freeShipping: false,
  tags: '', images: [], thumbnail: '',
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(INITIAL);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => setCategories(data.categories)).catch(() => {});
    if (isEdit) {
      productAPI.getById(id).then(({ data }) => {
        const p = data.product;
        setForm({
          ...INITIAL, ...p,
          price: p.price?.toString() || '',
          comparePrice: p.comparePrice?.toString() || '',
          costPrice: p.costPrice?.toString() || '',
          stock: p.stock?.toString() || '',
          weight: p.weight?.toString() || '',
          category: p.category?._id || '',
          tags: p.tags?.join(', ') || '',
        });
      }).catch(() => toast.error('Failed to load product'));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const { data } = await uploadAPI.uploadImages(formData);
      setForm(f => ({
        ...f,
        images: [...f.images, ...data.urls],
        thumbnail: f.thumbnail || data.urls[0],
      }));
      toast.success(`${data.urls.length} image(s) uploaded`);
    } catch (_) { toast.error('Upload failed'); }
    setUploading(false);
  };

  const removeImage = (idx) => {
    setForm(f => {
      const imgs = f.images.filter((_, i) => i !== idx);
      return { ...f, images: imgs, thumbnail: imgs[0] || '' };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        comparePrice: Number(form.comparePrice) || 0,
        costPrice: Number(form.costPrice) || 0,
        stock: Number(form.stock) || 0,
        weight: Number(form.weight) || 0,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      if (isEdit) {
        await productAPI.update(id, payload);
        toast.success('Product updated!');
      } else {
        await productAPI.create(payload);
        toast.success('Product created!');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setLoading(false);
  };

  const Field = ({ label, name, type = 'text', placeholder, required, className = '' }) => (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <input
        type={type}
        name={name}
        value={form[name] || ''}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04] transition-colors"
      />
    </div>
  );

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a2e]">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-sm text-gray-500">Fill in the product details below</p>
        </div>
        <button onClick={() => navigate('/admin/products')} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-[#1a1a2e]">Basic Information</h2>
          <Field label="Product Name" name="name" required placeholder="e.g. iPhone 15 Pro Max" className="col-span-2" />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Short Description</label>
            <input type="text" name="shortDescription" value={form.shortDescription} onChange={handleChange}
              placeholder="Brief product summary"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Description <span className="text-red-500">*</span></label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={5}
              placeholder="Detailed product description..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04] resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tags (comma separated)</label>
            <input type="text" name="tags" value={form.tags} onChange={handleChange}
              placeholder="e.g. electronics, apple, smartphone"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]" />
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1a1a2e] mb-4">Pricing & Inventory</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <Field label="Selling Price (₦)" name="price" type="number" required placeholder="0" />
            <Field label="Compare Price (₦)" name="comparePrice" type="number" placeholder="Original price" />
            <Field label="Cost Price (₦)" name="costPrice" type="number" placeholder="Your cost" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Stock Quantity" name="stock" type="number" placeholder="0" />
            <Field label="SKU" name="sku" placeholder="Product-001" />
            <Field label="Weight (grams)" name="weight" type="number" placeholder="0" />
          </div>
        </div>

        {/* Category & Brand */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1a1a2e] mb-4">Category & Brand</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Category <span className="text-red-500">*</span></label>
              <select name="category" value={form.category} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04] bg-white">
                <option value="">Select category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <Field label="Brand" name="brand" placeholder="e.g. Apple, Samsung" />
          </div>
        </div>

        {/* Images */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1a1a2e] mb-4">Product Images</h2>
          <label className="block border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-[#e85d04] transition-colors">
            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
            <div className="text-3xl mb-2">{uploading ? '⏳' : '📸'}</div>
            <p className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload images (max 5MB each)'}</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP supported</p>
          </label>

          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {form.images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img.startsWith('http') ? img : img} alt="" className="w-20 h-20 object-cover rounded-xl border-2 border-gray-100" />
                  {i === 0 && <span className="absolute -top-2 -left-2 bg-[#e85d04] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">Main</span>}
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Or use URL */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Or enter image URL directly</label>
            <div className="flex gap-2">
              <input type="text" placeholder="https://..." id="imgUrl"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]" />
              <button type="button"
                onClick={() => {
                  const val = document.getElementById('imgUrl').value.trim();
                  if (val) { setForm(f => ({ ...f, images: [...f.images, val], thumbnail: f.thumbnail || val })); document.getElementById('imgUrl').value = ''; }
                }}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Flags */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1a1a2e] mb-4">Product Flags</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: 'isActive', label: '✅ Active (visible to customers)' },
              { name: 'isFeatured', label: '⭐ Featured Product' },
              { name: 'isNew', label: '🆕 New Arrival' },
              { name: 'freeShipping', label: '🚚 Free Shipping' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" name={name} checked={form[name] || false} onChange={handleChange} className="w-4 h-4 accent-[#e85d04]" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 bg-[#e85d04] text-white font-bold py-3.5 rounded-2xl hover:bg-[#c44d03] transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>{isEdit ? 'Saving...' : 'Creating...'}</> : isEdit ? '💾 Save Changes' : '➕ Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')}
            className="px-6 py-3.5 border border-gray-200 text-gray-700 rounded-2xl hover:border-gray-300 transition-colors font-semibold">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
