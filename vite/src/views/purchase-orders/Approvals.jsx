import React, { useEffect, useState } from 'react';
import { useToast } from 'contexts/ToastContext';

const Approvals = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { show } = useToast ? useToast() : { show: () => {} };

  const { show } = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { api } = await import('utils/api');
      const data = await api.get('/api/approvals/pending');
      setItems(data || []);
    } catch (err) {
      setError(err.message || String(err));
      try{ show(err.message || 'Error', 'error'); }catch(e){}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const doAction = async (docEntry, action) => {
    try {
      const { api } = await import('utils/api');
      await api.post(`/api/approvals/${docEntry}/action`, { action });
      show('Action completed', 'success');
      // optimistic update
      setItems(prev => prev.filter(i => Number(i.DocEntry) !== Number(docEntry)));
    } catch (err) {
      show('Action failed: ' + (err.message || err), 'error');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Approvals — Purchase Orders (PoC)</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/approvals/pending"><button>Pending Requests</button></a>
          <a href="/approvals/create"><button>Criar Request</button></a>
          <a href="/login"><button>Login</button></a>
          <button onClick={() => { localStorage.removeItem('b1_token'); localStorage.removeItem('b1_user'); window.location.reload(); }}>Logout</button>
        </div>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>DocEntry</th>
              <th>DocNum</th>
              <th>CardCode</th>
              <th>CardName</th>
              <th>DocDate</th>
              <th>DocTotal</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.DocEntry} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{item.DocEntry}</td>
                <td>{item.DocNum}</td>
                <td>{item.CardCode}</td>
                <td>{item.CardName}</td>
                <td>{item.DocDate}</td>
                <td>{item.DocTotal}</td>
                <td>
                  <button onClick={() => doAction(item.DocEntry, 'approve')} style={{ marginRight: 8 }}>
                    Aprovar
                  </button>
                  <button onClick={() => doAction(item.DocEntry, 'reject')}>Rejeitar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Approvals;
