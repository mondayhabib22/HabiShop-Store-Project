import { useEffect, useState } from 'react';
import { userAPI } from '../../utils/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const { data } = await userAPI.getAll(params);
      setUsers(data.users);
      setPages(data.pages);
      setTotal(data.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${user.name}'s role to ${newRole}?`)) return;
    setUpdating(user._id);
    try {
      await userAPI.updateRole(user._id, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) { toast.error(getErrorMessage(err)); }
    setUpdating(null);
  };

  const toggleActive = async (user) => {
    setUpdating(user._id);
    try {
      await userAPI.updateRole(user._id, { isActive: !user.isActive });
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch (err) { toast.error(getErrorMessage(err)); }
    setUpdating(null);
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setUpdating(user._id);
    try {
      await userAPI.delete(user._id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) { toast.error(getErrorMessage(err)); }
    setUpdating(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a2e]">Users</h1>
          <p className="text-sm text-gray-500">{total} registered users</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e85d04]"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="text-left p-4 font-semibold">User</th>
                <th className="text-left p-4 font-semibold">Role</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Joined</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array(8).fill(null).map((_, i) => (
                    <tr key={i}>
                      {Array(5).fill(null).map((_, j) => (
                        <td key={j} className="p-4"><div className="skeleton h-4 rounded-lg" /></td>
                      ))}
                    </tr>
                  ))
                : users.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">No users found</td>
                  </tr>
                )
                : users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#e85d04] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1a1a2e]">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {user.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {user.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => toggleRole(user)}
                          disabled={updating === user._id}
                          className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors font-medium disabled:opacity-50"
                        >
                          {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={updating === user._id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${user.isActive ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          disabled={updating === user._id}
                          className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                        >
                          {updating === user._id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:border-[#e85d04]">← Prev</button>
            <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:border-[#e85d04]">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
