import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, Trash2, X, Ticket } from 'lucide-react';

export default function AdminPage({ user, setToast, token }) {
  const [leads, setLeads] = useState([]);
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    closedLeads: 0,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/leads?${queryParams.toString()}`, {
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch leads');
      }

      setLeads(data.data || []);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Error loading leads.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter]);

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update lead status');
      }

      setToast({ type: 'success', text: `Status updated to ${newStatus}` });
      fetchLeads();
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Status update failed.' });
    }
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm('Delete this lead record permanently?')) return;

    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete lead');
      }

      setToast({ type: 'success', text: 'Lead deleted successfully' });
      fetchLeads();
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Delete failed.' });
    }
  };

  const exportCSV = () => {
    if (leads.length === 0) return;

    const headers = ['TicketNo', 'Name', 'Email', 'Budget', 'Status', 'Message', 'CreatedAt'];
    const csvRows = [headers.join(',')];

    leads.forEach((lead) => {
      const row = [
        `"${lead.ticketNo || 'TK-1000'}"`,
        `"${lead.name.replace(/"/g, '""')}"`,
        `"${lead.email}"`,
        `"${lead.budget}"`,
        `"${lead.status}"`,
        `"${lead.message.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${new Date(lead.createdAt).toISOString()}"`,
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `leaddesk_export_${new Date().toISOString().slice(0, 10)}.csv`);
    a.click();
  };

  return (
    <div className="container admin-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <div className="eyebrow-tag" style={{ marginBottom: '0.4rem' }}>ADMIN DASHBOARD</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Intake Tickets</h1>
        </div>

        <button 
          onClick={exportCSV} 
          disabled={leads.length === 0}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#ffffff',
            padding: '0.65rem 1.2rem',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.88rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Metrics */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-title">TOTAL TICKETS</div>
          <div className="admin-stat-num">{metrics.totalLeads}</div>
        </div>

        <div className="admin-stat-card" style={{ borderTop: '3px solid #d97706' }}>
          <div className="admin-stat-title">NEW</div>
          <div className="admin-stat-num" style={{ color: '#d97706' }}>{metrics.newLeads}</div>
        </div>

        <div className="admin-stat-card" style={{ borderTop: '3px solid #3b82f6' }}>
          <div className="admin-stat-title">CONTACTED</div>
          <div className="admin-stat-num" style={{ color: '#60a5fa' }}>{metrics.contactedLeads}</div>
        </div>

        <div className="admin-stat-card" style={{ borderTop: '3px solid #10b981' }}>
          <div className="admin-stat-title">CLOSED</div>
          <div className="admin-stat-num" style={{ color: '#34d399' }}>{metrics.closedLeads}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search tickets by ticket #, name, email, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.6rem',
              background: 'var(--bg-surface)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '0.9rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['All', 'New', 'Contacted', 'Closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                background: statusFilter === tab ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                color: statusFilter === tab ? '#12151c' : '#8c93a4',
                fontWeight: 700,
                fontSize: '0.82rem',
                border: 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-card">
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading tickets...
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No tickets match your query.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>TICKET NO.</th>
                  <th>DATE</th>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>BUDGET</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, idx) => (
                  <tr key={lead._id}>
                    <td>
                      <span 
                        style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontWeight: 700, 
                          color: 'var(--accent-gold)',
                          background: 'rgba(217, 119, 6, 0.1)',
                          border: '1px solid rgba(217, 119, 6, 0.3)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.82rem',
                        }}
                      >
                        {lead.ticketNo || `TK-${1001 + idx}`}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td><strong>{lead.name}</strong></td>
                    <td style={{ color: '#a5b4fc' }}>{lead.email}</td>
                    <td style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{lead.budget}</td>
                    <td>
                      <select
                        className="status-select-dark"
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setSelectedLead(lead)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            background: 'rgba(255,255,255,0.08)',
                            color: '#ffffff',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={() => handleDelete(lead._id)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            background: 'rgba(225,29,72,0.15)',
                            color: '#f43f5e',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedLead && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedLead(null)}
        >
          <div
            style={{
              background: 'var(--ticket-paper)',
              color: 'var(--ticket-text)',
              width: '100%',
              maxWidth: '520px',
              padding: '2.2rem',
              borderRadius: '16px',
              position: 'relative',
              boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLead(null)}
              style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'transparent', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            {/* Ticket Header Matching Reference Card */}
            <div 
              style={{ 
                display: 'flex', 
                justify: 'space-between', 
                alignItems: 'center', 
                paddingBottom: '1rem', 
                marginBottom: '1.5rem',
                borderBottom: '1.5px dashed #d5d0c3' 
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--ticket-muted)' }}>
                INTAKE TICKET
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 800, color: '#161820' }}>
                No. {selectedLead.ticketNo || 'TK-1001'}
              </span>
            </div>

            <div style={{ display: 'grid', gap: '1rem', fontSize: '0.95rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ticket-muted)', textTransform: 'uppercase' }}>Full Name</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedLead.name}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ticket-muted)', textTransform: 'uppercase' }}>Email</span>
                  <p style={{ color: '#2563eb', fontWeight: 600 }}>{selectedLead.email}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ticket-muted)', textTransform: 'uppercase' }}>Budget</span>
                  <p style={{ color: '#059669', fontWeight: 700 }}>{selectedLead.budget}</p>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ticket-muted)', textTransform: 'uppercase' }}>Current Status</span>
                <p style={{ fontWeight: 700, color: selectedLead.status === 'New' ? '#d97706' : selectedLead.status === 'Contacted' ? '#2563eb' : '#059669' }}>
                  {selectedLead.status}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ticket-muted)', textTransform: 'uppercase' }}>Project Message</span>
                <p style={{ background: '#ebe7dc', padding: '0.9rem', borderRadius: '8px', marginTop: '0.4rem', border: '1px solid #dcd7c7', fontSize: '0.92rem', whiteSpace: 'pre-wrap' }}>
                  {selectedLead.message}
                </p>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--ticket-muted)', textAlign: 'right' }}>
                Submitted: {new Date(selectedLead.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
