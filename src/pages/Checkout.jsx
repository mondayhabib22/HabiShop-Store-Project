import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, couponAPI } from '../utils/api';
import { formatPrice, calculateCartTotals, NIGERIAN_STATES, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

const STEPS = ['Address', 'Payment', 'Review'];

/* ─── Field label map for friendly error messages ─────────────────── */
const FIELD_LABELS = {
  fullName: 'Full Name',
  phone:    'Phone Number',
  street:   'Street Address',
  city:     'City',
  state:    'State',
};

/* ─── Input component ─────────────────────────────────────────────── */
const Field = ({ label, name, value, onChange, placeholder, type = 'text', error, required }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="on"
      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors
        ${error
          ? 'border-red-400 bg-red-50 focus:border-red-500'
          : 'border-gray-200 bg-white focus:border-[#e85d04]'
        }`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

/* ─── Progress stepper ────────────────────────────────────────────── */
const Stepper = ({ step }) => (
  <div className="flex items-center mb-10">
    {STEPS.map((s, i) => (
      <div key={s} className="flex items-center flex-1">
        <div className="flex flex-col items-center">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200
            ${i < step  ? 'bg-green-500 text-white shadow-md'
            : i === step ? 'bg-[#e85d04] text-white shadow-md shadow-orange-200'
            :              'bg-gray-100 text-gray-400'}`}>
            {i < step ? '✓' : i + 1}
          </div>
          <span className={`text-xs mt-1.5 font-semibold ${i === step ? 'text-[#e85d04]' : i < step ? 'text-green-600' : 'text-gray-400'}`}>
            {s}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={`flex-1 h-1 mx-3 rounded-full transition-colors duration-300 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
        )}
      </div>
    ))}
  </div>
);

/* ─── Main Checkout ───────────────────────────────────────────────── */
export default function Checkout() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step,           setStep]           = useState(0);
  const [placing,        setPlacing]        = useState(false);
  const [couponCode,     setCouponCode]     = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading,  setCouponLoading]  = useState(false);
  const [appliedCoupon,  setAppliedCoupon]  = useState(null);
  const [fieldErrors,    setFieldErrors]    = useState({});
  const [paymentMethod,  setPaymentMethod]  = useState('payondelivery');
  const [notes,          setNotes]          = useState('');

  /* Pre-fill from saved address or user profile */
  const defaultAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
  const [address, setAddress] = useState({
    fullName:   defaultAddr?.fullName  || user?.name  || '',
    phone:      defaultAddr?.phone     || user?.phone || '',
    street:     defaultAddr?.street    || '',
    city:       defaultAddr?.city      || '',
    state:      defaultAddr?.state     || '',
    country:    'Nigeria',
    postalCode: defaultAddr?.postalCode || '',
  });

  const { subtotal, shipping, total } = calculateCartTotals(items, couponDiscount);

  /* ── Address field change ── */
  const handleAddressChange = useCallback((e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [fieldErrors]);

  /* ── Fill from saved address ── */
  const fillSavedAddress = (addr) => {
    setAddress({
      fullName:   addr.fullName   || '',
      phone:      addr.phone      || '',
      street:     addr.street     || '',
      city:       addr.city       || '',
      state:      addr.state      || '',
      country:    'Nigeria',
      postalCode: addr.postalCode || '',
    });
    setFieldErrors({});
  };

  /* ── Validate address fields ── */
  const validateAddress = () => {
    const required = ['fullName', 'phone', 'street', 'city', 'state'];
    const errors = {};
    required.forEach((key) => {
      if (!address[key]?.trim()) {
        errors[key] = `${FIELD_LABELS[key]} is required`;
      }
    });
    // Phone format check
    if (address.phone && !/^[\d\s\+\-\(\)]{7,15}$/.test(address.phone)) {
      errors.phone = 'Enter a valid phone number';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return false;
    }
    return true;
  };

  /* ── Next step ── */
  const nextStep = () => {
    if (step === 0 && !validateAddress()) return;
    setStep((s) => Math.min(s + 1, 2));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Apply coupon ── */
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await couponAPI.validate({ code: couponCode.trim(), orderAmount: subtotal });
      setCouponDiscount(data.coupon.discount);
      setAppliedCoupon(data.coupon);
      toast.success(`🎉 Coupon applied! You saved ${formatPrice(data.coupon.discount)}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid coupon code');
      setCouponDiscount(0);
      setAppliedCoupon(null);
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  /* ── Place order ── */
  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const orderItems = items
        .filter((item) => item.product)
        .map((item) => ({
          product:  item.product._id,
          quantity: item.quantity,
          variant:  item.variant || '',
        }));

      if (orderItems.length === 0) {
        toast.error('Your cart is empty');
        setPlacing(false);
        return;
      }

      const { data } = await orderAPI.create({
        items:           orderItems,
        shippingAddress: address,
        paymentMethod,
        couponCode:      appliedCoupon?.code || '',
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

  /* ── Empty cart guard ── */
  if (!items || items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="text-7xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-[#1a1a2e] mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Add items to your cart before checking out.</p>
        <Link to="/products" className="inline-block bg-[#e85d04] text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-[#c44d03] transition-colors">
          Browse Products →
        </Link>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     STEP 1 — ADDRESS
  ══════════════════════════════════════════════════════════════ */
  const renderAddressStep = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#1a1a2e]">Shipping Address</h2>
        <p className="text-sm text-gray-400 mt-0.5">Where should we deliver your order?</p>
      </div>

      {/* Saved addresses quick-fill */}
      {user?.addresses?.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-2xl">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Saved Addresses</p>
          <div className="flex flex-wrap gap-2">
            {user.addresses.map((addr) => (
              <button
                key={addr._id}
                type="button"
                onClick={() => fillSavedAddress(addr)}
                className="text-xs border border-blue-200 bg-white text-blue-700 rounded-xl px-3 py-2 hover:border-[#e85d04] hover:text-[#e85d04] hover:bg-orange-50 transition-colors font-medium"
              >
                📍 {addr.label || addr.city || 'Address'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Full Name" name="fullName" required
          value={address.fullName} onChange={handleAddressChange}
          placeholder="e.g. Adebayo Johnson"
          error={fieldErrors.fullName}
        />
        <Field
          label="Phone Number" name="phone" required type="tel"
          value={address.phone} onChange={handleAddressChange}
          placeholder="+234 800 000 0000"
          error={fieldErrors.phone}
        />
        <div className="sm:col-span-2">
          <Field
            label="Street Address" name="street" required
            value={address.street} onChange={handleAddressChange}
            placeholder="e.g. 12 Adeola Odeku Street, VI"
            error={fieldErrors.street}
          />
        </div>
        <Field
          label="City / Town" name="city" required
          value={address.city} onChange={handleAddressChange}
          placeholder="e.g. Lagos"
          error={fieldErrors.city}
        />
        <Field
          label="Postal Code" name="postalCode"
          value={address.postalCode} onChange={handleAddressChange}
          placeholder="e.g. 101001"
          error={fieldErrors.postalCode}
        />

        {/* State dropdown */}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            State <span className="text-red-500">*</span>
          </label>
          <select
            name="state"
            value={address.state}
            onChange={handleAddressChange}
            className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-white appearance-none cursor-pointer
              ${fieldErrors.state
                ? 'border-red-400 bg-red-50 focus:border-red-500'
                : 'border-gray-200 focus:border-[#e85d04]'
              }`}
          >
            <option value="">— Select your state —</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {fieldErrors.state && <p className="text-xs text-red-500 mt-1">{fieldErrors.state}</p>}
        </div>
      </div>

      {/* Delivery notes */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Delivery Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Call before delivery, leave at gate, etc."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04] transition-colors resize-none bg-white"
        />
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     STEP 2 — PAYMENT
  ══════════════════════════════════════════════════════════════ */
  const renderPaymentStep = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#1a1a2e]">Payment Method</h2>
        <p className="text-sm text-gray-400 mt-0.5">Choose how you'd like to pay</p>
      </div>

      <div className="space-y-3">
        {[
          { value: 'payondelivery', label: 'Pay on Delivery',   icon: '💵', desc: 'Pay cash or transfer when your order arrives' },
          { value: 'transfer',     label: 'Bank Transfer',      icon: '🏦', desc: 'Transfer directly to our bank account' },
          { value: 'paystack',     label: 'Pay with Paystack',  icon: '💳', desc: 'Debit/credit card, USSD, bank app & more' },
        ].map(({ value, label, icon, desc }) => (
          <label
            key={value}
            className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all select-none
              ${paymentMethod === value
                ? 'border-[#e85d04] bg-orange-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={value}
              checked={paymentMethod === value}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="sr-only"
            />
            <span className="text-2xl shrink-0">{icon}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm text-[#1a1a2e]">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
              ${paymentMethod === value ? 'border-[#e85d04]' : 'border-gray-300'}`}>
              {paymentMethod === value && (
                <div className="w-2.5 h-2.5 bg-[#e85d04] rounded-full" />
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Bank transfer details */}
      {paymentMethod === 'transfer' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm space-y-1.5">
          <p className="font-bold text-blue-800 mb-2">🏦 Bank Transfer Details</p>
          <p className="text-blue-700"><span className="font-semibold">Bank:</span> First Bank Nigeria</p>
          <p className="text-blue-700"><span className="font-semibold">Account Number:</span> 1234567890</p>
          <p className="text-blue-700"><span className="font-semibold">Account Name:</span> HabiShop Enterprises Ltd</p>
          <p className="text-xs text-blue-500 mt-2">Use your order number as payment reference after placing.</p>
        </div>
      )}

      {/* Coupon code */}
      <div className="pt-2 border-t border-gray-100">
        <label className="text-sm font-semibold text-gray-700 mb-2 block">
          🎟️ Promo / Discount Code
        </label>
        {appliedCoupon ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <span className="text-green-600 text-lg">✅</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-green-700">{appliedCoupon.code} applied!</p>
              <p className="text-xs text-green-600">You saved {formatPrice(couponDiscount)}</p>
            </div>
            <button
              type="button"
              onClick={removeCoupon}
              className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
              placeholder="e.g. WELCOME10"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04] transition-colors font-mono tracking-wide uppercase bg-white"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="px-5 py-2.5 bg-[#1a1a2e] text-white rounded-xl text-sm font-semibold hover:bg-[#e85d04] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {couponLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Apply'}
            </button>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1.5">Try: WELCOME10 · HABI500 · SAVE20</p>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     STEP 3 — REVIEW
  ══════════════════════════════════════════════════════════════ */
  const renderReviewStep = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#1a1a2e]">Review Your Order</h2>
        <p className="text-sm text-gray-400 mt-0.5">Please confirm everything looks correct</p>
      </div>

      {/* Items list */}
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
        {items.filter((i) => i.product).map((item) => (
          <div key={item.product._id} className="flex gap-3 items-center p-3 bg-white">
            <img
              src={item.product.thumbnail || 'https://via.placeholder.com/48?text=?'}
              alt={item.product.name}
              className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/48?text=?'; }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1a1a2e] line-clamp-2 leading-snug">
                {item.product.name}
              </p>
              {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>}
              <p className="text-xs text-gray-500 mt-1">
                {formatPrice(item.price)} × {item.quantity}
              </p>
            </div>
            <span className="text-sm font-bold text-[#1a1a2e] shrink-0">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Delivery & payment summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">📍 Delivery Address</p>
          <p className="text-sm font-semibold text-gray-800">{address.fullName}</p>
          <p className="text-sm text-gray-600">{address.phone}</p>
          <p className="text-sm text-gray-600">{address.street}</p>
          <p className="text-sm text-gray-600">{address.city}, {address.state}</p>
          <p className="text-sm text-gray-600">Nigeria</p>
          {notes && <p className="text-xs text-gray-400 italic mt-1">Note: {notes}</p>}
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">💳 Payment</p>
          <p className="text-sm font-semibold text-gray-800 capitalize">
            {{
              payondelivery: '💵 Pay on Delivery',
              transfer:      '🏦 Bank Transfer',
              paystack:      '💳 Paystack',
            }[paymentMethod]}
          </p>
          {appliedCoupon && (
            <p className="text-sm text-green-600 font-medium">🎟️ {appliedCoupon.code} (-{formatPrice(couponDiscount)})</p>
          )}
        </div>
      </div>

      {/* Final totals */}
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Items subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping fee</span>
          <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>
            {shipping === 0 ? '🚚 FREE' : formatPrice(shipping)}
          </span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600 font-semibold">
            <span>Discount</span>
            <span>-{formatPrice(couponDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-base text-[#1a1a2e] border-t border-orange-200 pt-2 mt-1">
          <span>Total to Pay</span>
          <span className="text-[#e85d04]">{formatPrice(total)}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        By placing this order you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/cart" className="text-sm text-[#e85d04] font-semibold hover:underline">
          ← Back to Cart
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-[#1a1a2e]" style={{ fontFamily: 'Sora, sans-serif' }}>
          Checkout
        </h1>
      </div>

      <Stepper step={step} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Step content ── */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          {step === 0 && renderAddressStep()}
          {step === 1 && renderPaymentStep()}
          {step === 2 && renderReviewStep()}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8 pt-5 border-t border-gray-100">
            {step > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl hover:border-[#e85d04] hover:text-[#e85d04] transition-colors"
              >
                ← Back
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-[#e85d04] text-white font-bold py-3.5 rounded-2xl hover:bg-[#c44d03] transition-colors shadow-md shadow-orange-200"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing}
                className="flex-1 bg-[#e85d04] text-white font-bold py-3.5 rounded-2xl hover:bg-[#c44d03] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-md shadow-orange-200"
              >
                {placing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  '🎉 Place Order'
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Order summary sidebar ── */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm sticky top-24">
            <h3 className="font-bold text-[#1a1a2e] mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
              Order Summary
            </h3>

            {/* Item count */}
            <p className="text-xs text-gray-400 mb-3">
              {items.length} item{items.length !== 1 ? 's' : ''} in cart
            </p>

            {/* Items preview */}
            <div className="space-y-2 mb-4">
              {items.filter((i) => i.product).slice(0, 4).map((item) => (
                <div key={item.product._id} className="flex items-center gap-2.5">
                  <img
                    src={item.product.thumbnail || ''}
                    alt={item.product.name}
                    className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=?'; }}
                  />
                  <p className="text-xs text-gray-600 line-clamp-1 flex-1">{item.product.name}</p>
                  <span className="text-xs font-bold text-gray-700 shrink-0">×{item.quantity}</span>
                </div>
              ))}
              {items.length > 4 && (
                <p className="text-xs text-gray-400 text-center pt-1">
                  +{items.length - 4} more item{items.length - 4 > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-gray-800">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className={`font-medium ${shipping === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                  {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Discount</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-[#1a1a2e] text-base border-t border-gray-100 pt-2">
                <span>Total</span>
                <span className="text-[#e85d04]">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Free shipping progress */}
            {shipping > 0 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-xl">
                <p className="text-xs text-orange-700 font-medium">
                  Add {formatPrice(50000 - subtotal)} more for FREE shipping! 🚚
                </p>
                <div className="mt-2 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#e85d04] rounded-full transition-all"
                    style={{ width: `${Math.min((subtotal / 50000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="mt-5 flex items-center justify-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-100">
              <span>🔒 Secure</span>
              <span>•</span>
              <span>✅ Verified</span>
              <span>•</span>
              <span>↩️ 7-day return</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
