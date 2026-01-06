import React, { useEffect, useState } from 'react';
import { useToast } from 'contexts/ToastContext';

const PendingApprovals = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const { show } = useToast();

  const load = async (p = page, ps = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const { api } = await import('utils/api');
      const data = await api.get(`/api/approvals/requests?status=pending&page=${p}&pageSize=${ps}`);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
      setPageSize(data.pageSize || ps);
    } catch (err) {
      setError(err.message || String(err));
      try{ show(err.message || 'Error', 'error'); }catch(e){}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  const showUser = () => {
    try{ const u = JSON.parse(localStorage.getItem('b1_user') || 'null'); return u && u.username ? u.username : null; }catch(e){ return null; }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ padding: 16 }}>
      <h2>Pending Approval Requests</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <label>Page size: </label>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div>
          <button disabled={page <= 1} onClick={() => { setPage(page - 1); load(page - 1); }}>Prev</button>
          <span style={{ margin: '0 8px' }}>Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => { setPage(page + 1); load(page + 1); }}>Next</button>
        </div>
        <div>
          {showUser() ? (
            <span>Logged as <strong>{showUser()}</strong></span>
          ) : (
            <a href="/login"><button>Login</button></a>
          )}
        </div>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>DocEntry</th>
              <th>DocNum</th>
              <th>Requester</th>
              <th>Level</th>
              <th>Levels</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{item.id}</td>
                <td>{item.docEntry}</td>
                <td>{item.docNum}</td>
                <td>{item.requester}</td>
                <td>{item.currentLevel}</td>
                <td>{(item.levels || []).length}</td>
                <td>{item.status}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>
                  <a href={`/approvals/requests/${item.id}`}>
                    <button>Detalhe</button>
                  </a>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 16 }}>
                  Nenhuma aprovação pendente encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PendingApprovals;
