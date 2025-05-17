import { Link } from 'react-router-dom';
import { useThemeStore } from '../lib/themeStore';
import { cn } from '../lib/utils';
import { ShieldAlert, Home } from 'lucide-react';

export default function Forbidden() {
  const { isDarkMode } = useThemeStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className={cn(
        "flex flex-col items-center text-center max-w-md p-8 rounded-lg shadow-lg",
        isDarkMode ? "bg-gray-800" : "bg-white"
      )}>
        <ShieldAlert className={cn(
          "w-20 h-20 mb-6",
          isDarkMode ? "text-red-400" : "text-red-500"
        )} />
        
        <h1 className={cn(
          "text-2xl font-bold mb-4",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Access Denied
        </h1>
        
        <p className={cn(
          "mb-6",
          isDarkMode ? "text-gray-300" : "text-gray-600"
        )}>
          You don't have permission to access this page. If you believe this is an error, please contact the administrator.
        </p>
        
        <div className="flex space-x-4">
          <Link
            to="/"
            className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Link>
          
          <Link
            to="/dashboard"
            className={cn(
              "flex items-center px-4 py-2 border rounded-md",
              isDarkMode 
                ? "border-gray-700 text-gray-200 hover:bg-gray-700" 
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}