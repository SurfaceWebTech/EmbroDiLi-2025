import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function AuthGuard({ children, allowedRoles = [] }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Auth error:', userError);
          setLoading(false);
          return;
        }
        
        if (!user) {
          setLoading(false);
          return;
        }
        
        setUser(user);

        // Fetch user role from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('role, email_verified')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user role:', error);
          
          // Attempt to create profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email,
              role: 'user',
              email_verified: true
            });
            
          if (!insertError) {
            setUserRole('user');
          } else {
            console.error('Error creating profile:', insertError);
            toast.error('Error setting up your account');
          }
        } else {
          console.log('User role found:', data.role);
          setUserRole(data.role);
          
          // If email is not verified, verify it now
          if (!data.email_verified) {
            await supabase.rpc('verify_user_email', {
              user_id: user.id
            });
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setUser(session?.user || null);
        
        if (session?.user) {
          // Fetch user role
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          if (!error) {
            console.log('Updated user role:', data.role);
            setUserRole(data.role);
          } else {
            console.error('Error fetching updated user role:', error);
            // Create profile if it doesn't exist
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.email,
                role: 'user',
                email_verified: true
              });
              
            if (!insertError) {
              setUserRole('user');
            } else {
              console.error('Error creating profile on auth change:', insertError);
            }
          }
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check roles
  if (allowedRoles.length > 0) {
    console.log('Checking roles:', allowedRoles, 'User role:', userRole);
    
    // Special check for 'admin' to be more permissive with how it's stored
    const isAdmin = 
      userRole === 'admin' || 
      String(userRole).toLowerCase() === 'admin';
      
    if (allowedRoles.includes('admin') && isAdmin) {
      return children;
    }
    
    // Check other roles
    const hasRole = allowedRoles.some(role => 
      role === userRole || 
      String(userRole).toLowerCase() === String(role).toLowerCase()
    );
    
    if (!hasRole) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return children;
}