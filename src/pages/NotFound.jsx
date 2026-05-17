import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
      <div>
        <div className="text-8xl mb-6">🛍️</div>
        <h1 className="text-6xl font-extrabold text-[#e85d04] mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>404</h1>
        <h2 className="text-2xl font-bold text-[#1a1a2e] mb-4">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/" className="bg-[#e85d04] text-white font-bold px-6 py-3 rounded-2xl hover:bg-[#c44d03] transition-colors">Go Home</Link>
          <Link to="/products" className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-2xl hover:border-[#e85d04] hover:text-[#e85d04] transition-colors">Browse Products</Link>
        </div>
      </div>
    </div>
  );
}
