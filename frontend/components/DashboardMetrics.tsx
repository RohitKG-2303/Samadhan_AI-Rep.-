import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface DashboardMetrics {
  activeUsers: number;
  totalUsers: number;
  totalQueries: number;
  totalLearnings: number;
  satisfactionRate: number;
}

const MetricsCard = ({ title, value, color }: any) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="text-gray-600 text-sm font-semibold">{title}</div>
    <div className={`text-3xl font-bold ${color} mt-2`}>{value}</div>
  </div>
);

const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeUsers: 0,
    totalUsers: 0,
    totalQueries: 0,
    totalLearnings: 0,
    satisfactionRate: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/summary`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setMetrics(response.data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricsCard
          title="Active Users (24h)"
          value={metrics.activeUsers}
          color="text-blue-600"
        />
        <MetricsCard
          title="Total Users"
          value={metrics.totalUsers}
          color="text-green-600"
        />
        <MetricsCard
          title="Queries Asked"
          value={metrics.totalQueries}
          color="text-purple-600"
        />
        <MetricsCard
          title="Learnings Shared"
          value={metrics.totalLearnings}
          color="text-orange-600"
        />
        <MetricsCard
          title="Satisfaction Rate"
          value={`${metrics.satisfactionRate}%`}
          color="text-green-600"
        />
      </div>
    </div>
  );
};

export default Dashboard;
