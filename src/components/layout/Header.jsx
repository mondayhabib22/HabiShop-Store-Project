import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { productAPI } from '../../utils/api';
import { formatPrice, getImageUrl } from '../../utils/helpers';

/* ── Icons ─────────────────────────────────────────────────────────── */
const SearchIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const CartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const HeartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SpinnerIcon = () => (
  <div className="w-4 h-4 border-2 border-[#e85d04] border-t-transparent rounded-full animate-spin" />
);

/* ── Search Dropdown ────────────────────────────────────────────────── */
function SearchBar({ mobile = false, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hs_recent') || '[]'); } catch { return []; }
  });

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  const doSearch = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await productAPI.getAll({ keyword: q.trim(), limit: 6, page: 1 });
      setResults(data.products || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIdx(-1);
    setOpen(true);
    clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      setLoading(true);
      debounceRef.current = setTimeout(() => doSearch(val), 350);
    } else {
      setResults([]);
      setLoading(false);
    }
  };

  const saveRecent = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter(r => r !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('hs_recent', JSON.stringify(updated));
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('hs_recent');
  };

  const goToSearch = (q) => {
    if (!q.trim()) return;
    saveRecent(q.trim());
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(`/products?keyword=${encodeURIComponent(q.trim())}`);
    onClose?.();
  };

  const goToProduct = (product) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(`/products/${product._id}`);
    onClose?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeIdx >= 0 && results[activeIdx]) {
      goToProduct(results[activeIdx]);
    } else {
      goToSearch(query);
    }
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  const showDropdown = open && (
    loading ||
    results.length > 0 ||
    (query.trim().length === 0 && recentSearches.length > 0) ||
    (query.trim().length >= 2 && !loading && results.length === 0)
  );

  const discount = (p) => p.comparePrice > p.price
    ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0;

  return (
    <div className={`relative ${mobile ? 'w-full' : 'flex-1 max-w-xl'}`}>
      <form onSubmit={handleSubmit}>
        <div className={`flex items-center bg-gray-50 border rounded-xl overflow-hidden transition-all
          ${open ? 'border-[#e85d04] ring-2 ring-[#e85d04]/20' : 'border-gray-200'}
          ${mobile ? 'w-full' : ''}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search products, brands, categories…"
            autoComplete="off"
            className="flex-1 px-4 py-2.5 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
          />
          <div className="px-3 flex items-center">
            {loading
              ? <SpinnerIcon />
              : query
                ? (
                  <button type="button" onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
                    className="text-gray-400 hover:text-gray-600 mr-1">
                    <XIcon />
                  </button>
                ) : null
            }
            <button type="submit" className="text-[#e85d04] hover:text-[#c44d03] transition-colors">
              <SearchIcon />
            </button>
          </div>
        </div>
      </form>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden"
          style={{ maxHeight: '480px', overflowY: 'auto' }}
        >
          {/* Recent searches (when input is empty) */}
          {query.trim().length === 0 && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Searches</span>
                <button onClick={clearRecent} className="text-xs text-[#e85d04] hover:underline">Clear</button>
              </div>
              {recentSearches.map((r) => (
                <button key={r} onClick={() => goToSearch(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left group">
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-[#e85d04] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-600 group-hover:text-[#1a1a2e]">{r}</span>
                  <svg className="w-3 h-3 text-gray-300 ml-auto group-hover:text-[#e85d04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" transform="rotate(45 12 12)" />
                  </svg>
                </button>
              ))}
              <div className="border-t border-gray-50 mt-1 px-4 py-2.5">
                <button onClick={() => goToSearch(recentSearches[0] || '')}
                  className="text-xs text-[#e85d04] font-semibold hover:underline">
                  Browse all products →
                </button>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && query.trim().length >= 2 && (
            <div className="p-3 space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 rounded w-3/4" />
                    <div className="skeleton h-3 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Products ({results.length})
                </span>
                <button onClick={() => goToSearch(query)}
                  className="text-xs text-[#e85d04] font-semibold hover:underline">
                  See all results →
                </button>
              </div>

              {results.map((product, idx) => {
                const disc = discount(product);
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={product._id}
                    onClick={() => goToProduct(product)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 shrink-0 bg-gray-50">
                      <img
                        src={getImageUrl(product.thumbnail)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/56x56?text=?'; }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a1a2e] truncate leading-snug">
                        {product.name}
                      </p>
                      {product.brand && (
                        <p className="text-xs text-gray-400 mt-0.5">{product.brand}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {product.rating > 0 && (
                          <span className="text-xs text-yellow-500 font-medium">⭐ {product.rating}</span>
                        )}
                        {product.category?.name && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{product.category.name}</span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#e85d04]">{formatPrice(product.price)}</p>
                      {disc > 0 && (
                        <span className="text-[10px] bg-[#e85d04] text-white px-1.5 py-0.5 rounded-full font-bold">-{disc}%</span>
                      )}
                      {product.stock === 0 && (
                        <span className="text-[10px] text-red-500 font-medium block mt-0.5">Out of stock</span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* See all results footer */}
              <button
                onClick={() => goToSearch(query)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-orange-50 border-t border-gray-100 text-sm font-semibold text-[#e85d04] hover:text-[#c44d03] transition-colors"
              >
                <SearchIcon className="w-4 h-4" />
                See all results for "{query}"
              </button>
            </div>
          )}

          {/* No results */}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm font-semibold text-gray-700 mb-1">No results for "{query}"</p>
              <p className="text-xs text-gray-400 mb-3">Try a different search term or browse categories</p>
              <button onClick={() => goToSearch(query)}
                className="text-xs bg-[#e85d04] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#c44d03] transition-colors">
                Search anyway →
              </button>
            </div>
          )}

          {/* Trending / quick links (when empty & no recents) */}
          {query.trim().length === 0 && recentSearches.length === 0 && (
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {['iPhone','Samsung','Sneakers','Skincare','Laptop','Yoga Mat','Books','Kids Toys'].map((tag) => (
                  <button key={tag} onClick={() => goToSearch(tag)}
                    className="text-xs bg-gray-100 hover:bg-orange-100 hover:text-[#e85d04] text-gray-600 px-3 py-1.5 rounded-full transition-colors font-medium">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Header ─────────────────────────────────────────────────────────── */
export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Shop' },
    { to: '/products?featured=true', label: 'Featured' },
    { to: '/products?newArrival=true', label: 'New Arrivals' },
  ];

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'border-b border-gray-100'}`}>
      {/* Top promo bar */}
      <div className="bg-[#1a1a2e] text-white text-xs py-2 text-center px-4">
        🎉 Free shipping on orders over ₦50,000! Use code{' '}
        <span className="font-bold text-[#ffd166]">WELCOME10</span> for 10% off your first order
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-[#e85d04] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">H</div>
            <span className="font-bold text-xl text-[#1a1a2e] hidden sm:block" style={{ fontFamily: 'Sora, sans-serif' }}>
              Habi<span className="text-[#e85d04]">Shop</span>
            </span>
          </Link>

          {/* Desktop Search bar with live dropdown */}
          <div className="flex-1 hidden md:flex mx-4">
            <SearchBar />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile search toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-[#e85d04] rounded-lg hover:bg-orange-50 transition-colors"
            >
              <SearchIcon />
            </button>

            {user && (
              <Link to="/wishlist" className="p-2 text-gray-600 hover:text-[#e85d04] transition-colors rounded-lg hover:bg-orange-50">
                <HeartIcon />
              </Link>
            )}

            <Link to="/cart" className="p-2 text-gray-600 hover:text-[#e85d04] transition-colors rounded-lg hover:bg-orange-50 relative">
              <CartIcon />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#e85d04] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#e85d04] to-[#f4a261] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name?.split(' ')[0]}</span>
                  <svg className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-bold text-sm text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                    </div>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 font-semibold transition-colors">
                        <span>🛡️</span> Admin Panel
                      </Link>
                    )}
                    {[
                      { to: '/profile', icon: '👤', label: 'My Profile' },
                      { to: '/orders', icon: '📦', label: 'My Orders' },
                      { to: '/wishlist', icon: '❤️', label: 'Wishlist' },
                    ].map(({ to, icon, label }) => (
                      <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <span>{icon}</span> {label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 mt-1">
                      <button onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors font-medium">
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="text-sm text-gray-600 hover:text-[#e85d04] font-medium px-3 py-2 transition-colors">Login</Link>
                <Link to="/register" className="text-sm bg-[#e85d04] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#c44d03] transition-colors shadow-sm">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile search bar (slides down) */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <SearchBar mobile onClose={() => setMobileSearchOpen(false)} />
          </div>
        )}

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center justify-between pb-2">
          <div className="flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  (to === '/' ? location.pathname === '/' : location.pathname + location.search === to || location.search === to.replace(/^\/[^?]*/, ''))
                    ? 'text-[#e85d04] bg-orange-50'
                    : 'text-gray-600 hover:text-[#e85d04] hover:bg-orange-50'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span>🚚</span> Free shipping ₦50k+</span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1"><span>📞</span> Support 24/7</span>
            <span className="text-gray-200">|</span>
            <Link to="/products?featured=true" className="text-[#e85d04] font-semibold hover:underline">Deals</Link>
          </div>
        </nav>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2 shadow-lg">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to}
              className="flex items-center justify-between text-sm font-medium text-gray-700 py-2.5 border-b border-gray-50 hover:text-[#e85d04] transition-colors">
              {label}
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
          {!user && (
            <div className="flex gap-3 pt-3">
              <Link to="/login" className="flex-1 text-center text-sm border-2 border-gray-200 rounded-2xl py-2.5 font-semibold text-gray-700 hover:border-[#e85d04] hover:text-[#e85d04] transition-colors">
                Login
              </Link>
              <Link to="/register" className="flex-1 text-center text-sm bg-[#e85d04] text-white rounded-2xl py-2.5 font-bold hover:bg-[#c44d03] transition-colors">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
