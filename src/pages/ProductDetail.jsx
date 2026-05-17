import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI, reviewAPI, wishlistAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';
import { formatPrice, formatDate, getImageUrl } from '../utils/helpers';
import toast from 'react-hot-toast';

const StarRating = ({ rating, interactive = false, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type={interactive ? 'button' : undefined}
        onClick={() => interactive && onChange && onChange(star)}
        className={interactive ? 'cursor-pointer' : 'cursor-default'}
      >
        <svg className={`w-5 h-5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </button>
    ))}
  </div>
);

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const [pRes, rRes, relRes] = await Promise.all([
          productAPI.getById(id),
          reviewAPI.getForProduct(id, { limit: 10 }),
          productAPI.getRelated(id),
        ]);
        setProduct(pRes.data.product);
        setReviews(rRes.data.reviews);
        setRelated(relRes.data.products);
        setActiveImage(0);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(product._id, quantity);
    setAdding(false);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); return; }
    try {
      const { data } = await wishlistAPI.toggle(product._id);
      setWishlisted(data.action === 'added');
      toast.success(data.action === 'added' ? 'Added to wishlist ❤️' : 'Removed from wishlist');
    } catch (_) { toast.error('Failed'); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.title || !reviewForm.comment) { toast.error('Please fill all fields'); return; }
    setSubmittingReview(true);
    try {
      const { data } = await reviewAPI.create(id, reviewForm);
      setReviews((prev) => [data.review, ...prev]);
      setReviewForm({ rating: 5, title: '', comment: '' });
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    }
    setSubmittingReview(false);
  };

  const discount = product?.comparePrice > product?.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-6 rounded-lg" style={{ width: `${[80, 60, 40, 90, 50, 70][i]}%` }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">😔</div>
      <h2 className="text-xl font-bold text-gray-700">Product not found</h2>
      <Link to="/products" className="mt-4 inline-block text-[#e85d04] underline">Back to products</Link>
    </div>
  );

  const images = product.images?.length > 0 ? product.images : [product.thumbnail];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-[#e85d04]">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-[#e85d04]">Products</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link to={`/products?category=${product.category._id}`} className="hover:text-[#e85d04]">{product.category.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main product area */}
      <div className="grid md:grid-cols-2 gap-12 mb-16">
        {/* Images */}
        <div>
          <div className="relative rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 mb-4 aspect-square">
            <img
              src={getImageUrl(images[activeImage])}
              alt={product.name}
              className="w-full h-full object-contain p-6"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/600x600?text=No+Image'; }}
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-[#e85d04] text-white text-sm font-bold px-3 py-1 rounded-full">
                -{discount}% OFF
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === activeImage ? 'border-[#e85d04]' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && (
            <span className="text-sm font-semibold text-[#e85d04] uppercase tracking-wide">{product.brand}</span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mt-2 mb-3 leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-5">
            <StarRating rating={product.rating} />
            <span className="text-sm text-gray-500">{product.rating} ({product.numReviews} reviews)</span>
            {product.soldCount > 0 && <span className="text-xs text-gray-400">• {product.soldCount} sold</span>}
          </div>

          {/* Price */}
          <div className="flex items-end gap-4 mb-6 p-4 bg-orange-50 rounded-2xl">
            <span className="text-4xl font-extrabold text-[#e85d04]">{formatPrice(product.price)}</span>
            {product.comparePrice > product.price && (
              <div>
                <span className="text-lg text-gray-400 line-through block">{formatPrice(product.comparePrice)}</span>
                <span className="text-sm font-bold text-green-600">You save {formatPrice(product.comparePrice - product.price)}</span>
              </div>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-gray-600 mb-5 leading-relaxed">{product.shortDescription}</p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
              {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left!` : 'Out of Stock'}
            </span>
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {product.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          {/* Quantity + Actions */}
          {product.stock > 0 && (
            <>
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm font-semibold text-gray-700">Qty:</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >−</button>
                  <span className="w-12 text-center font-semibold text-[#1a1a2e]">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >+</button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="flex-1 bg-[#e85d04] text-white font-bold py-3.5 px-6 rounded-2xl hover:bg-[#c44d03] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {adding ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🛒'}
                  {adding ? 'Adding…' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleWishlist}
                  className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl transition-all ${wishlisted ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-200 hover:border-red-400 hover:text-red-500'}`}
                >
                  {wishlisted ? '❤️' : '🤍'}
                </button>
              </div>
            </>
          )}

          {/* Guarantees */}
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl grid grid-cols-3 gap-3">
            {[['🚚', 'Fast Delivery'], ['🔒', 'Secure Pay'], ['↩️', '7-Day Return']].map(([icon, label]) => (
              <div key={label} className="text-center">
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-xs text-gray-600 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex gap-1">
          {['description', 'reviews', 'specs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-semibold capitalize border-b-2 transition-colors -mb-px ${activeTab === tab ? 'border-[#e85d04] text-[#e85d04]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              {tab === 'reviews' ? `Reviews (${reviews.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-16">
        {activeTab === 'description' && (
          <div className="prose max-w-none text-gray-600 leading-relaxed">
            <p>{product.description}</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            {isAuthenticated && (
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">Write a Review</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Your Rating</label>
                    <StarRating rating={reviewForm.rating} interactive onChange={(r) => setReviewForm((f) => ({ ...f, rating: r }))} />
                  </div>
                  <input
                    type="text"
                    placeholder="Review title"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04]"
                  />
                  <textarea
                    placeholder="Share your experience..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-[#e85d04] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#c44d03] transition-colors disabled:opacity-60"
                  >
                    {submittingReview ? 'Submitting…' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <div className="text-4xl mb-2">💬</div>
                <p>No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r._id} className="border-b border-gray-100 pb-6 last:border-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#e85d04] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                      {r.user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-sm text-[#1a1a2e]">{r.user?.name}</span>
                        {r.isVerifiedPurchase && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                      </div>
                      <StarRating rating={r.rating} />
                      <h4 className="font-semibold text-sm mt-2 mb-1">{r.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ['Weight', product.weight ? `${product.weight}g` : 'N/A'],
              ['Brand', product.brand || 'N/A'],
              ['SKU', product.sku || 'N/A'],
              ['Stock', product.stock],
              ['Category', product.category?.name || 'N/A'],
            ].map(([key, val]) => (
              <div key={key} className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500 font-medium">{key}</span>
                <span className="text-sm text-gray-800 font-semibold">{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
