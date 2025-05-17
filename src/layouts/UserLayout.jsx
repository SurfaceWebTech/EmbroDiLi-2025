import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import UserSidebar from '../components/UserSidebar';
import { useThemeStore } from '../lib/themeStore';
import { supabase } from '../lib/supabaseClient';

export default function UserLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <UserSidebar 
        isCollapsed={isCollapsed} 
        onCollapse={setIsCollapsed}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        user={user}
        onLogout={handleLogout}
      />
      <div className={`transition-all duration-300 ${isCollapsed ? 'pl-16' : 'pl-64'}`}>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}