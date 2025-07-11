import { useState, useEffect } from 'react';
import { z } from 'zod';
import type {ChangeEvent, FormEvent} from 'react';
import { userSignupSchema } from '../../schema/user';
import { authService } from '../../services/auth';
import { useNavigate } from 'react-router';
import Alert from '../../components/public/alert';

type SignupFormData = z.infer<typeof userSignupSchema>;

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<SignupFormData>>({
    role: 'user'
  });
  const [skills, setSkills] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success' | 'warning' | 'info'; message: string } | null>(null);

  // Real-time form validation
  useEffect(() => {
    // Form validation logic can be added here if needed
  }, [formData, skills]);

  // Password strength indicator (removed for now)
  useEffect(() => {
    // Password strength logic can be added here if needed
  }, [formData.password]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear alert when user starts typing
    if (alert) setAlert(null);
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const formDataToValidate = {
        ...formData,
        skills: skills.split(',').map(skill => skill.trim()).filter(Boolean)
      };
      
      const validatedData = userSignupSchema.parse(formDataToValidate);
      await authService.signup(validatedData);
      setAlert({
        type: 'success',
        message: 'Account created successfully! Redirecting to sign in...'
      });
      setTimeout(() => {
        navigate('/auth/signin/');
      }, 2000);
    } catch (error) {
      console.error('Signup error:', error);
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
          message: error.message || 'Signup failed. Please try again.'
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

  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'volunteer':
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="group">
              <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-blue-400 transition-colors duration-200">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Skills (comma separated)
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm"
                  placeholder="e.g., First Aid, CPR, Search & Rescue"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {skills && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.split(',').map((skill, index) => skill.trim() && (
                    <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs border border-blue-500/30">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'first_responder':
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="group">
              <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-blue-400 transition-colors duration-200">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Department
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="department"
                  value={formData.department || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-12 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm"
                  placeholder="e.g., Fire Department, Police, EMS"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="group">
              <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-blue-400 transition-colors duration-200">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Unit
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="unit"
                  value={formData.unit || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-12 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm"
                  placeholder="e.g., Unit 12, Engine 7, Squad A"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );
      case 'government':
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="group">
              <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-blue-400 transition-colors duration-200">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  Department
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="department"
                  value={formData.department || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-12 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm"
                  placeholder="e.g., Emergency Management, Public Safety"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="group">
              <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-blue-400 transition-colors duration-200">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Position
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="position"
                  value={formData.position || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-12 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm"
                  placeholder="e.g., Director, Coordinator, Manager"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-grid-pattern"></div>
      </div>
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-lg w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm font-medium border border-green-500/30">
              🚀 Join the Team
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Create Account
          </h2>
          <p className="text-gray-300 text-lg">
            Join our emergency response network
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl hover:bg-gray-800/40 transition-all duration-300">
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
              <div className="group">
                <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-blue-400 transition-colors duration-200">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-blue-400 transition-colors duration-200">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-blue-400 transition-colors duration-200">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm"
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-blue-400 transition-colors duration-200">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm"
                  placeholder="Create a secure password"
                />
                {errors.password && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-blue-400 transition-colors duration-200">
                  Role
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm appearance-none cursor-pointer"
                  >
                    <option value="user">👤 User</option>
                    <option value="volunteer">🤝 Volunteer</option>
                    <option value="first_responder">🚨 First Responder</option>
                    <option value="government">🏛️ Government</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {renderRoleSpecificFields && renderRoleSpecificFields()}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full py-4 px-6 border border-transparent rounded-xl shadow-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-900 font-medium text-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center justify-center">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <svg className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>
          
          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <p className="text-center text-gray-400 text-sm">
              Already have an account?{' '}
              <a href="/auth/signin" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;