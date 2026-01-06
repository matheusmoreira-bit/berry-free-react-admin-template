B1 Approvals PoC server

Quickstart

1. Copy `.env.example` to `.env` and fill the SAP B1 Service Layer credentials.
2. Install dependencies: `cd server && npm install`
3. Start server: `npm run dev` (requires `nodemon`) or `npm start`.

Quick setup with the provided credentials (example):

```bash
# copy example (.env will contain the SL credentials provided)
cp .env.example .env

# install and start
npm install
npm run dev   # or `npm start`

# quick test after server is running
curl http://localhost:4000/api/approvals/pending
```

Security note:

- Keep `.env` out of source control. The repository contains `.env.example` for convenience but **do not commit** real credentials. Consider adding `.env` to `.gitignore` if not already present.

Notes

- This PoC patches Purchase Orders using UDF fields (`U_ApprovalStatus`, `U_ApprovalNote`). Adapt the code to use your system's approval flow (ApprovalRequests, UDOs, or other fields).

New endpoints (PoC):

- POST `/api/approvals/request` — create a new approval workflow for a PO in the local store (body: `{ docEntry, docNum, requester, levels: [{ level: 1, approver: 'USER' }], subject, comments }`). The server will attempt to mirror by calling `POST ApprovalRequests` in the Service Layer (best effort; payload may require adaptation).
- GET `/api/approvals/requests` — list requests; optional query params: `status` (pending/approved/rejected), `approver` (user code), `page` (1-based) and `pageSize` (number of items per page). Response format: `{ items, total, page, pageSize }`.
- GET `/api/approvals/requests/:id` — request detail
- POST `/api/approvals/requests/:id/action` — take action: body `{ action: 'approve'|'reject', approver, note }`. The PoC updates the local workflow, advances levels and attempts to patch the PO with UDFs to reflect approval state.

- The server uses `b1-service-layer` (https://github.com/nestebe/b1-service-layer).

Authentication (PoC):

- POST `/api/auth/login` — body `{ username, password }` returns `{ token, user }`.
- GET `/api/auth/me` — returns the user associated with the token in `Authorization: Bearer <token>`.

Notes: This is a PoC authentication system using JWT and a local `data/users.json` store. Replace with your preferred auth provider for production.
