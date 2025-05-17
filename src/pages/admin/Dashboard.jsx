import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Users, DollarSign, Download, CreditCard } from 'lucide-react';
import { useThemeStore } from '../../lib/themeStore';
import { cn } from '../../lib/utils';

const revenueData = [
  { month: 'Jan', revenue: 2100 },
  { month: 'Feb', revenue: 2400 },
  { month: 'Mar', revenue: 2200 },
  { month: 'Apr', revenue: 2800 },
  { month: 'May', revenue: 3100 },
  { month: 'Jun', revenue: 3245.78 }
];

const planDistribution = [
  { name: 'Professional', users: 68, percentage: 55 },
  { name: 'Business', users: 32, percentage: 26 },
  { name: 'Starter', users: 18, percentage: 14 },
  { name: 'Trial', users: 6, percentage: 5 }
];

const recentTransactions = [
  { user: 'Sarah Johnson', plan: 'Professional', amount: 19.99, date: '2 days ago', status: 'Completed' },
  { user: 'Michael Brown', plan: 'Business', amount: 39.99, date: '3 days ago', status: 'Completed' },
  { user: 'Jessica Wilson', plan: 'Trial', amount: 0.00, date: '4 days ago', status: 'Trial Started' },
  { user: 'David Miller', plan: 'Professional', amount: 19.99, date: '5 days ago', status: 'Completed' },
  { user: 'Emily Davis', plan: 'Starter', amount: 9.99, date: '6 days ago', status: 'Completed' }
];

const StatCard = ({ icon: Icon, label, value, increase, percentage, color = "blue" }) => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <div className={cn(
      "rounded-lg p-6 shadow-sm border transition-colors duration-200",
      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <div className={`flex items-center text-sm ${percentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {percentage >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
          {Math.abs(percentage)}%
        </div>
      </div>
      <h3 className={cn(
        "text-sm font-medium mb-2",
        isDarkMode ? "text-gray-300" : "text-gray-600"
      )}>{label}</h3>
      <p className={cn(
        "text-2xl font-bold",
        isDarkMode ? "text-gray-100" : "text-gray-900"
      )}>{value}</p>
      <p className={cn(
        "text-sm mt-2",
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>{increase}</p>
    </div>
  );
};

const RateCard = ({ title, rate, change, isPositive, description }) => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <div className={cn(
      "rounded-lg p-6 shadow-sm border transition-colors duration-200",
      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    )}>
      <h3 className={cn(
        "text-lg font-semibold mb-4",
        isDarkMode ? "text-gray-100" : "text-gray-900"
      )}>{title}</h3>
      <div className="flex items-baseline gap-2 mb-2">
        <span className={cn(
          "text-3xl font-bold",
          isPositive 
            ? isDarkMode ? "text-green-400" : "text-green-600"
            : isDarkMode ? "text-red-400" : "text-red-600"
        )}>
          {rate}%
        </span>
        <span className={cn(
          "text-sm",
          isPositive 
            ? isDarkMode ? "text-green-400" : "text-green-600"
            : isDarkMode ? "text-red-400" : "text-red-600"
        )}>
          {change >= 0 ? '+' : ''}{change}% from last month
        </span>
      </div>
      <p className={cn(
        "text-sm",
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>{description}</p>
    </div>
  );
};

export default function AdminDashboard() {
  const { isDarkMode } = useThemeStore();
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className={cn(
          "text-2xl font-bold",
          isDarkMode ? "text-gray-100" : "text-gray-900"
        )}>Analytics Dashboard</h1>
        <div className="flex items-center gap-4">
          <select className={cn(
            "border rounded-md px-3 py-2 text-sm transition-colors duration-200",
            isDarkMode 
              ? "bg-gray-800 border-gray-700 text-gray-300" 
              : "bg-white border-gray-300 text-gray-700"
          )}>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value="156"
          increase="12% from last month"
          percentage={12}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value="$3,245.78"
          increase="8% from last month"
          percentage={8}
          color="green"
        />
        <StatCard
          icon={Download}
          label="Total Downloads"
          value="1876"
          increase="15% from last month"
          percentage={15}
          color="purple"
        />
        <StatCard
          icon={CreditCard}
          label="Active Subscriptions"
          value="124"
          increase="5% from last month"
          percentage={5}
          color="orange"
        />
      </div>

      {/* Conversion and Churn Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <RateCard
          title="Conversion Rate"
          rate={4.2}
          change={0.3}
          isPositive={true}
          description="4.2% of visitors sign up for a trial or subscription"
        />
        <RateCard
          title="Churn Rate"
          rate={2.1}
          change={-0.2}
          isPositive={false}
          description="2.1% of subscribers canceled their subscription"
        />
      </div>

      {/* Revenue Chart and Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className={cn(
          "lg:col-span-2 p-6 rounded-lg shadow-sm border transition-colors duration-200",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <h3 className={cn(
            "text-lg font-semibold mb-6",
            isDarkMode ? "text-gray-100" : "text-gray-900"
          )}>Revenue Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                />
                <XAxis 
                  dataKey="month" 
                  stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
                <YAxis 
                  stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                    borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                    color: isDarkMode ? "#F3F4F6" : "#111827"
                  }}
                />
                <Bar dataKey="revenue" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn(
          "p-6 rounded-lg shadow-sm border transition-colors duration-200",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <h3 className={cn(
            "text-lg font-semibold mb-6",
            isDarkMode ? "text-gray-100" : "text-gray-900"
          )}>Plan Distribution</h3>
          <div className="space-y-4">
            {planDistribution.map((plan) => (
              <div key={plan.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                    {plan.name}
                  </span>
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                    {plan.users} users ({plan.percentage}%)
                  </span>
                </div>
                <div className={cn(
                  "w-full rounded-full h-2",
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                )}>
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${plan.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className={cn(
        "rounded-lg shadow-sm border transition-colors duration-200",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      )}>
        <div className={cn(
          "p-6 border-b",
          isDarkMode ? "border-gray-700" : "border-gray-200"
        )}>
          <h3 className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-gray-100" : "text-gray-900"
          )}>Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? "bg-gray-900" : "bg-gray-50"}>
              <tr>
                <th className={cn(
                  "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>User</th>
                <th className={cn(
                  "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>Plan</th>
                <th className={cn(
                  "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>Amount</th>
                <th className={cn(
                  "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>Date</th>
                <th className={cn(
                  "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>Status</th>
              </tr>
            </thead>
            <tbody className={cn(
              "divide-y",
              isDarkMode ? "divide-gray-700" : "divide-gray-200"
            )}>
              {recentTransactions.map((transaction, index) => (
                <tr key={index} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                  <td className={cn(
                    "px-6 py-4 whitespace-nowrap text-sm",
                    isDarkMode ? "text-gray-200" : "text-gray-900"
                  )}>{transaction.user}</td>
                  <td className={cn(
                    "px-6 py-4 whitespace-nowrap text-sm",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>{transaction.plan}</td>
                  <td className={cn(
                    "px-6 py-4 whitespace-nowrap text-sm",
                    isDarkMode ? "text-gray-200" : "text-gray-900"
                  )}>
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className={cn(
                    "px-6 py-4 whitespace-nowrap text-sm",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>{transaction.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      transaction.status === 'Completed'
                        ? isDarkMode 
                          ? "bg-green-900 text-green-200"
                          : "bg-green-100 text-green-800"
                        : isDarkMode
                          ? "bg-blue-900 text-blue-200"
                          : "bg-blue-100 text-blue-800"
                    )}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}