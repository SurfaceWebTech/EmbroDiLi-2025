import { useState } from 'react';
import { Bell, Trash2, Check } from 'lucide-react';

const initialNotifications = [
  {
    id: 1,
    title: 'New User Registration',
    message: 'John Doe has registered a new account',
    time: '2 minutes ago',
    type: 'info',
    read: false
  },
  {
    id: 2,
    title: 'Subscription Canceled',
    message: 'User #123 has canceled their premium subscription',
    time: '1 hour ago',
    type: 'warning',
    read: false
  },
  {
    id: 3,
    title: 'Payment Received',
    message: 'Payment of $99.99 received from user #456',
    time: '2 hours ago',
    type: 'success',
    read: true
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  const deleteAll = () => {
    setNotifications([]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="space-x-4">
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Mark all as read
          </button>
          <button
            onClick={deleteAll}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 flex items-start space-x-4 ${
                  notification.read ? 'bg-white' : 'bg-blue-50'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  notification.type === 'success' ? 'bg-green-100 text-green-600' :
                  notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{notification.time}</p>
                </div>
                <div className="flex space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-gray-500"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}