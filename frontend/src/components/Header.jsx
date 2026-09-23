import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import api from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { LogOut, BellRing, Moon, Sun, Menu, X } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [reallocations, setReallocations] = React.useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Global Displacement Alert for Coordinators
  const checkReallocations = async () => {
    if (user?.role !== 'coordinator') return;
    try {
      const res = await api.get("/reallocation/my");
      const pending = res.data || [];
      setReallocations(pending);

      if (pending.length > 0) {
        toast.info(
          <div className="flex flex-col gap-1">
            <p className="font-bold text-orange-700 flex items-center gap-2">
              <BellRing className="w-4 h-4" /> Displacement Alert
            </p>
            <p className="text-sm">You have {pending.length} hall reallocation request(s) waiting for review.</p>
            <Button
              size="sm"
              className="mt-2 bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => {
                toast.dismiss("reallocation-toast");
                navigate("/reallocation-requests");
              }}
            >
              Resolve Now
            </Button>
          </div>,
          { duration: 15000, id: "reallocation-toast" }
        );
      }
    } catch (err) {
      console.error('Failed to poll reallocation requests:', err);
    }
  };

  useEffect(() => {
    checkReallocations();
    const interval = setInterval(checkReallocations, 45000); // Check every 45s
    return () => clearInterval(interval);
  }, [user]);

  const getDisplayName = () => {
    if (user?.username) return user.username;
    if (user?.role === "admin") return "Admin";
    if (user?.role === "coordinator") return "Student Coordinator";
    if (user?.role) return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    return "User";
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className="bg-amrita text-amrita-foreground shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4 cursor-pointer min-w-0" onClick={() => navigate('/')}>
          <img src="/logo.svg" alt="Amrita Logo" className="h-8 sm:h-10 w-auto brightness-0 invert shrink-0" />
          <h1 className="text-lg sm:text-2xl font-bold tracking-wide truncate">AMRITA PORTAL</h1>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-4">
          <span className="text-lg">
            Welcome, <span className="font-semibold">{getDisplayName()}!</span>
          </span>
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="icon"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white flex items-center gap-1"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="sm:hidden p-2 rounded-md hover:bg-white/10"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-white/20 px-4 py-3 flex flex-col gap-3">
          <span className="text-sm">
            Welcome, <span className="font-semibold">{getDisplayName()}!</span>
          </span>
          <div className="flex gap-2">
            <Button
              onClick={toggleTheme}
              variant="outline"
              className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              Theme
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Global Displacement Alert Banner for Coordinators */}
      {reallocations.length > 0 && user?.role === 'coordinator' && (
        <div
          className="bg-amber-500 text-white py-2 px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 animate-in slide-in-from-top duration-300"
          style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <BellRing className="w-4 h-4 shrink-0" />
            <span>You have {reallocations.length} booking(s) overridden by higher priority events.</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-amber-600 hover:bg-amber-50 h-8 text-xs font-bold w-full sm:w-auto"
            onClick={() => navigate('/reallocation-requests')}
          >
            View Alternatives
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
