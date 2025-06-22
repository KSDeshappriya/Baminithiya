import { useState } from 'react';
import { z } from 'zod';
import type {ChangeEvent, FormEvent} from 'react';
import { userLoginSchema } from '../../schema/user';
import { authService } from '../../services/auth';

type LoginFormData = z.infer<typeof userLoginSchema>;

const SignIn = () => {
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
      await authService.login(validatedData);
      // ...handle success (e.g., redirect)...
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Sign In</h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Password"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={locationLoading}
              >
                {locationLoading ? 'Getting Location...' : (location ? 'Location Set' : 'Get Location (Required)')}
              </button>
              {location && (
                <p className="text-green-600 text-sm mt-1">Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
              )}
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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