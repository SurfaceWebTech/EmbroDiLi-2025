import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  ExternalLink, 
  Download, 
  Filter, 
  Users, 
  Mail, 
  Phone, 
  AlertTriangle, 
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import CustomerForm from '../../components/CustomerForm';
import SubscriptionForm from '../../components/SubscriptionForm';
import { useThemeStore } from '../../lib/themeStore';
import { cn } from '../../lib/utils';

export default function Customers() {
  const { isDarkMode } = useThemeStore();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState({
    highEngagement: 16,
    lowEngagement: 42,
    unsubscribed: 33,
    invalidNumbers: 150
  });
  
  // Filter states
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedGroup, setSelectedGroup] = useState('All Groups');
  const [selectedTime, setSelectedTime] = useState('All Time');
  const [selectedTier, setSelectedTier] = useState('All Tiers');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          role,
          email_verified,
          created_at,
          user_profiles!id(
            company_name,
            phone,
            address
          ),
          customer_subscriptions!id(
            id,
            plan_id,
            status,
            start_date,
            end_date,
            subscription_plans!plan_id(
              name,
              price,
              billing_period
            )
          )
        `);

      if (error) throw error;

      const formattedCustomers = data.map(customer => ({
        id: customer.id,
        firstName: customer.full_name?.split(' ')[0] || '',
        lastName: customer.full_name?.split(' ').slice(1).join(' ') || '',
        email: customer.email,
        phoneNumber: customer.user_profiles?.[0]?.phone || '',
        company: customer.user_profiles?.[0]?.company_name || '',
        location: customer.user_profiles?.[0]?.address?.city || 'Not specified',
        role: customer.role || 'user',
        status: customer.customer_subscriptions?.[0]?.status || 'inactive',
        subscription: customer.customer_subscriptions?.[0] || null,
        joinDate: new Date(customer.created_at).toISOString().split('T')[0],
        lastEngaged: generateRandomDate(),
        engagementTier: generateRandomTier(),
        email_verified: customer.email_verified || false
      }));

      setCustomers(formattedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    return date.toISOString().split('T')[0];
  };
  
  const generateRandomTier = () => {
    const tiers = ['High', 'Medium', 'Low', 'None'];
    return tiers[Math.floor(Math.random() * tiers.length)];
  };

  const handleSubmit = async (formData) => {
    if (editingCustomer) {
      try {
        const { error } = await supabase.rpc('update_customer', {
          p_id: editingCustomer.id,
          p_email: formData.email,
          p_full_name: `${formData.firstName} ${formData.lastName}`,
          p_company_name: formData.companyName || null,
          p_phone: `${formData.countryCode}${formData.phoneNumber}`,
          p_address: {
            street: formData.streetAddress.trim(),
            city: formData.city.trim(),
            postcode: formData.postcode.trim()
          },
          p_metadata: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            companyName: formData.companyName,
            gstNumber: formData.gstNumber,
            streetAddress: formData.streetAddress,
            city: formData.city,
            postcode: formData.postcode,
            countryCode: formData.countryCode,
            phoneNumber: formData.phoneNumber
          }
        });

        if (error) throw error;

        toast.success('Customer updated successfully');
        setIsModalOpen(false);
        setEditingCustomer(null);
        fetchCustomers();
      } catch (error) {
        console.error('Error updating customer:', error);
        toast.error('Failed to update customer');
      }
    } else {
      fetchCustomers();
    }
  };

  const handleSubscriptionSubmit = async (subscriptionData) => {
    try {
      const { error } = await supabase
        .from('customer_subscriptions')
        .upsert({
          customer_id: selectedCustomer.id,
          plan_id: subscriptionData.planId,
          status: 'active',
          start_date: subscriptionData.startDate,
          end_date: subscriptionData.endDate
        });

      if (error) throw error;

      toast.success('Subscription updated successfully');
      setIsSubscriptionModalOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const handleEdit = (customer) => {
    const nameParts = customer.firstName && customer.lastName 
      ? [customer.firstName, customer.lastName]
      : customer.firstName.split(' ');
    
    const formData = {
      id: customer.id,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: customer.email,
      phoneNumber: customer.phoneNumber?.replace(/^\+\d+/, '') || '',
      countryCode: customer.phoneNumber?.match(/^\+\d+/)?.[0] || '+91',
      companyName: customer.company || '',
      gstNumber: '',
      streetAddress: '',
      city: customer.location || '',
      postcode: ''
    };
    
    setEditingCustomer(formData);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setCustomers(customers.filter(customer => customer.id !== id));
        toast.success('Customer deleted successfully');
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer');
      }
    }
  };

  const handleManageSubscription = (customer) => {
    setSelectedCustomer(customer);
    setIsSubscriptionModalOpen(true);
  };

  const handleVerifyUser = async (userId) => {
    try {
      const { error } = await supabase.rpc('verify_user_email', {
        user_id: userId
      });

      if (error) throw error;

      toast.success('User email verified successfully');
      fetchCustomers(); // Refresh the customer list
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Failed to verify user');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneNumber.includes(searchTerm);
      
    const matchesType = selectedType === 'All Types' || 
                        (selectedType === 'Active' && customer.status === 'active') ||
                        (selectedType === 'Inactive' && customer.status === 'inactive');
                        
    const matchesLocation = selectedLocation === 'All Locations' || 
                           customer.location === selectedLocation;
                           
    const matchesTier = selectedTier === 'All Tiers' ||
                       customer.engagementTier === selectedTier;
                       
    return matchesSearch && matchesType && matchesLocation && matchesTier;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredCustomers.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const locations = [...new Set(customers.map(customer => customer.location))];
  const engagementTiers = ['High', 'Medium', 'Low', 'None'];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
          Customer Management
        </h1>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Overview Section */}
      <div className="mb-8">
        <h2 className={cn("text-xl font-semibold mb-4", isDarkMode ? "text-gray-200" : "text-gray-800")}>
          Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={cn(
            "p-4 rounded-lg shadow border",
            isDarkMode 
              ? "bg-gray-800 border-gray-700" 
              : "bg-white border-gray-200"
          )}>
            <h3 className={cn("text-sm font-medium mb-2", isDarkMode ? "text-gray-300" : "text-gray-600")}>
              High Engagement
            </h3>
            <div className="flex justify-between items-center">
              <span className={cn("text-3xl font-bold", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                {metrics.highEngagement}
              </span>
              <button className="text-primary text-sm font-medium flex items-center">
                View <ExternalLink className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
          
          <div className={cn(
            "p-4 rounded-lg shadow border",
            isDarkMode 
              ? "bg-gray-800 border-gray-700" 
              : "bg-white border-gray-200"
          )}>
            <h3 className={cn("text-sm font-medium mb-2", isDarkMode ? "text-gray-300" : "text-gray-600")}>
              Low Engagement
            </h3>
            <div className="flex justify-between items-center">
              <span className={cn("text-3xl font-bold", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                {metrics.lowEngagement}
              </span>
              <button className="text-primary text-sm font-medium flex items-center">
                View <ExternalLink className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
          
          <div className={cn(
            "p-4 rounded-lg shadow border",
            isDarkMode 
              ? "bg-gray-800 border-gray-700" 
              : "bg-white border-gray-200"
          )}>
            <h3 className={cn("text-sm font-medium mb-2", isDarkMode ? "text-gray-300" : "text-gray-600")}>
              Unsubscribed
            </h3>
            <div className="flex justify-between items-center">
              <span className={cn("text-3xl font-bold", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                {metrics.unsubscribed}
              </span>
              <button className="text-primary text-sm font-medium flex items-center">
                View <ExternalLink className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
          
          <div className={cn(
            "p-4 rounded-lg shadow border",
            isDarkMode 
              ? "bg-gray-800 border-gray-700" 
              : "bg-white border-gray-200"
          )}>
            <h3 className={cn("text-sm font-medium mb-2", isDarkMode ? "text-gray-300" : "text-gray-600")}>
              Invalid Numbers
            </h3>
            <div className="flex justify-between items-center">
              <span className={cn("text-3xl font-bold", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                {metrics.invalidNumbers}
              </span>
              <button className="text-primary text-sm font-medium flex items-center">
                View <ExternalLink className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={cn(
              "px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary",
              isDarkMode 
                ? "bg-gray-800 border-gray-700 text-gray-200" 
                : "bg-white border-gray-300 text-gray-700"
            )}
          >
            <option>All Types</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className={cn(
              "px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary",
              isDarkMode 
                ? "bg-gray-800 border-gray-700 text-gray-200" 
                : "bg-white border-gray-300 text-gray-700"
            )}
          >
            <option>All Locations</option>
            {locations.map((location, idx) => (
              <option key={idx}>{location}</option>
            ))}
          </select>
          
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className={cn(
              "px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary",
              isDarkMode 
                ? "bg-gray-800 border-gray-700 text-gray-200" 
                : "bg-white border-gray-300 text-gray-700"
            )}
          >
            <option>All Groups</option>
            <option>Customers</option>
            <option>Leads</option>
            <option>Prospects</option>
          </select>
          
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className={cn(
              "px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary",
              isDarkMode 
                ? "bg-gray-800 border-gray-700 text-gray-200" 
                : "bg-white border-gray-300 text-gray-700"
            )}
          >
            <option>All Time</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>Last Year</option>
          </select>
          
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className={cn(
              "px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary",
              isDarkMode 
                ? "bg-gray-800 border-gray-700 text-gray-200" 
                : "bg-white border-gray-300 text-gray-700"
            )}
          >
            <option>All Tiers</option>
            {engagementTiers.map((tier, idx) => (
              <option key={idx}>{tier}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-1 justify-between items-center">
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              placeholder="Search customers..."
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
          
          <div className="flex items-center space-x-2">
            <button className={cn(
              "flex items-center px-3 py-2 border rounded-md text-sm hover:bg-gray-50",
              isDarkMode 
                ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700" 
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            )}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Customer Table */}
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
              <thead className={cn(
                isDarkMode ? "bg-gray-900" : "bg-gray-50"
              )}>
                <tr>
                  <th className="w-12 px-3 py-3 text-left">
                    <input type="checkbox" className={cn(
                      "rounded",
                      isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                    )} />
                  </th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Name</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Phone Number</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Location</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Role</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Subscription</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Last Engaged</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Engagement Tier</th>
                  <th className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Added On</th>
                  <th className={cn(
                    "px-6 py-3 text-right text-xs font-medium uppercase tracking-wider",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Actions</th>
                </tr>
              </thead>
              <tbody className={cn(
                "divide-y",
                isDarkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"
              )}>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="10" className={cn(
                      "px-6 py-8 text-center text-sm",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                      No customers found matching your criteria
                    </td>
                  </tr>
                ) : (
                  currentItems.map((customer) => (
                    <tr key={customer.id} className={cn(
                      "hover:bg-gray-50",
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    )}>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <input type="checkbox" className={cn(
                          "rounded",
                          isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                        )} />
                      </td>
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
                              {customer.firstName[0]}{customer.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className={cn(
                              "text-sm font-medium",
                              isDarkMode ? "text-gray-200" : "text-gray-900"
                            )}>
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className={cn(
                              "text-sm",
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            )}>{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm",
                          Math.random() > 0.9 
                            ? "text-red-500" 
                            : isDarkMode ? "text-gray-400" : "text-gray-500"
                        )}>
                          {Math.random() > 0.9 && (
                            <span className="inline-block mr-1 text-red-500" title="Invalid number">
                              <AlertTriangle className="h-4 w-4" />
                            </span>
                          )}
                          {customer.phoneNumber || 'Not provided'}
                          {Math.random() > 0.9 && (
                            <div className="text-xs text-red-500">This number is invalid</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        )}>{customer.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        )}>{customer.role || 'Customer'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.subscription ? (
                          <div className="text-sm">
                            <div className={cn(
                              "font-medium",
                              isDarkMode ? "text-gray-200" : "text-gray-900"
                            )}>
                              {customer.subscription.subscription_plans.name}
                            </div>
                            <div className={cn(
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            )}>
                              ${customer.subscription.subscription_plans.price}/{customer.subscription.subscription_plans.billing_period}
                            </div>
                            <div className={cn(
                              "text-xs",
                              customer.subscription.status === 'active'
                                ? "text-green-600"
                                : "text-red-600"
                            )}>
                              {customer.subscription.status}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleManageSubscription(customer)}
                            className={cn(
                              "inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded",
                              isDarkMode
                                ? "border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700"
                                : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                            )}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Add Plan
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        )}>
                          {customer.lastEngaged || 'Never'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                          getEngagementColor(customer.engagementTier, isDarkMode)
                        )}>
                          {customer.engagementTier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        )}>{customer.joinDate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleVerifyUser(customer.id)}
                            className={cn(
                              "text-primary hover:text-primary-dark",
                              isDarkMode && "text-opacity-90 hover:text-opacity-100"
                            )}
                            title={customer.email_verified ? "Email Verified" : "Verify Email"}
                          >
                            {customer.email_verified ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <button
                                onClick={() => handleVerifyUser(customer.id)}
                                className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                
                              >
                                Verify Email
                              </button>
                            )}
                          </button>
                          <button
                            onClick={() => handleManageSubscription(customer)}
                            className={cn(
                              "text-primary hover:text-primary-dark",
                              isDarkMode && "text-opacity-90 hover:text-opacity-100"
                            )}
                            title="Manage Subscription"
                          >
                            <CreditCard className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className={cn(
                              "text-indigo-600 hover:text-indigo-900",
                              isDarkMode && "text-opacity-90 hover:text-opacity-100"
                            )}
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageNumbers.length))}
              disabled={currentPage === pageNumbers.length}
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
                  {Math.min(indexOfLastItem, filteredCustomers.length)}
                </span>{' '}
                of <span className="font-medium">{filteredCustomers.length}</span> customers
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
                
                {pageNumbers.map(number => (
                  <button
                    key={number}
                    onClick={() => setCurrentPage(number)}
                    className={cn(
                      "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                      currentPage === number
                        ? "z-10 bg-primary border-primary text-white"
                        : isDarkMode
                          ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    {number}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageNumbers.length))}
                  disabled={currentPage === pageNumbers.length || pageNumbers.length === 0}
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

      {/* Customer Form Modal */}
      <CustomerForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingCustomer}
      />

      {/* Subscription Form Modal */}
      <SubscriptionForm
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSubmit={handleSubscriptionSubmit}
        customer={selectedCustomer}
      />
    </div>
  );
}