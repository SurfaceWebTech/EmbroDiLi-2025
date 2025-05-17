import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useThemeStore } from '../lib/themeStore';
import { cn } from '../lib/utils';
import { useState } from 'react';

export default function AuthLayout() {
  const { isDarkMode } = useThemeStore();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4",
      isDarkMode ? "bg-gray-900" : "bg-gray-100"
    )}>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}