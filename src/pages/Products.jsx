import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productAPI, categoryAPI } from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';
import { formatPrice } from '../utils/helpers';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'popular',   label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc',label: 'Price: High → Low' },
  { value: 'rating',    label: 'Top Rated' },
];

const PRICE_PRESETS = [
  { label: 'Under ₦5k',   min: '', max: '5000' },
  { label: '₦5k–₦20k',   min: '5000', max: '20000' },
  { label: '₦20k–₦100k', min: '20000', max: '100000' },
  { label: 'Over ₦100k',  min: '100000', max: '' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [sidebarOpen,setSidebarOpen]= useState(false);
  const [localMin,   setLocalMin]   = useState('');
  const [localMax,   setLocalMax]   = useState('');

  const keyword    = searchParams.get('keyword')    || '';
  const category   = searchParams.get('category')   || '';
  const sort       = searchParams.get('sort')        || 'newest';
  const page       = Number(searchParams.get('page'))|| 1;
  const minPrice   = searchParams.get('minPrice')    || '';
  const maxPrice   = searchParams.get('maxPrice')    || '';
  const featured   = searchParams.get('featured')    || '';
  const newArrival = searchParams.get('newArrival')  || '';
  const freeShip   = searchParams.get('freeShipping')|| '';

  // Sync local price inputs with URL params
  useEffect(() => { setLocalMin(minPrice); setLocalMax(maxPrice); }, [minPrice, maxPrice]);

  // Load categories once
  useEffect(() => {
    categoryAPI.getAll()
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 24, sort };
      if (keyword)    params.keyword    = keyword;
      if (category)   params.category   = category;
      if (minPrice)   params.minPrice   = minPrice;
      if (maxPrice)   params.maxPrice   = maxPrice;
      if (featured)   params.featured   = featured;
      if (newArrival) params.newArrival = newArrival;
      if (freeShip)   params.freeShipping = freeShip;

      const { data } = await productAPI.getAll(params);
      setProducts(data.products || []);
      setTotal(data.total  || 0);
      setPages(data.pages  || 1);
    } catch (err) {
      console.error('Products fetch error:', err);
      setError('Failed to load products. Please check your connection.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, category, sort, page, minPrice, maxPrice, featured, newArrival, freeShip]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const applyPrice = () => {
    const p = new URLSearchParams(searchParams);
    if (localMin) p.set('minPrice', localMin); else p.delete('minPrice');
    if (localMax) p.set('maxPrice', localMax); else p.delete('maxPrice');
    p.delete('page');
    setSearchParams(p);
  };

  const applyPreset = (min, max) => {
    const p = new URLSearchParams(searchParams);
    if (min) p.set('minPrice', min); else p.delete('minPrice');
    if (max) p.set('maxPrice', max); else p.delete('maxPrice');
    p.delete('page');
    setSearchParams(p);
    setLocalMin(min); setLocalMax(max);
  };

  const clearAll = () => {
    setLocalMin(''); setLocalMax('');
    setSearchParams({});
  };

  const hasFilters = keyword || category || minPrice || maxPrice || featured || newArrival || freeShip;

  const pageTitle = keyword    ? `"${keyword}"`
    : featured    ? 'Featured Products'
    : newArrival  ? 'New Arrivals'
    : category    ? (categories.find(c => c._id === category)?.name || 'Category')
    : 'All Products';

  /* ── Filter Sidebar content ── */
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categories</p>
        <div className="space-y-1">
          <button onClick={() => setParam('category', '')}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${!category ? 'bg-[#e85d04] text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
            All Categories
          </button>
          {categories.map((cat) => (
            <button key={cat._id} onClick={() => setParam('category', cat._id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${category === cat._id ? 'bg-[#e85d04] text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Price Range</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRICE_PRESETS.map((pr) => {
            const active = minPrice === pr.min && maxPrice === pr.max;
            return (
              <button key={pr.label} onClick={() => applyPreset(pr.min, pr.max)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${active ? 'border-[#e85d04] bg-orange-50 text-[#e85d04] font-medium' : 'border-gray-200 text-gray-600 hover:border-[#e85d04]'}`}>
                {pr.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 items-center mb-2">
          <input type="number" placeholder="Min ₦" value={localMin} onChange={(e) => setLocalMin(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#e85d04]" />
          <span className="text-gray-400 shrink-0">–</span>
          <input type="number" placeholder="Max ₦" value={localMax} onChange={(e) => setLocalMax(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#e85d04]" />
        </div>
        <button onClick={applyPrice} className="w-full bg-[#1a1a2e] text-white text-sm py-2 rounded-xl hover:bg-[#e85d04] transition-colors font-medium">
          Apply Price
        </button>
      </div>

      {/* Quick Filters */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Filters</p>
        <div className="space-y-2">
          {[
            { label:'⭐ Featured',      key:'featured',     val:'true' },
            { label:'🆕 New Arrivals',  key:'newArrival',   val:'true' },
            { label:'🚚 Free Shipping', key:'freeShipping', val:'true' },
          ].map(({ label, key, val }) => {
            const active = searchParams.get(key) === val;
            return (
              <button key={key} onClick={() => setParam(key, active ? '' : val)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm border transition-all ${active ? 'border-[#e85d04] bg-orange-50 text-[#e85d04] font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {hasFilters && (
        <button onClick={clearAll} className="w-full text-sm text-red-500 border border-red-200 py-2.5 rounded-xl hover:bg-red-50 transition-colors font-medium">
          ✕ Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]" style={{ fontFamily: 'Sora, sans-serif' }}>
            {pageTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading products…' : `${total} product${total !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-[#e85d04] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-[#e85d04] inline-block" />}
          </button>
          {/* Sort */}
          <select value={sort} onChange={(e) => setParam('sort', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 outline-none focus:border-[#e85d04] bg-white cursor-pointer">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Category quick-filter horizontal scroll bar */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button
            onClick={() => setParam('category', '')}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all whitespace-nowrap ${
              !category ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#e85d04] hover:text-[#e85d04]'
            }`}
          >
            🛍️ All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setParam('category', cat._id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all whitespace-nowrap ${
                category === cat._id
                  ? 'bg-[#e85d04] text-white border-[#e85d04] shadow-md shadow-orange-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#e85d04] hover:text-[#e85d04]'
              }`}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-5">
          {keyword && <span className="text-xs bg-orange-100 text-[#e85d04] px-3 py-1.5 rounded-full font-medium flex items-center gap-2">🔍 "{keyword}" <button onClick={() => setParam('keyword','')} className="ml-1 hover:text-red-500">×</button></span>}
          {category && categories.find(c=>c._id===category) && <span className="text-xs bg-orange-100 text-[#e85d04] px-3 py-1.5 rounded-full font-medium flex items-center gap-2">{categories.find(c=>c._id===category)?.icon} {categories.find(c=>c._id===category)?.name} <button onClick={() => setParam('category','')} className="ml-1 hover:text-red-500">×</button></span>}
          {(minPrice || maxPrice) && <span className="text-xs bg-orange-100 text-[#e85d04] px-3 py-1.5 rounded-full font-medium flex items-center gap-2">💰 {minPrice ? `₦${Number(minPrice).toLocaleString()}` : '₦0'} – {maxPrice ? `₦${Number(maxPrice).toLocaleString()}` : '∞'} <button onClick={() => { setParam('minPrice',''); setParam('maxPrice',''); setLocalMin(''); setLocalMax(''); }} className="ml-1 hover:text-red-500">×</button></span>}
          {featured && <span className="text-xs bg-orange-100 text-[#e85d04] px-3 py-1.5 rounded-full font-medium flex items-center gap-2">⭐ Featured <button onClick={() => setParam('featured','')} className="ml-1 hover:text-red-500">×</button></span>}
          {newArrival && <span className="text-xs bg-orange-100 text-[#e85d04] px-3 py-1.5 rounded-full font-medium flex items-center gap-2">🆕 New <button onClick={() => setParam('newArrival','')} className="ml-1 hover:text-red-500">×</button></span>}
          {freeShip && <span className="text-xs bg-orange-100 text-[#e85d04] px-3 py-1.5 rounded-full font-medium flex items-center gap-2">🚚 Free Ship <button onClick={() => setParam('freeShipping','')} className="ml-1 hover:text-red-500">×</button></span>}
          <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 transition-colors">Clear all</button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <FilterContent />
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="w-72 bg-white h-full overflow-y-auto p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg text-[#1a1a2e]">Filters</h2>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-xl">×</button>
              </div>
              <FilterContent />
              <button onClick={() => setSidebarOpen(false)} className="w-full mt-6 bg-[#e85d04] text-white font-bold py-3 rounded-2xl">
                Show {total} Products
              </button>
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* Main Grid */}
        <div className="flex-1 min-w-0">
          {error ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Failed to load products</h3>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <button onClick={fetchProducts} className="bg-[#e85d04] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#c44d03] transition-colors">
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {Array(12).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No products found</h3>
              <p className="text-gray-500 mb-2">Try adjusting your search or filters</p>
              {keyword && <p className="text-sm text-gray-400 mb-6">No results for "<span className="font-semibold">{keyword}</span>"</p>}
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={clearAll} className="bg-[#e85d04] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#c44d03] transition-colors text-sm">
                  Clear Filters
                </button>
                <Link to="/products" className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-semibold hover:border-[#e85d04] hover:text-[#e85d04] transition-colors text-sm">
                  Browse All
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
                  <button disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:border-[#e85d04] hover:text-[#e85d04] transition-colors">
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                    // Show pages near current
                    let p2;
                    if (pages <= 7) p2 = i + 1;
                    else if (page <= 4) p2 = i + 1;
                    else if (page >= pages - 3) p2 = pages - 6 + i;
                    else p2 = page - 3 + i;
                    return (
                      <button key={p2} onClick={() => setParam('page', String(p2))}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${p2 === page ? 'bg-[#e85d04] text-white shadow-md' : 'border border-gray-200 hover:border-[#e85d04] hover:text-[#e85d04]'}`}>
                        {p2}
                      </button>
                    );
                  })}
                  <button disabled={page >= pages} onClick={() => setParam('page', String(page + 1))}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:border-[#e85d04] hover:text-[#e85d04] transition-colors">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
