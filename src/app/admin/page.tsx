'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Stats = {
  totalEvents: number;
  byEvent: Record<string, number>;
  byRole: Record<string, number>;
  byZone: Record<string, number>;
  starts: number;
  completions: number;
  emailSubmits: number;
  completionRate: number;
  emailConversionRate: number;
};

const PERSONA_COLORS: Record<string, string> = {
  guide: '#2F6F62',
  anchor: '#85714E',
  sprinter: '#9E1D20',
  wanderer: '#7a6b5c'
};

const PERSONA_LABEL: Record<string, string> = {
  guide: 'The Guide',
  anchor: 'The Anchor',
  sprinter: 'The Sprinter',
  wanderer: 'The Wanderer'
};

const ROLE_LABEL: Record<string, string> = {
  student: 'Student',
  educator: 'Educator',
  parent: 'Parent',
  leader: 'Leader',
  curious: 'Curious'
};

declare global {
  interface Window {
    google?: any;
  }
}

let googleChartsPromise: Promise<void> | null = null;

const loadGoogleCharts = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (googleChartsPromise) return googleChartsPromise;
  googleChartsPromise = new Promise<void>((resolve) => {
    const start = () =>
      window.google.charts.load('current', { packages: ['corechart', 'bar'] }) &&
      window.google.charts.setOnLoadCallback(() => resolve());
    if (window.google && window.google.charts) {
      start();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = start;
    document.head.appendChild(script);
  });
  return googleChartsPromise;
};

type AdminUserRow = { username: string; createdAt: string; updatedAt: string };
type AdminTheme = 'light' | 'dark';

type LeadRow = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  mobilePhone?: string;
  heardFrom?: string;
  role: string;
  modality: string;
  consent: boolean;
  persona: string;
  personaName: string;
  resilience: number;
  readiness: number;
  overall: number;
  dimensions?: Record<string, number>;
  answers?: Record<string, number>;
  baseline?: { b1: number; b2: number } | null;
  usageVal?: number | null;
  createdAt: string;
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date);
};

function SunIcon() {
  return (
    <svg className="admin-theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.75v2.1M12 19.15v2.1M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2.75 12h2.1M19.15 12h2.1M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="admin-theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.4 14.7A7.35 7.35 0 0 1 9.3 3.6a8.75 8.75 0 1 0 11.1 11.1Z" />
    </svg>
  );
}

