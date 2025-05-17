import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Check, Star, ArrowRight, Menu } from 'lucide-react';
import { cn } from '../lib/utils';

const plans = {
  monthly: [
    {
      name: 'Starter',
      price: 799,
      description: 'Perfect for hobbyists and occasional users',
      features: [
        '50 downloads per month',
        'Access to basic design library',
        'Standard file formats',
        'Email support'
      ]
    },
    {
      name: 'Professional',
      price: 1499,
      description: 'Ideal for regular embroidery enthusiasts',
      features: [
        '200 downloads per month',
        'Full design library access',
        'All file formats',
        'Priority email support',
        'Commercial license'
      ],
      popular: true
    },
    {
      name: 'Business',
      price: 2999,
      description: 'For professional embroidery businesses',
      features: [
        'Unlimited downloads',
        'Premium design library',
        'All file formats',
        'Priority support',
        'Commercial license',
        'Bulk download option'
      ]
    }
  ],
  yearly: [
    {
      name: 'Starter',
      price: 7990,
      description: 'Perfect for hobbyists and occasional users',
      features: [
        '50 downloads per month',
        'Access to basic design library',
        'Standard file formats',
        'Email support'
      ]
    },
    {
      name: 'Professional',
      price: 14990,
      description: 'Ideal for regular embroidery enthusiasts',
      features: [
        '200 downloads per month',
        'Full design library access',
        'All file formats',
        'Priority email support',
        'Commercial license'
      ],
      popular: true
    },
    {
      name: 'Business',
      price: 29990,
      description: 'For professional embroidery businesses',
      features: [
        'Unlimited downloads',
        'Premium design library',
        'All file formats',
        'Priority support',
        'Commercial license',
        'Bulk download option'
      ]
    }
  ]
};

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleGetStarted = (plan) => {
    // Navigate to checkout with plan details
    const searchParams = new URLSearchParams({
      plan: plan.name.toLowerCase(),
      period: isAnnual ? 'yearly' : 'monthly'
    }).toString();
    
    window.location.href = `/checkout?${searchParams}`;
  };

  const features = [
    {
      title: 'Fast Building',
      description: 'Build high-performance applications with optimized development experience',
      icon: '⚡'
    },
    {
      title: 'Route & State',
      description: 'Integrated routing and state management for seamless navigation',
      icon: '🔄'
    },
    {
      title: 'Developer Tools',
      description: 'Powerful developer tools and debugging capabilities built-in',
      icon: '🛠️'
    },
    {
      title: 'TypeScript',
      description: 'First-class TypeScript support with automated type inference',
      icon: '📝'
    },
    {
      title: 'Auto Imports',
      description: 'Smart automatic imports and code organization',
      icon: '📦'
    },
    {
      title: 'Modern Tooling',
      description: 'Latest development tools and optimizations included',
      icon: '🚀'
    }
  ];

  const codeExample = `
<template>
  <div class="counter">
    <button @click="count++">
      Count is: {{ count }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>
  `.trim();

  return (
    <div className="min-h-screen bg-[#020420] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-light/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg" />
                <span className="text-xl font-bold">Platform</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/admin" className="nav-link">Admin Panel</Link>
              <Link to="/dashboard" className="nav-link">User Panel</Link>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="primary-button">Sign Up</Link>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-800">
              <div className="flex flex-col space-y-4">
                <Link to="/admin" className="nav-link">Admin Panel</Link>
                <Link to="/dashboard" className="nav-link">User Panel</Link>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="primary-button text-center">Sign Up</Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 glow-effect" />
        <div className="container mx-auto px-4 py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8">
              The Intuitive
              <span className="glow-text block">Framework</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Build an open-source framework that makes web development intuitive and powerful,
              using best practices and modern tools to create web apps with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="primary-button inline-flex items-center justify-center">
                Get Started
                <ChevronRight className="ml-2" />
              </Link>
              <button className="secondary-button">
                Why Choose Us?
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Simple, transparent
              <span className="glow-text"> pricing</span>
            </h2>
            <p className="text-xl text-gray-400">Choose the plan that's right for you</p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mt-8 space-x-4">
              <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnnual ? 'bg-primary' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
                Yearly
                <span className="ml-1.5 text-primary">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans[isAnnual ? 'yearly' : 'monthly'].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-8 ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-primary py-1 px-3 text-sm font-semibold text-white text-center">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                  <div className="mt-4 flex items-baseline text-white">
                    <span className="text-4xl font-bold tracking-tight">₹{plan.price}</span>
                    <span className="ml-1 text-sm font-semibold text-gray-400">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                </div>
                <ul className="space-y-4 text-sm mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-300">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleGetStarted(plan)}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-primary hover:bg-primary-dark text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  Get started
                </button>
              </div>
            ))}
          </div>

          <p className="text-center mt-8 text-gray-400">
            All prices are in INR. Need a custom plan?{' '}
            <a href="#" className="text-primary hover:text-primary-dark">
              Contact us
            </a>
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-20">
            Compose with
            <span className="glow-text"> everything you need.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                The power of
                <span className="glow-text"> Components</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Write clean, maintainable code with our component system.
                Build complex UIs with ease and confidence.
              </p>
              <button className="primary-button">
                Learn More
                <ArrowRight className="inline-block ml-2" />
              </button>
            </div>
            <div className="code-window">
              <pre>
                <code className="text-gray-300">{codeExample}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Documentation</h3>
              <ul className="space-y-2">
                <li><a href="#" className="nav-link">Guide</a></li>
                <li><a href="#" className="nav-link">API Reference</a></li>
                <li><a href="#" className="nav-link">Examples</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2">
                <li><a href="#" className="nav-link">Team</a></li>
                <li><a href="#" className="nav-link">Blog</a></li>
                <li><a href="#" className="nav-link">Forums</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="nav-link">Help</a></li>
                <li><a href="#" className="nav-link">FAQ</a></li>
                <li><a href="#" className="nav-link">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="nav-link">Privacy</a></li>
                <li><a href="#" className="nav-link">Terms</a></li>
                <li><a href="#" className="nav-link">License</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2024 Your Company. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}