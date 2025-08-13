import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navItems = [
    { path: '/', label: 'Dashboard', roles: ['dealer', 'admin'] },
    { path: '/batteries', label: 'Batteries', roles: ['dealer', 'admin'] },
    { path: '/consumers', label: 'Consumers', roles: ['dealer', 'admin'] },
    { path: '/finance', label: 'Finance', roles: ['dealer', 'admin'] },
    { path: '/service', label: 'Service', roles: ['dealer', 'admin'] },
    { path: '/consumer-view', label: 'Consumer View', roles: ['dealer', 'admin'] }
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand">
          Ienerzy Battery Management
        </NavLink>
        
        <ul className="navbar-nav">
          {filteredNavItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path}
                className={({ isActive }) => 
                  isActive ? 'active' : ''
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        
        <div className="flex items-center">
          <span className="user-info">
            {user.name} ({user.role})
          </span>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 