import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, LogIn, UserPlus, Home, LayoutDashboard, PenTool } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent"
        >
          AI CMS
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center space-x-6 text-gray-700 dark:text-gray-200 font-medium">
          <Link to="/" className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-purple-400">
            <Home className="w-4 h-4" /> Home
          </Link>

          {token ? (
            <>
              <Link
                to="/create"
                className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-purple-400"
              >
                <PenTool className="w-4 h-4" /> Create
              </Link>

              <Link
                to="/dashboard"
                className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-purple-400"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-purple-400"
              >
                <LogIn className="w-4 h-4" /> Login
              </Link>

              <Link
                to="/register"
                className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-purple-400"
              >
                <UserPlus className="w-4 h-4" /> Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <details className="relative">
            <summary className="list-none cursor-pointer text-gray-800 dark:text-gray-200">
              ☰
            </summary>
            <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 w-40 border border-gray-200 dark:border-gray-700">
              <Link to="/" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                Home
              </Link>
              {token ? (
                <>
                  <Link to="/create" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Create
                  </Link>
                  <Link to="/dashboard" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Login
                  </Link>
                  <Link to="/register" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Register
                  </Link>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
