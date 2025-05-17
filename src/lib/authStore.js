import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabaseClient';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      userRole: null,
      subscription: null,
      loadingAuth: true,
      
      // Initialize auth state
      initAuth: async () => {
        try {
          set({ loadingAuth: true });
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            await get().fetchProfile(user.id);
            await get().fetchSubscription(user.id);
          }
          
          set({ user, loadingAuth: false });
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ user: null, profile: null, userRole: null, subscription: null, loadingAuth: false });
        }
      },
      
      // Fetch user profile
      fetchProfile: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select(`
              id,
              email,
              full_name,
              avatar_url,
              role,
              email_verified,
              user_profiles!id(*)
            `)
            .eq('id', userId)
            .single();
            
          if (error) throw error;
          
          set({ 
            profile: data,
            userRole: data.role
          });
          
          return data;
        } catch (error) {
          console.error('Error fetching profile:', error);
          return null;
        }
      },
      
      // Fetch user subscription
      fetchSubscription: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('customer_subscriptions')
            .select(`
              id,
              status,
              start_date,
              end_date,
              subscription_plans!plan_id(*)
            `)
            .eq('customer_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (error && error.code !== 'PGRST116') {
            // PGRST116 is the error code for no rows returned
            throw error;
          }
          
          set({ subscription: data || null });
          return data;
        } catch (error) {
          console.error('Error fetching subscription:', error);
          set({ subscription: null });
          return null;
        }
      },
      
      // Login user
      login: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) throw error;
          
          const user = data.user;
          await get().fetchProfile(user.id);
          await get().fetchSubscription(user.id);
          
          set({ user });
          return { success: true, user };
        } catch (error) {
          console.error('Login error:', error);
          return { success: false, error };
        }
      },
      
      // Register user
      register: async (email, password, userData) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: userData,
              emailRedirectTo: window.location.origin
            }
          });
          
          if (error) throw error;
          
          // Auto-login after registration
          if (data.user) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (!signInError) {
              await get().fetchProfile(signInData.user.id);
              await get().fetchSubscription(signInData.user.id);
              set({ user: signInData.user });
            }
          }
          
          return { success: true, user: data.user };
        } catch (error) {
          console.error('Registration error:', error);
          return { success: false, error };
        }
      },
      
      // Logout user
      logout: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          
          set({ user: null, profile: null, userRole: null, subscription: null });
          return { success: true };
        } catch (error) {
          console.error('Logout error:', error);
          return { success: false, error };
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, userRole: state.userRole }),
    }
  )
);

// Setup auth listener
supabase.auth.onAuthStateChange((event, session) => {
  const auth = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' && session?.user) {
    auth.fetchProfile(session.user.id);
    auth.fetchSubscription(session.user.id);
    useAuthStore.setState({ user: session.user });
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, profile: null, userRole: null, subscription: null });
  }
});