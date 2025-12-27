import React, { useState, useEffect } from 'react';
import { X, Lock, CreditCard, Check, RefreshCw, Repeat, Clock3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { dataService } from '../services/dataService';
import { useApp } from '../context/AppContext';
import { EmailScheduleFrequency, GroupPerformanceRow } from '../types';
import { generateAIContext, generateComprehensiveSummary } from '../services/aiService';
import { computeGroupPerformanceTableData } from '../utils/metricUtils';
import { generateShortId } from '../utils/idUtils';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'account' | 'email';
}

interface ActiveScheduleItem {
  id: string;
  subject: string;
  sendAt: number;
  mode?: 'manual' | 'autoSummary';
  recipients: string[];
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  mode = 'account',
}) => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const {
    bowlers,
    a3Cases,
    selectedModel,
    dashboardSettings,
    setDashboardSettings,
    dashboardMarkdown,
    dashboardTitle,
    dashboardMindmaps,
    activeMindmapId,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'password' | 'profile' | 'email'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSendingNow, setIsSendingNow] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

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
  const [emailBodyHtml, setEmailBodyHtml] = useState<string | null>(null);

  const [scheduleFrequency, setScheduleFrequency] = useState<EmailScheduleFrequency>('weekly');
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<number>(1);
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState<number>(1);
  const [scheduleTime, setScheduleTime] = useState<string>('08:00');
  const [hasInitializedSchedule, setHasInitializedSchedule] = useState(false);
  const [hasInitializedEmailDefaults, setHasInitializedEmailDefaults] = useState(false);
  const [emailMode, setEmailMode] = useState<'scheduled' | 'oneTime'>('scheduled');
  const [hasInitializedConsolidateSettings, setHasInitializedConsolidateSettings] = useState(false);
  const [emailConsolidateTags, setEmailConsolidateTags] = useState('');
  const [emailConsolidateEnabled, setEmailConsolidateEnabled] = useState(false);
  const [emailTab, setEmailTab] = useState<'schedule' | 'active'>('schedule');
  const [activeSchedules, setActiveSchedules] = useState<ActiveScheduleItem[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isCancellingScheduleId, setIsCancellingScheduleId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setRole(user.role || '');
      setCountry(user.country || 'China');
      setPlant(user.plant || 'SZFTZ');
      setTeam(user.team || 'GBS');
      setIsPublic(user.isPublicProfile !== undefined ? user.isPublicProfile : true);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setHasInitializedSchedule(false);
      setHasInitializedEmailDefaults(false);
      setHasInitializedConsolidateSettings(false);
      setEmailTab('schedule');
      setActiveSchedules([]);
      return;
    }
    if (hasInitializedSchedule) {
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
    setHasInitializedSchedule(true);
  }, [isOpen, dashboardSettings.emailSchedule, hasInitializedSchedule]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (hasInitializedEmailDefaults) {
      return;
    }
    const defaults = (dashboardSettings as any).emailDefaults || {};
    if (!emailRecipients) {
      if (typeof defaults.recipients === 'string' && defaults.recipients.trim() !== '') {
        setEmailRecipients(defaults.recipients);
      } else if (user && user.email) {
        setEmailRecipients(user.email);
      }
    }
    if (!emailSubject && typeof defaults.subject === 'string' && defaults.subject.trim() !== '') {
      setEmailSubject(defaults.subject);
    }
    setHasInitializedEmailDefaults(true);
  }, [
    isOpen,
    dashboardSettings,
    hasInitializedEmailDefaults,
    emailRecipients,
    emailSubject,
    user,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (mode === 'email') {
      setActiveTab('email');
    } else if (mode === 'account' && activeTab === 'email') {
      setActiveTab('password');
    }
  }, [isOpen, mode, activeTab]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (hasInitializedConsolidateSettings) {
      return;
    }
    const consolidate = (dashboardSettings as any).emailConsolidate || {};
    if (typeof consolidate.tags === 'string') {
      setEmailConsolidateTags(consolidate.tags);
    }
    if (typeof consolidate.enabled === 'boolean') {
      setEmailConsolidateEnabled(consolidate.enabled);
    }
    setHasInitializedConsolidateSettings(true);
  }, [isOpen, dashboardSettings, hasInitializedConsolidateSettings]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!hasInitializedSchedule) {
      return;
    }
    setDashboardSettings(prev => ({
      ...prev,
      emailSchedule: {
        frequency: scheduleFrequency,
        dayOfWeek: scheduleFrequency === 'weekly' ? scheduleDayOfWeek : undefined,
        dayOfMonth: scheduleFrequency === 'monthly' ? scheduleDayOfMonth : undefined,
        timeOfDay: scheduleTime,
      },
    }));
  }, [
    scheduleFrequency,
    scheduleDayOfWeek,
    scheduleDayOfMonth,
    scheduleTime,
    isOpen,
    hasInitializedSchedule,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!hasInitializedEmailDefaults) {
      return;
    }
    setDashboardSettings(prev => ({
      ...prev,
      emailDefaults: {
        ...((prev as any).emailDefaults || {}),
        recipients: emailRecipients,
        subject: emailSubject,
      },
    }));
  }, [emailRecipients, emailSubject, isOpen, hasInitializedEmailDefaults, setDashboardSettings]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!hasInitializedConsolidateSettings) {
      return;
    }
    setDashboardSettings(prev => ({
      ...prev,
      emailConsolidate: {
        ...((prev as any).emailConsolidate || {}),
        enabled: emailConsolidateEnabled,
        tags: emailConsolidateTags,
      },
    }));
  }, [
    emailConsolidateEnabled,
    emailConsolidateTags,
    isOpen,
    hasInitializedConsolidateSettings,
    setDashboardSettings,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!emailBody) {
      if (dashboardSettings.latestSummaryForEmail) {
        setEmailBody(dashboardSettings.latestSummaryForEmail);
        if (dashboardSettings.latestSummaryHtmlForEmail) {
          setEmailBodyHtml(dashboardSettings.latestSummaryHtmlForEmail);
        } else {
          setEmailBodyHtml(null);
        }
      }
    }
  }, [isOpen, dashboardSettings.latestSummaryForEmail, emailBody]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!emailSubject) {
      setEmailSubject('Monthly A3 / Bowler Summary');
    }
  }, [isOpen, emailSubject]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (mode !== 'email') {
      return;
    }
    if (emailTab !== 'active') {
      return;
    }
    if (!user || !user.username) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoadingSchedules(true);
      try {
        const response = await dataService.listScheduledEmails(user.username as string);
        if (cancelled) {
          return;
        }
        const jobs = Array.isArray((response as any).jobs) ? (response as any).jobs : [];
        jobs.sort((a: ActiveScheduleItem, b: ActiveScheduleItem) => {
          if (a.sendAt === b.sendAt) {
            return a.id.localeCompare(b.id);
          }
          return a.sendAt - b.sendAt;
        });
        setActiveSchedules(jobs);
      } catch (error: any) {
        if (!cancelled) {
          toast.error(error.message || 'Failed to load active schedules');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSchedules(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, emailTab, user, toast]);

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
      if (user?.username) {
        dataService.appendAuditLog({
          id: generateShortId(),
          type: 'password_changed',
          username: user.username,
          timestamp: new Date().toISOString(),
          summary: 'User changed password',
          details: {
            target: user.username,
          },
        }).catch(error => {
          console.error('Failed to persist password change audit log', error);
        });
      }
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
      if (user?.username) {
        dataService.appendAuditLog({
          id: generateShortId(),
          type: 'profile_updated',
          username: user.username,
          timestamp: new Date().toISOString(),
          summary: 'Updated own profile',
          details: {
            target: user.username,
            role,
            country,
            plant,
            team,
            isPublic,
          },
        }).catch(error => {
          console.error('Failed to persist profile update audit log', error);
        });
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

  const handleCancelScheduleItem = async (item: ActiveScheduleItem) => {
    if (!user || !user.username) {
      toast.error('You must be logged in to cancel scheduled emails');
      return;
    }

    setIsCancellingScheduleId(item.id);
    try {
      await dataService.cancelScheduledEmail(user.username as string, item.id);

      if (item.mode === 'autoSummary') {
        const updatedSettings = {
          ...dashboardSettings,
        };
        if ('emailSchedule' in updatedSettings) {
          delete (updatedSettings as any).emailSchedule;
        }
        setDashboardSettings(updatedSettings);
        const settingsForPersist = {
          ...updatedSettings,
          emailDefaults: {
            ...(((updatedSettings as any).emailDefaults as any) || {}),
            recipients: emailRecipients,
            subject: emailSubject,
          },
          emailConsolidate: {
            ...(((updatedSettings as any).emailConsolidate as any) || {}),
            enabled: emailConsolidateEnabled,
            tags: emailConsolidateTags,
          },
        };
        await persistDashboardSettingsToBackend(settingsForPersist);
        toast.success('Auto summary schedule cancelled');
      } else {
        toast.success('Scheduled email cancelled');
      }

      const response = await dataService.listScheduledEmails(user.username as string);
      const jobs = Array.isArray((response as any).jobs) ? (response as any).jobs : [];
      jobs.sort((a: ActiveScheduleItem, b: ActiveScheduleItem) => {
        if (a.sendAt === b.sendAt) {
          return a.id.localeCompare(b.id);
        }
        return a.sendAt - b.sendAt;
      });
      setActiveSchedules(jobs);
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel scheduled email');
    } finally {
      setIsCancellingScheduleId(null);
    }
  };

  const buildEmailDashboardSettingsForPersist = () => {
    const base = dashboardSettings as any;
    return {
      ...base,
      emailDefaults: {
        ...(base.emailDefaults || {}),
        recipients: emailRecipients,
        subject: emailSubject,
      },
      emailConsolidate: {
        ...(base.emailConsolidate || {}),
        enabled: emailConsolidateEnabled,
        tags: emailConsolidateTags,
      },
      emailSchedule: {
        frequency: scheduleFrequency,
        dayOfWeek: scheduleFrequency === 'weekly' ? scheduleDayOfWeek : undefined,
        dayOfMonth: scheduleFrequency === 'monthly' ? scheduleDayOfMonth : undefined,
        timeOfDay: scheduleTime,
      },
    };
  };

  const persistDashboardSettingsToBackend = async (settings: any) => {
    if (!user || !user.username) {
      return;
    }
    try {
      await dataService.saveData(
        bowlers,
        a3Cases,
        user.username,
        dashboardMarkdown,
        dashboardTitle,
        dashboardMindmaps,
        activeMindmapId,
        settings,
      );
    } catch (error: any) {
      console.error('Failed to persist email settings to backend', error);
    }
  };

  const buildEmailSummaryForRows = (raw: string, rows: GroupPerformanceRow[]) => {
    try {
      const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean) as {
        executiveSummary?: string;
        a3Summary?: string;
        areasOfConcern?: {
          metricName: string;
          groupName: string;
          issue: string;
          suggestion: string;
        }[];
      };

      if (!parsed || !parsed.executiveSummary) {
        return raw;
      }

      let text = `Executive Overview:\n${parsed.executiveSummary}\n\n`;

      if (parsed.a3Summary && parsed.a3Summary.trim() !== '') {
        text += `A3 Problem Solving Summary:\n${parsed.a3Summary}\n\n`;
      }

      if (rows.length > 0) {
        text += 'Portfolio Statistical Table:\n';
        text +=
          'Group | Metric | Latest month | Last 2 months | Last 3 months | Linked A3s | Overall target achieving %\n';
        text +=
          '----- | ------ | ------------ | ------------- | ------------- | ---------- | --------------------------\n';

        rows.forEach(row => {
          const latestText =
            row.latestMet === null || !row.latestActual
              ? '—'
              : row.latestActual;

          const last2Text = row.fail2 ? 'Failing' : '—';
          const last3Text = row.fail3 ? 'Failing' : '—';

          const atRisk = row.fail2 || row.fail3;
          const linkedText = atRisk ? (row.linkedA3Count === 0 ? '0' : String(row.linkedA3Count)) : '—';

          const achievementText =
            row.achievementRate != null ? `${row.achievementRate.toFixed(0)}%` : '—';

          text += `${row.groupName} | ${row.metricName} | ${latestText} | ${last2Text} | ${last3Text} | ${linkedText} | ${achievementText}\n`;
        });

        text += '\n';
      }

      if (Array.isArray(parsed.areasOfConcern) && parsed.areasOfConcern.length > 0) {
        text += 'Areas of Concern & Recommendations:\n';
        parsed.areasOfConcern.forEach(area => {
          text += `- ${area.metricName} (${area.groupName}): ${area.issue}\n  Suggestion: ${area.suggestion}\n`;
        });
      }

      return text;
    } catch {
      return raw;
    }
  };

  const buildSimpleHtmlFromText = (text: string) => {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const withBreaks = escaped.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br />');

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>A3 Summary Email</title>
</head>
<body>
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6;">
    ${withBreaks}
  </div>
</body>
</html>`;
  };

  const buildEmailHtmlForRows = (raw: string, rows: GroupPerformanceRow[]) => {
    try {
      const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean) as {
        executiveSummary?: string;
        a3Summary?: string;
        areasOfConcern?: {
          metricName: string;
          groupName: string;
          issue: string;
          suggestion: string;
        }[];
      };

      if (!parsed || !parsed.executiveSummary || !Array.isArray(parsed.areasOfConcern)) {
        return '';
      }

      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

      const executive = escapeHtml(parsed.executiveSummary);
      const a3Summary =
        parsed.a3Summary && parsed.a3Summary.trim() !== ''
          ? `<section class="card card-a3">
  <h2 class="card-title">A3 Problem Solving Summary</h2>
  <p>${escapeHtml(parsed.a3Summary)}</p>
</section>`
          : '';

      const statsTableHtml =
        rows.length > 0
          ? `<section class="card card-stats">
  <h2 class="card-title">Portfolio Statistical Table</h2>
  <div class="table-wrapper">
    <table class="stats-table">
      <thead>
        <tr>
          <th>Group</th>
          <th>Metric</th>
          <th>Latest month</th>
          <th>Last 2 months</th>
          <th>Last 3 months</th>
          <th>Linked A3s</th>
          <th>Overall target achieving %</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            row => `<tr>
          <td>${escapeHtml(row.groupName)}</td>
          <td>${escapeHtml(row.metricName)}</td>
          <td>${
            row.latestMet === null || !row.latestActual
              ? '—'
              : `<span class="status-pill ${
                  row.latestMet === false ? 'status-fail' : 'status-ok'
                }">${escapeHtml(row.latestActual)}</span>`
          }</td>
          <td>${
            row.fail2
              ? '<span class="status-pill status-warn"><span class="status-dot"></span>Failing</span>'
              : '—'
          }</td>
          <td>${
            row.fail3
              ? '<span class="status-pill status-fail"><span class="status-dot"></span>Failing</span>'
              : '—'
          }</td>
          <td>${
            row.fail2 || row.fail3
              ? row.linkedA3Count === 0
                ? '<span class="circle-badge circle-badge-fail">0</span>'
                : `<span class="circle-badge circle-badge-ok">${row.linkedA3Count}</span>`
              : '—'
          }</td>
          <td>${
            row.achievementRate != null
              ? `<span class="status-pill ${
                  row.achievementRate < (2 / 3) * 100
                    ? 'status-fail'
                    : 'status-ok'
                }">${row.achievementRate.toFixed(0)}%</span>`
              : '—'
          }</td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </div>
