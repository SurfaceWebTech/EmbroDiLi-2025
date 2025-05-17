import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useThemeStore } from '../../lib/themeStore';
import { cn } from '../../lib/utils';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (!formData.acceptTerms) {
      toast.error('You must accept the terms and conditions');
      return;
    }
    
    setLoading(true);
    
    try {
      // Build user metadata
      const userMetadata = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`,
        role: 'user'
      };
      
      // Direct signup with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: userMetadata
        }
      });
      
      if (error) {
        console.error('Registration error:', error);
        toast.error(error.message || 'Registration failed');
        return;
      }

      // After successful registration, ensure profile is created
      if (data.user) {
        // Manually update the user as confirmed
        await supabase.rpc('verify_user_email', {
          user_id: data.user.id
        });
        
        // Add a small delay to ensure database triggers complete
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Sign in immediately after registration
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        
        if (signInError) {
          console.error('Auto-login error:', signInError);
          toast.success('Registration successful! Please log in.');
          navigate('/login');
          return;
        }
        
        toast.success('Registration successful!');
        navigate('/dashboard');
      } else {
        toast.success('Registration successful! Please log in.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
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
          Create an account
        </h1>
        <p className={cn(
          "mt-2 text-sm",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          Sign up to get started with our platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className={cn(
              "block text-sm font-medium",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              First Name
            </label>
            <div className="mt-1">
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={formData.firstName}
                onChange={handleChange}
                className={cn(
                  "appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm",
                  isDarkMode 
                    ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-gray-300 text-gray-900"
                )}
                placeholder="John"
              />
            </div>
          </div>

          <div>
            <label htmlFor="lastName" className={cn(
              "block text-sm font-medium",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Last Name
            </label>
            <div className="mt-1">
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={formData.lastName}
                onChange={handleChange}
                className={cn(
                  "appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm",
                  isDarkMode 
                    ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-gray-300 text-gray-900"
                )}
                placeholder="Doe"
              />
            </div>
          </div>
        </div>

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
          <label htmlFor="password" className={cn(
            "block text-sm font-medium",
            isDarkMode ? "text-gray-300" : "text-gray-700"
          )}>
            Password
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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
          <p className={cn(
            "mt-1 text-xs",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>
            Must be at least 6 characters
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className={cn(
            "block text-sm font-medium",
            isDarkMode ? "text-gray-300" : "text-gray-700"
          )}>
            Confirm Password
          </label>
          <div className="mt-1">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className={cn(
                "appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm",
                isDarkMode 
                  ? "bg-gray-700 border-gray-600 text-white" 
                  : "bg-white border-gray-300 text-gray-900"
              )}
              placeholder="********"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="acceptTerms"
            name="acceptTerms"
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={handleChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="acceptTerms" className={cn(
            "ml-2 block text-sm",
            isDarkMode ? "text-gray-300" : "text-gray-700"
          )}>
            I agree to the{' '}
            <Link to="/terms" className="text-primary hover:text-primary-dark">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:text-primary-dark">
              Privacy Policy
            </Link>
          </label>
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
                Creating account...
              </span>
            ) : (
              <span className="flex items-center">
                <UserPlus className="w-4 h-4 mr-2" />
                Sign up
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
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}