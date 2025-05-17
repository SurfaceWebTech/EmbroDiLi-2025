import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useThemeStore } from '../../lib/themeStore';
import { cn } from '../../lib/utils';
import { CreditCard, Download, Clock, Search } from 'lucide-react';

export default function UserDashboard() {
  const { isDarkMode } = useThemeStore();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [downloadStats, setDownloadStats] = useState({
    total: 0,
    thisMonth: 0,
    limit: 0
  });
  const [recentDownloads, setRecentDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        setUser(user);
        
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
              billing_period,
              downloads_limit
            )
          `)
          .eq('customer_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!subError) {
          setSubscription(subData);
          
          // Update download limit
          setDownloadStats(prev => ({
            ...prev,
            limit: subData.subscription_plans.downloads_limit || 'Unlimited'
          }));
        }
        
        // Fetch download stats
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        const { data: monthlyDownloads, error: monthlyError } = await supabase
          .from('downloads')
          .select('id')
          .eq('user_id', user.id)
          .gte('downloaded_at', firstDayOfMonth);
          
        if (!monthlyError) {
          setDownloadStats(prev => ({
            ...prev,
            thisMonth: monthlyDownloads?.length || 0
          }));
        }
        
        const { data: totalDownloads, error: totalError } = await supabase
          .from('downloads')
          .select('id')
          .eq('user_id', user.id);
          
        if (!totalError) {
          setDownloadStats(prev => ({
            ...prev,
            total: totalDownloads?.length || 0
          }));
        }
        
        // Fetch recent downloads
        const { data: recentData, error: recentError } = await supabase
          .from('downloads')
          .select(`
            id,
            design_no,
            downloaded_at,
            documents(description)
          `)
          .eq('user_id', user.id)
          .order('downloaded_at', { ascending: false })
          .limit(5);
          
        if (!recentError) {
          setRecentDownloads(recentData || []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className={cn(
        "text-3xl font-bold",
        isDarkMode ? "text-gray-100" : "text-gray-900"
      )}>
        Welcome{user?.user_metadata?.firstName ? `, ${user.user_metadata.firstName}` : ''}!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subscription Status */}
        <div className={cn(
          "p-6 rounded-lg shadow-sm border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className={cn(
                "text-sm font-medium mb-1",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>Subscription Status</h3>
              {subscription ? (
                <>
                  <p className={cn(
                    "text-2xl font-bold",
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  )}>{subscription.subscription_plans.name}</p>
                  <p className={cn(
                    "text-sm",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    Renews on {new Date(subscription.end_date).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <>
                  <p className={cn(
                    "text-2xl font-bold text-yellow-500",
                    isDarkMode ? "text-yellow-400" : "text-yellow-500"
                  )}>No Active Plan</p>
                  <p className={cn(
                    "text-sm",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    <Link to="/dashboard/subscription" className="text-primary hover:underline">
                      Subscribe Now
                    </Link>
                  </p>
                </>
              )}
            </div>
            <CreditCard className={cn(
              "h-8 w-8",
              isDarkMode ? "text-gray-600" : "text-gray-300"
            )} />
          </div>
        </div>

        {/* Downloads */}
        <div className={cn(
          "p-6 rounded-lg shadow-sm border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className={cn(
                "text-sm font-medium mb-1",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>Downloads</h3>
              <p className={cn(
                "text-2xl font-bold",
                isDarkMode ? "text-gray-100" : "text-gray-900"
              )}>{downloadStats.thisMonth}</p>
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                {typeof downloadStats.limit === 'number' 
                  ? `out of ${downloadStats.limit} this month` 
                  : 'unlimited downloads'}
              </p>
            </div>
            <Download className={cn(
              "h-8 w-8",
              isDarkMode ? "text-gray-600" : "text-gray-300"
            )} />
          </div>
        </div>

        {/* Total Downloads */}
        <div className={cn(
          "p-6 rounded-lg shadow-sm border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className={cn(
                "text-sm font-medium mb-1",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>Total Downloads</h3>
              <p className={cn(
                "text-2xl font-bold",
                isDarkMode ? "text-gray-100" : "text-gray-900"
              )}>{downloadStats.total}</p>
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                all time
              </p>
            </div>
            <Clock className={cn(
              "h-8 w-8",
              isDarkMode ? "text-gray-600" : "text-gray-300"
            )} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Downloads */}
        <div className={cn(
          "rounded-lg shadow-sm border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className={cn(
            "px-6 py-4 border-b",
            isDarkMode ? "border-gray-700" : "border-gray-200"
          )}>
            <h3 className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-gray-100" : "text-gray-900"
            )}>Recent Downloads</h3>
          </div>
          <div className="p-6">
            {recentDownloads.length > 0 ? (
              <ul className="space-y-4">
                {recentDownloads.map((download) => (
                  <li key={download.id} className={cn(
                    "flex items-center p-3 rounded-lg",
                    isDarkMode ? "bg-gray-700" : "bg-gray-50"
                  )}>
                    <div className={cn(
                      "h-10 w-10 flex items-center justify-center rounded-full mr-4",
                      isDarkMode ? "bg-gray-600" : "bg-gray-200"
                    )}>
                      <Download className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className={cn(
                        "text-sm font-medium",
                        isDarkMode ? "text-gray-200" : "text-gray-800"
                      )}>{download.design_no}</h4>
                      <p className={cn(
                        "text-xs",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>
                        {download.documents?.description || 'Design'} • {new Date(download.downloaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <Download className={cn(
                  "h-12 w-12 mx-auto mb-4",
                  isDarkMode ? "text-gray-600" : "text-gray-300"
                )} />
                <p className={cn(
                  "text-sm",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>No download history yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={cn(
          "rounded-lg shadow-sm border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className={cn(
            "px-6 py-4 border-b",
            isDarkMode ? "border-gray-700" : "border-gray-200"
          )}>
            <h3 className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-gray-100" : "text-gray-900"
            )}>Quick Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            <Link
              to="/dashboard/designs"
              className={cn(
                "block w-full text-center px-4 py-3 rounded-lg border transition-colors",
                isDarkMode 
                  ? "bg-primary text-white hover:bg-primary-dark border-primary" 
                  : "bg-primary text-white hover:bg-primary-dark border-primary"
              )}
            >
              <div className="flex items-center justify-center">
                <Search className="h-5 w-5 mr-2" />
                Browse Designs
              </div>
            </Link>
            
            <Link
              to="/dashboard/downloads"
              className={cn(
                "block w-full text-center px-4 py-3 rounded-lg border transition-colors",
                isDarkMode 
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200"
              )}
            >
              <div className="flex items-center justify-center">
                <Download className="h-5 w-5 mr-2" />
                Download History
              </div>
            </Link>
            
            <Link
              to="/dashboard/subscription"
              className={cn(
                "block w-full text-center px-4 py-3 rounded-lg border transition-colors",
                isDarkMode 
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200"
              )}
            >
              <div className="flex items-center justify-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Manage Subscription
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}