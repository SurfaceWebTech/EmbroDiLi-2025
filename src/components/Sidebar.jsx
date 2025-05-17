import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  Settings, 
  Bell, 
  ChevronDown,
  LogOut,
  Shield,
  Package,
  MessageSquare,
  FileEdit,
  Upload,
  UserCog,
  Sun,
  Moon
} from 'lucide-react';
import { useThemeStore } from '../lib/themeStore';
import { supabase } from '../lib/supabaseClient';
import { cn } from '../lib/utils';

const menuItems = [
  {
    title: 'Main',
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      { title: 'Customers', icon: Users, path: '/admin/customers' },
      { title: 'User Roles', icon: UserCog, path: '/admin/user-roles' },
      { title: 'Plan Management', icon: Package, path: '/admin/plans' },
      { title: 'Subscriptions', icon: CreditCard, path: '/admin/subscriptions' },
      { title: 'Transactions', icon: FileText, path: '/admin/transactions' },
      { title: 'Invoices', icon: FileText, path: '/admin/invoices' },
    ]
  },
  {
    title: 'System',
    items: [
      { title: 'CMS', icon: FileEdit, path: '/admin/cms' },
      { title: 'Import Documents', icon: Upload, path: '/admin/import-documents' },
      { title: 'Notifications', icon: Bell, path: '/admin/notifications' },
      { title: 'Settings', icon: Settings, path: '/admin/settings' },
      { title: 'Roles & Permissions', icon: Shield, path: '/admin/roles' },
      { title: 'Support Messages', icon: MessageSquare, path: '/admin/support' }
    ]
  }
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState({});
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!error) {
          setAdminUser(data);
        }
      }
    };
    
    fetchUser();
  }, []);

  const toggleSection = (title) => {
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/login');
    }
  };

  return (
    <div className={`w-64 h-screen fixed left-0 top-0 border-r transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200'
    }`}>
      {/* Logo */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <Link to="/admin" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg" />
          <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Admin Panel</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {menuItems.map((section) => (
          <div key={section.title} className="mb-6">
            <button
              onClick={() => toggleSection(section.title)}
              className={`flex items-center justify-between w-full mb-2 text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {section.title}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  collapsed[section.title] ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {!collapsed[section.title] && (
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary text-white'
                        : isDarkMode
                          ? 'text-gray-300 hover:bg-gray-800'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            {adminUser?.full_name ? (
              <span className="text-gray-700 font-semibold">
                {adminUser.full_name.split(' ').map(n => n[0]).join('')}
              </span>
            ) : (
              <span className="text-gray-700 font-semibold">A</span>
            )}
          </div>
          <div>
            <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {adminUser?.full_name || 'Admin User'}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {adminUser?.email || 'admin@example.com'}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button 
            onClick={toggleDarkMode} 
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}