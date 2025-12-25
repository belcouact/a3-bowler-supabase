import React, { useState, useEffect } from 'react';
import { X, Lock, CreditCard, Check, RefreshCw, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { dataService } from '../services/dataService';
import { useApp } from '../context/AppContext';
import { EmailScheduleFrequency } from '../types';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const { dashboardSettings, setDashboardSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'password' | 'profile' | 'email'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSendingNow, setIsSendingNow] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile State
  const [role, setRole] = useState('');
  const [country, setCountry] = useState('China');
  const [plant, setPlant] = useState('SZFTZ');
  const [team, setTeam] = useState('GBS');
  const [isPublic, setIsPublic] = useState(true);

  // Email Schedule State
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSendAt, setEmailSendAt] = useState('');

  const [scheduleFrequency, setScheduleFrequency] = useState<EmailScheduleFrequency>('weekly');
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<number>(1);
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState<number>(1);
  const [scheduleTime, setScheduleTime] = useState<string>('08:00');
  const [emailMode, setEmailMode] = useState<'scheduled' | 'oneTime'>('scheduled');

  useEffect(() => {
    if (user) {
      setRole(user.role || '');
      setCountry(user.country || 'China');
      setPlant(user.plant || 'SZFTZ');
      setTeam(user.team || 'GBS');
      setIsPublic(user.isPublicProfile !== undefined ? user.isPublicProfile : true);
      if (user.email) {
        setEmailRecipients(user.email);
      }
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const existing = dashboardSettings.emailSchedule;
    if (existing) {
      if (existing.frequency === 'weekly' || existing.frequency === 'monthly') {
        setScheduleFrequency(existing.frequency);
      }
      if (typeof existing.dayOfWeek === 'number') {
        setScheduleDayOfWeek(existing.dayOfWeek);
      }
      if (typeof existing.dayOfMonth === 'number') {
        setScheduleDayOfMonth(existing.dayOfMonth);
      }
      if (existing.timeOfDay) {
        setScheduleTime(existing.timeOfDay);
      }
    }
  }, [isOpen, dashboardSettings.emailSchedule]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setDashboardSettings({
      ...dashboardSettings,
      emailSchedule: {
        frequency: scheduleFrequency,
        dayOfWeek: scheduleFrequency === 'weekly' ? scheduleDayOfWeek : undefined,
        dayOfMonth: scheduleFrequency === 'monthly' ? scheduleDayOfMonth : undefined,
        timeOfDay: scheduleTime,
      },
    });
  }, [scheduleFrequency, scheduleDayOfWeek, scheduleDayOfMonth, scheduleTime, isOpen, setDashboardSettings]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!emailBody) {
      if (dashboardSettings.latestSummaryForEmail) {
        setEmailBody(dashboardSettings.latestSummaryForEmail);
      }
    }
  }, [isOpen, dashboardSettings.latestSummaryForEmail, emailBody]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!emailSubject) {
      const base =
        scheduleFrequency === 'weekly'
          ? 'Weekly A3 / metric summary'
          : 'Monthly A3 / metric summary';
      setEmailSubject(base);
    }
  }, [isOpen, scheduleFrequency, emailSubject]);

  if (!isOpen) return null;

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (!currentPassword) {
        toast.error("Please enter current password");
        return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword({
        username: user?.username,
        oldPassword: currentPassword,
        newPassword: newPassword
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      await authService.updateProfile({
        username: user?.username,
        role,
        profile: {
          country,
          plant,
          team,
          isPublic
        }
      });
      
      toast.success('Profile updated successfully');
      
      // Refresh user data after successful update
      try {
        await refreshUser();
      } catch (error) {
        console.warn('Background refresh failed:', error);
        // We don't show an error toast here because the update was successful
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshProfile = async () => {
    setIsLoading(true);
    try {
        await refreshUser(true);
        toast.success('Profile reloaded');
    } catch (error: any) {
        toast.error('Failed to reload profile');
    } finally {
        setIsLoading(false);
    }
  };

  const getNextScheduledSendAt = () => {
    const now = new Date();
    const [hourStr, minuteStr] = scheduleTime.split(':');
    const hour = Number(hourStr) || 8;
    const minute = Number(minuteStr) || 0;

    if (scheduleFrequency === 'weekly') {
      const current = new Date(now.getTime());
      const currentDay = current.getDay();
      const targetDay = scheduleDayOfWeek === 7 ? 0 : scheduleDayOfWeek;

      current.setHours(hour, minute, 0, 0);

      let diff = targetDay - currentDay;
      if (diff < 0 || (diff === 0 && current <= now)) {
        diff += 7;
      }
      current.setDate(current.getDate() + diff);
      return current;
    }

    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.min(scheduleDayOfMonth, daysInCurrentMonth);

    let candidate = new Date(year, month, day, hour, minute, 0, 0);
    if (candidate <= now) {
      const nextMonth = new Date(year, month + 1, 1);
      const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
      const nextDay = Math.min(scheduleDayOfMonth, daysInNextMonth);
      candidate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextDay, hour, minute, 0, 0);
    }

    return candidate;
  };

  const handleScheduleEmail = async () => {
    const recipients = emailRecipients
      .split(/[,\n]/)
      .map(r => r.trim())
      .filter(r => r.length > 0);

    if (recipients.length === 0) {
      toast.error('Please enter at least one recipient email');
      return;
    }

    if (!emailSubject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }

    if (!emailBody.trim()) {
      toast.error('Please enter an email body');
      return;
    }

    let sendAtDate: Date | null = null;

    if (emailMode === 'scheduled') {
      sendAtDate = getNextScheduledSendAt();
    } else {
      if (!emailSendAt) {
        toast.error('Please choose a send date and time');
        return;
      }

      const parsed = new Date(emailSendAt);
      if (Number.isNaN(parsed.getTime())) {
        toast.error('Please enter a valid date and time');
        return;
      }
      sendAtDate = parsed;
    }

    setIsScheduling(true);
    try {
      const userId = user?.username || undefined;
      await dataService.scheduleEmail({
        userId,
        recipients,
        subject: emailSubject.trim(),
        body: emailBody.trim(),
        sendAt: sendAtDate.toISOString(),
      });
      toast.success('Email scheduled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule email');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSendEmailNow = async () => {
    const recipients = emailRecipients
      .split(/[,\n]/)
      .map(r => r.trim())
      .filter(r => r.length > 0);

    if (recipients.length === 0) {
      toast.error('Please enter at least one recipient email');
      return;
    }

    if (!emailSubject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }

    if (!emailBody.trim()) {
      toast.error('Please enter an email body');
      return;
    }

    setIsSendingNow(true);
    try {
      const userId = user?.username || undefined;
      await dataService.sendEmailNow({
        userId,
        recipients,
        subject: emailSubject.trim(),
        body: emailBody.trim(),
      });
      toast.success('Email sent successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email');
    } finally {
      setIsSendingNow(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              Account Settings
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${activeTab === 'password' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('password')}
            >
              <Lock className="w-4 h-4" />
              <span>Password</span>
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('profile')}
            >
              <CreditCard className="w-4 h-4" />
              <span>Profile</span>
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${activeTab === 'email' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('email')}
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="mb-6 flex items-center justify-between">
               <div>
                  <span className="text-gray-500">User: </span>
                  <span className="font-semibold text-blue-600">{user?.username}</span>
               </div>
               <button 
                  onClick={handleRefreshProfile}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Reload Profile from Server"
               >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
               </button>
            </div>

            {activeTab === 'password' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Current Password</label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                     <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                     />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">New Password</label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /> 
                     <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                     />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Confirm New Password</label>
                   <div className="relative">
                     <Check className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                     <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                     />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Region</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    >
                      <option value="China">China</option>
                      <option value="US">US</option>
                      <option value="EMEA">EMEA</option>
                      <option value="APAC">APAC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Plant/Office</label>
                    <select
                      value={plant}
                      onChange={(e) => setPlant(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    >
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
                 <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Functional Team</label>
                    <select
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    >
                      <option value="Commercial">Commercial</option>
                      <option value="SC">SC</option>
                      <option value="Technical">Technical</option>
                    </select>
                </div>

                <div className="pt-2">
                    <div className="border border-gray-200 rounded-md p-4 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Public Profile</h4>
                            <p className="text-xs text-gray-500">Allow others to consolidate your bowlers</p>
                        </div>
                        <button 
                            type="button"
                            className={`${isPublic ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                            role="switch"
                            aria-checked={isPublic}
                            onClick={() => setIsPublic(!isPublic)}
                        >
                            <span className={`${isPublic ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}></span>
                        </button>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Recipients</label>
                  <textarea
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    rows={2}
                    placeholder="user1@example.com, user2@example.com"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Separate multiple emails with commas or new lines.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Weekly A3 / metric summary"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Message</label>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        const summary = dashboardSettings.latestSummaryForEmail;
                        if (!summary) {
                          toast.error('No latest AI summary found. Please run one-click summary first.');
                          return;
                        }
                        setEmailBody((prev: string) => (prev ? `${prev}\n\n${summary}` : summary));
                      }}
                    >
                      Insert latest AI summary
                    </button>
                  </div>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={4}
                    placeholder="Add the summary or message you want to email."
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  />
                </div>
                <div className="mt-4 border rounded-md">
                  <div className="flex text-xs font-medium border-b">
                    <button
                      type="button"
                      className={`flex-1 px-3 py-2 text-center ${
                        emailMode === 'scheduled'
                          ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setEmailMode('scheduled')}
                    >
                      Scheduled (repeat)
                    </button>
                    <button
                      type="button"
                      className={`flex-1 px-3 py-2 text-center ${
                        emailMode === 'oneTime'
                          ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setEmailMode('oneTime')}
                    >
                      One-time
                    </button>
                  </div>
                  <div className="p-3 space-y-3">
                    {emailMode === 'scheduled' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Repeat</label>
                            <select
                              value={scheduleFrequency}
                              onChange={(e) => setScheduleFrequency(e.target.value as EmailScheduleFrequency)}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                            >
                              <option value="weekly">Every week</option>
                              <option value="monthly">Every month</option>
                            </select>
                          </div>
                          <div>
                            {scheduleFrequency === 'weekly' ? (
                              <>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Day of Week</label>
                                <select
                                  value={scheduleDayOfWeek}
                                  onChange={(e) => setScheduleDayOfWeek(Number(e.target.value))}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                >
                                  <option value={1}>Monday</option>
                                  <option value={2}>Tuesday</option>
                                  <option value={3}>Wednesday</option>
                                  <option value={4}>Thursday</option>
                                  <option value={5}>Friday</option>
                                  <option value={6}>Saturday</option>
                                  <option value={7}>Sunday</option>
                                </select>
                              </>
                            ) : (
                              <>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Date of Month</label>
                                <select
                                  value={scheduleDayOfMonth}
                                  onChange={(e) => setScheduleDayOfMonth(Number(e.target.value))}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                >
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <option key={day} value={day}>
                                      {day}
                                    </option>
                                  ))}
                                </select>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Time</label>
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                          />
                          <p className="mt-1 text-xs text-gray-400">
                            Saved to dashboard settings for recurring email schedule. Next send time is calculated automatically.
                          </p>
                        </div>
                      </>
                    )}
                    {emailMode === 'oneTime' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Send At</label>
                        <input
                          type="datetime-local"
                          value={emailSendAt}
                          onChange={(e) => setEmailSendAt(e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {activeTab === 'password' && (
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleUpdatePassword}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            )}

            {activeTab === 'profile' && (
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleUpdateProfile}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Profile'}
              </button>
            )}

            {activeTab === 'email' && (
              <>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleScheduleEmail}
                  disabled={isScheduling || isSendingNow}
                >
                  {isScheduling
                    ? 'Scheduling...'
                    : emailMode === 'scheduled'
                      ? 'Schedule recurring email'
                      : 'Schedule one-time email'}
                </button>
                {emailMode === 'oneTime' && (
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-blue-600 shadow-sm px-4 py-2 bg-white text-base font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleSendEmailNow}
                    disabled={isSendingNow || isScheduling}
                  >
                    {isSendingNow ? 'Sending...' : 'Send Now'}
                  </button>
                )}
              </>
            )}
            
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              {activeTab === 'password' ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
