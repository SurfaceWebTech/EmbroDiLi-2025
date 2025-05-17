import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useThemeStore } from '../../lib/themeStore';
import { cn, formatDate, formatCurrency, getStatusColor } from '../../lib/utils';

export default function Subscriptions() {
  const { isDarkMode } = useThemeStore();
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_subscriptions')
        .select(`
          id,
          status,
          start_date,
          end_date,
          created_at,
          profiles:customer_id(
            id,
            email,
            full_name,
            user_profiles!id(
              company_name
            )
          ),
          subscription_plans:plan_id(
            id,
            name,
            price,
            billing_period
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    try {
      const { error } = await supabase
        .from('customer_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubscriptions(subscriptions.filter(sub => sub.id !== id));
      toast.success('Subscription deleted successfully');
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Failed to delete subscription');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('customer_subscriptions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setSubscriptions(subscriptions.map(sub => 
        sub.id === id ? { ...sub, status: newStatus } : sub
      ));
      toast.success('Subscription status updated');
    } catch (error) {
      console.error('Error updating subscription status:', error);
      toast.error('Failed to update subscription status');
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles.user_profiles?.[0]?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'all' || sub.subscription_plans.id.toString() === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubscriptions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);

  const uniquePlans = [...new Set(subscriptions.map(sub => sub.subscription_plans))];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className={cn(
          "text-2xl font-bold",
          isDarkMode ? "text-gray-100" : "text-gray-900"
        )}>Subscription Management</h1>
        <button
          onClick={() => {/* Handle new subscription */}}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(
              "px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary",
              isDarkMode 
                ? "bg-gray-800 border-gray-700 text-gray-200" 
                : "bg-white border-gray-300 text-gray-700"
            )}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className={cn(
              "px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary",
              isDarkMode 
                ? "bg-gray-800 border-gray-700 text-gray-200" 
                : "bg-white border-gray-300 text-gray-700"
            )}
          >
            <option value="all">All Plans</option>
            {uniquePlans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 justify-between items-center">
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent",
                isDarkMode 
                  ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500" 
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              )}
            />
            <Search className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5",
              isDarkMode ? "text-gray-500" : "text-gray-400"
            )} />
          </div>

          <button className={cn(
            "flex items-center px-3 py-2 border rounded-md text-sm hover:bg-gray-50 ml-4",
            isDarkMode 
              ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700" 
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          )}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className={cn(
        "rounded-lg shadow overflow-hidden",
        isDarkMode ? "bg-gray-800" : "bg-white"
      )}>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-900" : "bg-gray-50"}>
                <tr>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Customer</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Plan</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Status</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Start Date</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>End Date</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Amount</th>
                  <th className={cn(
                    "px-6 py-3 text-right text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Actions</th>
                </tr>
              </thead>
              <tbody className={cn(
                "divide-y",
                isDarkMode ? "divide-gray-700" : "divide-gray-200"
              )}>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={cn(
                      "px-6 py-8 text-center text-sm",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                      No subscriptions found matching your criteria
                    </td>
                  </tr>
                ) : (
                  currentItems.map((subscription) => (
                    <tr key={subscription.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={cn(
                            "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                            isDarkMode ? "bg-gray-700" : "bg-gray-200"
                          )}>
                            <span className={cn(
                              "text-sm font-medium",
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            )}>
                              {subscription.profiles.full_name?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className={cn(
                              "text-sm font-medium",
                              isDarkMode ? "text-gray-200" : "text-gray-900"
                            )}>
                              {subscription.profiles.full_name}
                            </div>
                            <div className={cn(
                              "text-sm",
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            )}>
                              {subscription.profiles.email}
                            </div>
                            {subscription.profiles.user_profiles?.[0]?.company_name && (
                              <div className={cn(
                                "text-xs",
                                isDarkMode ? "text-gray-500" : "text-gray-400"
                              )}>
                                {subscription.profiles.user_profiles[0].company_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm font-medium",
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        )}>
                          {subscription.subscription_plans.name}
                        </div>
                        <div className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        )}>
                          {formatCurrency(subscription.subscription_plans.price)}/{subscription.subscription_plans.billing_period}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={subscription.status}
                          onChange={(e) => handleStatusChange(subscription.id, e.target.value)}
                          className={cn(
                            "px-2 py-1 text-xs font-semibold rounded-full",
                            getStatusColor(subscription.status, isDarkMode)
                          )}
                        >
                          <option value="active">Active</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="expired">Expired</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        )}>
                          {formatDate(subscription.start_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        )}>
                          {formatDate(subscription.end_date)}
                        </div>
                        {new Date(subscription.end_date) < new Date() && (
                          <div className="flex items-center text-xs text-red-500 mt-1">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Expired
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm font-medium",
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        )}>
                          {formatCurrency(subscription.subscription_plans.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {/* Handle edit */}}
                            className={cn(
                              "text-indigo-600 hover:text-indigo-900",
                              isDarkMode && "text-opacity-90 hover:text-opacity-100"
                            )}
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(subscription.id)}
                            className={cn(
                              "text-red-600 hover:text-red-900",
                              isDarkMode && "text-opacity-90 hover:text-opacity-100"
                            )}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className={cn(
          "px-4 py-3 flex items-center justify-between border-t sm:px-6",
          isDarkMode ? "border-gray-700" : "border-gray-200"
        )}>
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={cn(
                "relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md disabled:opacity-50",
                isDarkMode
                  ? "border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              )}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={cn(
                "ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md disabled:opacity-50",
                isDarkMode
                  ? "border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              )}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredSubscriptions.length)}
                </span>{' '}
                of <span className="font-medium">{filteredSubscriptions.length}</span> subscriptions
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={cn(
                    "relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium disabled:opacity-50",
                    isDarkMode
                      ? "border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700"
                      : "border-gray-300 text-gray-500 bg-white hover:bg-gray-50"
                  )}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                      currentPage === i + 1
                        ? "z-10 bg-primary border-primary text-white"
                        : isDarkMode
                          ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={cn(
                    "relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium disabled:opacity-50",
                    isDarkMode
                      ? "border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700"
                      : "border-gray-300 text-gray-500 bg-white hover:bg-gray-50"
                  )}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}