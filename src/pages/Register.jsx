import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password);
      toast.success(`Welcome to HabiShop, ${user.name.split(' ')[0]}! 🎉`);
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#e85d04] rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">H</div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]" style={{ fontFamily: 'Sora, sans-serif' }}>Create your account</h1>
          <p className="text-gray-500 mt-1 text-sm">Join HabiShop and start shopping</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>
                <input
                  type={type}
                  required
                  value={form[key]}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04] transition-colors"
                />
              </div>
            ))}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04] transition-colors pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirm Password</label>
              <input
                type="password"
                required
                value={form.confirm}
                onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat your password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e85d04] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e85d04] text-white font-bold py-3.5 rounded-2xl hover:bg-[#c44d03] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creating account...</> : 'Create Account'}
            </button>

            <p className="text-xs text-center text-gray-400">
              By signing up you agree to our <a href="#" className="text-[#e85d04]">Terms</a> and <a href="#" className="text-[#e85d04]">Privacy Policy</a>
            </p>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-[#e85d04] font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
