import React, {useState} from 'react'
import { Logout, Notifications, Settings, AccountCircle } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ toggleSidebar}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Function to get user initials with gradient determination
  const getUserInitials = () => {
    if (!user) return 'U';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  // Generate gradient based on user initials for consistency
  const getAvatarGradient = () => {
    const initials = getUserInitials();
    const gradients = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-blue-500'
    ];
    
    const index = initials.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className='flex justify-between items-center bg-white shadow-sm border-b border-gray-100 px-6 h-16'>
      <button onClick={toggleSidebar} className="md:hidden text-2xl text-gray-600 hover:text-green-700 transition-colors">☰</button>
      
      <img src="/logo.png" alt="Company Logo" className="h-10 w-auto" />
      
      <h1 className="text-center text-sm md:text-xl font-semibold text-green-800">Janco Home & Construction Dashboard</h1>
      
      <div className="flex items-center space-x-4">
        {/* Notifications Bell */}
        <div className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
          <Notifications className="text-gray-600 group-hover:text-green-700" />
        </div>

        {/* User Avatar with Dropdown */}
        <div className="relative">
          <div 
            className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200"
            onClick={() => setMenuOpen(prev => !prev)}
          >
            {/* Modern Avatar with Gradient */}
            <div className={`w-9 h-9 rounded-full bg-gradient-to-r ${getAvatarGradient()} flex items-center justify-center text-white font-semibold shadow-md`}>
              {getUserInitials()}
            </div>
            
            {/* User Info (hidden on mobile) */}
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role || 'Admin'}
              </p>
            </div>
          </div>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-14 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
              {/* User Summary */}
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getAvatarGradient()} flex items-center justify-center text-white font-semibold text-lg shadow-md`}>
                    {getUserInitials()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button className="w-full px-4 py-3 flex items-center space-x-3 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                  <AccountCircle className="text-gray-400" />
                  <span>Profile Settings</span>
                </button>
                
                <button className="w-full px-4 py-3 flex items-center space-x-3 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings className="text-gray-400" />
                  <span>Preferences</span>
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Standalone Logout Button (visible on desktop) */}
        <button
          onClick={handleLogout}
          className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <Logout className="text-sm" />
          
        </button>
      </div>

      {/* Backdrop for mobile dropdown */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-10 z-10 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}

export default Navbar