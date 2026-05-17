import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, couponAPI } from '../utils/api';
import { formatPrice, calculateCartTotals, NIGERIAN_STATES, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

const STEPS = ['Address', 'Payment', 'Review'];

export default function Checkout() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const defaultAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: defaultAddr?.street || '',
    city: defaultAddr?.city || '',
    state: defaultAddr?.state || '',
    country: 'Nigeria',
    postalCode: defaultAddr?.postalCode || '',
  });

  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [notes, setNotes] = useState('');

  const { subtotal, shipping, total } = calculateCartTotals(items, couponDiscount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await couponAPI.validate({ code: couponCode, orderAmount: subtotal });
      setCouponDiscount(data.coupon.discount);
      setAppliedCoupon(data.coupon);
      toast.success(`Coupon applied! You saved ${formatPrice(data.coupon.discount)}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid coupon');
      setCouponDiscount(0);
      setAppliedCoupon(null);
    }
    setCouponLoading(false);
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const orderItems = items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        variant: item.variant,
      }));

      const { data } = await orderAPI.create({
        items: orderItems,
        shippingAddress: address,
        paymentMethod,
        couponCode: appliedCoupon?.code || '',
        notes,
      });

      await clearCart();
      toast.success('Order placed successfully! 🎉');
      navigate(`/order-success/${data.order._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setPlacing(false);
  };

  const validateAddress = () => {
    const required = ['fullName', 'phone', 'street', 'city', 'state'];
    const missing = required.find((k) => !address[k]);
    if (missing) { toast.error(`Please fill in your ${missing}`); return false; }
    return true;
  };

  const nextStep = () => {
    if (step === 0 && !validateAddress()) return;
    setStep((s) => Math.min(s + 1, 2));
  };

  const AddressStep = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-5">Shipping Address</h2>
      {/* Use saved address */}
      {user?.addresses?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600 mb-2">Saved Addresses</p>
          <div className="flex flex-wrap gap-2">
            {user.addresses.map((addr) => (
              <button
                key={addr._id}
                onClick={() => setAddress({ ...address, street: addr.street, city: addr.city, state: addr.state, postalCode: addr.postalCode || '', fullName: addr.fullName, phone: addr.phone })}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 hover:border-[#e85d04] hover:text-[#e85d04] transition-colors"
              >
                📍 {addr.label || addr.city}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: 'Full Name', key: 'fullName', placeholder: 'Your full name' },
          { label: 'Phone', key: 'phone', placeholder: '+234 800 000 0000' },
          { label: 'Street Address', key: 'street', placeholder: '12 Main Street', full: true },
          { label: 'City', key: 'city', placeholder: 'Lagos' },
          { label: 'Postal Code', key: 'postalCode', placeholder: '100001' },
        ].map(({ label, key, placeholder, full }) => (
          <div key={key} className={full ? 'sm:col-span-2' : ''}>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>
            <input
              type="text"
              value={address[key]}
              onChange={(e) => setAddress((a) => ({ ...a, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04] transition-colors"
            />
          </div>
        ))}

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">State</label>
          <select
            value={address.state}
            onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04] bg-white"
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Order Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special delivery instructions..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04] resize-none"
        />
      </div>
    </div>
  );

  const PaymentStep = () => (
    <div>
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-5">Payment Method</h2>
      <div className="space-y-3">
        {[
          { value: 'paystack', label: 'Pay with Paystack', icon: '💳', desc: 'Cards, bank transfer, USSD & more' },
          { value: 'transfer', label: 'Bank Transfer', icon: '🏦', desc: 'Transfer directly to our account' },
          { value: 'payondelivery', label: 'Pay on Delivery', icon: '💵', desc: 'Pay cash when your order arrives' },
        ].map(({ value, label, icon, desc }) => (
          <label
            key={value}
            className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === value ? 'border-[#e85d04] bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <input
              type="radio"
              name="payment"
              value={value}
              checked={paymentMethod === value}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="hidden"
            />
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-semibold text-sm text-[#1a1a2e]">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === value ? 'border-[#e85d04]' : 'border-gray-300'}`}>
              {paymentMethod === value && <div className="w-2.5 h-2.5 bg-[#e85d04] rounded-full" />}
            </div>
          </label>
        ))}
      </div>

      {/* Coupon */}
      <div className="mt-6">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Promo Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter code e.g. WELCOME10"
            disabled={!!appliedCoupon}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04] disabled:bg-gray-50"
          />
          {appliedCoupon ? (
            <button
              onClick={() => { setAppliedCoupon(null); setCouponDiscount(0); setCouponCode(''); }}
              className="px-4 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50 transition-colors"
            >
              Remove
            </button>
          ) : (
            <button
              onClick={applyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="px-4 py-2.5 bg-[#1a1a2e] text-white rounded-xl text-sm font-medium hover:bg-[#e85d04] transition-colors disabled:opacity-50"
            >
              {couponLoading ? '...' : 'Apply'}
            </button>
          )}
        </div>
        {appliedCoupon && (
          <p className="text-xs text-green-600 mt-2 font-medium">
            ✓ {appliedCoupon.code} applied — You saved {formatPrice(couponDiscount)}!
          </p>
        )}
      </div>
    </div>
  );

  const ReviewStep = () => (
    <div>
      <h2 className="text-lg font-bold text-[#1a1a2e] mb-5">Review Your Order</h2>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.product._id} className="flex gap-3 items-center py-2 border-b border-gray-100">
            <img
              src={item.product.thumbnail || 'https://via.placeholder.com/48'}
              alt={item.product.name}
              className="w-12 h-12 rounded-xl object-cover border border-gray-100"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1a1a2e] line-clamp-1">{item.product.name}</p>
              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
            </div>
            <span className="text-sm font-bold text-[#1a1a2e]">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-5">
        <div className="flex justify-between text-sm text-gray-600"><span>📍 Deliver to:</span><span className="font-medium text-gray-800">{address.city}, {address.state}</span></div>
        <div className="flex justify-between text-sm text-gray-600"><span>💳 Payment:</span><span className="font-medium text-gray-800 capitalize">{paymentMethod}</span></div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-8" style={{ fontFamily: 'Sora, sans-serif' }}>Checkout</h1>

      {/* Progress */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-[#e85d04] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${i === step ? 'text-[#e85d04]' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Steps */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          {step === 0 && <AddressStep />}
          {step === 1 && <PaymentStep />}
          {step === 2 && <ReviewStep />}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl hover:border-[#e85d04] hover:text-[#e85d04] transition-colors"
              >
                ← Back
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={nextStep}
                className="flex-1 bg-[#e85d04] text-white font-bold py-3 rounded-2xl hover:bg-[#c44d03] transition-colors"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="flex-1 bg-[#e85d04] text-white font-bold py-3 rounded-2xl hover:bg-[#c44d03] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {placing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing...</> : '🎉 Place Order'}
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm h-fit sticky top-24">
          <h3 className="font-bold text-[#1a1a2e] mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600 font-medium"><span>Discount ({appliedCoupon?.code})</span><span>-{formatPrice(couponDiscount)}</span></div>
            )}
            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-[#1a1a2e] text-base">
              <span>Total</span>
              <span className="text-[#e85d04]">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {items.slice(0, 3).map((item) => (
              <div key={item.product._id} className="flex items-center gap-2">
                <img
                  src={item.product.thumbnail || ''}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover border border-gray-100"
                />
                <span className="text-xs text-gray-600 line-clamp-1 flex-1">{item.product.name}</span>
                <span className="text-xs font-semibold">×{item.quantity}</span>
              </div>
            ))}
            {items.length > 3 && <p className="text-xs text-gray-400 text-center">+{items.length - 3} more items</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