</section>`
          : '';

      const concernsHtml =
        parsed.areasOfConcern.length > 0
          ? parsed.areasOfConcern
              .map(
                area => `<div class="concern-card">
  <div class="concern-header">
    <span class="concern-metric">${escapeHtml(area.metricName)}</span>
    <span class="concern-group">${escapeHtml(area.groupName)}</span>
  </div>
  <p class="concern-issue">${escapeHtml(area.issue)}</p>
  <p class="concern-suggestion">${escapeHtml(area.suggestion)}</p>
</div>`,
              )
              .join('')
          : '<p class="empty-text">No major areas of concern identified. Keep up the good work!</p>';

      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Smart Summary & Insights</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --bg: #f3f4f6;
      --card-bg: #ffffff;
      --primary: #4f46e5;
      --primary-soft: #eef2ff;
      --border-subtle: #e5e7eb;
      --text-main: #111827;
      --text-muted: #6b7280;
      --danger: #b91c1c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: var(--bg);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text-main);
    }
    .summary-root {
      max-width: 1100px;
      margin: 0 auto;
    }
    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-radius: 16px;
      background: linear-gradient(90deg, #eef2ff, #ffffff);
      border: 1px solid #e0e7ff;
      margin-bottom: 20px;
    }
    .summary-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }
    .summary-tag {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 999px;
      background: #ecfdf3;
      color: #166534;
      border: 1px solid #bbf7d0;
      font-size: 11px;
      font-weight: 500;
      margin-top: 4px;
    }
    .summary-tag span {
      margin-left: 4px;
    }
    .card {
      background: var(--card-bg);
      border-radius: 16px;
      border: 1px solid var(--border-subtle);
      padding: 20px 24px;
      margin-bottom: 20px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
    }
    .card-executive {
      background: linear-gradient(135deg, #eef2ff, #ffffff);
      border-color: #e0e7ff;
    }
    .card-a3 {
      background: linear-gradient(135deg, #eff6ff, #ffffff);
      border-color: #bfdbfe;
    }
    .card-title {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary);
    }
    .card p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-muted);
    }
    .card-concerns {
      background: #fef2f2;
      border-color: #fecaca;
    }
    .concern-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #fee2e2;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    .concern-header {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
    }
    .concern-metric {
      font-size: 13px;
      font-weight: 700;
      margin-right: 6px;
      color: #111827;
    }
    .concern-group {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 999px;
      background: #f3f4f6;
      color: #4b5563;
    }
    .concern-issue {
      font-size: 13px;
      color: var(--danger);
      font-weight: 500;
      margin: 0 0 4px 0;
    }
    .concern-suggestion {
      font-size: 13px;
      color: #4b5563;
      margin: 0;
      font-style: italic;
    }
    .empty-text {
      font-size: 13px;
      color: #9ca3af;
      font-style: italic;
    }
    .table-wrapper {
      overflow-x: auto;
      margin-top: 8px;
    }
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .stats-table th,
    .stats-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }
    .stats-table thead th {
      background: #f9fafb;
      font-weight: 600;
      color: #4b5563;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid transparent;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      margin-right: 4px;
      background: currentColor;
    }
    .status-ok {
      background: #ecfdf3;
      color: #166534;
      border-color: #bbf7d0;
    }
    .status-fail {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }
    .status-warn {
      background: #fffbeb;
      color: #92400e;
      border-color: #fed7aa;
    }
    .circle-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .circle-badge-ok {
      background: #ecfdf3;
      color: #166534;
      border-color: #bbf7d0;
    }
    .circle-badge-fail {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }
    @media (max-width: 640px) {
      body { padding: 16px; }
      .summary-header { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <div class="summary-root">
    <header class="summary-header">
      <div>
        <h1 class="summary-title">Smart Summary & Insights</h1>
        <div class="summary-tag">
          <span>Consecutive Failing Metrics Focus</span>
        </div>
      </div>
    </header>

    <section class="card card-executive">
      <h2 class="card-title">Executive Overview</h2>
      <p>${executive}</p>
    </section>

    ${statsTableHtml}

    ${a3Summary}

    <section class="card card-concerns">
      <h2 class="card-title">Areas of Concern & Recommendations</h2>
      ${concernsHtml}
    </section>
  </div>
</body>
</html>`;

      return html;
    } catch {
      return '';
    }
  };

  const handleGenerateSummaryForMessage = async () => {
    setIsAutoGenerating(true);
    try {
      const context = generateAIContext(bowlers, a3Cases);
      const rows = computeGroupPerformanceTableData(bowlers, a3Cases);

      const failingMetricsForAI = rows.filter(row => row.fail2 || row.fail3);

      const statsForPrompt = JSON.stringify(
        failingMetricsForAI.map(row => {
          const linked = a3Cases.filter(c => (c.linkedMetricIds || []).includes(row.metricId));
          const completedCount = linked.filter(
            c => (c.status || '').trim().toLowerCase() === 'completed',
          ).length;
          const activeCount = linked.filter(
            c => (c.status || '').trim().toLowerCase() !== 'completed',
          ).length;

          return {
            groupName: row.groupName,
            metricName: row.metricName,
            metricId: row.metricId,
            latestMet: row.latestMet,
            fail2: row.fail2,
            fail3: row.fail3,
            achievementRate:
              row.achievementRate != null ? Number(row.achievementRate.toFixed(1)) : null,
            linkedA3Total: linked.length,
            linkedA3Completed: completedCount,
            linkedA3Active: activeCount,
          };
        }),
        null,
        2,
      );

      const prompt = `You are generating a one-click portfolio summary focused on improvement opportunities.

Use the pre-computed statistical snapshot below. Do not redo statistical calculations from raw data. Rely on this snapshot instead.

Consecutive failing metrics (derived from the integrated portfolio table):
${statsForPrompt}

Definitions:
- latestMet: null = no data, true = met latest target, false = missed latest target.
- fail2: true if the metric missed its target for the latest 2 consecutive months.
- fail3: true if the metric missed its target for the latest 3 consecutive months.
- achievementRate: percentage of historical data points that met target.
- metricId: unique id of the metric (matches linkedMetricIds in A3 cases from context).
- linkedA3Total: total number of A3 cases linked to this metric.
- linkedA3Completed: number of linked A3s with status "Completed".
- linkedA3Active: number of linked A3s that are not completed.

Tasks:
1) Write "executiveSummary": a concise high-level snapshot of overall portfolio performance across metrics and A3 activity.
2) Write "a3Summary": an overview of the A3 problem-solving portfolio (key themes, progress, coverage, and where A3 work is effective or insufficient).
3) Build "areasOfConcern": each entry must correspond to one metric from the snapshot where fail2 or fail3 is true.
   - For each metric, write a rich, multi-sentence issue description that references consecutive failures, achievementRate, and any linked A3 activity.
   - For each metric, provide a detailed, action-oriented suggestion that can guide real improvement work (diagnosis, countermeasures, and follow-up).

Guidance for areasOfConcern:
- Prioritize metrics with fail3 = true, then fail2 = true.
- Use latestMet and achievementRate to describe severity and risk.
- Use metricId together with the A3 cases in the provided context to identify any A3s linked to each metric.
- When linkedA3Completed > 0, briefly assess whether performance appears to have improved since those A3s were completed and state whether the A3 work seems effective or not.
- When linkedA3Total = 0 or performance is still weak despite completed A3s, explicitly recommend the next A3 step (for example: start a new A3, extend or revise an existing A3, or move to follow-up/standardization).
- Focus on actionable, metric-specific improvement suggestions (avoid generic advice).
- Suggestions should reflect typical quality, process-improvement, and problem-solving practices.
- Each suggestion should describe concrete next actions, such as specific analyses to run, experiments or pilots to try, process changes to test, and how to monitor impact over the next 2–3 months.
- Do not output your own statistical tables or detailed numerical calculations in text; focus on narrative and actions.

Return the response in STRICT JSON format with the following structure:
{
  "executiveSummary": "A concise high-level performance snapshot.",
  "a3Summary": "Narrative summary of A3 cases and portfolio status.",
  "areasOfConcern": [
    {
      "metricName": "Metric Name",
      "groupName": "Group Name",
      "issue": "Why this metric is a concern (e.g., 'Missed target for 3 consecutive months with low overall achievement rate').",
      "suggestion": "Detailed, actionable, metric-specific improvement suggestion based on the pattern and context."
    }
  ]
}

Do not include any markdown formatting (like \`\`\`json). Just the raw JSON object.`;

      const summary = await generateComprehensiveSummary(context, prompt, selectedModel);

      const emailSummary = buildEmailSummaryForRows(summary, rows);
      const richHtml = buildEmailHtmlForRows(summary, rows);
      const finalEmailHtml =
        richHtml && richHtml.trim() !== '' ? richHtml : buildSimpleHtmlFromText(emailSummary);

      setEmailBody(emailSummary);
      setEmailBodyHtml(finalEmailHtml);

      setDashboardSettings({
        ...dashboardSettings,
        latestSummaryForEmail: emailSummary,
        latestSummaryHtmlForEmail: finalEmailHtml,
      });

      toast.success('AI summary generated');
    } catch (error: any) {
      console.error('Generate summary error:', error);
      toast.error(error.message || 'Failed to generate summary');
    } finally {
      setIsAutoGenerating(false);
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

    if (emailMode === 'oneTime' && !emailBody.trim()) {
      toast.error('Please enter an email body or generate a summary');
      return;
    }

    if (emailMode === 'scheduled' && !user?.username) {
      toast.error('You must be logged in to schedule recurring summary emails');
      return;
    }

    setIsScheduling(true);
    try {
      const userId = user?.username || undefined;

      if (emailMode === 'scheduled') {
        await dataService.scheduleEmail({
          userId,
          recipients,
          subject: emailSubject.trim(),
          body: '',
          sendAt: sendAtDate.toISOString(),
          mode: 'autoSummary',
          aiModel: dashboardSettings.aiModel,
          fromName: 'A3 Bowler',
        });
      } else {
        const htmlForSend =
          emailBodyHtml && emailBodyHtml.trim() !== ''
            ? emailBodyHtml
            : buildSimpleHtmlFromText(emailBody.trim());
        await dataService.scheduleEmail({
          userId,
          recipients,
          subject: emailSubject.trim(),
          body: emailBody.trim(),
          bodyHtml: htmlForSend,
          sendAt: sendAtDate.toISOString(),
          fromName: 'A3 Bowler',
        });
      }
      const settingsForPersist = buildEmailDashboardSettingsForPersist();
      await persistDashboardSettingsToBackend(settingsForPersist);
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
      const htmlForSend =
        emailBodyHtml && emailBodyHtml.trim() !== ''
          ? emailBodyHtml
          : buildSimpleHtmlFromText(emailBody.trim());
      await dataService.sendEmailNow({
        userId,
        recipients,
          subject: emailSubject.trim(),
          body: emailBody.trim(),
          bodyHtml: htmlForSend,
          fromName: 'A3 Bowler',
        });
      const settingsForPersist = buildEmailDashboardSettingsForPersist();
      await persistDashboardSettingsToBackend(settingsForPersist);
      toast.success('Email sent successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email');
    } finally {
      setIsSendingNow(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div
        className={
          mode === 'email'
            ? 'flex min-h-screen items-stretch justify-center pt-4 px-4 pb-4 text-center sm:block sm:p-0'
            : 'flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'
        }
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div
          className={
            mode === 'email'
              ? 'inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-h-[calc(100vh-2rem)] max-w-5xl sm:align-middle overflow-y-auto'
              : 'inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'
          }
        >
          
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              {mode === 'email' ? 'Email Settings' : 'Account Settings'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          {mode !== 'email' && (
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${
                  activeTab === 'password'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('password')}
              >
                <Lock className="w-4 h-4" />
                <span>Password</span>
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <CreditCard className="w-4 h-4" />
                <span>Profile</span>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-6">
            {mode !== 'email' && user && (
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
            )}

            {mode === 'account' && activeTab === 'password' && (
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

            {mode === 'account' && activeTab === 'profile' && (
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

            {mode === 'email' && (
              <div className="space-y-4">
                <div className="flex border-b border-gray-200">
                  <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-medium text-center ${
                      emailTab === 'schedule'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setEmailTab('schedule')}
                  >
                    Schedule
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-medium text-center ${
                      emailTab === 'active'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setEmailTab('active')}
                  >
                    Active schedules
                  </button>
                </div>

                {emailTab === 'schedule' && (
                  <>
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
                        placeholder="Monthly A3 / metric summary"
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                      />
                    </div>
                    <div className="mt-4 border rounded-md">
                      <div className="flex flex-wrap text-xs font-medium border-b">
                        <button
                          type="button"
                          className={`flex-1 px-3 py-2 text-center flex items-center justify-center space-x-2 ${
                            emailMode === 'scheduled'
                              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                          onClick={() => setEmailMode('scheduled')}
                        >
                          <Repeat className="w-4 h-4" />
                          <span>Scheduled (repeat)</span>
                        </button>
                        <button
                          type="button"
                          className={`flex-1 px-3 py-2 text-center flex items-center justify-center space-x-2 ${
                            emailMode === 'oneTime'
                              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                          onClick={() => setEmailMode('oneTime')}
                        >
                          <Clock3 className="w-4 h-4" />
                          <span>One-time</span>
                        </button>
                      </div>
                      <div className="p-3 space-y-3">
                        {emailMode === 'scheduled' && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Time</label>
                                <input
                                  type="time"
                                  value={scheduleTime}
                                  onChange={(e) => setScheduleTime(e.target.value)}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                />
                              </div>
                            </div>
                            <div className="mt-4 border-t border-gray-100 pt-3 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-xs font-medium text-gray-700 uppercase mb-1">Consolidate before summary</h4>
                                  <p className="text-xs text-gray-500">
                                    When enabled, consolidate tagged bowlers and A3 cases before generating the summary email.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className={`${emailConsolidateEnabled ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                  role="switch"
                                  aria-checked={emailConsolidateEnabled}
                                  onClick={() => setEmailConsolidateEnabled(!emailConsolidateEnabled)}
                                >
                                  <span className={`${emailConsolidateEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}></span>
                                </button>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Consolidate tags</label>
                                <input
                                  type="text"
                                  value={emailConsolidateTags}
                                  onChange={e => setEmailConsolidateTags(e.target.value)}
                                  placeholder="e.g. Technical, Q1, Portfolio"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                />
                                <p className="mt-1 text-xs text-gray-400">
                                  Tags are matched during consolidation before each scheduled summary email.
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                        {emailMode === 'oneTime' && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Send At</label>
                              <input
                                type="datetime-local"
                                value={emailSendAt}
                                onChange={(e) => setEmailSendAt(e.target.value)}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Message</label>
                                <button
                                  type="button"
                                  className="text-xs px-2 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                  onClick={handleGenerateSummaryForMessage}
                                  disabled={isAutoGenerating || isScheduling || isSendingNow}
                                >
                                  {isAutoGenerating ? 'Generating…' : 'Generate summary'}
                                </button>
                              </div>
                              <textarea
                                value={emailBody}
                                onChange={(e) => {
                                  setEmailBody(e.target.value);
                                  setEmailBodyHtml(null);
                                }}
                                rows={4}
                                placeholder="Add the summary or message you want to email."
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {emailTab === 'active' && (
                  <div className="space-y-3">
                    {isLoadingSchedules && (
                      <p className="text-sm text-gray-500">Loading active schedules...</p>
                    )}
                    {!isLoadingSchedules && activeSchedules.length === 0 && (
                      <p className="text-sm text-gray-500">No active scheduled emails.</p>
                    )}
                    {!isLoadingSchedules && activeSchedules.length > 0 && (
                      <div className="space-y-2">
                        {activeSchedules.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.subject}</p>
                              <p className="text-xs text-gray-500">
                                {item.mode === 'autoSummary' ? 'Auto summary (recurring)' : 'One-time'} · Next run:{' '}
                                {new Date(item.sendAt).toLocaleString()}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-full p-2 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                              onClick={() => handleCancelScheduleItem(item)}
                              disabled={isCancellingScheduleId === item.id}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {mode === 'account' && activeTab === 'password' && (
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleUpdatePassword}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            )}

            {mode === 'account' && activeTab === 'profile' && (
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleUpdateProfile}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Profile'}
              </button>
            )}

            {mode === 'email' && emailTab === 'schedule' && (
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
