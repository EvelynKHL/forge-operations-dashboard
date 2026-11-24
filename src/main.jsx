import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const initialServices = [
  { id: 'svc-001', name: 'Identity Gateway', team: 'Access & Identity', owner: 'AK', status: 'Healthy', uptime: '99.99%', region: 'Global', updated: '2 min ago', description: 'Authentication and token exchange for internal services.', tier: 'Tier 0', latency: '42 ms' },
  { id: 'svc-002', name: 'Device Provisioning', team: 'Fleet Systems', owner: 'MP', status: 'Degraded', uptime: '98.72%', region: 'US West', updated: '4 min ago', description: 'Enrollment and configuration for managed devices.', tier: 'Tier 1', latency: '840 ms' },
  { id: 'svc-003', name: 'Build Orchestrator', team: 'Developer Tools', owner: 'JL', status: 'Healthy', uptime: '99.95%', region: 'US East', updated: '8 min ago', description: 'Schedules and coordinates continuous integration workloads.', tier: 'Tier 1', latency: '118 ms' },
  { id: 'svc-004', name: 'Asset Registry', team: 'Infrastructure Data', owner: 'SR', status: 'Maintenance', uptime: '99.80%', region: 'EU Central', updated: '12 min ago', description: 'Source of truth for infrastructure assets and relationships.', tier: 'Tier 2', latency: '—' },
  { id: 'svc-005', name: 'Metrics Pipeline', team: 'Observability', owner: 'TN', status: 'Healthy', uptime: '99.97%', region: 'Global', updated: '16 min ago', description: 'Collects and routes operational telemetry across regions.', tier: 'Tier 1', latency: '76 ms' },
  { id: 'svc-006', name: 'Secrets Broker', team: 'Access & Identity', owner: 'DV', status: 'Healthy', uptime: '99.99%', region: 'AP South', updated: '21 min ago', description: 'Issues short-lived credentials to authorized workloads.', tier: 'Tier 0', latency: '35 ms' },
  { id: 'svc-007', name: 'Network Configurator', team: 'Network Platform', owner: 'EC', status: 'Degraded', uptime: '97.61%', region: 'AP South', updated: '27 min ago', description: 'Validates and applies approved network configuration changes.', tier: 'Tier 1', latency: '1.2 s' },
  { id: 'svc-008', name: 'Capacity Planner', team: 'Infrastructure Data', owner: 'RB', status: 'Healthy', uptime: '99.91%', region: 'US East', updated: '31 min ago', description: 'Models demand and recommends infrastructure capacity.', tier: 'Tier 2', latency: '203 ms' },
];

