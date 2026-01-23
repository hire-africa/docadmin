'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Search, Filter, MoreVertical, Eye, CheckCircle, XCircle, Calendar, DollarSign, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  plan_name: string;
  plan_price: string;
  plan_currency: string;
  status: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  text_sessions_remaining: number;
  appointments_remaining: number;
  voice_calls_remaining: number;
  video_calls_remaining: number;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    text_sessions_remaining: number;
    voice_calls_remaining: number;
    video_calls_remaining: number;
    appointments_remaining: number;
  } | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchSubscriptions();
  }, [currentPage, filterStatus, searchTerm]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: filterStatus,
      });

      const response = await fetch(`/api/subscriptions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
        setTotalPages(data.totalPages || 1);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch subscriptions' }));
        console.error('Error fetching subscriptions:', errorData);
        toast.error(errorData.message || 'Failed to fetch subscriptions');
        setSubscriptions([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to fetch subscriptions');
      setSubscriptions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSubscriptions();
  };

  const handleStatusToggle = async (subscriptionId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/subscriptions/${subscriptionId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        toast.success('Subscription status updated successfully');
        fetchSubscriptions();
      } else {
        toast.error('Failed to update subscription status');
      }
    } catch (error) {
      console.error('Error updating subscription status:', error);
      toast.error('Failed to update subscription status');
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingId(subscription.id);
    setEditValues({
      text_sessions_remaining: subscription.text_sessions_remaining,
      voice_calls_remaining: subscription.voice_calls_remaining,
      video_calls_remaining: subscription.video_calls_remaining,
      appointments_remaining: subscription.appointments_remaining,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const handleSaveEdit = async (subscriptionId: number) => {
    if (!editValues) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editValues),
      });

      if (response.ok) {
        toast.success('Subscription updated successfully');
        setEditingId(null);
        setEditValues(null);
        fetchSubscriptions();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update subscription' }));
        toast.error(errorData.message || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const handleEditValueChange = (field: keyof typeof editValues, value: string) => {
    if (!editValues) return;
    const numValue = parseInt(value) || 0;
    if (numValue < 0) return;
    setEditValues({
      ...editValues,
      [field]: numValue,
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(parseFloat(amount));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage user subscriptions and plans
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by user name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn btn-primary w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {subscription.user.first_name.charAt(0)}{subscription.user.last_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.user.first_name} {subscription.user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{subscription.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.plan_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(subscription.plan_price, subscription.plan_currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(subscription.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === subscription.id && editValues ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-500 w-20">Text:</label>
                            <input
                              type="number"
                              min="0"
                              value={editValues.text_sessions_remaining}
                              onChange={(e) => handleEditValueChange('text_sessions_remaining', e.target.value)}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-500 w-20">Voice:</label>
                            <input
                              type="number"
                              min="0"
                              value={editValues.voice_calls_remaining}
                              onChange={(e) => handleEditValueChange('voice_calls_remaining', e.target.value)}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-500 w-20">Video:</label>
                            <input
                              type="number"
                              min="0"
                              value={editValues.video_calls_remaining}
                              onChange={(e) => handleEditValueChange('video_calls_remaining', e.target.value)}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-500 w-20">Appts:</label>
                            <input
                              type="number"
                              min="0"
                              value={editValues.appointments_remaining}
                              onChange={(e) => handleEditValueChange('appointments_remaining', e.target.value)}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">
                          <div>Text: {subscription.text_sessions_remaining}</div>
                          <div>Voice: {subscription.voice_calls_remaining}</div>
                          <div>Video: {subscription.video_calls_remaining}</div>
                          <div>Appointments: {subscription.appointments_remaining}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>Start: {formatDate(subscription.start_date)}</div>
                        <div>End: {formatDate(subscription.end_date)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {editingId === subscription.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(subscription.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(subscription)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit sessions"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusToggle(subscription.id, subscription.is_active)}
                              className={`${
                                subscription.is_active
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                              title={subscription.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {subscription.is_active ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}






