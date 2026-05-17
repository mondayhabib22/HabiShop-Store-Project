import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-gray-300 pt-16 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#e85d04] rounded-xl flex items-center justify-center text-white font-bold text-lg">H</div>
              <span className="font-bold text-xl text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                Habi<span className="text-[#e85d04]">Shop</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Your one-stop destination for quality products at unbeatable prices. Shop with confidence, delivered to your door.
            </p>
            <div className="flex gap-3 mt-5">
              {['📘', '🐦', '📸', '▶️'].map((icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#e85d04] transition-colors text-base">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/products', label: 'All Products' },
                { to: '/products?featured=true', label: 'Featured' },
                { to: '/products?newArrival=true', label: 'New Arrivals' },
                { to: '/products?sort=popular', label: 'Best Sellers' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-[#e85d04] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer care */}
          <div>
            <h4 className="text-white font-semibold mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>Customer Care</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/orders', label: 'Track My Order' },
                { to: '/profile', label: 'My Account' },
                { to: '/wishlist', label: 'Wishlist' },
                { to: '#returns', label: 'Returns & Refunds' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-[#e85d04] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <span className="mt-0.5">📍</span>
                <span>12 Commerce Street, Victoria Island, Lagos, Nigeria</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <span>📞</span>
                <a href="tel:+2348000000000" className="hover:text-[#e85d04] transition-colors">+234 800 000 0000</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <span>✉️</span>
                <a href="mailto:hello@habishop.com" className="hover:text-[#e85d04] transition-colors">hello@habishop.com</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <span>🕐</span>
                <span>Mon – Sat: 9AM – 6PM WAT</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment icons */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} HabiShop. All rights reserved.</p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {['💳 Paystack', '🏦 Transfer', '💵 Pay on Delivery'].map((m) => (
                <span key={m} className="text-xs bg-white/10 px-3 py-1 rounded-full text-gray-400">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
