import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, Settings, ChevronRight, UserCheck, AlertTriangle } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: <Home size={20} />, label: 'Home' },
    { path: '/students', icon: <Users size={20} />, label: 'Students', hasDropdown: true },
    { path: '/schedule', icon: <Calendar size={20} />, label: 'Schedule' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className={`h-screen bg-gradient-to-br from-purple-50 to-orange-50 border-r border-gray-100 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="bg-gradient-radial from-purple-300 to-orange-200 h-10 w-10 rounded-full"></div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-orange-400 text-transparent bg-clip-text">
              EduAdmin
            </h1>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronRight size={20} className={`${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                onClick={(e) => {
                  if (item.hasDropdown && item.label === 'Students' && !isCollapsed) {
                    e.preventDefault();
                    setShowStudentDropdown(!showStudentDropdown);
                  }
                }}
              >
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                  <span className={isActive(item.path) ? 'text-purple-600' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </div>
                {!isCollapsed && item.hasDropdown && (
                  <ChevronRight
                    size={18}
                    className={`transition-transform ${showStudentDropdown ? 'rotate-90' : ''}`}
                  />
                )}
              </Link>
              {!isCollapsed && item.hasDropdown && showStudentDropdown && item.label === 'Students' && (
                <div className="ml-8 mt-1 space-y-1 animate-fade-in">
                  <Link
                    to="/students/add"
                    className={`block py-2 px-3 rounded-md text-sm font-medium ${
                      isActive('/students/add') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Add Student
                  </Link>
                  <Link
                    to="/students"
                    className={`block py-2 px-3 rounded-md text-sm font-medium ${
                      isActive('/students') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    View All
                  </Link>
                  <Link
                    to="/active-students"
                    className={`flex items-center py-2 px-3 rounded-md text-sm font-medium ${
                      isActive('/active-students') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <UserCheck size={14} className="mr-1.5" />
                    Active Students
                  </Link>
                  <Link
                    to="/expired-memberships"
                    className={`flex items-center py-2 px-3 rounded-md text-sm font-medium ${
                      isActive('/expired-memberships') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <AlertTriangle size={14} className="mr-1.5" />
                    Expired Members
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
      {!isCollapsed && (
        <div className="p-4 mb-4 mx-4 bg-purple-100 rounded-lg">
          <p className="text-sm font-medium text-purple-800">Need help?</p>
          <p className="text-xs text-purple-600 mt-1">Check our documentation</p>
          <button className="mt-2 text-xs bg-white text-purple-600 px-3 py-1 rounded-md border border-purple-200 hover:bg-purple-50">
            View Docs
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;