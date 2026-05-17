import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { wishlistAPI } from '../../utils/api';
import { formatPrice, getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

const StarRating = ({ rating, count }) => (
  <div className="flex items-center gap-1">
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    {count > 0 && <span className="text-xs text-gray-400">({count})</span>}
  </div>
);

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(true);
    await addToCart(product._id, 1);
    setAddingToCart(false);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to save items'); return; }
    try {
      const { data } = await wishlistAPI.toggle(product._id);
      const isNowWishlisted = data.action === 'added';
      setWishlisted(isNowWishlisted);
      toast.success(isNowWishlisted ? 'Added to wishlist ❤️' : 'Removed from wishlist');
    } catch (_) { toast.error('Failed to update wishlist'); }
  };

  const discount = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <Link to={`/products/${product._id}`} className="product-card group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all duration-300">
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square">
        <img
          src={getImageUrl(product.thumbnail)}
          alt={product.name}
          className="product-img w-full h-full object-cover transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="bg-[#e85d04] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          {product.isNew && (
            <span className="bg-[#1a1a2e] text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
          )}
          {product.stock === 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Out of Stock</span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
            wishlisted ? 'bg-red-500 text-white scale-110' : 'bg-white text-gray-400 hover:text-red-500 hover:scale-110'
          }`}
        >
          <svg className="w-4 h-4" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Quick add to cart overlay */}
        <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addingToCart}
            className="w-full bg-[#1a1a2e] text-white text-sm font-semibold py-3 hover:bg-[#e85d04] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {addingToCart ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {product.brand && (
          <p className="text-xs text-[#e85d04] font-semibold uppercase tracking-wide mb-1">{product.brand}</p>
        )}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-[#e85d04] transition-colors">
          {product.name}
        </h3>
        <StarRating rating={product.rating} count={product.numReviews} />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-base font-bold text-[#1a1a2e]">{formatPrice(product.price)}</span>
          {product.comparePrice > product.price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
          )}
        </div>
        {product.freeShipping && (
          <span className="text-xs text-green-600 font-medium">✓ Free Shipping</span>
        )}
      </div>
    </Link>
  );
}
