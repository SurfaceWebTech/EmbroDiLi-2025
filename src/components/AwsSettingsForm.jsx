import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

export default function AwsSettingsForm() {
  const [settings, setSettings] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: '',
    bucketName: ''
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
        .eq('key', 'aws_storage')
        .single();

      if (error) throw error;

      if (data && data.value) {
        // Handle both string and object values
        const settingsValue = typeof data.value === 'string' 
          ? JSON.parse(data.value)
          : data.value;
          
        setSettings(settingsValue);
      }
    } catch (error) {
      console.error('Error fetching AWS settings:', error);
      toast.error('Failed to load AWS settings');
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
          key: 'aws_storage',
          value: settings
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      toast.success('AWS settings saved successfully');
    } catch (error) {
      console.error('Error saving AWS settings:', error);
      toast.error('Failed to save AWS settings');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">AWS Storage Settings</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Access Key ID</label>
            <input
              type="text"
              name="accessKeyId"
              value={settings.accessKeyId}
              onChange={handleChange}
              className="mt-1 block w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Secret Access Key</label>
            <input
              type="password"
              name="secretAccessKey"
              value={settings.secretAccessKey}
              onChange={handleChange}
              className="mt-1 block w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Region</label>
            <input
              type="text"
              name="region"
              value={settings.region}
              onChange={handleChange}
              placeholder="e.g., us-east-1"
              className="mt-1 block w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bucket Name</label>
            <input
              type="text"
              name="bucketName"
              value={settings.bucketName}
              onChange={handleChange}
              className="mt-1 block w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </button>
      </div>
    </form>
  );
}