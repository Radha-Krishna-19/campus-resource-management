import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { User, Lock } from 'lucide-react';
import amritaLogo from '/src/assets/amrita.png';

const Login = () => {
  const [currentView, setCurrentView] = useState('login');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');

  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const { login, register, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (user.role === 'coordinator') {
        navigate('/coordinator-dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');
    setIsLoading(true);

    try {
      const result = await login(username, password, role);

      if (result.success) {
        toast.success("Login successful!");
        // Navigation is handled by useEffect
      } else {
        toast.error(result.message);
        setError(result.message);
      }
    } catch (err) {
      toast.error("An error occurred during login");
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!registerUsername || !registerPassword || !confirmPassword) {
      setError('Please fill all fields');
      setIsLoading(false);
      return;
    }

    if (registerPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register(registerUsername, registerPassword, 'admin');
      if (result.success) {
        // toast.success("Admin request submitted successfully!"); // Removed as per request
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          setRegisterUsername('');
          setRegisterPassword('');
          setConfirmPassword('');
          flipToLogin('right-to-left');
        }, 2000);
      } else {
        toast.error(result.message);
        setError(result.message);
      }
    } catch (err) {
      toast.error("Failed to register");
      setError('Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  const flipToRegister = () => {
    if (isAnimating) return;
    setError('');
    setSuccessMessage('');
    setIsAnimating(true);
    setAnimationDirection('left-to-right');

    setTimeout(() => {
      setCurrentView('register');
    }, 350);

    setTimeout(() => {
      setIsAnimating(false);
      setAnimationDirection('');
    }, 750);
  };

  const flipToLogin = (direction = 'right-to-left') => {
    if (isAnimating) return;
    setError('');
    setSuccessMessage('');
    setIsAnimating(true);
    setAnimationDirection(direction);

    setTimeout(() => {
      setCurrentView('login');
    }, 350);

    setTimeout(() => {
      setIsAnimating(false);
      setAnimationDirection('');
    }, 750);
  };

  const getAnimationStyle = () => {
    if (!isAnimating) return {};

    if (animationDirection === 'left-to-right') {
      return {
        transform: currentView === 'login'
          ? 'translateX(0%)'
          : 'translateX(100%)',
        opacity: currentView === 'login' ? 0 : 1
      };
    } else { // right to left
      return {
        transform: currentView === 'register'
          ? 'translateX(0%)'
          : 'translateX(-100%)',
        opacity: currentView === 'register' ? 0 : 1
      };
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-8 overflow-y-auto overflow-x-hidden">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md mx-4 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
              <p className="text-gray-600">Coordinator account has been created successfully. Redirecting to login...</p>
            </div>
          </div>
        </div>
      )}
      {/* outer layer */}
      {/* min-h (not h-auto) matters here: the login/register panels are
          absolutely positioned, so an auto-height ancestor would collapse to
          0px on mobile since it has no in-flow children to size against. */}
      <div className="w-full max-w-6xl min-h-[560px] sm:h-[600px] relative">
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">

          {/* Red Diagonal Overlay - Grows and Shrinks */}
          <div className={`absolute inset-0 z-30 pointer-events-none overflow-hidden ${isAnimating ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-300`}>
            <div
              className="absolute w-full h-full bg-amrita transition-all duration-700 ease-in-out"
              style={{
                clipPath: animationDirection === 'left-to-right'
                  ? (currentView === 'login'
                    ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                    : 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)')
                  : (currentView === 'register'
                    ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                    : 'polygon(0 0, 0 0, 0 100%, 0 100%)')
              }}
            ></div>
          </div>

          {/* Login Form */}
          <div
            className={`absolute inset-0 w-full h-full z-10 transition-all duration-700 ease-in-out ${currentView === 'login' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            style={getAnimationStyle()}
          >
            <div className="w-full h-full flex">
              {/* left side - img */}
              <div className="hidden sm:block sm:w-1/2 relative overflow-hidden">
                <div
                  className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${isAnimating ? (animationDirection === 'left-to-right' ? 'translate-x-10' : '-translate-x-10') : ''
                    }`}
                  style={{
                    backgroundImage: `url(${amritaLogo})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/10"></div>
                </div>

                <div className={`absolute -right-20 top-0 bottom-0 w-40 bg-background transform skew-x-12 transition-all duration-700 ${isAnimating ? 'opacity-0' : 'opacity-100'
                  }`}></div>
              </div>

              {/* right side - login form */}
              <div className="w-full sm:w-1/2 bg-background flex items-center justify-center p-6 sm:p-8">
                <Card
                  className={`w-full max-w-sm border-0 shadow-none transition-all duration-700 ${isAnimating ? (animationDirection === 'left-to-right' ? 'translate-x-10' : '-translate-x-10') : ''
                    }`}
                >
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold text-amrita">Welcome Back</CardTitle>
                    <p className="text-muted-foreground">Sign in to your account</p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-foreground-90">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="pl-10 w-full focus:border-amrita focus:ring-amrita"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-foreground-90">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 w-full focus:border-amrita focus:ring-amrita"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-foreground-90">Role</Label>
                        <Select
                          value={role}
                          onValueChange={setRole}
                        >
                          <SelectTrigger className="w-full focus:ring-amrita focus:border-amrita">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent className="border-amrita/20">
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="coordinator">Coordinator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {error && (
                        <p className="text-destructive text-sm text-center">{error}</p>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-amrita hover:bg-amrita/90 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Logging in...' : 'Login'}
                      </Button>

                      <div className="relative mt-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={flipToRegister}
                        disabled={isAnimating}
                        className="w-full text-center text-amrita hover:underline text-sm mt-4"
                      >
                        New? Create Admin Account
                      </button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Register Form */}
          <div
            className={`absolute inset-0 w-full h-full z-20 transition-all duration-700 ease-in-out ${currentView === 'register' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            style={getAnimationStyle()}
          >
            <div className="w-full h-full flex">
              <div className="w-full sm:w-1/2 bg-background flex items-center justify-center p-6 sm:p-8">
                <Card
                  className={`w-full max-w-sm border-0 shadow-none transition-all duration-700 ${isAnimating ? (animationDirection === 'right-to-left' ? 'translate-x-10' : '-translate-x-10') : ''
                    }`}
                >
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold text-amrita">Create Admin Account</CardTitle>
                    <p className="text-muted-foreground">Create a new admin account</p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="registerUsername" className="text-foreground-90">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="registerUsername"
                            type="text"
                            placeholder="Enter username for admin"
                            value={registerUsername}
                            onChange={(e) => setRegisterUsername(e.target.value)}
                            className="pl-10 w-full focus:border-amrita focus:ring-amrita"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="registerPassword" className="text-foreground-90">Create Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="registerPassword"
                            type="password"
                            placeholder="Create password"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            className="pl-10 w-full focus:border-amrita focus:ring-amrita"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-foreground-90">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 w-full focus:border-amrita focus:ring-amrita"
                            required
                          />
                        </div>
                      </div>

                      {error && (
                        <p className="text-destructive text-sm text-center">{error}</p>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-amrita hover:bg-amrita/90 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating...' : 'Create Admin Account'}
                      </Button>

                      <button
                        type="button"
                        onClick={() => flipToLogin('right-to-left')}
                        disabled={isAnimating}
                        className="w-full text-center text-amrita hover:underline text-sm mt-4"
                      >
                        Back to Login
                      </button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Right side - image */}
              <div className="hidden sm:block sm:w-1/2 relative overflow-hidden">
                <div
                  className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${isAnimating ? (animationDirection === 'right-to-left' ? '-translate-x-10' : 'translate-x-10') : ''
                    }`}
                  style={{
                    backgroundImage: `url(${amritaLogo})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/10"></div>
                </div>

                <div className={`absolute -left-20 top-0 bottom-0 w-40 bg-background transform skew-x-12 transition-all duration-700 ${isAnimating ? 'opacity-0' : 'opacity-100'
                  }`}></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;