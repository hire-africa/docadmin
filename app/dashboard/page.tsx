'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Users, CreditCard, Calendar, DollarSign, Activity, ArrowUpRight, ArrowDownRight, UserPlus, FileText, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  todayAppointments: number;
  todayRevenue: number;
  userGrowthPercentage: number;
  revenueGrowthPercentage: number;
  appointmentGrowthPercentage: number;
  subscriptionGrowthPercentage: number;
}

interface ChartData {
  name: string;
  value: number;
}

interface ActivityItem {
  type: 'user' | 'subscription' | 'appointment' | 'system';
  title: string;
  description: string;
  time: string;
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    todayAppointments: 0,
    todayRevenue: 0,
    userGrowthPercentage: 0,
    revenueGrowthPercentage: 0,
    appointmentGrowthPercentage: 0,
    subscriptionGrowthPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userGrowthData, setUserGrowthData] = useState<ChartData[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<ChartData[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setUserGrowthData(data.userGrowthData || []);
        setRevenueData(data.revenueData || []);
        setSubscriptionData(data.subscriptionData || []);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      change: stats.userGrowthPercentage,
      color: 'bg-blue-50 text-blue-600',
      iconColor: 'text-blue-600'
    },
    {
      name: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      icon: CreditCard,
      change: stats.subscriptionGrowthPercentage,
      color: 'bg-emerald-50 text-emerald-600',
      iconColor: 'text-emerald-600'
    },
    {
      name: 'Total Revenue',
      value: `MWK ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      change: stats.revenueGrowthPercentage,
      color: 'bg-violet-50 text-violet-600',
      iconColor: 'text-violet-600'
    },
    {
      name: 'Total Appointments',
      value: stats.totalAppointments,
      icon: Calendar,
      change: stats.appointmentGrowthPercentage,
      color: 'bg-amber-50 text-amber-600',
      iconColor: 'text-amber-600'
    },
  ];

  // Modern colors for charts
  const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
            <p className="mt-2 text-slate-500">
              Welcome back, here's what's happening with DocAvailable today.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-500 truncate">{card.name}</p>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-800 break-words">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg flex-shrink-0 ${card.color}`}>
                    <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  {card.change >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-semibold ${card.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {Math.abs(card.change)}%
                  </span>
                  <span className="ml-2 text-sm text-slate-400">from last month</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Growth Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">User Growth Trend</h3>
              <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded-md">Last 12 Weeks</span>
            </div>

            {userGrowthData.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: 'none' }}
                      itemStyle={{ color: '#334155' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUser)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <div className="text-center">
                  <Activity className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p>No growth data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Subscription Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Subscription Distribution</h3>
            {subscriptionData.length > 0 ? (
              <div className="flex flex-col">
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subscriptionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {subscriptionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Legend */}
                <div className="mt-6 space-y-3">
                  {subscriptionData.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center min-w-0">
                        <span className="h-3 w-3 rounded-full flex-shrink-0 mr-2" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                        <span className="text-sm text-slate-600 truncate">{entry.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800 ml-2">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <div className="text-center">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p>No subscription data</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Revenue & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Weekly Revenue</h3>
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                <span className="text-xs text-slate-500">Income</span>
              </div>
            </div>
            {revenueData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} barSize={30}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      tickFormatter={(value) => `${value}`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: 'none' }}
                      formatter={(value) => [`MWK ${Number(value).toLocaleString('en-US')}`, 'Revenue']}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <div className="text-center">
                  <DollarSign className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p>No revenue data</p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
              <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">View All</button>
            </div>
            <div className="space-y-6">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex relative">
                    {index !== recentActivity.length - 1 && (
                      <div className="absolute left-0 top-1 bottom-0 w-px bg-slate-100 ml-4 h-full"></div>
                    )}
                    <div className={`relative z-10 flex-shrink-0 h-8 w-8 rounded-full border-2 border-white flex items-center justify-center mr-4 ${activity.type === 'user' ? 'bg-emerald-100' :
                      activity.type === 'subscription' ? 'bg-blue-100' :
                        'bg-amber-100'
                      }`}>
                      {activity.type === 'user' ? (
                        <UserPlus className="h-4 w-4 text-emerald-600" />
                      ) : activity.type === 'subscription' ? (
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Calendar className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div className="pb-2 min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{activity.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 break-words">{activity.description}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(activity.time)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                  <p className="text-slate-400 text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
