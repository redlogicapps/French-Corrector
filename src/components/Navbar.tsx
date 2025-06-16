import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NAV_ITEMS } from '../types/navigation';

export function Navbar() {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    // Show public items
    if (!item.requiresAuth) return true;
    
    // For protected items, check if user is logged in
    if (!currentUser) return false;
    
    // For admin-only items, check if user is admin
    if (item.adminOnly) return isAdmin;
    
    // Show regular protected items to all authenticated users
    return true;
  });

  return (
    <nav className="bg-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left side navigation */}
          <div className="flex items-center space-x-6">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }: { isActive: boolean }) => 
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'text-white bg-slate-700' 
                      : 'text-blue-200 hover:text-white hover:bg-slate-700'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Right side user controls */}
          <div className="flex items-center">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-blue-100">
                  {currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-md text-sm font-medium text-blue-200 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
