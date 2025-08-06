'use client';

import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('../components/Dashboard'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-2xl text-gray-600">Loading dashboard...</div></div>
});

export default function Home() {
  return <Dashboard />;
}