function ThemeToggleButton({ theme, onClick }: { theme: AdminTheme; onClick: () => void }) {
  const label = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="admin-theme-toggle admin-button admin-button-muted"
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

function LeadDetailPanel({ lead, onClose }: { lead: LeadRow; onClose: () => void }) {
  const pdfUrl = `/api/admin/leads/report?id=${encodeURIComponent(lead.id)}`;

  return (
    <div className="admin-modal-backdrop fixed inset-0 z-50 p-2 backdrop-blur-sm sm:p-5">
      <div className="admin-modal mx-auto flex h-full max-w-6xl flex-col overflow-hidden">
        <div className="admin-modal-head flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="admin-eyebrow">Participant PDF report</p>
            <h2 className="admin-modal-title mt-1 font-serif text-2xl">{lead.name || 'Unnamed taker'}</h2>
            <p className="admin-muted mt-1 break-all text-xs">
              {lead.email} / {formatDateTime(lead.createdAt)}
            </p>
            <p className="admin-muted-soft mt-1 text-xs">
              Mobile: {lead.mobilePhone || 'Not provided'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-button admin-button-outline rounded-full px-4 py-2 text-xs font-semibold transition"
            >
              Open PDF
            </a>
            <button onClick={onClose} className="admin-button admin-button-muted rounded-full px-4 py-2 text-xs transition">
              Close
            </button>
          </div>
        </div>
        <iframe
          title={`${lead.name || 'Participant'} PDF report`}
          src={pdfUrl}
          className="min-h-0 flex-1 bg-[#2b2724]"
        />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<AdminTheme>('light');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadQuery, setLeadQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  // User management
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [userMsg, setUserMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editPass, setEditPass] = useState('');

  const funnelRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const eventRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('neogogyAdminTheme');
    if (stored === 'dark' || stored === 'light') setTheme(stored);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      window.localStorage.setItem('neogogyAdminTheme', next);
      return next;
    });
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    setLeadError(null);
    try {
      const res = await fetch('/api/admin/leads', { credentials: 'include' });
      if (res.status === 401) {
        setAuthed(false);
        setLeads([]);
        return;
      }
      if (!res.ok) throw new Error('Could not load exam takers.');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch {
      setLeadError('Could not load exam takers.');
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats', { credentials: 'include' });
      if (res.status === 401) {
        setAuthed(false);
        setStats(null);
        return;
      }
      const data = (await res.json()) as Stats;
      setStats(data);
      setAuthed(true);
    } catch {
      setError('Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (authed) fetchUsers();
  }, [authed, fetchUsers]);

  useEffect(() => {
    if (authed) fetchLeads();
  }, [authed, fetchLeads]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      setPassword('');
      setUsername('');
      await fetchStats();
      await fetchUsers();
      await fetchLeads();
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
    setStats(null);
    setUsers([]);
    setLeads([]);
    setSelectedLead(null);
    setSelectedLeadIds([]);
  };

  const refreshDashboard = async () => {
    await Promise.all([fetchStats(), fetchLeads()]);
  };

  const downloadCsv = () => {
    window.location.href = '/api/admin/leads?format=csv';
  };

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.concat(id)
    );
  };

  const downloadSelectedPdfs = async () => {
    if (!selectedLeadIds.length) return;
    setBulkDownloading(true);
    setLeadError(null);
    try {
      const res = await fetch('/api/admin/leads/bulk-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedLeadIds })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Could not download selected PDFs.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neogogy-selected-pdf-reports-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : 'Could not download selected PDFs.');
    } finally {
      setBulkDownloading(false);
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg(null);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: newUser, password: newPass })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNewUser('');
      setNewPass('');
      setUserMsg('User added.');
      await fetchUsers();
    } else {
      setUserMsg(data.error || 'Could not add user.');
    }
  };

  const savePassword = async (uname: string) => {
    setUserMsg(null);
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: uname, password: editPass })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setEditing(null);
      setEditPass('');
      setUserMsg(`Password updated for ${uname}.`);
      await fetchUsers();
    } else {
      setUserMsg(data.error || 'Could not update password.');
    }
  };

  const removeUser = async (uname: string) => {
    setUserMsg(null);
    const res = await fetch(`/api/admin/users?username=${encodeURIComponent(uname)}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setUserMsg(`Removed ${uname}.`);
      await fetchUsers();
    } else {
      setUserMsg(data.error || 'Could not remove user.');
    }
  };

  // Draw charts whenever stats change.
  useEffect(() => {
    if (!stats || !authed) return;
    let cancelled = false;
    loadGoogleCharts().then(() => {
      if (cancelled || !window.google) return;
      const g = window.google.visualization;

      const chartText = theme === 'dark' ? '#cbb994' : '#6A5E54';
      const chartTitle = theme === 'dark' ? '#F7F1E3' : '#26201C';
      const chartGrid = theme === 'dark' ? '#3a352f' : '#E2D4BF';
      const baseOptions = {
        backgroundColor: 'transparent',
        legend: { textStyle: { color: chartText }, position: 'bottom' as const },
        titleTextStyle: { color: chartTitle },
        chartArea: { width: '86%', height: '74%' },
        tooltip: { textStyle: { color: '#141210' } }
      };

      // Funnel (column chart)
      if (funnelRef.current) {
        const data = g.arrayToDataTable([
          ['Stage', 'Count', { role: 'style' }],
          ['Started', stats.starts, '#D69A2D'],
          ['Completed', stats.completions, '#D9A521'],
          ['Submitted email', stats.emailSubmits, '#2E7D4F']
        ]);
        new g.ColumnChart(funnelRef.current).draw(data, {
          ...baseOptions,
          legend: { position: 'none' },
          hAxis: { textStyle: { color: chartText } },
          vAxis: { textStyle: { color: chartText }, gridlines: { color: chartGrid }, minValue: 0 }
        });
      }

      // Role distribution (pie)
      if (roleRef.current) {
        const rows = Object.entries(stats.byRole).map(([k, v]) => [ROLE_LABEL[k] || k, v]);
        const data = g.arrayToDataTable([['Role', 'Count'], ...(rows.length ? rows : [['No data', 1]])]);
        new g.PieChart(roleRef.current).draw(data, {
          ...baseOptions,
          colors: ['#D69A2D', '#2E7D4F', '#D9711F', '#7c93b8', '#9a6cc0'],
          pieHole: 0.4
        });
      }

      // Persona distribution (pie with persona colors)
      if (zoneRef.current) {
        const order = ['guide', 'anchor', 'sprinter', 'wanderer'];
        const present = order.filter((z) => stats.byZone[z]);
        const rows = present.map((z) => [PERSONA_LABEL[z] || z, stats.byZone[z]]);
        const data = g.arrayToDataTable([['Persona', 'Count'], ...(rows.length ? rows : [['No data', 1]])]);
        new g.PieChart(zoneRef.current).draw(data, {
          ...baseOptions,
          colors: present.length ? present.map((z) => PERSONA_COLORS[z]) : ['#3a352f'],
          pieHole: 0.4
        });
      }

      // All events (bar chart)
      if (eventRef.current) {
        const rows = Object.entries(stats.byEvent).map(([k, v]) => [k.replace(/_/g, ' '), v]);
        const data = g.arrayToDataTable([['Event', 'Count'], ...(rows.length ? rows : [['No data', 0]])]);
        new g.BarChart(eventRef.current).draw(data, {
          ...baseOptions,
          legend: { position: 'none' },
          colors: ['#D69A2D'],
          hAxis: { textStyle: { color: chartText }, gridlines: { color: chartGrid }, minValue: 0 },
          vAxis: { textStyle: { color: chartText } }
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stats, authed, theme]);

  if (authed === null) {
    return (
      <main className="admin-shell flex min-h-screen items-center justify-center" data-theme={theme}>
        <p className="admin-muted">Loading...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="admin-shell flex min-h-screen items-center justify-center px-4" data-theme={theme}>
        <form onSubmit={handleLogin} className="admin-card w-full max-w-sm rounded-3xl p-8 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="admin-eyebrow text-sm uppercase tracking-[0.3em]">Neogogy</p>
              <h1 className="admin-title mt-3 font-serif text-2xl">Admin sign in</h1>
            </div>
            <ThemeToggleButton theme={theme} onClick={toggleTheme} />
          </div>
          <p className="admin-muted mt-2 text-sm">Enter your username and password to continue.</p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            className="admin-input mt-6 w-full rounded-2xl px-4 py-3 outline-none"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="admin-input mt-3 w-full rounded-2xl px-4 py-3 outline-none"
          />
          {error ? <p className="admin-error mt-3 text-sm">{error}</p> : null}
          <button type="submit" className="admin-button admin-button-primary mt-5 w-full rounded-full px-6 py-3 text-sm font-semibold transition">
            Sign in
          </button>
        </form>
      </main>
    );
  }

  const cards = stats
    ? [
        { label: 'Assessments started', value: stats.starts },
        { label: 'Completed', value: stats.completions },
        { label: 'Completion rate', value: `${stats.completionRate}%` },
        { label: 'Emails captured', value: stats.emailSubmits },
        { label: 'Email conversion', value: `${stats.emailConversionRate}%` },
        { label: 'Total events', value: stats.totalEvents }
      ]
    : [];

  const filteredLeads = leads.filter((lead) => {
    const query = leadQuery.trim().toLowerCase();
    if (!query) return true;
    return [lead.name, lead.email, lead.mobilePhone, lead.role, lead.modality, lead.personaName, lead.heardFrom]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const visibleLeadIds = filteredLeads.map((lead) => lead.id);
  const selectedVisibleCount = visibleLeadIds.filter((id) => selectedLeadIds.includes(id)).length;
  const allVisibleSelected = visibleLeadIds.length > 0 && selectedVisibleCount === visibleLeadIds.length;
  const selectVisibleLeads = () => {
    setSelectedLeadIds((current) => Array.from(new Set(current.concat(visibleLeadIds))));
  };
  const unselectVisibleLeads = () => {
    setSelectedLeadIds((current) => current.filter((id) => !visibleLeadIds.includes(id)));
  };

  return (
    <main className="admin-shell min-h-screen px-4 py-6 sm:px-6 lg:px-8" data-theme={theme}>
      {selectedLead ? <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} /> : null}
      <div className="admin-dashboard-wrap mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="admin-eyebrow text-sm uppercase tracking-[0.3em]">The Neogogy Formation Compass</p>
            <h1 className="admin-title mt-2 font-serif text-3xl">Analytics dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <ThemeToggleButton theme={theme} onClick={toggleTheme} />
            <button onClick={refreshDashboard} disabled={loading || leadsLoading} className="admin-button admin-button-outline rounded-full px-5 py-2 text-sm font-semibold transition disabled:opacity-60">
              {loading || leadsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button onClick={handleLogout} className="admin-button admin-button-muted rounded-full px-5 py-2 text-sm transition">
              Sign out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map((c) => (
            <div key={c.label} className="admin-card rounded-3xl p-5">
              <p className="admin-stat-value text-3xl font-semibold">{c.value}</p>
              <p className="admin-muted mt-1 text-xs">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="admin-card rounded-2xl p-3 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="admin-eyebrow text-xs uppercase tracking-[0.24em]">Exam takers</p>
              <h2 className="admin-title mt-2 font-serif text-2xl">Submissions and individual results</h2>
              <p className="admin-muted mt-2 max-w-2xl text-sm">
                View who completed the assessment, download the list, and inspect each person&apos;s result.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={leadQuery}
                onChange={(e) => setLeadQuery(e.target.value)}
                placeholder="Search name, email, phone..."
                className="admin-input w-full rounded-xl px-4 py-3 text-sm outline-none sm:w-72"
              />
              <button onClick={downloadCsv} className="admin-button admin-button-primary rounded-full px-5 py-3 text-sm font-semibold transition">
                Download CSV
              </button>
            </div>
          </div>

          <div className="admin-bulkbar mt-5 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="admin-muted text-sm">
              {selectedLeadIds.length} selected
              {filteredLeads.length ? ` / ${filteredLeads.length} visible` : ''}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={allVisibleSelected ? unselectVisibleLeads : selectVisibleLeads}
                disabled={!visibleLeadIds.length}
                className="admin-button admin-button-muted rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-50"
              >
                {allVisibleSelected ? 'Unselect all' : 'Select all'}
              </button>
              <button
                onClick={unselectVisibleLeads}
                disabled={!selectedVisibleCount}
                className="admin-button admin-button-muted rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-50"
              >
                Unselect visible
              </button>
              <button
                onClick={downloadSelectedPdfs}
                disabled={!selectedLeadIds.length || bulkDownloading}
                className="admin-button admin-button-primary rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-50"
              >
                {bulkDownloading ? 'Preparing ZIP...' : 'Bulk download PDFs'}
              </button>
            </div>
          </div>

          {leadError ? <p className="admin-error-box mt-4 rounded-xl px-4 py-3 text-sm">{leadError}</p> : null}

          <div className="admin-table mt-5 rounded-xl">
            <div className="admin-leads-grid admin-table-head hidden px-3 py-3 text-xs uppercase tracking-[0.11em] md:grid">
              <span>Select</span>
              <span>Taker</span>
              <span>Email</span>
              <span>Mobile</span>
              <span>Role</span>
              <span>Persona</span>
              <span>Index</span>
              <span>Submitted</span>
              <span className="text-right">Action</span>
            </div>

            <div className="admin-table-body">
              {leadsLoading ? (
                <div className="admin-muted px-4 py-6 text-sm">Loading exam takers...</div>
              ) : filteredLeads.length ? filteredLeads.map((lead) => (
                <div key={lead.id} className="admin-leads-grid admin-table-row grid gap-3 px-3 py-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.includes(lead.id)}
                      onChange={() => toggleLeadSelection(lead.id)}
                      className="admin-checkbox"
                    />
                    <span className="admin-mobile-label text-xs uppercase tracking-[0.14em] md:hidden">Select</span>
                  </label>
                  <div>
                    <span className="admin-mobile-label text-xs uppercase tracking-[0.14em] md:hidden">Taker</span>
                    <p className="admin-strong font-semibold">{lead.name || 'Unnamed'}</p>
                    <p className="admin-muted-soft mt-1 text-xs md:hidden">{formatDateTime(lead.createdAt)}</p>
                  </div>
                  <div className="min-w-0">
                    <span className="admin-mobile-label text-xs uppercase tracking-[0.14em] md:hidden">Email</span>
                    <p className="admin-muted break-all md:truncate md:break-normal md:whitespace-nowrap">{lead.email}</p>
                  </div>
                  <div className="min-w-0">
                    <span className="admin-mobile-label text-xs uppercase tracking-[0.14em] md:hidden">Mobile</span>
                    <p className="admin-muted break-all md:truncate md:break-normal md:whitespace-nowrap" title={lead.mobilePhone || '-'}>
                      {lead.mobilePhone || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="admin-mobile-label text-xs uppercase tracking-[0.14em] md:hidden">Role</span>
                    <p className="admin-muted md:whitespace-nowrap">{ROLE_LABEL[lead.role] || lead.role || '-'}</p>
                  </div>
                  <div>
                    <span className="admin-mobile-label text-xs uppercase tracking-[0.14em] md:hidden">Persona</span>
                    <p className="admin-strong font-medium md:whitespace-nowrap">{lead.personaName || PERSONA_LABEL[lead.persona] || '-'}</p>
                  </div>
                  <div>
                    <span className="admin-mobile-label text-xs uppercase tracking-[0.14em] md:hidden">Index</span>
                    <p className="admin-accent font-semibold">{lead.overall}</p>
                  </div>
                  <div className="admin-muted admin-submitted-cell hidden md:block" title={lead.createdAt}>
                    {formatDateTime(lead.createdAt)}
                  </div>
                  <div className="flex justify-start md:justify-end">
                    <button onClick={() => setSelectedLead(lead)} className="admin-button admin-button-outline whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition">
                      View result
                    </button>
                  </div>
                </div>
              )) : (
                <div className="admin-muted px-4 py-6 text-sm">
                  {leads.length ? 'No exam takers match your search.' : 'No completed submissions yet.'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="admin-card rounded-3xl p-6">
          <h2 className="admin-title font-serif text-xl">Conversion funnel</h2>
          <div ref={funnelRef} className="mt-4 h-72 w-full" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="admin-card rounded-3xl p-6">
            <h2 className="admin-title font-serif text-xl">By role</h2>
            <div ref={roleRef} className="mt-4 h-72 w-full" />
          </div>
          <div className="admin-card rounded-3xl p-6">
            <h2 className="admin-title font-serif text-xl">By persona</h2>
            <div ref={zoneRef} className="mt-4 h-72 w-full" />
          </div>
        </div>

        <div className="admin-card rounded-3xl p-6">
          <h2 className="admin-title font-serif text-xl">All events</h2>
          <div ref={eventRef} className="mt-4 h-80 w-full" />
        </div>

        {/* User management */}
        <div className="admin-card rounded-3xl p-6">
          <h2 className="admin-title font-serif text-xl">Admin users</h2>
          <p className="admin-muted mt-2 text-sm">Add, update passwords, or remove people who can sign in here.</p>

          <div className="mt-5 space-y-3">
            {users.map((u) => (
              <div key={u.username} className="admin-subcard rounded-2xl p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="admin-strong font-semibold">{u.username}</p>
                    <p className="admin-muted-soft text-xs">updated {new Date(u.updatedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setEditing(editing === u.username ? null : u.username); setEditPass(''); }}
                      className="admin-button admin-button-outline rounded-full px-4 py-2 text-xs font-semibold transition"
                    >
                      {editing === u.username ? 'Cancel' : 'Change password'}
                    </button>
                    <button
                      onClick={() => removeUser(u.username)}
                      className="admin-button admin-button-danger rounded-full px-4 py-2 text-xs transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {editing === u.username && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={editPass}
                      onChange={(e) => setEditPass(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      className="admin-input w-full rounded-2xl px-4 py-2 text-sm outline-none"
                    />
                    <button
                      onClick={() => savePassword(u.username)}
                      className="admin-button admin-button-primary rounded-full px-5 py-2 text-xs font-semibold transition sm:w-auto"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            ))}
            {users.length === 0 && <p className="admin-muted text-sm">No users yet.</p>}
          </div>

          <form onSubmit={addUser} className="admin-form-row mt-6 flex flex-col gap-3 pt-6 sm:flex-row">
            <input
              type="email"
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              placeholder="New user email"
              className="admin-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
            />
            <input
              type="text"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Password (min 6 chars)"
              className="admin-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
            />
            <button type="submit" className="admin-button admin-button-primary rounded-full px-6 py-3 text-sm font-semibold transition sm:w-auto">
              Add user
            </button>
          </form>
          {userMsg && <p className="admin-accent mt-3 text-sm">{userMsg}</p>}
        </div>

        <p className="admin-muted-soft pb-6 text-center text-xs">Self-hosted analytics. Data lives in DynamoDB; nothing is shared with third parties.</p>
      </div>
    </main>
  );
}
