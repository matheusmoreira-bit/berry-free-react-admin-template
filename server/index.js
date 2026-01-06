require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sl = require('b1-service-layer');

const app = express();
app.use(cors());
app.use(express.json());

function getConfigFromEnv(){
  const base = process.env.SL_BASE_URL || '';
  let host = base;
  const idx = base.indexOf('/b1s');
  if (idx !== -1) host = base.substring(0, idx);
  return {
    host,
    username: process.env.SL_USER,
    password: process.env.SL_PASS,
    company: process.env.SL_COMPANY
  };
}

const jwt = require('jsonwebtoken');

async function ensureSession(){
  if (!global.slSessionCreated){
    const config = getConfigFromEnv();
    await sl.createSession(config);
    global.slSessionCreated = true;
  }
}

// --- Simple auth helpers (PoC)
async function loadUsers(){
  try{
    const txt = await fs.readFile(path.join(__dirname, 'data', 'users.json'), 'utf8');
    return JSON.parse(txt || '[]');
  }catch(e){
    return [];
  }
}

function signToken(payload){
  const secret = process.env.JWT_SECRET || 'change-me';
  return jwt.sign(payload, secret, { expiresIn: '8h' });
}

function authRequired(req,res,next){
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: true, message: 'Missing Authorization header' });
  const parts = h.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: true, message: 'Invalid Authorization header' });
  const token = parts[1];
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
    req.user = payload;
    next();
  }catch(e){
    return res.status(401).json({ error: true, message: 'Invalid token' });
  }
}

// GET pending purchase orders (PoC filter)
app.get('/api/approvals/pending', authRequired, async (req, res) => {
  try{
    await ensureSession();
    const resp = await sl.get("PurchaseOrders?$filter=DocumentStatus eq 'bost_Open'&$select=DocEntry,DocNum,CardCode,CardName,DocDate,DocTotal");
    if (resp.error) return res.status(500).json(resp);
    return res.json(resp.value || resp);
  }catch(err){ console.error(err); res.status(500).json({ error: true, message: err.message }) }
});

// POST action (approve/reject) — PoC using UDF fields; adjust to your environment
app.post('/api/approvals/:docEntry/action', authRequired, async (req,res)=>{
  const { docEntry } = req.params;
  const { action, note } = req.body;
  if(!['approve','reject'].includes(action)) return res.status(400).json({ error: true, message: 'Invalid action' });
  try{
    await ensureSession();
    const status = action === 'approve' ? 'A' : 'R';
    const patchBody = { U_ApprovalStatus: status, U_ApprovalNote: note || '', U_ApprovalUser: req.user && req.user.username };
    const resp = await sl.patch(`PurchaseOrders(${docEntry})`, patchBody);
    if (resp.error) return res.status(500).json(resp);
    return res.json({ success: true, resp });
  }catch(err){ console.error(err); res.status(500).json({ error: true, message: err.message }) }
});

const fs = require('fs').promises;
const path = require('path');
const DATA_FILE = path.join(__dirname, 'data', 'requests.json');

async function loadRequests(){
  try{
    const txt = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(txt || '[]');
  }catch(e){
    return [];
  }
}

async function saveRequests(list){
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
}

// Auth endpoints (PoC)
app.post('/api/auth/login', async (req,res)=>{
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: true, message: 'username and password required' });
  try{
    const users = await loadUsers();
    const u = users.find(x=>String(x.username) === String(username));
    if (!u || u.password !== password) return res.status(401).json({ error: true, message: 'Invalid credentials' });
    const token = signToken({ username: u.username, roles: u.roles });
    return res.json({ token, user: { username: u.username, roles: u.roles } });
  }catch(err){ console.error(err); res.status(500).json({ error: true, message: err.message }) }
});

app.get('/api/auth/me', authRequired, async (req,res)=>{
  return res.json({ user: req.user });
});

// Create an approval request locally and try to mirror to SAP ApprovalRequests
app.post('/api/approvals/request', authRequired, async (req,res)=>{
  const { docEntry, docNum, requester, levels, subject, comments } = req.body;
  if (!docEntry || !Array.isArray(levels) || levels.length === 0) return res.status(400).json({ error: true, message: 'docEntry and levels[] are required' });
  try{
    const requests = await loadRequests();
    const id = (requests.reduce((m,r)=>Math.max(m,r.id || 0), 0) || 0) + 1;
    const newRequest = {
      id,
      docEntry,
      docNum,
      requester: requester || req.user && req.user.username || 'unknown',
      levels,
      currentLevel: 1,
      status: 'pending',
      history: [],
      createdAt: new Date().toISOString(),
      sapId: null
    };

    // Try to create a SAP ApprovalRequest (best-effort; payload might need adjustments to match your SL schema)
    try{
      await ensureSession();
      const sapPayload = {
        DocumentType: 'PurchaseOrder',
        DocumentEntry: Number(docEntry),
        Subject: subject || (`Approval request PO ${docNum || docEntry}`),
        Remarks: comments || ''
        // Note: you may need to add Approvers array here according to your SAP B1 structure
      };
      const sapResp = await sl.post('ApprovalRequests', sapPayload);
      if (!sapResp.error){
        newRequest.sapId = sapResp.DocEntry || sapResp.RequestId || sapResp;
      }
    }catch(e){
      console.warn('Could not create SAP ApprovalRequest (continuing with local request):', e.message);
    }

    requests.push(newRequest);
    await saveRequests(requests);
    return res.json(newRequest);
  }catch(err){ console.error(err); res.status(500).json({ error: true, message: err.message }) }
});

