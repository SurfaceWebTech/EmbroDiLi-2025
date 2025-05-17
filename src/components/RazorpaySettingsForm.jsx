import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useThemeStore } from '../lib/themeStore';
import { cn, getModalClasses } from '../lib/utils';

export default function RazorpaySettingsForm() {
  const { isDarkMode } = useThemeStore();
  const modalClasses = getModalClasses(isDarkMode);
  
  const [settings, setSettings] = useState({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    isTestMode: true
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'razorpay_settings')
        .single();

      if (error) throw error;

      if (data && data.value) {
        const settingsValue = typeof data.value === 'string' 
          ? JSON.parse(data.value)
          : data.value;
          
        setSettings(settingsValue);
      }
    } catch (error) {
      console.error('Error fetching Razorpay settings:', error);
      toast.error('Failed to load Razorpay settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'razorpay_settings',
          value: settings
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      toast.success('Razorpay settings saved successfully');
    } catch (error) {
      console.error('Error saving Razorpay settings:', error);
      toast.error('Failed to save Razorpay settings');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className={cn(
          "text-lg font-medium mb-4",
          isDarkMode ? "text-gray-100" : "text-gray-900"
        )}>Razorpay Settings</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className={modalClasses.label}>Key ID</label>
            <input
              type="text"
              name="keyId"
              value={settings.keyId}
              onChange={handleChange}
              className={modalClasses.input}
              required
            />
          </div>
          <div>
            <label className={modalClasses.label}>Key Secret</label>
            <input
              type="password"
              name="keySecret"
              value={settings.keySecret}
              onChange={handleChange}
              className={modalClasses.input}
              required
            />
          </div>
          <div>
            <label className={modalClasses.label}>Webhook Secret</label>
            <input
              type="password"
              name="webhookSecret"
              value={settings.webhookSecret}
              onChange={handleChange}
              className={modalClasses.input}
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isTestMode"
              checked={settings.isTestMode}
              onChange={handleChange}
              className={modalClasses.checkbox}
            />
            <label className={cn(
              "ml-2 block text-sm",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Test Mode
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className={modalClasses.button.primary}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </button>
      </div>
    </form>
  );
}