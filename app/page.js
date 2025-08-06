export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Kitchen Dashboard
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Dashboard is ready to be built! Weather API is connected to Candler, NC.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Coordinates: {process.env.NEXT_PUBLIC_WEATHER_LAT}, {process.env.NEXT_PUBLIC_WEATHER_LON}
          </p>
        </div>
      </div>
    </main>
  );
}
