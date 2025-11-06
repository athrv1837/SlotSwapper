import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, ArrowLeftRight, Inbox, LogOut } from 'lucide-react';

export default function Layout() {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">SlotSwapper</h1>

              <div className="hidden sm:flex space-x-2">
                <Link
                  to="/app/dashboard"
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/app/dashboard')
                      ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-700/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:shadow-sm'
                  }`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>

                <Link
                  to="/app/marketplace"
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/app/marketplace')
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Marketplace
                </Link>

                <Link
                  to="/app/requests"
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/app/requests')
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Inbox className="w-4 h-4 mr-2" />
                  Requests
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
