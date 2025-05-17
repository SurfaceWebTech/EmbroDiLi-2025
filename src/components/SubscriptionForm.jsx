import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useThemeStore } from '../lib/themeStore';
import { cn, getModalClasses } from '../lib/utils';

export default function SubscriptionForm({ isOpen, onClose, onSubmit, customer }) {
  const { isDarkMode } = useThemeStore();
  const modalClasses = getModalClasses(isDarkMode);
  
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      setFormData({
        planId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      });
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;

      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.planId) {
        throw new Error('Please select a plan');
      }

      if (!formData.startDate || !formData.endDate) {
        throw new Error('Please select both start and end dates');
      }

      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting subscription:', error);
      toast.error(error.message || 'Failed to update subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'planId') {
      const selectedPlan = plans.find(plan => plan.id === parseInt(value));
      if (selectedPlan) {
        const startDate = new Date(formData.startDate);
        let endDate = new Date(startDate);

        switch (selectedPlan.billing_period) {
          case 'monthly':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          case 'yearly':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
          case '7days':
            endDate.setDate(endDate.getDate() + 7);
            break;
        }

        setFormData(prev => ({
          ...prev,
          endDate: endDate.toISOString().split('T')[0]
        }));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={modalClasses.overlay}>
      <div className={modalClasses.content}>
        <div className={modalClasses.header}>
          <h2 className={modalClasses.title}>
            {customer?.subscription ? 'Update Subscription' : 'Add Subscription'}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "text-gray-400 hover:text-gray-500",
              isDarkMode && "text-gray-500 hover:text-gray-400"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={cn(modalClasses.body, "mb-4")}>
          <h3 className={modalClasses.label}>Customer</h3>
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-gray-300" : "text-gray-600"
          )}>{customer?.firstName} {customer?.lastName}</p>
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>{customer?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className={modalClasses.label}>Subscription Plan</label>
            <select
              name="planId"
              value={formData.planId}
              onChange={handleChange}
              required
              className={modalClasses.select}
            >
              <option value="">Select a plan</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price}/{plan.billing_period}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={modalClasses.label}>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className={modalClasses.input}
              />
            </div>

            <div>
              <label className={modalClasses.label}>End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                min={formData.startDate}
                className={modalClasses.input}
              />
            </div>
          </div>

          <div className={modalClasses.footer}>
            <button
              type="button"
              onClick={onClose}
              className={modalClasses.button.secondary}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={modalClasses.button.primary}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}