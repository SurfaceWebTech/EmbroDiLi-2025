import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useThemeStore } from '../lib/themeStore';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch user role
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (!error) {
          setUserRole(data.role);
        }
      }
    };

    getUserData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        
        if (session?.user) {
          // Fetch user role
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          if (!error) {
            setUserRole(data.role);
          }
        } else {
          setUserRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/');
      setUser(null);
      setUserRole(null);
    }
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b",
      isDarkMode 
        ? "bg-dark-light/80 border-gray-800" 
        : "bg-white/80 border-gray-200"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg" />
              <span className={cn(
                "text-xl font-bold",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                Platform
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                {userRole === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={cn(
                      "transition-colors duration-200",
                      isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Admin Panel
                  </Link>
                )}
                <Link 
                  to="/dashboard" 
                  className={cn(
                    "transition-colors duration-200",
                    isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className={cn(
                    "transition-colors duration-200",
                    isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={cn(
                    "transition-colors duration-200",
                    isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 bg-gradient-to-r from-primary to-secondary rounded-lg font-medium text-white hover:opacity-90 transition-opacity duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className={cn("h-6 w-6", isDarkMode ? "text-white" : "text-gray-900")} />
            ) : (
              <Menu className={cn("h-6 w-6", isDarkMode ? "text-white" : "text-gray-900")} />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-4">
              {user ? (
                <>
                  {userRole === 'admin' && (
                    <Link 
                      to="/admin" 
                      className={cn(
                        "transition-colors duration-200",
                        isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link 
                    to="/dashboard" 
                    className={cn(
                      "transition-colors duration-200",
                      isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className={cn(
                      "text-left transition-colors duration-200",
                      isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className={cn(
                      "transition-colors duration-200",
                      isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 bg-gradient-to-r from-primary to-secondary rounded-lg font-medium text-white hover:opacity-90 transition-opacity duration-200 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}