export default function ScanLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-800 rounded-lg w-64 mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-800/50 rounded-xl" />
            <div className="h-48 bg-gray-800/50 rounded-xl" />
            <div className="h-48 bg-gray-800/50 rounded-xl" />
            <div className="h-48 bg-gray-800/50 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}