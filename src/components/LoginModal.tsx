import { useState } from 'react';
import { Mail, Lock, User, Info, Loader2, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup specific states
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Common user');
  const [country, setCountry] = useState('');
  const [plant, setPlant] = useState('');
  const [team, setTeam] = useState('');
  const [isPublicProfile, setIsPublicProfile] = useState(true);
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
      const payload = {
        username: signupUsername,
        password: signupPassword,
        role,
        email: signupEmail || undefined,
        profile: {
          country,
          plant,
          team,
          isPublic: isPublicProfile
        }
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
        "flex-1 py-3 text-xs font-medium tracking-wide transition-colors border-b-2",
        activeTab === id
          ? "border-blue-600 text-blue-600 bg-blue-50/40"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/60"
      )}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {id === 'login' ? (
          <LogIn className="h-3.5 w-3.5" />
        ) : (
          <UserPlus className="h-3.5 w-3.5" />
        )}
        <span>{label}</span>
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] px-3 py-4">
      <div className={clsx(
        "bg-white rounded-xl w-full shadow-xl overflow-hidden transition-all max-h-[88vh] overflow-y-auto no-scrollbar border border-gray-100",
        activeTab === 'signup' ? "max-w-xl" : "max-w-md"
      )}>
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <TabButton id="login" label="Login" />
          <TabButton id="signup" label="Create Account" />
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4 text-sm">
              {successMessage}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
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
                <label className="block text-xs font-medium text-gray-700 mb-1">
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
              <div className="mb-3">
                <h2 className="text-xl font-semibold text-gray-900">Create your account</h2>
                <p className="text-xs text-gray-500 mt-1">
                  A single account lets you manage your bowlers and A3 cases across devices.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {/* Left Column - Account Details */}
                <div className="space-y-3 bg-gray-50/60 rounded-lg border border-gray-100 p-4">
                  <h3 className="flex items-center justify-between text-sm font-semibold text-gray-800 border-b pb-2">
                    <span>Account Details</span>
                    <span className="text-[10px] font-medium text-blue-500 uppercase tracking-wide">Step 1 of 2</span>
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      User Account Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter account name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Email Address (optional)
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
                <div className="space-y-3 bg-gray-50/60 rounded-lg border border-gray-100 p-4">
                  <h3 className="flex items-center justify-between text-sm font-semibold text-gray-800 border-b pb-2">
                    <span>Profile Information</span>
                    <span className="text-[10px] font-medium text-blue-500 uppercase tracking-wide">Step 2 of 2</span>
                  </h3>

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
                        Region
                      </label>
                      <div className="relative">
                         {/* Using simple select for now */}
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select Region</option>
                          <option value="China">China</option>
                          <option value="US">US</option>
                          <option value="EMEA">EMEA</option>
                          <option value="APAC">APAC</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Plant/Office
                      </label>
                      <div className="relative">
                        <select
                          value={plant}
                          onChange={(e) => setPlant(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select Plant/Office</option>
                          <option value="BJ">BJ</option>
                          <option value="SH">SH</option>
                          <option value="TW">TW</option>
                          <option value="SZFTZ">SZFTZ</option>
                          <option value="SZBAN">SZBAN</option>
                          <option value="EM1">EM1</option>
                          <option value="EM5">EM5</option>
                          <option value="LOV">LOV</option>
                          <option value="PU3">PU3</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Functional Team
                    </label>
                    <div className="relative">
                       <select
                          value={team}
                          onChange={(e) => setTeam(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select Functional Team</option>
                          <option value="Commercial">Commercial</option>
                          <option value="SC">SC</option>
                          <option value="Technical">Technical</option>
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
                      <span
                        className="inline-flex items-center justify-center"
                        title="If checked, administrators and privileged users can consolidate your metrics & A3 data."
                      >
                        <Info className="h-4 w-4 text-gray-400" />
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
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
