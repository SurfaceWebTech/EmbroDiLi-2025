import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useThemeStore } from '../../lib/themeStore';
import { cn, formatDate, formatCurrency } from '../../lib/utils';

export default function Subscription() {
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadUsage, setDownloadUsage] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchUserData(user.id);
      } else {
        navigate('/login');
      }
    };

    getUserData();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      setIsLoading(true);
      
      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('customer_subscriptions')
        .select(`
          id,
          status,
          start_date,
          end_date,
          subscription_plans(
            id,
            name,
            price,
            currency,
            billing_period,
            downloads_limit,
            features
          )
        `)
        .eq('customer_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!subError) {
        setSubscription(subData);
      }

      // Fetch available plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (!plansError) {
        const monthlyPlans = plansData.filter(p => p.billing_period === 'monthly');
        const yearlyPlans = plansData.filter(p => p.billing_period === 'yearly');
        
        // Group similar plans (monthly/yearly variants)
        const groupedPlans = monthlyPlans.map(plan => {
          const yearlyVariant = yearlyPlans.find(p => p.name === plan.name);
          return {
            ...plan,
            yearlyVariant
          };
        });
        
        setPlans(groupedPlans);
      }

      // Fetch download usage
      const { data: downloads, error: downloadsError } = await supabase
        .from('downloads')
        .select('id')
        .eq('user_id', userId)
        .gte('downloaded_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

      if (!downloadsError) {
        setDownloadUsage(downloads?.length || 0);
      }

      // Fetch recent transactions
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!transError) {
        setTransactions(transData || []);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (plan, period = 'monthly') => {
    const billingPeriod = period === 'yearly' ? 'yearly' : 'monthly';
    const planToUse = period === 'yearly' && plan.yearlyVariant ? plan.yearlyVariant : plan;
    
    navigate(`/dashboard/checkout?plan=${encodeURIComponent(planToUse.name)}&period=${billingPeriod}`);
  };

  const handleCancelSubscription = async () => {
    if (!subscription || !user) return;
    
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      const { error } = await supabase
        .from('customer_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id)
        .eq('customer_id', user.id);

      if (error) throw error;

      toast.success('Subscription cancelled successfully');
      
      // Refresh subscription data
      setSubscription(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'cancelled'
        };
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className={cn(
        "text-2xl font-bold",
        isDarkMode ? "text-gray-100" : "text-gray-900"
      )}>Subscription Management</h1>

      {/* Current Plan Section */}
      <div className={cn(
        "rounded-lg border",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      )}>
        <div className="p-6">
          <h2 className={cn(
            "text-lg font-semibold mb-4",
            isDarkMode ? "text-gray-100" : "text-gray-900"
          )}>Current Plan</h2>

          {subscription ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={cn(
                    "text-xl font-bold",
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  )}>{subscription.subscription_plans.name}</h3>
                  <div className="mt-1 space-y-1">
                    <p className={cn(
                      "text-sm",
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    )}>Started on {formatDate(subscription.start_date)}</p>
                    <p className={cn(
                      "text-sm",
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    )}>Renews on {formatDate(subscription.end_date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-2xl font-bold",
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  )}>{formatCurrency(subscription.subscription_plans.price, subscription.subscription_plans.currency)}</div>
                  <div className={cn(
                    "text-sm",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>/{subscription.subscription_plans.billing_period}</div>
                  <div className="mt-2">
                    {subscription.status === 'active' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    ) : subscription.status === 'cancelled' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {subscription.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Download Usage */}
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>Download Usage</label>
                <div className="relative pt-1">
                  <div className={cn(
                    "overflow-hidden h-2 text-xs flex rounded",
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  )}>
                    <div
                      style={{ 
                        width: subscription.subscription_plans.downloads_limit 
                          ? `${Math.min(100, (downloadUsage / subscription.subscription_plans.downloads_limit) * 100)}%` 
                          : '10%' 
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                    />
                  </div>
                  <div className={cn(
                    "text-sm mt-1",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    {downloadUsage} of {subscription.subscription_plans.downloads_limit || 'Unlimited'} downloads used this month
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className={cn(
                  "text-sm font-medium mb-2",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>Features included:</h4>
                <ul className="space-y-2">
                  {subscription.subscription_plans.features && 
                   Array.isArray(subscription.subscription_plans.features) &&
                   subscription.subscription_plans.features.map((feature, index) => (
                    <li key={index} className={cn(
                      "flex items-center text-sm",
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    )}>
                      <span className="mr-2 text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              {subscription.status === 'active' && (
                <div className="flex space-x-4">
                  <button
                    onClick={handleCancelSubscription}
                    className={cn(
                      "inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md",
                      isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    Cancel Subscription
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className={cn(
                "text-lg",
                isDarkMode ? "text-gray-300" : "text-gray-600"
              )}>
                You don't have an active subscription.
              </p>
              <p className={cn(
                "mt-2",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                Choose a plan below to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Billing History */}
      {transactions.length > 0 && (
        <div className={cn(
          "rounded-lg border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className="p-6">
            <h2 className={cn(
              "text-lg font-semibold mb-4",
              isDarkMode ? "text-gray-100" : "text-gray-900"
            )}>Billing History</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>Date</th>
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
                    )}>Payment ID</th>
                  </tr>
                </thead>
                <tbody className={cn(
                  "divide-y",
                  isDarkMode ? "divide-gray-700" : "divide-gray-200"
                )}>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className={cn(
                        "px-6 py-4 whitespace-nowrap text-sm",
                        isDarkMode ? "text-gray-300" : "text-gray-900"
                      )}>{formatDate(transaction.created_at)}</td>
                      <td className={cn(
                        "px-6 py-4 whitespace-nowrap text-sm",
                        isDarkMode ? "text-gray-300" : "text-gray-900"
                      )}>{formatCurrency(transaction.amount, transaction.currency)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        )}>
                          {transaction.razorpay_payment_id || transaction.id}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h2 className={cn(
          "text-lg font-semibold mb-4",
          isDarkMode ? "text-gray-100" : "text-gray-900"
        )}>Available Plans</h2>

        {/* Monthly/Yearly Toggle */}
        <div className="flex justify-center mb-6">
          <div className="relative w-60">
            <div className="bg-gray-300 h-8 rounded-full">
              <div className="absolute inset-0 flex">
                <span className="flex-1 flex justify-center items-center text-sm font-medium cursor-pointer z-10 text-gray-800">Monthly</span>
                <span className="flex-1 flex justify-center items-center text-sm font-medium cursor-pointer z-10 text-gray-800">Annual (Save 20%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            // Check if this plan is the current subscription
            const isCurrent = subscription && 
                             subscription.subscription_plans.id === plan.id && 
                             subscription.status === 'active';
            
            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-lg border p-6",
                  isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
                  isCurrent && "ring-2 ring-primary"
                )}
              >
                <h3 className={cn(
                  "text-lg font-semibold",
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                )}>{plan.name}</h3>
                <div className="mt-2">
                  <span className={cn(
                    "text-3xl font-bold",
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  )}>{formatCurrency(plan.price, plan.currency)}</span>
                  <span className={cn(
                    "text-sm ml-1",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>/{plan.billing_period}</span>
                </div>
                {plan.description && (
                  <p className={cn(
                    "mt-2 text-sm",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    {plan.description}
                  </p>
                )}

                <ul className="mt-6 space-y-4">
                  {plan.features && Array.isArray(plan.features) && plan.features.map((feature, index) => (
                    <li key={index} className="flex">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className={cn(
                        "text-sm",
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      )}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(plan, 'monthly')}
                  disabled={isCurrent}
                  className={cn(
                    "mt-8 w-full px-4 py-2 text-sm font-medium rounded-md",
                    isCurrent
                      ? isDarkMode
                        ? "bg-gray-700 text-gray-300 cursor-default"
                        : "bg-gray-100 text-gray-400 cursor-default"
                      : "bg-primary text-white hover:bg-primary-dark"
                  )}
                >
                  {isCurrent ? 'Current Plan' : 'Select Plan'}
                </button>

                {/* Yearly option */}
                {plan.yearlyVariant && (
                  <button
                    onClick={() => handlePlanSelect(plan, 'yearly')}
                    disabled={subscription && 
                            subscription.subscription_plans.id === plan.yearlyVariant.id && 
                            subscription.status === 'active'}
                    className={cn(
                      "mt-2 w-full px-4 py-2 text-sm font-medium border rounded-md",
                      subscription && 
                      subscription.subscription_plans.id === plan.yearlyVariant.id && 
                      subscription.status === 'active'
                        ? isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-300 cursor-default"
                          : "bg-gray-100 border-gray-200 text-gray-400 cursor-default"
                        : isDarkMode
                          ? "border-primary text-primary hover:bg-gray-700"
                          : "border-primary text-primary hover:bg-gray-50"
                    )}
                  >
                    {subscription && 
                     subscription.subscription_plans.id === plan.yearlyVariant.id && 
                     subscription.status === 'active' 
                      ? 'Current Annual Plan' 
                      : `Select Annual Plan (${formatCurrency(plan.yearlyVariant.price, plan.yearlyVariant.currency)})`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className={cn(
          "mt-4 text-sm text-center",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          Need a custom solution?{' '}
          <a href="#" className="text-primary hover:text-primary-dark">
            Contact us
          </a>{' '}
          for enterprise pricing.
        </p>
      </div>
    </div>
  );
}