import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../../utils/api';
import { formatPrice, formatDate, formatDateTime, getStatusColor, getStatusIcon } from '../../utils/helpers';
import toast from 'react-hot-toast';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', note: '', trackingNumber: '' });

  useEffect(() => {
    orderAPI.getById(id).then(({ data }) => {
      setOrder(data.order);
      setStatusForm(f => ({ ...f, status: data.order.status, trackingNumber: data.order.trackingNumber || '' }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const { data } = await orderAPI.updateStatus(id, statusForm);
      setOrder(data.order);
      toast.success('Order status updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
    setUpdating(false);
  };

  if (loading) return <div className="skeleton h-96 rounded-2xl"/>;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/orders" className="text-sm text-[#e85d04] hover:underline">← Back to Orders</Link>
          <h1 className="text-xl font-bold text-[#1a1a2e] mt-1">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-sm font-bold px-4 py-2 rounded-full ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)} {order.status}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#1a1a2e] mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3 items-center py-2 border-b border-gray-50 last:border-0">
                  <img src={item.image || 'https://via.placeholder.com/48'} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <p className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(order.itemsTotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)}</span></div>
              {order.couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.couponDiscount)}</span></div>}
              <div className="flex justify-between font-bold text-base text-[#1a1a2e] pt-1"><span>Total</span><span className="text-[#e85d04]">{formatPrice(order.totalAmount)}</span></div>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#1a1a2e] mb-4">Update Order Status</h2>
            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                  <select value={statusForm.status} onChange={(e) => setStatusForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#e85d04] bg-white">
                    {STATUSES.map(s => <option key={s} value={s}>{getStatusIcon(s)} {s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tracking Number</label>
                  <input type="text" value={statusForm.trackingNumber} onChange={(e) => setStatusForm(f => ({ ...f, trackingNumber: e.target.value }))}
                    placeholder="e.g. NG123456789"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#e85d04]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Note (optional)</label>
                <input type="text" value={statusForm.note} onChange={(e) => setStatusForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Status update note..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#e85d04]" />
              </div>
              <button type="submit" disabled={updating}
                className="bg-[#e85d04] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#c44d03] transition-colors text-sm disabled:opacity-60">
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </form>
          </div>

          {/* Timeline */}
          {order.statusHistory?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-[#1a1a2e] mb-4">Status History</h2>
              <div className="space-y-3">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-lg shrink-0">{getStatusIcon(h.status)}</span>
                    <div>
                      <p className="font-semibold capitalize">{h.status} — {h.note}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(h.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#1a1a2e] mb-3">Customer</h2>
            <p className="font-semibold text-sm">{order.user?.name}</p>
            <p className="text-sm text-gray-500">{order.user?.email}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#1a1a2e] mb-3">Shipping Address</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.phone}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#1a1a2e] mb-3">Payment</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="capitalize font-medium">{order.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span>
                <span className={`font-semibold ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>{order.isPaid ? '✓ Paid' : 'Unpaid'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
