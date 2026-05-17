export const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr) => {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(dateStr));
};

export const formatDateTime = (dateStr) => {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
};

export const truncate = (str, n) => str?.length > n ? str.slice(0, n) + '…' : str;

export const getErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong';

export const getStatusColor = (status) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusIcon = (status) => {
  const map = {
    pending: '⏳', processing: '⚙️', shipped: '🚚',
    delivered: '✅', cancelled: '❌', refunded: '↩️',
  };
  return map[status] || '📦';
};

export const calculateCartTotals = (items, couponDiscount = 0) => {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 50000 ? 0 : 1500;
  const discount = couponDiscount;
  const total = subtotal + shipping - discount;
  return { subtotal, shipping, discount, total };
};

export const getImageUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/400x400?text=No+Image';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}/uploads/${url.replace('/uploads/', '')}`;
};

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];
