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

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

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
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
    setStats(null);
    setUsers([]);
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

      const baseOptions = {
        backgroundColor: 'transparent',
        legend: { textStyle: { color: '#cbb994' }, position: 'bottom' as const },
        titleTextStyle: { color: '#F7F1E3' },
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
          hAxis: { textStyle: { color: '#cbb994' } },
          vAxis: { textStyle: { color: '#cbb994' }, gridlines: { color: '#3a352f' }, minValue: 0 }
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
          hAxis: { textStyle: { color: '#cbb994' }, gridlines: { color: '#3a352f' }, minValue: 0 },
          vAxis: { textStyle: { color: '#cbb994' } }
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stats, authed]);

  if (authed === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-panel">
        <p className="text-slate-400">Loading...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-panel">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-3xl border border-amber/20 bg-black/70 p-8 shadow-2xl shadow-black/40">
          <p className="text-sm uppercase tracking-[0.3em] text-amber">Neogogy</p>
          <h1 className="mt-3 font-serif text-2xl text-white">Admin sign in</h1>
          <p className="mt-2 text-sm text-slate-400">Enter your username and password to continue.</p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            className="mt-6 w-full rounded-2xl border border-slate-700 bg-[#141210] px-4 py-3 text-white outline-none focus:border-amber"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="mt-3 w-full rounded-2xl border border-slate-700 bg-[#141210] px-4 py-3 text-white outline-none focus:border-amber"
          />
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          <button type="submit" className="mt-5 w-full rounded-full bg-amber px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#c68e1a]">
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

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-panel">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber">The Neogogy Formation Compass</p>
            <h1 className="mt-2 font-serif text-3xl text-white">Analytics dashboard</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchStats} disabled={loading} className="rounded-full border border-amber px-5 py-2 text-sm font-semibold text-amber transition hover:bg-amber hover:text-black disabled:opacity-60">
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button onClick={handleLogout} className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-300 transition hover:border-amber">
              Sign out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map((c) => (
            <div key={c.label} className="rounded-3xl border border-amber/20 bg-black/50 p-5">
              <p className="text-3xl font-semibold text-white">{c.value}</p>
              <p className="mt-1 text-xs text-slate-400">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-amber/20 bg-black/50 p-6">
          <h2 className="font-serif text-xl text-white">Conversion funnel</h2>
          <div ref={funnelRef} className="mt-4 h-72 w-full" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber/20 bg-black/50 p-6">
            <h2 className="font-serif text-xl text-white">By role</h2>
            <div ref={roleRef} className="mt-4 h-72 w-full" />
          </div>
          <div className="rounded-3xl border border-amber/20 bg-black/50 p-6">
            <h2 className="font-serif text-xl text-white">By persona</h2>
            <div ref={zoneRef} className="mt-4 h-72 w-full" />
          </div>
        </div>

        <div className="rounded-3xl border border-amber/20 bg-black/50 p-6">
          <h2 className="font-serif text-xl text-white">All events</h2>
          <div ref={eventRef} className="mt-4 h-80 w-full" />
        </div>

        {/* User management */}
        <div className="rounded-3xl border border-amber/20 bg-black/50 p-6">
          <h2 className="font-serif text-xl text-white">Admin users</h2>
          <p className="mt-2 text-sm text-slate-400">Add, update passwords, or remove people who can sign in here.</p>

          <div className="mt-5 space-y-3">
            {users.map((u) => (
              <div key={u.username} className="rounded-2xl border border-slate-700 bg-[#141210] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{u.username}</p>
                    <p className="text-xs text-slate-500">updated {new Date(u.updatedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setEditing(editing === u.username ? null : u.username); setEditPass(''); }}
                      className="rounded-full border border-amber px-4 py-2 text-xs font-semibold text-amber transition hover:bg-amber hover:text-black"
                    >
                      {editing === u.username ? 'Cancel' : 'Change password'}
                    </button>
                    <button
                      onClick={() => removeUser(u.username)}
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300 transition hover:border-red hover:text-red"
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
                      className="w-full rounded-2xl border border-slate-700 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-amber"
                    />
                    <button
                      onClick={() => savePassword(u.username)}
                      className="rounded-full bg-amber px-5 py-2 text-xs font-semibold text-black transition hover:bg-[#c68e1a] sm:w-auto"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-slate-500">No users yet.</p>}
          </div>

          <form onSubmit={addUser} className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row">
            <input
              type="email"
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              placeholder="New user email"
              className="w-full rounded-2xl border border-slate-700 bg-[#141210] px-4 py-3 text-sm text-white outline-none focus:border-amber"
            />
            <input
              type="text"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Password (min 6 chars)"
              className="w-full rounded-2xl border border-slate-700 bg-[#141210] px-4 py-3 text-sm text-white outline-none focus:border-amber"
            />
            <button type="submit" className="rounded-full bg-amber px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#c68e1a] sm:w-auto">
              Add user
            </button>
          </form>
          {userMsg && <p className="mt-3 text-sm text-amber">{userMsg}</p>}
        </div>

        <p className="pb-6 text-center text-xs text-slate-500">Self-hosted analytics. Data lives in DynamoDB; nothing is shared with third parties.</p>
      </div>
    </main>
  );
}
