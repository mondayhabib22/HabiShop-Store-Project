import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#e85d04] rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">H</div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]" style={{ fontFamily: 'Sora, sans-serif' }}>Welcome back</h1>
          <p className="text-gray-500 mt-1 text-sm">Login to your HabiShop account</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <button type="button" className="text-xs text-[#e85d04] hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04] transition-colors pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e85d04] text-white font-bold py-3.5 rounded-2xl hover:bg-[#c44d03] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Logging in...</> : 'Login to HabiShop'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
            <p className="font-semibold mb-1">Demo credentials:</p>
            <p>User: user@habishop.com / User@123</p>
            <p>Admin: admin@habishop.com / Admin@123</p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#e85d04] font-semibold hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
