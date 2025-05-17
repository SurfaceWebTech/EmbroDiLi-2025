import { supabase } from './supabaseClient';

let razorpaySettings = null;

export async function initializeRazorpay() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'razorpay_settings')
      .single();

    if (error) throw error;

    razorpaySettings = data.value;

    if (!razorpaySettings.keyId || !razorpaySettings.keySecret) {
      throw new Error('Missing Razorpay configuration');
    }

    return true;
  } catch (error) {
    console.error('Error initializing Razorpay:', error);
    razorpaySettings = null;
    throw error;
  }
}

export async function createOrder(amount, currency = 'INR', receipt = null) {
  if (!razorpaySettings) {
    await initializeRazorpay();
  }

  const options = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency,
    receipt,
    payment_capture: 1
  };

  try {
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export async function initializePayment(options) {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    throw new Error('Failed to load Razorpay script');
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...options,
      handler: function(response) {
        resolve(response);
      },
      modal: {
        ondismiss: function() {
          reject(new Error('Payment cancelled'));
        }
      }
    });

    rzp.open();
  });
}