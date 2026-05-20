import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI, categoryAPI } from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';

/* ─── Hero ─────────────────────────────────────────────────────── */
const Hero = ({ navigate }) => {
  const [search, setSearch] = useState('');
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?keyword=${encodeURIComponent(search.trim())}`);
  };
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#e85d04]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#ffd166]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 relative z-10">
        <div className="max-w-2xl">
          <span className="inline-block bg-[#e85d04]/20 text-[#f48c42] text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            🛍️ Nigeria's Premium Store
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
            Shop Smart,<br /><span className="text-[#e85d04]">Live Better</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            Thousands of quality products across electronics, fashion, home &amp; more. Fast delivery across Nigeria.
          </p>
          <form onSubmit={handleSearch} className="flex mb-8 shadow-2xl rounded-2xl overflow-hidden">
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands, categories…"
              className="flex-1 px-5 py-4 bg-white/10 backdrop-blur-sm border border-white/20 border-r-0 text-white placeholder-gray-400 outline-none text-sm"
            />
            <button type="submit" className="px-7 py-4 bg-[#e85d04] hover:bg-[#c44d03] text-white font-bold text-sm transition-colors shrink-0">
              Search
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {[['💻 Electronics','Electronics'],['👗 Fashion','Fashion'],['💄 Beauty','Beauty'],['🏠 Home','Home'],['⚽ Sports','Sports']].map(([label, kw]) => (
              <Link key={kw} to={`/products?keyword=${kw}`}
                className="text-sm bg-white/10 hover:bg-[#e85d04] border border-white/20 rounded-full px-4 py-1.5 text-gray-300 hover:text-white transition-all">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['📦','50K+ Products'],['🚀','Fast Delivery'],['🔒','Secure Payment'],['↩️','7-Day Returns']].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <span className="text-sm text-gray-300 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Section Header ─────────────────────────────────────────────── */
const SectionHeader = ({ title, subtitle, link, linkLabel = 'View all →' }) => (
  <div className="flex items-end justify-between mb-6">
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]" style={{ fontFamily: 'Sora, sans-serif' }}>{title}</h2>
      {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
    </div>
    {link && <Link to={link} className="text-sm text-[#e85d04] font-semibold hover:underline whitespace-nowrap">{linkLabel}</Link>}
  </div>
);

/* ─── Product Grid ───────────────────────────────────────────────── */
const ProductGrid = ({ products, loading, count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
    {loading
      ? Array(count).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)
      : products.length > 0
        ? products.slice(0, count).map((p) => <ProductCard key={p._id} product={p} />)
        : (
          <div className="col-span-4 py-14 text-center">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-gray-500 font-medium">Products loading… make sure your backend is running.</p>
            <Link to="/products" className="mt-4 inline-block text-sm text-[#e85d04] font-semibold hover:underline">Browse all products</Link>
          </div>
        )
    }
  </div>
);

/* ─── Home Page ──────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();

  // Each section has its own state so they load independently
  const [categories,   setCategories]   = useState([]);
  const [featured,     setFeatured]     = useState([]);
  const [bestSellers,  setBestSellers]  = useState([]);
  const [newArrivals,  setNewArrivals]  = useState([]);
  const [allProducts,  setAllProducts]  = useState([]);

  const [loadingCats,  setLoadingCats]  = useState(true);
  const [loadingFeat,  setLoadingFeat]  = useState(true);
  const [loadingBest,  setLoadingBest]  = useState(true);
  const [loadingNew,   setLoadingNew]   = useState(true);
  const [loadingAll,   setLoadingAll]   = useState(true);

  useEffect(() => {
    categoryAPI.getAll()
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));

    productAPI.getFeatured()
      .then(({ data }) => setFeatured(data.products || []))
      .catch(() => setFeatured([]))
      .finally(() => setLoadingFeat(false));

    productAPI.getBestSellers()
      .then(({ data }) => setBestSellers(data.products || []))
      .catch(() => setBestSellers([]))
      .finally(() => setLoadingBest(false));

    productAPI.getNewArrivals()
      .then(({ data }) => setNewArrivals(data.products || []))
      .catch(() => setNewArrivals([]))
      .finally(() => setLoadingNew(false));

    productAPI.getAll({ page: 1, limit: 30, sort: 'newest' })
      .then(({ data }) => setAllProducts(data.products || []))
      .catch(() => setAllProducts([]))
      .finally(() => setLoadingAll(false));
  }, []);

  const STATIC_CATS = [
    { label:'Electronics', icon:'💻', kw:'Electronics' },
    { label:'Fashion', icon:'👗', kw:'Fashion' },
    { label:'Home & Living', icon:'🏠', kw:'Home' },
    { label:'Beauty & Health', icon:'💄', kw:'Beauty' },
    { label:'Sports & Fitness', icon:'⚽', kw:'Sports' },
    { label:'Books', icon:'📚', kw:'Books' },
    { label:'Food & Grocery', icon:'🛒', kw:'Food' },
    { label:'Toys & Kids', icon:'🧸', kw:'Toys' },
  ];

  return (
    <div>
      <Hero navigate={navigate} />

      {/* ── Categories ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <SectionHeader title="Shop by Category" subtitle="Browse our wide range of product categories" link="/products" linkLabel="All products →" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {loadingCats
            ? Array(8).fill(null).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)
            : (categories.length > 0 ? categories.slice(0, 8) : STATIC_CATS).map((cat) => {
                const to   = cat._id ? `/products?category=${cat._id}` : `/products?keyword=${cat.kw || cat.name}`;
                const name = cat.name || cat.label;
                return (
                  <Link key={cat._id || cat.kw} to={to}
                    className="flex flex-col items-center justify-center p-4 bg-white hover:bg-orange-50 border border-gray-100 hover:border-[#e85d04]/50 rounded-2xl transition-all group cursor-pointer shadow-sm hover:shadow-md">
                    <div className="w-12 h-12 bg-orange-50 group-hover:bg-[#e85d04] rounded-xl flex items-center justify-center text-2xl mb-2 transition-all group-hover:scale-110">
                      {cat.icon}
                    </div>
                    <span className="text-xs font-bold text-center text-gray-700 group-hover:text-[#e85d04] transition-colors leading-tight">{name}</span>
                  </Link>
                );
              })
          }
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <SectionHeader title="Featured Products ⭐" subtitle="Hand-picked top quality items" link="/products?featured=true" />
        <ProductGrid products={featured} loading={loadingFeat} count={12} />
      </section>

      {/* ── Promo Banners ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#e85d04] to-[#f4a261] p-8 text-white min-h-[180px] flex flex-col justify-between">
            <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/10 rounded-full" />
            <div className="absolute right-14 -top-5 w-20 h-20 bg-white/10 rounded-full" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>New Arrivals 🆕</h3>
              <p className="text-white/80 mb-5 text-sm">Fresh products added daily. Be first to grab them.</p>
            </div>
            <Link to="/products?newArrival=true" className="relative z-10 self-start bg-white text-[#e85d04] font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-colors shadow">
              Shop Now →
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1a2e] to-[#2d2d54] p-8 text-white min-h-[180px] flex flex-col justify-between">
            <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <span className="text-xs bg-[#ffd166] text-[#1a1a2e] font-bold px-3 py-1 rounded-full inline-block mb-3">FREE SHIPPING</span>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Orders Over ₦50K</h3>
              <p className="text-gray-300 mb-5 text-sm">Nationwide delivery. Fast and free, no hidden fees.</p>
            </div>
            <Link to="/products" className="relative z-10 self-start bg-[#e85d04] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#c44d03] transition-colors shadow">
              Explore →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Best Sellers ── */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader title="Best Sellers 🔥" subtitle="Top picks loved by our customers this week" link="/products?sort=popular" />
          <ProductGrid products={bestSellers} loading={loadingBest} count={20} />
        </div>
      </section>

      {/* ── New Arrivals ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <SectionHeader title="New Arrivals ✨" subtitle="Just landed — the freshest additions to our store" link="/products?newArrival=true" />
        <ProductGrid products={newArrivals} loading={loadingNew} count={20} />
      </section>

      {/* ── All Products (deduplicated from sections above) ── */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader title="Explore All Products 🛍️" subtitle="Every product in our store — something for everyone" link="/products" linkLabel="Browse all →" />
          <ProductGrid
            products={allProducts.filter(p =>
              !featured.some(f => f._id === p._id) &&
              !bestSellers.some(b => b._id === p._id)
            )}
            loading={loadingAll}
            count={30}
          />
        </div>
      </section>

      {/* ── Why HabiShop ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeader title="Why HabiShop? 💎" subtitle="The smarter way to shop in Nigeria" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon:'🚀', title:'Fast Delivery', desc:'Same-day delivery in Lagos. Next-day to all 36 states.' },
            { icon:'✅', title:'Verified Products', desc:'Every product quality-checked before it reaches your door.' },
            { icon:'🔒', title:'Secure Payment', desc:'Paystack-powered. Your card data is always 100% safe.' },
            { icon:'💬', title:'24/7 Support', desc:'Our team is always here to help via chat, call, or email.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="text-center p-6 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all group bg-white">
              <div className="w-14 h-14 bg-orange-50 group-hover:bg-[#e85d04] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 transition-colors">{icon}</div>
              <h3 className="font-bold text-[#1a1a2e] mb-2 text-base">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="bg-[#1a1a2e] py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
            Get Exclusive Deals 🎁
          </h2>
          <p className="text-gray-400 mb-6 text-sm">Subscribe and get 10% off your first order + early access to sales.</p>
          <div className="flex max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl">
            <input type="email" placeholder="your@email.com"
              className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 border-r-0 text-white placeholder-gray-500 outline-none text-sm" />
            <button className="px-6 py-3.5 bg-[#e85d04] text-white font-bold text-sm hover:bg-[#c44d03] transition-colors shrink-0">
              Subscribe
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            No spam. Unsubscribe anytime. Use code <span className="text-[#ffd166] font-bold">WELCOME10</span> at checkout.
          </p>
        </div>
      </section>
    </div>
  );
}
