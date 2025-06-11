import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Failed to log in with Google:', error);
      setError('Failed to log in with Google. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <div className="space-y-4">
        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.28426 53.749 C -8.52426 55.049 -9.21677 56.159 -10.0802 56.866 L -10.073 60.366 L -6.10996 60.366 C -2.60996 57.049 -0.714 53.019 -0.714 48.009 C -0.714 47.289 -0.666 46.569 -0.575 45.859 L -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.70996 60.366 L -10.089 56.866 C -11.119 57.566 -12.484 57.989 -14.004 57.989 C -16.924 57.989 -19.364 55.949 -20.194 53.229 L -24.269 53.229 L -24.269 56.729 C -22.099 61.109 -17.704 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -20.194 53.229 C -20.464 52.389 -20.614 51.499 -20.614 50.589 C -20.614 49.669 -20.464 48.789 -20.184 47.949 L -20.184 44.449 L -24.274 44.449 C -25.304 46.539 -25.864 48.869 -25.864 51.179 C -25.864 53.489 -25.304 55.819 -24.274 57.909 L -20.194 53.229 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.094 45.789 L -6.729 42.369 C -8.809 40.429 -11.614 39.239 -14.754 39.239 C -17.704 39.239 -22.099 41.369 -24.274 44.449 L -20.194 47.949 C -19.364 45.229 -16.924 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          By signing in, you agree to our{' '}
          <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
