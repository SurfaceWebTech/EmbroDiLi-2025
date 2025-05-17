import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function useRazorpay() {
  const [loading, setLoading] = useState(true);
  const [razorpaySettings, setRazorpaySettings] = useState(null);

  useEffect(() => {
    const loadRazorpaySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'razorpay_settings')
          .single();

        if (error) throw error;

        const settings = data.value;
        setRazorpaySettings(settings);
      } catch (error) {
        console.error('Error loading Razorpay settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRazorpaySettings();
  }, []);

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async ({
    amount,
    currency = 'INR',
    name = 'Design Platform',
    description = 'Subscription Payment',
    orderId = null,
    successCallback,
    failureCallback,
    customer
  }) => {
    if (!razorpaySettings || !razorpaySettings.keyId) {
      console.error('Razorpay settings not loaded');
      if (failureCallback) failureCallback(new Error('Payment gateway not configured'));
      return;
    }

    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

    if (!res) {
      console.error('Razorpay SDK failed to load');
      if (failureCallback) failureCallback(new Error('Razorpay SDK failed to load'));
      return;
    }

    // Prepare payment options
    const options = {
      key: razorpaySettings.keyId,
      amount: amount * 100, // convert to smallest currency unit
      currency,
      name,
      description,
      order_id: orderId,
      handler: function (response) {
        if (successCallback) successCallback(response);
      },
      prefill: {
        name: customer?.fullName || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim(),
        email: customer?.email || '',
        contact: customer?.phoneNumber || ''
      },
      theme: {
        color: '#1EB4E2' // primary color
      },
      modal: {
        ondismiss: function () {
          if (failureCallback) failureCallback(new Error('Payment cancelled by user'));
        }
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  return {
    loading,
    razorpaySettings,
    handlePayment
  };
}