const icon = (name, size=18) => {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></>,
    pulse: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    down: <path d="m7 10 5 5 5-5"/>,
    external: <><path d="M14 3h7v7"/><path d="m10 14 11-11"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/></>,
    refresh: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

function App() {
  const [services, setServices] = useState(initialServices);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All services');
  const [selected, setSelected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('just now');
  const [notice, setNotice] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [apiState, setApiState] = useState('loading');

  useEffect(() => {
    fetch('/api/services')
      .then(response => { if (!response.ok) throw new Error('API unavailable'); return response.json(); })
      .then(data => { setServices(data); setApiState('connected'); })
      .catch(() => setApiState('offline'));
  }, []);

  const visible = useMemo(() => services.filter(service => {
    const matchesQuery = `${service.name} ${service.team} ${service.region}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === 'All services' || service.status === filter);
  }), [services, query, filter]);
  const counts = useMemo(() => services.reduce((result, service) => { result[service.status] = (result[service.status] || 0) + 1; return result; }, {}), [services]);

  const announce = (text) => { setNotice(text); window.setTimeout(() => setNotice(''), 3000); };
  const refresh = async () => {
    setLastUpdated('just now');
    try {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('API unavailable');
      setServices(await response.json()); setApiState('connected'); announce('Service data refreshed');
    } catch { setApiState('offline'); announce('API unavailable. Start the backend to refresh data.'); }
  };
  const addService = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get('name').trim();
    if (!name) return;
    try {
      const response = await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, team: data.get('team').trim(), region: data.get('region') }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not add service');
      setServices(current => [result, ...current]); setShowAdd(false); setQuery(''); setFilter('All services'); announce(`${name} added to services`);
    } catch (error) { announce(error.message || 'API unavailable. Start the backend to add a service.'); }
  };

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Main navigation">
      <a className="brand" href="#overview" aria-label="Forge home"><span className="brand-mark"><span/><span/><span/><span/></span><span>forge<span className="brand-dot">.</span></span></a>
      <div className="workspace-switch"><div className="workspace-icon">E</div><div className="workspace-copy"><span>WORKSPACE</span><strong>Enterprise Systems</strong></div><span className="switch-chevron">{icon('down', 15)}</span></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="nav-list">
        <a className="nav-item active" href="#overview" aria-current="page">{icon('grid')}<span>Overview</span></a>
        <a className="nav-item" href="#services" onClick={e=>{e.preventDefault(); document.getElementById('service-search')?.focus();}}>{icon('layers')}<span>Services</span><span className="nav-count">{services.length}</span></a>
        <a className="nav-item" href="#incidents" onClick={e=>{e.preventDefault(); setFilter('Degraded');}}>{icon('pulse')}<span>Incidents</span><span className="incident-count">2</span></a>
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">?</div><div><strong>Need a hand?</strong><p>Visit the platform guide</p></div>{icon('external', 15)}</div><button className="profile"><span className="avatar">EV</span><span className="profile-copy"><strong>Elena Vasquez</strong><small>Platform engineer</small></span><span className="profile-more">···</span></button></div>
    </aside>

    <main className="main-area" id="overview">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span>{icon('chevron', 14)}<strong>Overview</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notifications" onClick={()=>announce('You’re all caught up')}>{icon('bell')}<i className="notification-dot"/></button><span className="top-divider"/><span className="top-avatar">EV</span></div></header>
      <div className="page-content">
        <section className="page-heading"><div><div className="eyebrow"><span className={`live-dot ${apiState==='offline'?'offline-dot':''}`}/> {apiState==='offline'?'DEMO DATA':apiState==='loading'?'CONNECTING':'LIVE OVERVIEW'} <span className="eyebrow-separator">·</span> <span>UPDATED {lastUpdated.toUpperCase()}</span></div><h1>Good morning, Elena <span className="wave">✳</span></h1><p className="page-subtitle">Here’s what’s happening across your infrastructure today.</p></div><div className="heading-actions"><button className="button button-secondary" onClick={refresh}>{icon('refresh')}<span>Refresh</span></button><button className="button button-primary" onClick={()=>setShowAdd(true)}>{icon('plus')}<span>Add service</span></button></div></section>

        <section className="stat-grid" aria-label="Infrastructure summary">
          <article className="stat-card"><div className="stat-top"><span className="stat-label">TOTAL SERVICES</span><span className="stat-icon blue">{icon('layers', 16)}</span></div><div className="stat-value">{String(services.length).padStart(2,'0')}<span className="stat-context">registered</span></div><div className="stat-bottom"><span className="tiny-bars">▂ ▃ ▄ ▆ ▅ ▇ ▆ ▇</span><span>Across 5 regions</span></div></article>
          <article className="stat-card"><div className="stat-top"><span className="stat-label">HEALTHY</span><span className="stat-icon green"><span className="live-dot"/></span></div><div className="stat-value">{String(counts.Healthy || 0).padStart(2,'0')}<span className="stat-context">services</span></div><div className="stat-bottom"><span className="trend-up">↗ 99.94%</span><span>Average availability</span></div></article>
          <article className="stat-card"><div className="stat-top"><span className="stat-label">NEEDS ATTENTION</span><span className="stat-icon amber">{icon('pulse', 16)}</span></div><div className="stat-value">{String((counts.Degraded || 0) + (counts.Maintenance || 0)).padStart(2,'0')}<span className="stat-context">services</span></div><div className="stat-bottom"><span className="attention-copy"><span className="mini-dot amber-dot"/> {counts.Degraded || 0} degraded</span><span>{counts.Maintenance || 0} in maintenance</span></div></article>
          <article className="stat-card"><div className="stat-top"><span className="stat-label">OPEN INCIDENTS</span><span className="stat-icon red">{icon('bell', 16)}</span></div><div className="stat-value">02<span className="stat-context">active</span></div><div className="stat-bottom"><span className="incident-severity">● 1 high priority</span><span>Last updated 4m ago</span></div></article>
        </section>

        <section className="content-panel" id="services"><div className="panel-heading"><div><div className="section-title-row"><h2>Service health</h2><span className="count-pill">{visible.length}</span></div><p>Monitor status and availability across your services.</p></div><button className="text-button" onClick={()=>announce('You’re viewing all services')}>View reports {icon('arrow', 14)}</button></div>
          <div className="table-toolbar"><label className="search-box" htmlFor="service-search">{icon('search', 17)}<input id="service-search" type="search" placeholder="Search services, teams, regions..." value={query} onChange={e=>setQuery(e.target.value)} /><kbd>⌘ K</kbd></label><label className="filter-select"><span className="sr-only">Filter by status</span><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All services</option><option>Healthy</option><option>Degraded</option><option>Maintenance</option></select>{icon('down', 14)}</label><button className="filter-button" aria-label="Refresh services" onClick={refresh}>{icon('refresh', 16)}</button></div>
          <div className="table-wrap"><table><thead><tr><th scope="col">SERVICE</th><th scope="col">STATUS</th><th scope="col">AVAILABILITY <span className="sort-mark">↓</span></th><th scope="col">REGION</th><th scope="col">OWNER</th><th scope="col">LAST UPDATED</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead><tbody>{visible.map(service=><tr key={service.id} onClick={()=>setSelected(service)} tabIndex="0" onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(service);}}} aria-label={`${service.name}, ${service.status}`}><td><div className="service-cell"><div className={`service-symbol ${service.status==='Degraded'?'symbol-warn':''}`}>{service.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div><div><strong>{service.name}</strong><small>{service.team}</small></div></div></td><td><span className={`status-badge ${service.status.toLowerCase()}`}><i/>{service.status}</span></td><td><span className="uptime-value">{service.uptime}</span></td><td><span className="region-cell"><i className="region-dot"/>{service.region}</span></td><td><div className="owner-cell"><span className="owner-avatar">{service.owner}</span>{service.owner}</div></td><td className="updated-cell">{service.updated}</td><td><button className="row-arrow" aria-label={`View ${service.name} details`} onClick={e=>{e.stopPropagation();setSelected(service);}}>{icon('chevron', 16)}</button></td></tr>)}{visible.length===0&&<tr><td colSpan="7" className="empty-state"><div className="empty-icon">{icon('search',22)}</div><strong>No services found</strong><span>Try a different search or status filter.</span><button onClick={()=>{setQuery('');setFilter('All services');}}>Clear filters</button></td></tr>}</tbody></table></div>
          <div className="table-footer"><span>Showing <strong>{visible.length ? 1 : 0}–{visible.length}</strong> of <strong>{services.length}</strong> services</span><div className="pagination"><button disabled aria-label="Previous page">‹</button><button className="page-current" aria-current="page">1</button><button disabled aria-label="Next page">›</button></div></div>
        </section>

        <footer className="page-footer"><span>© 2026 Forge Infrastructure</span><div><a href="#docs" onClick={e=>{e.preventDefault();announce('Platform guide is coming soon')}}>Documentation</a><a href="#status" onClick={e=>{e.preventDefault();announce('All systems operational')}}>System status <i className="footer-live"/></a><span>v1.8.2</span></div></footer>
      </div>
    </main>

    {selected&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><aside className="details-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><div className="drawer-top"><span className="drawer-eyebrow">SERVICE DETAILS</span><button className="icon-button" aria-label="Close details" onClick={()=>setSelected(null)}>{icon('close')}</button></div><div className="drawer-service-symbol">{selected.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div><h2 id="drawer-title">{selected.name}</h2><p className="drawer-description">{selected.description}</p><span className={`status-badge ${selected.status.toLowerCase()}`}><i/>{selected.status}</span><div className="drawer-metrics"><div><span>AVAILABILITY</span><strong>{selected.uptime}</strong><small>Last 30 days</small></div><div><span>LATENCY</span><strong>{selected.latency}</strong><small>Current average</small></div></div><div className="detail-list"><div><span>Owning team</span><strong>{selected.team}</strong></div><div><span>Service tier</span><strong>{selected.tier}</strong></div><div><span>Primary region</span><strong>{selected.region}</strong></div><div><span>Service ID</span><strong className="mono">{selected.id}</strong></div><div><span>Last updated</span><strong>{selected.updated}</strong></div></div><button className="button button-secondary drawer-action" onClick={()=>announce(`Opening runbook for ${selected.name}`)}>Open runbook {icon('external', 15)}</button></aside></div>}

    {showAdd&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setShowAdd(false);}}><section className="add-modal" role="dialog" aria-modal="true" aria-labelledby="add-title"><div className="modal-heading"><div><span className="drawer-eyebrow">SERVICE CATALOG</span><h2 id="add-title">Add a service</h2><p>Register a service in your workspace.</p></div><button className="icon-button" aria-label="Close form" onClick={()=>setShowAdd(false)}>{icon('close')}</button></div><form onSubmit={addService}><label>Service name<input name="name" required maxLength="60" placeholder="e.g. Event Processor" autoFocus /></label><label>Owning team<input name="team" maxLength="60" placeholder="e.g. Platform Systems" /></label><label>Primary region<select name="region"><option>US West</option><option>US East</option><option>EU Central</option><option>AP South</option><option>Global</option></select></label><div className="form-actions"><button type="button" className="button button-secondary" onClick={()=>setShowAdd(false)}>Cancel</button><button type="submit" className="button button-primary">{icon('plus')} Add service</button></div></form></section></div>}
    <div className="toast" role="status" aria-live="polite" data-visible={!!notice}>{icon('check',16)}{notice}</div>
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
