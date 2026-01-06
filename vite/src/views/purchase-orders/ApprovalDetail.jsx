import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from 'contexts/ToastContext';

const ApprovalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [approver, setApprover] = useState('');
  const [note, setNote] = useState('');

  const { show } = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { api } = await import('utils/api');
      const data = await api.get(`/api/approvals/requests/${id}`);
      setRequest(data);
      // default approver to logged in user
      try{ const u = JSON.parse(localStorage.getItem('b1_user') || 'null'); if(u && u.username) setApprover(u.username); }catch(e){}
      setNote('');
    } catch (err) {
      setError(err.message || String(err));
      try{ show(err.message || 'Error', 'error'); }catch(e){}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const doAction = async (actionType) => {
    if (!['approve','reject'].includes(actionType)) return;
    if (!window.confirm(`Confirm ${actionType} on request ${id}?`)) return;
    setActionLoading(true);
    try {
      const { api } = await import('utils/api');
      const payload = { action: actionType, note };
      const data = await api.post(`/api/approvals/requests/${id}/action`, payload);
      // use toast via context
      try{ show('Action saved', 'success'); }catch(e){}
      setRequest(data);
      // If finished, redirect to pending list
      if (data.status && (data.status === 'approved' || data.status === 'rejected')) {
        navigate('/approvals/pending');
      } else {
        await load();
      }
    } catch (err) {
      try{ show('Action failed: ' + (err.message || String(err)), 'error'); }catch(e){ alert('Action failed: ' + (err.message || String(err))); }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (error) return <div style={{ padding: 16, color: 'red' }}>{error}</div>;
  if (!request) return <div style={{ padding: 16 }}>Not found</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Approval Request #{request.id}</h2>
      <div style={{ marginBottom: 12 }}>
        <strong>Document:</strong> PO {request.docNum || request.docEntry}
        <br />
        <strong>Requester:</strong> {request.requester}
        <br />
        <strong>Status:</strong> {request.status}
        <br />
        <strong>Current Level:</strong> {request.currentLevel} / {(request.levels || []).length}
      </div>

      <div style={{ marginBottom: 12 }}>
        <h4>Levels</h4>
        <ol>
          {(request.levels || []).map((l, idx) => (
            <li key={idx}>
              Level {l.level}: <strong>{l.approver || 'unassigned'}</strong>
            </li>
          ))}
        </ol>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h4>History</h4>
        <div style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 8, borderRadius: 4 }}>
          {(request.history || []).map((h, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              <div><strong>{h.approver}</strong> — {h.action} — <small>{new Date(h.at).toLocaleString()}</small></div>
              <div>{h.note}</div>
            </div>
          ))}
          {(request.history || []).length === 0 && <div>No history yet</div>}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h4>Take action (current level: {request.currentLevel})</h4>
        <div style={{ marginBottom: 8 }}>
          <label>Approver (your user code)</label>
          <br />
          <input value={approver} onChange={(e) => setApprover(e.target.value)} placeholder="approver code" />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Note</label>
          <br />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={actionLoading} onClick={() => doAction('approve')}>Approve</button>
          <button disabled={actionLoading} onClick={() => doAction('reject')}>Reject</button>
          <button onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDetail;
