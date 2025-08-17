export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block holo-spinner w-12 h-12 mb-4" />
        <p className="text-gray-400 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}