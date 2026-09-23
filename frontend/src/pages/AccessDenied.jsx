
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AccessDenied = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    if (user) { // Navigate ->  based on role
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'coordinator') {
        navigate('/coordinator-dashboard');
      } else {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <ShieldX className="w-12 h-12 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold text-foreground-90 mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          You don't have permission to access this page. Please contact the administrator.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleGoBack} className="bg-amrita hover:bg-amrita/90 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;