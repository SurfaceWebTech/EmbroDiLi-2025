import { useState, useEffect } from 'react';
import { 
  Search, 
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useThemeStore } from '../../lib/themeStore';
import { cn, formatDate, formatCurrency, getStatusColor } from '../../lib/utils';

export default function Transactions() {
  const { isDarkMode } = useThemeStore();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          currency,
          status,
          payment_intent_id,
          created_at,
          profiles:user_id(
            id,
            email,
            full_name,
            user_profiles!id(
              company_name
            )
          ),
          user_subscriptions:subscription_id(
            id,
            subscription_plans:plan_id(
              name,
              billing_period
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.profiles.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.payment_intent_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className={cn(
          "text-2xl font-bold",
          isDarkMode ? "text-gray-100" : "text-gray-900"
        )}>Transaction History</h1>
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
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="flex flex-1 justify-between items-center">
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              placeholder="Search transactions..."
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

      {/* Transactions Table */}
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
                  )}>Transaction ID</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Amount</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Status</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Plan</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Date</th>
                </tr>
              </thead>
              <tbody className={cn(
                "divide-y",
                isDarkMode ? "divide-gray-700" : "divide-gray-200"
              )}>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={cn(
                      "px-6 py-8 text-center text-sm",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                      No transactions found matching your criteria
                    </td>
                  </tr>
                ) : (
                  currentItems.map((transaction) => (
                    <tr key={transaction.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
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
                              {transaction.profiles.full_name?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className={cn(
                              "text-sm font-medium",
                              isDarkMode ? "text-gray-200" : "text-gray-900"
                            )}>
                              {transaction.profiles.full_name}
                            </div>
                            <div className={cn(
                              "text-sm",
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            )}>
                              {transaction.profiles.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        )}>
                          {transaction.payment_intent_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm font-medium",
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        )}>
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 text-xs font-semibold rounded-full",
                          getStatusColor(transaction.status, isDarkMode)
                        )}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        )}>
                          {transaction.user_subscriptions?.subscription_plans?.name || 'N/A'}
                        </div>
                        {transaction.user_subscriptions?.subscription_plans?.billing_period && (
                          <div className={cn(
                            "text-xs",
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          )}>
                            {transaction.user_subscriptions.subscription_plans.billing_period}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        )}>
                          {formatDate(transaction.created_at)}
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
                  {Math.min(indexOfLastItem, filteredTransactions.length)}
                </span>{' '}
                of <span className="font-medium">{filteredTransactions.length}</span> transactions
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