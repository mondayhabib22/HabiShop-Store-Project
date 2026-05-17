import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, getImageUrl, calculateCartTotals } from '../utils/helpers';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { subtotal, shipping, total } = calculateCartTotals(items);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl"/>)}
        </div>
        <div className="skeleton h-64 rounded-2xl"/>
      </div>
    </div>
  );

  if (items.length === 0) return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="text-7xl mb-6">🛒</div>
      <h2 className="text-2xl font-bold text-[#1a1a2e] mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
        Your cart is empty
      </h2>
      <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
      <Link
        to="/products"
        className="inline-block bg-[#e85d04] text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-[#c44d03] transition-colors"
      >
        Start Shopping →
      </Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-8" style={{ fontFamily: 'Sora, sans-serif' }}>
        Shopping Cart <span className="text-gray-400 font-normal text-lg">({items.length} items)</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const prod = item.product;
            if (!prod) return null;
            return (
              <div key={`${prod._id}-${item.variant}`} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 hover:shadow-md transition-shadow">
                <Link to={`/products/${prod._id}`} className="shrink-0">
                  <img
                    src={getImageUrl(prod.thumbnail)}
                    alt={prod.name}
                    className="w-24 h-24 object-cover rounded-xl border border-gray-100"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/96x96?text=?'; }}
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/products/${prod._id}`} className="font-semibold text-[#1a1a2e] hover:text-[#e85d04] transition-colors line-clamp-2 text-sm">
                    {prod.name}
                  </Link>
                  {item.variant && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>
                  )}

                  <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                    {/* Qty control */}
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(prod._id, item.quantity - 1)}
                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold"
                      >−</button>
                      <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(prod._id, item.quantity + 1)}
                        disabled={item.quantity >= prod.stock}
                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold disabled:opacity-40"
                      >+</button>
                    </div>

                    {/* Price & remove */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-[#1a1a2e]">{formatPrice(item.price * item.quantity)}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-400">{formatPrice(item.price)} each</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(prod._id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Link to="/products" className="inline-flex items-center gap-2 text-sm text-[#e85d04] font-semibold hover:underline mt-2">
            ← Continue Shopping
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
            <h2 className="font-bold text-lg text-[#1a1a2e] mb-5" style={{ fontFamily: 'Sora, sans-serif' }}>Order Summary</h2>

            <div className="space-y-3 mb-5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-medium text-gray-800">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium text-gray-800'}>
                  {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">Add {formatPrice(50000 - subtotal)} more for free shipping</p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-[#1a1a2e] text-base">
                <span>Total</span>
                <span className="text-[#e85d04]">{formatPrice(total)}</span>
              </div>
            </div>

            {isAuthenticated ? (
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#e85d04] text-white font-bold py-3.5 rounded-2xl hover:bg-[#c44d03] transition-colors text-sm"
              >
                Proceed to Checkout →
              </button>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login"
                  state={{ from: { pathname: '/checkout' } }}
                  className="block w-full bg-[#e85d04] text-white font-bold py-3.5 rounded-2xl hover:bg-[#c44d03] transition-colors text-sm text-center"
                >
                  Login to Checkout
                </Link>
                <Link
                  to="/register"
                  className="block w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl hover:border-[#e85d04] hover:text-[#e85d04] transition-colors text-sm text-center"
                >
                  Create Account
                </Link>
              </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-4 text-xs text-gray-400">
              <span>🔒 Secure</span>
              <span>💳 Paystack</span>
              <span>✅ Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
