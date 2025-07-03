import { useState } from 'react';
import { z } from 'zod';
import type {ChangeEvent, FormEvent} from 'react';
import { userLoginSchema } from '../../schema/user';
import { authService } from '../../services/auth';
import { useNavigate } from 'react-router';

type LoginFormData = z.infer<typeof userLoginSchema>;

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<LoginFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    try {
      if (!location) {
        setErrors(prev => ({ ...prev, location: 'Location is required' }));
        return;
      }
      const formDataWithLocation = {
        ...formData,
        latitude: location.latitude,
        longitude: location.longitude,
      };
      const validatedData = userLoginSchema.parse(formDataWithLocation);
      const token = await authService.login(validatedData);
      if (token != null) {
        const role = authService.getUserRole();
        if (role === 'user') navigate('/user');
        else if (role === 'volunteer') navigate('/volunteer');
        else if (role === 'first_responder') navigate('/first_responder');
        else if (role === 'government') navigate('/government');
        else navigate('/public');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            errorMap[err.path[0]] = err.message;
          }
        });
        setErrors(errorMap);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 shadow-lg">
        <h2 className="text-center text-3xl font-extrabold text-white mb-6">Sign In</h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
              <input
                type="email"
                name="email"
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-700/50 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                placeholder="Email"
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
              <input
                type="password"
                name="password"
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-700/50 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                placeholder="Password"
              />
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full py-2 px-4 border border-gray-700/50 rounded-md shadow-lg bg-gray-900 text-gray-300 hover:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50"
                disabled={locationLoading}
              >
                {locationLoading ? 'Getting Location...' : (location ? 'Location Set' : 'Get Location (Required)')}
              </button>
              {location && (
                <p className="text-green-400 text-sm mt-1">Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
              )}
              {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 font-medium text-lg transition-all duration-200 disabled:opacity-50"
            disabled={!location}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;