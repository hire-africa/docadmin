'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('admin_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        toast.success('Login successful!');
        router.push('/dashboard');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0B1C10] p-4 font-sans">
      <div className="w-full max-w-6xl bg-white rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl min-h-[600px]">
        {/* Left Side - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center md:justify-start gap-2">
              Welcome back <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-gray-500 text-sm">Please enter your details.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>


            {/* Email Field */}
            <div className="relative group">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Password Field */}
            <div className="relative group mt-4">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors duration-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm mt-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-gray-600">
                  Remember for 30 days
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-2xl text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-primary-100 mt-8"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                'Log In'
              )}
            </button>


          </form>
        </div>

        {/* Right Side - Brand Image */}
        <div className="hidden md:block w-1/2 p-6 bg-white">
          <div className="relative h-full w-full rounded-[2rem] overflow-hidden group">
            <img
              src="/assets/images/admin.jpg"
              alt="Admin Space"
              className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

            {/* Logo Overlay */}
            <div className="absolute top-8 left-8">
              <img
                src="/assets/images/DA logo green.png"
                alt="DocAvailable"
                className="h-12 w-auto brightness-0 invert"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
