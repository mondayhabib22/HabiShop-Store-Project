import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../../utils/api';
import { formatPrice, getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.keyword = search;
      const { data } = await productAPI.getAll(params);
      setProducts(data.products);
      setPages(data.pages);
      setTotal(data.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    }
    setDeleting(null);
  };

  const toggleFeatured = async (product) => {
    try {
      await productAPI.update(product._id, { isFeatured: !product.isFeatured });
      toast.success(`${product.isFeatured ? 'Removed from' : 'Added to'} featured`);
      fetchProducts();
    } catch (_) { toast.error('Failed to update'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a2e]">Products</h1>
          <p className="text-sm text-gray-500">{total} total products</p>
        </div>
        <Link to="/admin/products/new" className="bg-[#e85d04] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#c44d03] transition-colors text-sm flex items-center gap-2">
          ➕ Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="text-left p-4 font-semibold">Product</th>
                <th className="text-left p-4 font-semibold">Price</th>
                <th className="text-left p-4 font-semibold">Stock</th>
                <th className="text-left p-4 font-semibold">Rating</th>
                <th className="text-left p-4 font-semibold">Featured</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(8).fill(null).map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(null).map((_, j) => (
                      <td key={j} className="p-4"><div className="skeleton h-4 rounded-lg"/></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No products found</td></tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(product.thumbnail)}
                          alt={product.name}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/48'; }}
                        />
                        <div>
                          <p className="font-semibold text-[#1a1a2e] line-clamp-1 max-w-xs">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.brand || product.category?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#1a1a2e]">{formatPrice(product.price)}</p>
                      {product.comparePrice > product.price && (
                        <p className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        product.stock === 0 ? 'bg-red-100 text-red-700' :
                        product.stock <= 5 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="font-semibold">{product.rating}</span>
                        <span className="text-xs text-gray-400">({product.numReviews})</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleFeatured(product)}
                        className={`text-lg ${product.isFeatured ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'} transition-colors`}
                        title={product.isFeatured ? 'Remove from featured' : 'Add to featured'}
                      >
                        ★
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/products/${product._id}/edit`} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          disabled={deleting === product._id}
                          className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                        >
                          {deleting === product._id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:border-[#e85d04]">← Prev</button>
            <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:border-[#e85d04]">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
