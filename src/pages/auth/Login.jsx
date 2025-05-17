import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useThemeStore } from '../../lib/themeStore';
import { cn } from '../../lib/utils';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // User is already logged in, redirect
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (profileData?.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } catch (error) {
          console.error("Error getting user profile:", error);
          // Default redirect to dashboard if profile fetch fails
          navigate('/dashboard');
        }
      }
    };
    
    checkUserSession();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (error) {
        console.error('Login error details:', error);
        
        // Provide a more user-friendly error message
        if (error.message.includes('Invalid login credentials')) {
          setLoginError('The email or password you entered is incorrect. Please try again.');
        } else {
          setLoginError(error.message || 'Login failed');
        }
        
        toast.error('Login failed');
        setLoading(false);
        return;
      }
      
      // Login successful
      console.log('Login successful:', data.user.id);
      toast.success('Login successful');
      
      try {
        // Check role and redirect accordingly
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          // Default redirect
          navigate('/dashboard');
          return;
        }

        console.log('User role:', profileData?.role);
        
        // Redirect based on role
        if (profileData?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } catch (profileError) {
        console.error('Error checking role:', profileError);
        // Default redirect
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Login failed');
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Helper for admin quick login
  const handleAdminLogin = async () => {
    setFormData({
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    // Wait for state to update then submit
    setTimeout(() => {
      document.getElementById('login-form').dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }, 100);
  };

  return (
    <div className={cn(
      "w-full max-w-md p-8 space-y-8 rounded-xl shadow-lg",
      isDarkMode ? "bg-gray-800" : "bg-white"
    )}>
      <div className="text-center">
        <h1 className={cn(
          "text-2xl font-bold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Log in to your account
        </h1>
        <p className={cn(
          "mt-2 text-sm",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          Enter your credentials to access your account
        </p>
      </div>

      {loginError && (
        <div className={cn(
          "p-3 text-sm rounded-md",
          isDarkMode ? "bg-red-900/50 text-red-200" : "bg-red-50 text-red-800"
        )}>
          {loginError}
        </div>
      )}

      <form id="login-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className={cn(
            "block text-sm font-medium",
            isDarkMode ? "text-gray-300" : "text-gray-700"
          )}>
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={cn(
                "appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm",
                isDarkMode 
                  ? "bg-gray-700 border-gray-600 text-white" 
                  : "bg-white border-gray-300 text-gray-900"
              )}
              placeholder="your.email@example.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={cn(
              "block text-sm font-medium",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Password
            </label>
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-dark">
                Forgot your password?
              </Link>
            </div>
          </div>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className={cn(
                "appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm",
                isDarkMode 
                  ? "bg-gray-700 border-gray-600 text-white" 
                  : "bg-white border-gray-300 text-gray-900"
              )}
              placeholder="********"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className={cn(
                  "h-5 w-5",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )} />
              ) : (
                <Eye className={cn(
                  "h-5 w-5",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )} />
              )}
            </button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              <span className="flex items-center">
                <LogIn className="w-4 h-4 mr-2" />
                Log in
              </span>
            )}
          </button>
        </div>
      </form>

      <div className="text-center">
        <p className={cn(
          "text-sm",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
            Sign up
          </Link>
        </p>
        
        {/* Admin Quick Login Helper (for development) */}
        <button 
          onClick={handleAdminLogin}
          className={cn(
            "mt-4 text-xs px-3 py-1 rounded-md border",
            isDarkMode 
              ? "border-gray-700 text-gray-400 hover:bg-gray-700" 
              : "border-gray-200 text-gray-500 hover:bg-gray-50"
          )}
        >
          Quick Admin Login
        </button>
      </div>
    </div>
  );
}