import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import { formatPrice, formatDate, formatDateTime, getStatusColor, getStatusIcon, getImageUrl } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    orderAPI.getById(id).then(({ data }) => setOrder(data.order)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const { data } = await orderAPI.cancel(id, { reason: 'Customer requested cancellation' });
      setOrder(data.order);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel');
    }
    setCancelling(false);
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-10"><div className="skeleton h-96 rounded-2xl"/></div>;
  if (!order) return <div className="text-center py-20"><p className="text-gray-500">Order not found</p></div>;

  const canCancel = ['pending', 'processing'].includes(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/orders" className="text-[#e85d04] hover:underline text-sm font-semibold">← My Orders</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">#{order.orderNumber}</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]" style={{ fontFamily: 'Sora, sans-serif' }}>Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold px-4 py-2 rounded-full ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-sm border border-red-200 text-red-500 px-4 py-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#1a1a2e] mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <img
                    src={item.image || 'https://via.placeholder.com/64'}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-gray-100"
                  />
                  <div className="flex-1">
                    <Link to={`/products/${item.product}`} className="font-semibold text-sm text-[#1a1a2e] hover:text-[#e85d04] transition-colors">
                      {item.name}
                    </Link>
                    {item.variant && <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                      <span className="font-bold text-sm text-[#1a1a2e]">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-[#1a1a2e] mb-4">Order Timeline</h2>
              <div className="space-y-4">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-[#e85d04] rounded-full flex items-center justify-center text-white text-sm shrink-0">
                        {getStatusIcon(h.status)}
                      </div>
                      {i < order.statusHistory.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1"/>}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-semibold text-sm text-[#1a1a2e] capitalize">{h.status}</p>
                      <p className="text-xs text-gray-500">{h.note}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(h.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#1a1a2e] mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(order.itemsTotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)}</span></div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium"><span>Discount</span><span>-{formatPrice(order.couponDiscount)}</span></div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-[#1a1a2e]"><span>Total</span><span className="text-[#e85d04]">{formatPrice(order.totalAmount)}</span></div>
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#1a1a2e] mb-3">Shipping Address</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.phone}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
              <p>{order.shippingAddress?.country}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#1a1a2e] mb-3">Payment</h2>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-medium capitalize">{order.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span>
                <span className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.isPaid ? '✓ Paid' : 'Pending'}
                </span>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between"><span className="text-gray-500">Tracking</span><span className="font-medium">{order.trackingNumber}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
