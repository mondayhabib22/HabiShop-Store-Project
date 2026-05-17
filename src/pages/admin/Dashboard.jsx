import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../utils/api';
import { formatPrice, formatDate, getStatusColor, getStatusIcon } from '../../utils/helpers';

const StatCard = ({ icon, label, value, sub, color = 'orange' }) => {
  const colors = {
    orange: 'bg-orange-50 text-[#e85d04]',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-extrabold text-[#1a1a2e]" style={{ fontFamily: 'Sora, sans-serif' }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get().then(({ data: d }) => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl"/>)}
      </div>
      <div className="skeleton h-64 rounded-2xl"/>
    </div>
  );

  const { stats, recentOrders = [], topProducts = [], ordersByStatus = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon="🛍️" label="Total Orders" value={stats?.totalOrders?.toLocaleString()} sub={`+${stats?.monthOrders} this month`} color="orange" />
        <StatCard icon="💰" label="Total Revenue" value={formatPrice(stats?.totalRevenue || 0)} sub={`${formatPrice(stats?.monthRevenue || 0)} this month`} color="green" />
        <StatCard icon="👥" label="Total Users" value={stats?.totalUsers?.toLocaleString()} sub={`+${stats?.monthUsers} this month`} color="blue" />
        <StatCard icon="📦" label="Products" value={stats?.totalProducts?.toLocaleString()} sub={`${stats?.lowStockProducts} low stock`} color="purple" />
      </div>

      {/* Second row */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-[#1a1a2e] mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {ordersByStatus.map(({ _id: status, count }) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(status)}`}>
                  {getStatusIcon(status)} {status}
                </span>
                <span className="font-bold text-sm text-[#1a1a2e]">{count}</span>
              </div>
            ))}
            {stats?.pendingOrders > 0 && (
              <Link to="/admin/orders?status=pending" className="block text-xs text-center text-[#e85d04] font-semibold mt-3 hover:underline">
                {stats.pendingOrders} pending orders →
              </Link>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1a1a2e]">Top Selling Products</h3>
            <Link to="/admin/products" className="text-xs text-[#e85d04] font-semibold hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p._id} className="flex items-center gap-4">
                <span className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center text-xs font-bold text-[#e85d04] shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a2e] truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.soldCount} sold</p>
                </div>
                <span className="text-sm font-bold text-[#e85d04] shrink-0">{formatPrice(p.revenue)}</span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No sales data yet</p>}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[#1a1a2e]">Recent Orders</h3>
          <Link to="/admin/orders" className="text-xs text-[#e85d04] font-semibold hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-left pb-3 font-semibold">Order</th>
                <th className="text-left pb-3 font-semibold">Customer</th>
                <th className="text-left pb-3 font-semibold">Date</th>
                <th className="text-left pb-3 font-semibold">Status</th>
                <th className="text-right pb-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <Link to={`/admin/orders/${order._id}`} className="font-semibold text-[#e85d04] hover:underline">
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 text-gray-600">{order.user?.name}</td>
                  <td className="py-3 text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-[#1a1a2e]">{formatPrice(order.totalAmount)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { to: '/admin/products/new', icon: '➕', label: 'Add Product', color: 'bg-orange-500' },
          { to: '/admin/categories', icon: '🗂️', label: 'Categories', color: 'bg-blue-500' },
          { to: '/admin/coupons', icon: '🎟️', label: 'Coupons', color: 'bg-purple-500' },
          { to: '/admin/users', icon: '👥', label: 'Manage Users', color: 'bg-green-500' },
        ].map(({ to, icon, label, color }) => (
          <Link key={to} to={to} className={`${color} text-white rounded-2xl p-4 text-center hover:opacity-90 transition-opacity`}>
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-sm font-semibold">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