// List requests, with optional filters: status, approver, pagination (page & pageSize)
app.get('/api/approvals/requests', authRequired, async (req,res)=>{
  const { status, approver, page = 1, pageSize = 20 } = req.query;
  try{
    const requests = await loadRequests();
    let out = requests;

    // basic filtering
    if (status) out = out.filter(r=>String(r.status) === String(status));

    // If the caller is not admin, only return requests where the current level approver matches user
    const isAdmin = Array.isArray(req.user.roles) && req.user.roles.includes('admin');
    if (approver && isAdmin){
      out = out.filter(r=>{
        const lvl = r.levels[r.currentLevel - 1];
        return lvl && (lvl.approver === approver || String(lvl.approver) === String(approver));
      });
    }else if (!isAdmin){
      out = out.filter(r=>{
        const lvl = r.levels[r.currentLevel - 1];
        return lvl && String(lvl.approver) === String(req.user.username);
      });
    }

    // sort by createdAt desc
    out = out.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

    // pagination
    const p = Math.max(1, Number(page) || 1);
    const ps = Math.max(1, Number(pageSize) || 20);
    const total = out.length;
    const start = (p - 1) * ps;
    const items = out.slice(start, start + ps);

    return res.json({ items, total, page: p, pageSize: ps });
  }catch(err){ console.error(err); res.status(500).json({ error: true, message: err.message }) }
});

// Get request detail
app.get('/api/approvals/requests/:id', async (req,res)=>{
  try{
    const id = Number(req.params.id);
    const requests = await loadRequests();
    const r = requests.find(x=>Number(x.id) === id);
    if (!r) return res.status(404).json({ error: true, message: 'Not found' });
    return res.json(r);
  }catch(err){ console.error(err); res.status(500).json({ error: true, message: err.message }) }
});

// Action on a request (approve/reject) by current approver
app.post('/api/approvals/requests/:id/action', authRequired, async (req,res)=>{
  const { action, note } = req.body;
  if (!['approve','reject'].includes(action)) return res.status(400).json({ error: true, message: 'Invalid action' });
  try{
    const id = Number(req.params.id);
    const requests = await loadRequests();
    const idx = requests.findIndex(x=>Number(x.id) === id);
    if (idx === -1) return res.status(404).json({ error: true, message: 'Not found' });
    const r = requests[idx];
    const currentLvl = r.currentLevel;
    const lvlDef = r.levels[currentLvl - 1];

    // Validate approver matches expected approver (unless requester is admin)
    const isAdmin = Array.isArray(req.user.roles) && req.user.roles.includes('admin');
    if (lvlDef && lvlDef.approver && !isAdmin && String(lvlDef.approver) !== String(req.user.username)){
      return res.status(403).json({ error: true, message: 'You are not authorized to act on this level' });
    }

    const entry = { action, approver: req.user.username || 'unknown', note: note || '', at: new Date().toISOString(), level: currentLvl };
    r.history.push(entry);

    if (action === 'reject'){
      r.status = 'rejected';
    }else if (action === 'approve'){
      if (currentLvl >= (r.levels.length || 1)){
        r.status = 'approved';
      }else{
        r.currentLevel = currentLvl + 1;
        r.status = 'pending';
      }
    }

    // Mirror to SAP: update PurchaseOrder UDFs (best-effort)
    try{
      await ensureSession();
      const poPatch = {
        U_ApprovalStatus: r.status === 'approved' ? 'Approved' : (r.status === 'rejected' ? 'Rejected' : 'Pending'),
        U_ApprovalLevel: r.currentLevel,
        U_ApprovalNote: (r.history.map(h=>`[${h.at}] ${h.approver}: ${h.action} - ${h.note}`).join('\n'))
      };
      const sapResp = await sl.patch(`PurchaseOrders(${r.docEntry})`, poPatch);
      if (sapResp.error) console.warn('SAP PO patch returned error', sapResp);
    }catch(e){
      console.warn('Could not update SAP PO with approval info:', e.message);
    }

    requests[idx] = r;
    await saveRequests(requests);
    return res.json(r);
  }catch(err){ console.error(err); res.status(500).json({ error: true, message: err.message }) }
});

// Health endpoint for docker / orchestration
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log(`B1 approvals PoC server listening on ${PORT}`));
