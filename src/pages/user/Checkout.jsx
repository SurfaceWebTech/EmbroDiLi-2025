import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Shield, AlertCircle, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import useRazorpay from '../../lib/useRazorpay';
import { useThemeStore } from '../../lib/themeStore';
import { cn, formatCurrency } from '../../lib/utils';

export default function Checkout() {
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const { handlePayment, loading: razorpayLoading } = useRazorpay();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planName = params.get('plan');
    const period = params.get('period');
    
    if (!planName || !period) {
      toast.error('Invalid checkout parameters');
      navigate('/dashboard/subscription');
      return;
    }

    checkUser();
    fetchPlanDetails(planName, period);
  }, [location.search]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to continue');
        navigate('/login');
        return;
      }
      setUser(user);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          user_profiles!id(
            company_name,
            phone,
            address
          )
        `)
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('Authentication error');
      navigate('/login');
    }
  };

  const fetchPlanDetails = async (planName, period) => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .ilike('name', planName)
        .eq('billing_period', period)
        .single();

      if (error) {
        // Try searching by plan_id
        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('plan_id', `${planName.toLowerCase()}-${period}`)
          .single();
          
        if (planError) {
          throw new Error('Plan not found');
        }
        
        setPlan(planData);
      } else {
        setPlan(data);
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast.error('Failed to load plan details');
      navigate('/dashboard/subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionPurchase = async () => {
    if (!plan || !user) {
      toast.error('Missing plan or user information');
      return;
    }

    setProcessing(true);
    
    try {
      // Create payment
      handlePayment({
        amount: plan.price,
        currency: plan.currency || 'INR',
        name: 'Design Platform',
        description: `${plan.name} Plan - ${plan.billing_period}`,
        customer: {
          firstName: user.user_metadata?.firstName,
          lastName: user.user_metadata?.lastName,
          email: user.email,
          phoneNumber: profile?.user_profiles?.[0]?.phone
        },
        successCallback: async (response) => {
          try {
            // Create subscription record
            const startDate = new Date();
            let endDate = new Date(startDate);
            
            if (plan.billing_period === 'monthly') {
              endDate.setMonth(endDate.getMonth() + 1);
            } else if (plan.billing_period === 'yearly') {
              endDate.setFullYear(endDate.getFullYear() + 1);
            } else if (plan.billing_period === '7days') {
              endDate.setDate(endDate.getDate() + 7);
            }

            const { error: subscriptionError } = await supabase
              .from('customer_subscriptions')
              .insert({
                customer_id: user.id,
                plan_id: plan.id,
                status: 'active',
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString()
              });

            if (subscriptionError) throw subscriptionError;

            // Record transaction
            const { error: transactionError } = await supabase
              .from('transactions')
              .insert({
                user_id: user.id,
                amount: plan.price,
                currency: plan.currency || 'INR',
                status: 'completed',
                payment_gateway: 'razorpay',
                razorpay_payment_id: response.razorpay_payment_id
              });

            if (transactionError) throw transactionError;

            toast.success('Payment successful! Subscription activated.');
            navigate('/dashboard/subscription');
          } catch (error) {
            console.error('Error processing successful payment:', error);
            toast.error('Error activating subscription. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        failureCallback: (error) => {
          console.error('Payment failed:', error);
          toast.error(error.message || 'Payment failed');
          setProcessing(false);
        }
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error(error.message || 'Failed to process payment');
      setProcessing(false);
    }
  };

  if (loading || razorpayLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className={cn(
          "text-xl font-semibold mb-2",
          isDarkMode ? "text-gray-100" : "text-gray-900"
        )}>Plan Not Found</h2>
        <p className={cn(
          "text-sm mb-4",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>The selected plan could not be found.</p>
        <button
          onClick={() => navigate('/dashboard/subscription')}
          className="text-primary hover:text-primary-dark"
        >
          Return to Subscription Page
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className={cn(
            "text-3xl font-bold",
            isDarkMode ? "text-gray-100" : "text-gray-900"
          )}>Complete Your Purchase</h1>
          <p className={cn(
            "mt-2 text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>You're subscribing to the {plan.name} plan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <div className={cn(
            "rounded-lg border p-6",
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <h2 className={cn(
              "text-lg font-semibold mb-4",
              isDarkMode ? "text-gray-100" : "text-gray-900"
            )}>Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className={cn(
                  "text-sm",
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                )}>{plan.name} Plan</span>
                <span className={cn(
                  "font-medium",
                  isDarkMode ? "text-gray-200" : "text-gray-900"
                )}>{formatCurrency(plan.price, plan.currency)}</span>
              </div>

              <div className="flex justify-between">
                <span className={cn(
                  "text-sm",
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                )}>Billing Period</span>
                <span className={cn(
                  "font-medium",
                  isDarkMode ? "text-gray-200" : "text-gray-900"
                )}>{plan.billing_period}</span>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className={cn(
                    "font-medium",
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  )}>Total</span>
                  <span className={cn(
                    "text-xl font-bold",
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  )}>{formatCurrency(plan.price, plan.currency)}</span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className={cn(
                  "text-sm font-medium mb-2",
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                )}>Features included:</h3>
                <ul className="space-y-2">
                  {plan.features && Array.isArray(plan.features) && plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className={cn(
                        "w-4 h-4 mr-2",
                        isDarkMode ? "text-green-400" : "text-green-500"
                      )} />
                      <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className={cn(
            "rounded-lg border p-6",
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <h2 className={cn(
              "text-lg font-semibold mb-4",
              isDarkMode ? "text-gray-100" : "text-gray-900"
            )}>Payment Details</h2>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <CreditCard className={cn(
                  "w-6 h-6",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )} />
                <div>
                  <p className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  )}>Secure Payment</p>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Your payment is processed securely by Razorpay</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Shield className={cn(
                  "w-6 h-6",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )} />
                <div>
                  <p className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  )}>Money-back Guarantee</p>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>7-day money-back guarantee if you're not satisfied</p>
                </div>
              </div>

              <button
                onClick={handleSubscriptionPurchase}
                disabled={processing}
                className="w-full px-4 py-3 text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay {formatCurrency(plan.price, plan.currency)}
                  </>
                )}
              </button>

              <p className={cn(
                "text-xs text-center mt-4",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                By proceeding with the payment, you agree to our{' '}
                <a href="#" className="text-primary hover:text-primary-dark">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary hover:text-primary-dark">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}