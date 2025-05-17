import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useThemeStore } from '../lib/themeStore';
import { cn, getModalClasses } from '../lib/utils';

export default function CustomerForm({ isOpen, onClose, onSubmit, initialData = null }) {
  const { isDarkMode } = useThemeStore();
  const modalClasses = getModalClasses(isDarkMode);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    countryCode: '+91',
    companyName: '',
    gstNumber: '',
    streetAddress: '',
    city: '',
    postcode: '',
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        password: '',
        confirmPassword: ''
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        countryCode: '+91',
        companyName: '',
        gstNumber: '',
        streetAddress: '',
        city: '',
        postcode: '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isEditing) {
      if (formData.password && formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }
    }

    setIsLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      const address = {
        street: formData.streetAddress.trim(),
        city: formData.city.trim(),
        postcode: formData.postcode.trim()
      };
      
      if (isEditing) {
        const updateData = {
          id: initialData.id,
          email: formData.email,
          fullName,
          companyName: formData.companyName,
          phoneNumber: `${formData.countryCode}${formData.phoneNumber}`,
          address
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        if (onSubmit) {
          onSubmit(formData);
        }
      } else {
        const userId = uuidv4();
        
        const { error } = await supabase.rpc('create_new_customer', {
          p_id: userId,
          p_email: formData.email,
          p_password: formData.password,
          p_full_name: fullName,
          p_company_name: formData.companyName || null,
          p_phone: `${formData.countryCode}${formData.phoneNumber}`,
          p_address: address,
          p_metadata: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            companyName: formData.companyName,
            gstNumber: formData.gstNumber,
            streetAddress: formData.streetAddress,
            city: formData.city,
            postcode: formData.postcode,
            countryCode: formData.countryCode,
            phoneNumber: formData.phoneNumber
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to create customer');
        }

        toast.success('Customer created successfully');
        
        if (onSubmit) {
          onSubmit({
            id: userId,
            ...formData,
            fullName
          });
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error processing customer:', error);
      toast.error(error.message || 'Failed to process customer');
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
  };

  if (!isOpen) return null;

  return (
    <div className={modalClasses.overlay}>
      <div className={modalClasses.content}>
        <div className={modalClasses.header}>
          <h2 className={modalClasses.title}>
            {isEditing ? 'Edit Customer' : 'Add New Customer'}
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

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className={modalClasses.label}>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className={modalClasses.input}
              />
            </div>

            <div>
              <label className={modalClasses.label}>Email Address *</label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={modalClasses.input}
              />
            </div>

            <div>
              <label className={modalClasses.label}>Phone Number *</label>
              <div className="flex">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className={cn(
                    modalClasses.select,
                    "w-20 rounded-r-none"
                  )}
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+61">+61</option>
                  <option value="+86">+86</option>
                </select>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className={cn(
                    modalClasses.input,
                    "flex-1 rounded-l-none"
                  )}
                />
              </div>
            </div>

            <div>
              <label className={modalClasses.label}>Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={modalClasses.input}
              />
            </div>

            <div>
              <label className={modalClasses.label}>GST Number</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                className={modalClasses.input}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className={modalClasses.label}>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className={modalClasses.input}
              />
            </div>

            <div>
              <label className={modalClasses.label}>Street Address *</label>
              <input
                type="text"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                required
                className={modalClasses.input}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={modalClasses.label}>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className={modalClasses.input}
                />
              </div>

              <div>
                <label className={modalClasses.label}>Postcode *</label>
                <input
                  type="text"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleChange}
                  required
                  className={modalClasses.input}
                />
              </div>
            </div>

            <div>
              <label className={modalClasses.label}>
                Password {isEditing ? '(leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!isEditing}
                minLength={isEditing ? 0 : 6}
                className={modalClasses.input}
              />
              {!isEditing && (
                <p className={cn(
                  "mt-1 text-xs",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  Must be at least 6 characters long
                </p>
              )}
            </div>

            <div>
              <label className={modalClasses.label}>
                Confirm Password {isEditing ? '(leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isEditing}
                minLength={isEditing ? 0 : 6}
                className={modalClasses.input}
              />
            </div>
          </div>

          {/* Footer */}
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
              {isLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Customer' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}