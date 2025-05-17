import { useState } from 'react';
import { Save } from 'lucide-react';
import AwsSettingsForm from '../../components/AwsSettingsForm';
import RazorpaySettingsForm from '../../components/RazorpaySettingsForm';
import { useThemeStore } from '../../lib/themeStore';
import { cn, getModalClasses } from '../../lib/utils';

export default function Settings() {
  const { isDarkMode } = useThemeStore();
  const modalClasses = getModalClasses(isDarkMode);
  
  const [settings, setSettings] = useState({
    siteName: 'My SaaS Platform',
    siteDescription: 'A modern SaaS platform for business growth',
    emailNotifications: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically save the settings to your backend
    console.log('Settings saved:', settings);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className={cn(
          "text-2xl font-bold",
          isDarkMode ? "text-gray-100" : "text-gray-900"
        )}>Settings</h1>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className={cn(
          "rounded-lg border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h2 className={cn(
                "text-lg font-medium mb-4",
                isDarkMode ? "text-gray-100" : "text-gray-900"
              )}>General Settings</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className={modalClasses.label}>Site Name</label>
                  <input
                    type="text"
                    name="siteName"
                    value={settings.siteName}
                    onChange={handleChange}
                    className={modalClasses.input}
                  />
                </div>
                <div>
                  <label className={modalClasses.label}>Site Description</label>
                  <textarea
                    name="siteDescription"
                    value={settings.siteDescription}
                    onChange={handleChange}
                    rows="3"
                    className={modalClasses.input}
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="p-6">
              <h2 className={cn(
                "text-lg font-medium mb-4",
                isDarkMode ? "text-gray-100" : "text-gray-900"
              )}>Preferences</h2>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleChange}
                    className={modalClasses.checkbox}
                  />
                  <label className={cn(
                    "ml-2 block text-sm",
                    isDarkMode ? "text-gray-300" : "text-gray-900"
                  )}>
                    Enable email notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="darkMode"
                    checked={settings.darkMode}
                    onChange={handleChange}
                    className={modalClasses.checkbox}
                  />
                  <label className={cn(
                    "ml-2 block text-sm",
                    isDarkMode ? "text-gray-300" : "text-gray-900"
                  )}>
                    Enable dark mode
                  </label>
                </div>
              </div>
            </div>

            {/* Localization */}
            <div className="p-6">
              <h2 className={cn(
                "text-lg font-medium mb-4",
                isDarkMode ? "text-gray-100" : "text-gray-900"
              )}>Localization</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={modalClasses.label}>Language</label>
                  <select
                    name="language"
                    value={settings.language}
                    onChange={handleChange}
                    className={modalClasses.select}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className={modalClasses.label}>Timezone</label>
                  <select
                    name="timezone"
                    value={settings.timezone}
                    onChange={handleChange}
                    className={modalClasses.select}
                  >
                    <option value="UTC">UTC</option>
                    <option value="Asia/Kolkata">IST</option>
                  </select>
                </div>
                <div>
                  <label className={modalClasses.label}>Currency</label>
                  <select
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                    className={modalClasses.select}
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className={modalClasses.label}>Date Format</label>
                  <select
                    name="dateFormat"
                    value={settings.dateFormat}
                    onChange={handleChange}
                    className={modalClasses.select}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className={cn(
              "px-6 py-4 bg-gray-50 flex justify-end",
              isDarkMode && "bg-gray-900"
            )}>
              <button
                type="submit"
                className={modalClasses.button.primary}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* AWS Storage Settings */}
        <div className={cn(
          "rounded-lg border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className="p-6">
            <AwsSettingsForm />
          </div>
        </div>

        {/* Razorpay Settings */}
        <div className={cn(
          "rounded-lg border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className="p-6">
            <RazorpaySettingsForm />
          </div>
        </div>
      </div>
    </div>
  );
}