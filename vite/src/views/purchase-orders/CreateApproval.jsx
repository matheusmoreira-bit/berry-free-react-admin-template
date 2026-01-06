import React, { useState } from 'react';
import { useToast } from 'contexts/ToastContext';

const CreateApproval = () => {
  const [docEntry, setDocEntry] = useState('');
  const [docNum, setDocNum] = useState('');
  const [requester, setRequester] = useState('');
  const [subject, setSubject] = useState('');
  const [comments, setComments] = useState('');
  const [levels, setLevels] = useState([{ level: 1, approver: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { show } = useToast();

  const addLevel = () => setLevels(prev => [...prev, { level: prev.length + 1, approver: '' }]);
  const removeLevel = (idx) => setLevels(prev => prev.filter((_, i) => i !== idx));
  const setApprover = (idx, v) => setLevels(prev => prev.map((l, i) => (i === idx ? { ...l, approver: v } : l)));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        docEntry: Number(docEntry),
        docNum: docNum || undefined,
        requester: requester || 'web-user',
        levels: levels.map(l => ({ level: l.level, approver: l.approver })),
        subject,
        comments
      };
      const { api } = await import('utils/api');
      const data = await api.post('/api/approvals/request', payload);
      // toast
      show(`Request created (id=${data.id})`, 'success');
      window.location.href = '/approvals';
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Criar Approval Request — Purchase Order</h2>
      <form onSubmit={submit} style={{ maxWidth: 800 }}>
        <div style={{ marginBottom: 8 }}>
          <label>DocEntry</label>
          <br />
          <input value={docEntry} onChange={(e) => setDocEntry(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>DocNum (opcional)</label>
          <br />
          <input value={docNum} onChange={(e) => setDocNum(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Requester</label>
          <br />
          <input value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="user code" />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Subject</label>
          <br />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Comments</label>
          <br />
          <textarea value={comments} onChange={(e) => setComments(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Approval Levels</label>
          {levels.map((l, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ width: 40 }}>#{l.level}</div>
              <input
                value={l.approver}
                onChange={(e) => setApprover(idx, e.target.value)}
                placeholder="Approver user code"
                required
              />
              {levels.length > 1 && (
                <button type="button" onClick={() => removeLevel(idx)} style={{ marginLeft: 8 }}>
                  Remover
                </button>
              )}
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={addLevel}>Adicionar nível</button>
          </div>
        </div>

        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <div>
          <button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Criar Request'}
          </button>
          <button type="button" style={{ marginLeft: 8 }} onClick={() => (window.location.href = '/approvals')}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateApproval;
