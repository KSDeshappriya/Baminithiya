import { useState, useEffect } from 'react';
import { z } from 'zod';
import type {ChangeEvent, FormEvent} from 'react';
import { userLoginSchema } from '../../schema/user';
import { authService } from '../../services/auth';
import { useNavigate } from 'react-router';
import Alert from '../../components/public/alert';

type LoginFormData = z.infer<typeof userLoginSchema>;

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<LoginFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isFormValid, setIsFormValid] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success' | 'warning' | 'info'; message: string } | null>(null);

  // Real-time form validation
  useEffect(() => {
    const isValid = formData.email && 
                   formData.password && 
                   location && 
                   formData.email.includes('@') && 
                   formData.password.length >= 6;
    setIsFormValid(!!isValid);
  }, [formData, location]);

  // Password strength indicator
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength += 25;
      if (/[A-Z]/.test(formData.password)) strength += 25;
      if (/[0-9]/.test(formData.password)) strength += 25;
      if (/[^A-Za-z0-9]/.test(formData.password)) strength += 25;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear alert when user starts typing
    if (alert) setAlert(null);
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleGetLocation = () => {
    setLocationLoading(true);
    setErrors(prev => ({ ...prev, location: '' }));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationLoading(false);
        },
        () => {
          setErrors(prev => ({ ...prev, location: 'Unable to get location' }));
          setLocationLoading(false);
        }
      );
    } else {
      setErrors(prev => ({ ...prev, location: 'Geolocation is not supported' }));
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    
    try {
      if (!location) {
        setErrors(prev => ({ ...prev, location: 'Location is required' }));
        setIsLoading(false);
        return;
      }
      
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const formDataWithLocation = {
        ...formData,
        latitude: location.latitude,
        longitude: location.longitude,
      };
      const validatedData = userLoginSchema.parse(formDataWithLocation);
      const token = await authService.login(validatedData);
      if (token != null) {
        setAlert({
          type: 'success',
          message: 'Login successful! Redirecting to your dashboard...'
        });
        
        // Small delay to show success message before redirect
        setTimeout(() => {
          const role = authService.getUserRole();
          if (role === 'user') navigate('/user');
          else if (role === 'volunteer') navigate('/vol');
          else if (role === 'first_responder') navigate('/fr');
          else if (role === 'government') navigate('/gov');
          else navigate('/public');
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            errorMap[err.path[0]] = err.message;
          }
        });
        setErrors(errorMap);
        setAlert({
          type: 'error',
          message: 'Please check the form fields and try again.'
        });
      } else if (error instanceof Error) {
        setAlert({
          type: 'error',
          message: error.message || 'Login failed. Please check your credentials and try again.'
        });
      } else {
        setAlert({
          type: 'error',
          message: 'An unexpected error occurred. Please try again.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-grid-pattern animate-pulse"></div>
      </div>
      
      {/* Floating Gradient Orbs with Animation */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-reverse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 right-20 w-4 h-4 bg-blue-400/30 rounded-full animate-bounce"></div>
      <div className="absolute bottom-20 left-20 w-3 h-3 bg-purple-400/30 rounded-full animate-bounce delay-1000"></div>
      <div className="absolute top-1/3 left-10 w-2 h-2 bg-green-400/30 rounded-full animate-ping"></div>
      
      <div className="relative max-w-md w-full mx-auto">
        {/* Enhanced Header with Progress Indicator */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30 backdrop-blur-sm shadow-lg">
              <svg className="w-4 h-4 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure Access Portal
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Welcome Back
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-gradient">
              Emergency Team
            </span>
          </h2>
          <p className="text-gray-300 text-lg">
            Access your emergency response dashboard
          </p>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-6 space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                formData.email ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                1
              </div>
              <div className="ml-2 text-xs text-gray-400">Credentials</div>
            </div>
            <div className={`w-8 h-0.5 transition-all duration-300 ${
              formData.email && formData.password ? 'bg-blue-500' : 'bg-gray-700'
            }`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                location ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                2
              </div>
              <div className="ml-2 text-xs text-gray-400">Location</div>
            </div>
          </div>
        </div>

        {/* Enhanced Form Container */}
        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl hover:bg-gray-800/40 transition-all duration-300 hover:border-gray-600/50 hover:shadow-blue-500/10">
          {/* Alert Component */}
          {alert && (
            <div className="mb-6">
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Enhanced Email Field */}
              <div className="group">
                <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-blue-400 transition-colors duration-200">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    Email Address
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-12 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm"
                    placeholder="Enter your email"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {formData.email && formData.email.includes('@') && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.email && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </p>
                  </div>
                )}
              </div>

              {/* Enhanced Password Field */}
              <div className="group">
                <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-blue-400 transition-colors duration-200">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-12 pr-12 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm"
                    placeholder="Enter your password"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {formData.password && passwordStrength > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Password strength</span>
                      <span className={`text-xs ${
                        passwordStrength < 50 ? 'text-red-400' : 
                        passwordStrength < 75 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Medium' : 'Strong'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength < 50 ? 'bg-red-500' : 
                          passwordStrength < 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {errors.password && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password}
                    </p>
                  </div>
                )}
              </div>

              {/* Enhanced Location Access */}
              <div className="group">
                <label className="block text-sm font-medium mb-3 text-gray-300">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location Access
                  </div>
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className={`w-full py-3 px-4 border rounded-xl shadow-lg transition-all duration-200 font-medium flex items-center justify-center relative overflow-hidden ${
                    location 
                      ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                      : 'border-gray-600/50 bg-gray-900/50 text-gray-300 hover:bg-gray-800/70 hover:border-gray-500/50'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 backdrop-blur-sm`}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Acquiring Location...
                    </>
                  ) : location ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20"></div>
                      <svg className="mr-2 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Location Acquired
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Get Location (Required)
                    </>
                  )}
                </button>
                {location && (
                  <div className="mt-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-green-400 text-sm font-medium">Location Confirmed</p>
                        <p className="text-green-300/70 text-xs">
                          Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {errors.location && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <button
              type="submit"
              className={`group relative w-full py-4 px-6 border border-transparent rounded-xl shadow-lg text-white font-medium text-lg transition-all duration-300 overflow-hidden ${
                isFormValid && !isLoading
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-0.5 hover:shadow-xl cursor-pointer'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
              disabled={!isFormValid || isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center justify-center">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <svg className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>
          
          {/* Enhanced Footer */}
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="text-center space-y-4">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <a href="/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 hover:underline">
                  Sign up here
                </a>
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <a href="#" className="hover:text-gray-400 transition-colors duration-200">Terms</a>
                <span>•</span>
                <a href="#" className="hover:text-gray-400 transition-colors duration-200">Privacy</a>
                <span>•</span>
                <a href="#" className="hover:text-gray-400 transition-colors duration-200">Help</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;