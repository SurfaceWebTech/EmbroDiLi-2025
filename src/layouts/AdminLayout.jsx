import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useThemeStore } from '../lib/themeStore';

export default function AdminLayout() {
  const { isDarkMode } = useThemeStore();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      <div className="pl-64">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}