'use client';

import {
  ArrowUpCircle,
  BarChart3,
  Calendar,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  UserCheck,
  Users,
  Wallet,
  X,
  Bell,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Doctors', href: '/pending-doctors', icon: UserCheck },
  { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { name: 'Plans', href: '/plans', icon: FileText },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Payments', href: '/payments', icon: Wallet },
  { name: 'Withdraw Requests', href: '/withdraw-requests', icon: ArrowUpCircle },
  { name: 'Communications', href: '/communications', icon: MessageSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token');

      if (!token) {
        if (pathname !== '/') {
          router.push('/');
        }
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('admin_token');
          if (pathname !== '/') {
            router.push('/');
          }
        }
      } catch (error) {
        localStorage.removeItem('admin_token');
        if (pathname !== '/') {
          router.push('/');
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setShowLogoutConfirm(false);
    toast.success('Logged out successfully');
    router.push('/');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-xl rounded-r-3xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4 mb-8">
              <span className="text-2xl font-bold text-white tracking-tight">Doc<span className="text-emerald-400">Available</span></span>
            </div>
            <nav className="px-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2.5 text-base font-medium rounded-lg transition-all duration-200 ${isActive
                      ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border-l-2 border-emerald-500'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`mr-4 h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-slate-800 p-4">
            <button
              onClick={handleLogoutClick}
              className="flex-shrink-0 w-full group block"
            >
              <div className="flex items-center">
                <LogOut className="inline-block h-5 w-5 text-slate-500 group-hover:text-slate-300" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                    Sign out
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-72">
          {/* Added rounded-r-3xl to the container and margin to detach it slightly or just round the edge */}
          <div className="flex flex-col h-0 flex-1 bg-slate-900 shadow-xl rounded-r-3xl mr-4">
            <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
              <div className="flex items-center px-6 mb-10">
                <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/20">
                  <span className="text-white font-bold text-xl">D</span>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">Doc<span className="text-emerald-400">Available</span></span>
              </div>
              <nav className="flex-1 px-4 space-y-1.5">
                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Overview</p>
                {navigation.slice(0, 1).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-emerald-500/10 text-emerald-400 shadow-inner'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      {item.name}
                    </Link>
                  );
                })}

                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Management</p>
                {navigation.slice(1, 4).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-emerald-500/10 text-emerald-400 shadow-inner'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      {item.name}
                    </Link>
                  );
                })}

                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Financials & Data</p>
                {navigation.slice(4).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-emerald-500/10 text-emerald-400 shadow-inner'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-slate-800 p-4">
              <button
                onClick={handleLogoutClick}
                className="flex-shrink-0 w-full group block"
              >
                <div className="flex items-center px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                  <LogOut className="inline-block h-5 w-5 text-slate-500 group-hover:text-slate-300" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                      Sign out
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden bg-gray-50/50">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-100 lg:hidden">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600 flex items-center">
                  <span className="text-lg font-semibold text-slate-800">Admin Dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex h-16 bg-white shadow-sm border-b border-gray-100 justify-between items-center px-8 z-10">
          <div className="w-96 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
              placeholder="Search anything..."
            />
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors rounded-full hover:bg-gray-100">
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            <div className="h-8 w-px bg-gray-200 mx-2"></div>

            <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold border border-emerald-200">
                A
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Administrator</p>
              </div>
              <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-2xl rounded-xl bg-white transform transition-all scale-100">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
                <LogOut className="h-7 w-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Sign Out</h3>
              <div className="mt-2 px-4 py-2">
                <p className="text-sm text-gray-500 leading-relaxed">
                  Are you sure you want to end your session? You will need to sign in again to access the dashboard.
                </p>
              </div>
              <div className="items-center px-4 py-4 mt-2">
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors w-full"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors w-full"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
