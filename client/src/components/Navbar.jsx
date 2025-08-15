import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const mobileButtonRef = useRef(null);

  const navItems = user.role === 'consumer' ? [
    // Consumer navigation - only home/dashboard
    { path: '/', label: 'Dashboard', roles: ['consumer'] }
  ] : [
    // Dealer/Admin navigation
    { path: '/', label: 'Dashboard', roles: ['dealer', 'admin'] },
    { path: '/batteries', label: 'Batteries', roles: ['dealer', 'admin'] },
    { path: '/consumers', label: 'Consumers', roles: ['dealer', 'admin'] },
    { path: '/finance', label: 'Finance', roles: ['dealer', 'admin'] },
    { path: '/service', label: 'Service', roles: ['dealer', 'admin'] },
    { path: '/messaging', label: 'Messaging', roles: ['dealer', 'admin'] },
    { path: '/consumer-view', label: 'Consumer View', roles: ['dealer', 'admin'] },
    // NBFC navigation - only for NBFC and admin
    { path: '/nbfc', label: 'NBFC', roles: ['nbfc', 'admin'] },
    // Analytics navigation - for all business users
    { path: '/analytics', label: 'Analytics', roles: ['dealer', 'admin', 'nbfc'] }
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user.role)
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        mobileButtonRef.current &&
        !mobileButtonRef.current.contains(event.target)
      ) {
        closeMobileMenu();
      }
    };

    // Close mobile menu on escape key
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, []);

  return (
    <nav className="bg-gray-800 shadow-lg py-2 relative">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <NavLink to="/" className="text-gray-300 navbar-brand font-mono text-lg font-bold hover:text-white transition-colors duration-200">
          {user.role === 'consumer' ? 'Ienerzy Consumer' : 'Ienerzy'}
        </NavLink>
        
        {/* Desktop Navigation */}
        <ul className="hidden md:flex navbar-nav">
          {filteredNavItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path}
                className={({ isActive }) => 
                  `px-3 py-2 rounded-md transition-colors duration-200 ${
                    isActive ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        
        {/* Desktop User Info & Logout */}
        <div className="hidden md:flex items-center">
          <span className="user-info">
            {user.name} ({user.role})
          </span>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          ref={mobileButtonRef}
          onClick={toggleMobileMenu}
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-200"
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <span className="sr-only">Open main menu</span>
          {/* Hamburger Icon */}
          <svg
            className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {/* Close Icon */}
          <svg
            className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div 
        ref={mobileMenuRef}
        className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden absolute top-full left-0 right-0 bg-gray-800 shadow-lg z-50 border-t border-gray-700`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 max-h-96 overflow-y-auto">
          {/* Mobile Navigation Items */}
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-white bg-gray-700'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          
          {/* Mobile User Info & Logout */}
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="px-3 py-2 text-gray-300 text-sm font-medium">
              {user.name} ({user.role})
            </div>
            <button
              onClick={() => {
                closeMobileMenu();
                onLogout();
              }}
              className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}
    </nav>
  );
};

export default Navbar; 