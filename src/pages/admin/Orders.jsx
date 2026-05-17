// Admin Orders
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderAPI } from '../../utils/api';
import { formatPrice, formatDate, getStatusColor, getStatusIcon } from '../../utils/helpers';

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const status = searchParams.get('status') || '';

  const STATUSES = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (status) params.status = status;
        const { data } = await orderAPI.getAll(params);
        setOrders(data.orders);
        setTotal(data.total);
        setPages(data.pages);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [page, status]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a2e]">Orders</h1>
          <p className="text-sm text-gray-500">{total} total orders</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s}
            onClick={() => { setSearchParams(s ? { status: s } : {}); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${status === s ? 'bg-[#e85d04] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#e85d04]'}`}
          >
            {s ? `${getStatusIcon(s)} ${s.charAt(0).toUpperCase() + s.slice(1)}` : 'All Orders'}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="text-left p-4 font-semibold">Order</th>
                <th className="text-left p-4 font-semibold">Customer</th>
                <th className="text-left p-4 font-semibold">Date</th>
                <th className="text-left p-4 font-semibold">Items</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Payment</th>
                <th className="text-right p-4 font-semibold">Total</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(10).fill(null).map((_, i) => (
                <tr key={i}>{Array(8).fill(null).map((_, j) => <td key={j} className="p-4"><div className="skeleton h-4 rounded-lg"/></td>)}</tr>
              )) : orders.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No orders found</td></tr>
              ) : orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-[#e85d04]">#{order.orderNumber}</td>
                  <td className="p-4">
                    <p className="font-medium text-gray-800">{order.user?.name}</p>
                    <p className="text-xs text-gray-400">{order.user?.email}</p>
                  </td>
                  <td className="p-4 text-xs text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="p-4 text-gray-600">{order.items.length}</td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                      {order.isPaid ? '✓ Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-[#1a1a2e]">{formatPrice(order.totalAmount)}</td>
                  <td className="p-4">
                    <Link to={`/admin/orders/${order._id}`} className="text-xs text-blue-600 hover:underline font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">← Prev</button>
            <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
