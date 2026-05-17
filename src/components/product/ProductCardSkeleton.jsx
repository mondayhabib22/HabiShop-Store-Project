export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="skeleton aspect-square bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-16 rounded-full" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="skeleton h-5 w-28 rounded-lg" />
      </div>
    </div>
  );
}
