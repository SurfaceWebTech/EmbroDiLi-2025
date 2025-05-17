export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getContrastText(bgColor) {
  // Convert hex to RGB
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

export function getStatusColor(status, isDark = false) {
  const colors = {
    active: isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800',
    inactive: isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800',
    pending: isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800',
    cancelled: isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800',
    completed: isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
  };
  
  return colors[status.toLowerCase()] || colors.inactive;
}

export function getEngagementColor(tier, isDark = false) {
  const colors = {
    high: isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800',
    medium: isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800',
    low: isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800',
    none: isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
  };
  
  return colors[tier.toLowerCase()] || colors.none;
}

export function getModalClasses(isDark = false) {
  return {
    overlay: cn(
      "fixed inset-0 bg-black transition-opacity duration-200",
      isDark ? "bg-opacity-70" : "bg-opacity-50"
    ),
    content: cn(
      "relative w-full max-w-3xl mx-auto rounded-lg shadow-xl transition-all duration-200",
      isDark ? "bg-gray-800" : "bg-white"
    ),
    header: cn(
      "flex justify-between items-center p-6 border-b",
      isDark ? "border-gray-700" : "border-gray-200"
    ),
    title: cn(
      "text-xl font-semibold",
      isDark ? "text-gray-100" : "text-gray-900"
    ),
    body: cn(
      "p-6",
      isDark ? "text-gray-300" : "text-gray-600"
    ),
    footer: cn(
      "flex justify-end space-x-3 p-6 border-t",
      isDark ? "border-gray-700" : "border-gray-200"
    ),
    input: cn(
      "w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-200",
      isDark 
        ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400" 
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
    ),
    select: cn(
      "w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-200",
      isDark 
        ? "bg-gray-700 border-gray-600 text-gray-100" 
        : "bg-white border-gray-300 text-gray-900"
    ),
    button: {
      primary: cn(
        "px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark transition-colors duration-200"
      ),
      secondary: cn(
        "px-4 py-2 text-sm font-medium border rounded-md transition-colors duration-200",
        isDark 
          ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
          : "border-gray-300 text-gray-700 hover:bg-gray-50"
      )
    },
    label: cn(
      "block text-sm font-medium mb-1",
      isDark ? "text-gray-300" : "text-gray-700"
    ),
    checkbox: cn(
      "rounded border text-primary focus:ring-primary transition-colors duration-200",
      isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
    ),
    table: {
      wrapper: cn(
        "w-full rounded-lg shadow overflow-hidden transition-colors duration-200",
        isDark ? "bg-gray-800" : "bg-white"
      ),
      header: cn(
        isDark ? "bg-gray-900" : "bg-gray-50"
      ),
      headerCell: cn(
        "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
        isDark ? "text-gray-400" : "text-gray-500"
      ),
      body: cn(
        "divide-y",
        isDark ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"
      ),
      row: cn(
        "hover:bg-gray-50",
        isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
      ),
      cell: cn(
        "px-6 py-4 whitespace-nowrap text-sm",
        isDark ? "text-gray-300" : "text-gray-900"
      )
    },
    card: cn(
      "rounded-lg shadow-sm border transition-colors duration-200",
      isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    )
  };
}