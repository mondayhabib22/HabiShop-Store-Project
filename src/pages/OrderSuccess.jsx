// OrderSuccess.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import { formatPrice, formatDate, getStatusColor } from '../utils/helpers';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    orderAPI.getById(id).then(({ data }) => setOrder(data.order)).catch(() => {});
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🎉</div>
      <h1 className="text-3xl font-bold text-[#1a1a2e] mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>Order Placed!</h1>
      <p className="text-gray-500 mb-2">Thank you for shopping with HabiShop.</p>
      {order && (
        <p className="text-sm font-semibold text-[#e85d04] mb-8">Order #{order.orderNumber}</p>
      )}

      {order && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-left mb-8 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Order Date</p>
              <p className="font-semibold text-sm">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Payment</p>
              <p className="font-semibold text-sm capitalize">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="font-bold text-[#e85d04]">{formatPrice(order.totalAmount)}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 mb-1">Deliver to</p>
            <p className="text-sm font-medium">{order.shippingAddress?.fullName}</p>
            <p className="text-sm text-gray-600">{order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center flex-wrap">
        <Link to={`/orders/${id}`} className="bg-[#e85d04] text-white font-bold px-6 py-3 rounded-2xl hover:bg-[#c44d03] transition-colors text-sm">
          Track Order →
        </Link>
        <Link to="/products" className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-2xl hover:border-[#e85d04] hover:text-[#e85d04] transition-colors text-sm">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
