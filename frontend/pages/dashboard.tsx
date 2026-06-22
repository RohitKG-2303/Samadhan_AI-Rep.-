import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/summary`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setDashboardData(response.data);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-semibold">Active Users</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {dashboardData?.activeUsers || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-semibold">Total Users</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {dashboardData?.totalUsers || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-semibold">Queries Asked</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              {dashboardData?.totalQueries || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-semibold">Learnings Shared</div>
            <div className="text-3xl font-bold text-orange-600 mt-2">
              {dashboardData?.totalLearnings || 0}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">User Satisfaction</h2>
          <div className="text-4xl font-bold text-green-600">
            {dashboardData?.satisfactionRate || 0}%
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
