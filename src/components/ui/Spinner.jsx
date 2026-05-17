// Spinner.jsx
export default function Spinner({ size = 'md', color = 'orange' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const colors = { orange: 'border-[#e85d04]', white: 'border-white', gray: 'border-gray-400' };
  return (
    <div className={`${sizes[size]} border-4 ${colors[color]} border-t-transparent rounded-full animate-spin`} />
  );
}
