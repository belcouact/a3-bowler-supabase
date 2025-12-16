import { useState } from 'react';
import { Mail, Lock, User, Info, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup specific states
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Common user');
  const [country, setCountry] = useState('');
  const [plant, setPlant] = useState('');
  const [team, setTeam] = useState('');
  const [isPublicProfile, setIsPublicProfile] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [error, setError] = useState('');
  const { login, signup, isLoading } = useAuth();

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      await login({ username, password });
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Assuming email is used as username for now, or we can add a username field if strictly required
      // But the design only shows Email Address.
      // We'll send email as username or just send email if backend supports it.
      // Based on previous code, username was required.
      // Let's use email as username for now to match the design.
      
      const payload = {
        username: signupEmail.split('@')[0], // Fallback username from email
        email: signupEmail,
        password: signupPassword,
        role,
        country,
        plant,
        team,
        isPublicProfile
      };

      await signup(payload);
      
      // Auto switch to login or show success
      setActiveTab('login');
      setUsername(payload.username);
      setSuccessMessage('Signup successful! Please login.');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const TabButton = ({ id, label }: { id: 'login' | 'signup', label: string }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setError('');
        setSuccessMessage('');
      }}
      className={clsx(
        "flex-1 py-4 text-sm font-medium transition-colors border-b-2",
        activeTab === id
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={clsx(
        "bg-white rounded-lg w-full shadow-xl overflow-hidden transition-all",
        activeTab === 'signup' ? "max-w-4xl" : "max-w-md"
      )}>
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <TabButton id="login" label="Login" />
          <TabButton id="signup" label="Create Account" />
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md mb-6 text-sm">
              {successMessage}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                 <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Join us</h2>
                <p className="text-gray-500 mt-1">Create a new User in Cloudflare DB.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Account Details */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Account Details</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="name@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm password"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Profile Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Profile Information</h3>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Role
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Role"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Country
                      </label>
                      <div className="relative">
                         {/* Using simple select for now */}
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select Country</option>
                          <option value="USA">USA</option>
                          <option value="China">China</option>
                          <option value="Germany">Germany</option>
                          <option value="Mexico">Mexico</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Plant
                      </label>
                      <div className="relative">
                        <select
                          value={plant}
                          onChange={(e) => setPlant(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select Plant</option>
                          <option value="Plant A">Plant A</option>
                          <option value="Plant B">Plant B</option>
                          <option value="Plant C">Plant C</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Team
                    </label>
                    <div className="relative">
                       <select
                          value={team}
                          onChange={(e) => setTeam(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select Team</option>
                          <option value="Operations">Operations</option>
                          <option value="Safety">Safety</option>
                          <option value="Quality">Quality</option>
                          <option value="Logistics">Logistics</option>
                        </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={isPublicProfile}
                        onChange={(e) => setIsPublicProfile(e.target.checked)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700 font-medium flex-1">Public Profile</span>
                      <Info className="h-4 w-4 text-gray-400" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-md hover:bg-gray-200 transition-colors font-medium text-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
