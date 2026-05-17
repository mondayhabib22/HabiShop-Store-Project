// Wishlist.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { wishlistAPI } from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wishlistAPI.get().then(({ data }) => setItems(data.wishlist)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-8" style={{ fontFamily: 'Sora, sans-serif' }}>
        My Wishlist {!loading && <span className="text-gray-400 font-normal text-lg">({items.length})</span>}
      </h1>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <ProductCardSkeleton key={i}/>)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🤍</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Save items you love to your wishlist</p>
          <Link to="/products" className="bg-[#e85d04] text-white font-bold px-6 py-3 rounded-2xl hover:bg-[#c44d03] transition-colors">Explore Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map(p => <ProductCard key={p._id} product={p}/>)}
        </div>
      )}
    </div>
  );
}
