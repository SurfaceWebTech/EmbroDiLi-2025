import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Palette, 
  FolderHeart,
  Edit,
  CreditCard,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';

const menuItems = [
  {
    title: 'Main',
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { title: 'Designs', icon: Palette, path: '/dashboard/designs' },
      { title: 'My Designs', icon: FolderHeart, path: '/dashboard/my-designs' },
      { title: 'Downloads', icon: Download, path: '/dashboard/downloads' },
    ]
  },
  {
    title: 'Account',
    items: [
      { title: 'Subscription', icon: CreditCard, path: '/dashboard/subscription' },
      { title: 'Profile', icon: User, path: '/dashboard/profile' },
      { title: 'Settings', icon: Settings, path: '/dashboard/settings' }
    ]
  }
];

export default function UserSidebar({ 
  isCollapsed, 
  onCollapse, 
  isDarkMode, 
  onToggleDarkMode,
  user,
  onLogout
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (title) => {
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        navigate('/login');
      }
    }
  };

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 h-screen border-r transition-all duration-300 z-50",
        isDarkMode 
          ? "bg-gray-900 border-gray-700 text-gray-100" 
          : "bg-white border-gray-200",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "p-4 border-b flex items-center justify-between",
        isDarkMode ? "border-gray-700" : "border-gray-200"
      )}>
        <Link to="/dashboard" className="flex items-center space-x-2 overflow-hidden">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex-shrink-0" />
          {!isCollapsed && (
            <span className={cn(
              "text-xl font-bold truncate",
              isDarkMode ? "text-gray-100" : "text-gray-900"
            )}>Design Platform</span>
          )}
        </Link>
        <button
          onClick={() => onCollapse(!isCollapsed)}
          className={cn(
            "p-1 rounded-md",
            isDarkMode 
              ? "hover:bg-gray-800 text-gray-400 hover:text-gray-200" 
              : "hover:bg-gray-100 text-gray-600"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-4 space-y-6">
          {menuItems.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className={cn(
                    "flex items-center justify-between w-full mb-2 text-sm font-medium",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  {section.title}
                  <ChevronRight 
                    className={`w-4 h-4 transition-transform ${
                      collapsed[section.title] ? 'rotate-90' : ''
                    }`}
                  />
                </button>
              )}
              
              {(!collapsed[section.title] || isCollapsed) && (
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors",
                        isActive(item.path)
                          ? "bg-primary text-white"
                          : isDarkMode
                            ? "text-gray-300 hover:bg-gray-800"
                            : "text-gray-600 hover:bg-gray-100",
                        isCollapsed && "justify-center px-2"
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="w-5 h-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className={cn(
        "p-4 border-t",
        isDarkMode ? "border-gray-700" : "border-gray-200"
      )}>
        {/* Theme Toggle */}
        <button
          onClick={() => onToggleDarkMode(!isDarkMode)}
          className={cn(
            "flex items-center justify-center w-full p-2 mb-4 rounded-lg transition-colors",
            isDarkMode 
              ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          {!isCollapsed && (
            <span className="ml-2">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          )}
        </button>

        <div className={cn(
          "flex items-center space-x-3 mb-4",
          isCollapsed && "justify-center"
        )}>
          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
            {user?.user_metadata?.firstName ? (
              <span className="text-gray-700 font-medium">
                {user.user_metadata.firstName.charAt(0)}
                {user.user_metadata.lastName?.charAt(0)}
              </span>
            ) : (
              <User className="w-5 h-5 text-gray-500" />
            )}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className={cn(
                "font-medium truncate",
                isDarkMode ? "text-gray-100" : "text-gray-900"
              )}>
                {user?.user_metadata?.firstName && user?.user_metadata?.lastName 
                  ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
                  : user?.email?.split('@')[0] || 'User'}
              </div>
              <div className={cn(
                "text-sm truncate",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                {user?.email || ''}
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={handleLogout}
          className={cn(
            "flex items-center space-x-2 w-full transition-colors",
            isDarkMode 
              ? "text-red-400 hover:text-red-300" 
              : "text-red-600 hover:text-red-700",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}