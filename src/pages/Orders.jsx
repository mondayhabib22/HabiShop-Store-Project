import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import { formatPrice, formatDate, getStatusColor, getStatusIcon } from '../utils/helpers';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await orderAPI.getMyOrders({ page, limit: 10 });
        setOrders(data.orders);
        setPages(data.pages);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [page]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl"/>)}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-8" style={{ fontFamily: 'Sora, sans-serif' }}>My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
          <Link to="/products" className="bg-[#e85d04] text-white font-bold px-6 py-3 rounded-2xl hover:bg-[#c44d03] transition-colors">
            Shop Now →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-orange-200 transition-all"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-[#1a1a2e] text-sm">#{order.orderNumber}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#e85d04] text-lg">{formatPrice(order.totalAmount)}</p>
                  <p className="text-xs text-gray-400">{order.items.length} item(s)</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                {order.items.slice(0, 4).map((item, i) => (
                  <img
                    key={i}
                    src={item.image || 'https://via.placeholder.com/40'}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                  />
                ))}
                {order.items.length > 4 && (
                  <span className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    +{order.items.length - 4}
                  </span>
                )}
                <span className="ml-auto text-xs text-[#e85d04] font-semibold">View Details →</span>
              </div>
            </Link>
          ))}

          {pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:border-[#e85d04]">← Prev</button>
              <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:border-[#e85d04]">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
