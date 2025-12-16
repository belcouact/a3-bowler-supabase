import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // Assuming email is needed for signup, though prompt only mentioned username for fetching profile. Usually signup needs username/password at least.
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await login({ username, password });
      } else {
        await signup({ username, password, email });
        // Switch to login or auto-login (logic inside context or here)
        // If signup doesn't auto-login, we might want to tell user to login
        if (!error) {
           setIsLogin(true); // Switch to login view after successful signup
           setError('Signup successful! Please login.');
           return;
        }
      }
      onClose();
    } catch (err: any) {
      // Alert user if strictly requested, though UI error message is usually better.
      // The user prompt said: "alert user if account not exist, or password incorrect."
      // Since we also display it in the red box, I'll add window.alert for explicit compliance if that's what "alert" implies,
      // but "alert user" can also mean "show an alert message in UI".
      // Given the previous error display was just "Login failed", showing the specific message "Invalid credentials" in the UI is a huge improvement.
      // However, to be safe with "alert user", I will stick to the UI message which is the standard "alert" in web apps unless window.alert is explicitly asked.
      // But I will make sure the message is clear.
      
      const message = err.message || 'An error occurred';
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                // Making email optional if not strictly required by backend, but usually good practice
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
                setIsLogin(!isLogin);
                setError('');
            }}
            className="text-blue-600 hover:underline font-medium"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
