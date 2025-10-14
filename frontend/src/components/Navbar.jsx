import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const token = localStorage.getItem('token'); // check login
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-bold">
        <Link to="/">My CMS</Link>
      </div>

      <div className="space-x-4">
        <Link to="/" className="hover:text-gray-300">Home</Link>
        {token ? (
          <>
            <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
            <button onClick={handleLogout} className="hover:text-gray-300">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-gray-300">Login</Link>
            <Link to="/register" className="hover:text-gray-300">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
