# Berry Free React Material UI Admin Template [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Get%20Berry%20React%20-%20The%20most%20beautiful%20Material%20designed%20Admin%20Dashboard%20Template%20&url=https://berrydashboard.com&via=codedthemes&hashtags=reactjs,webdev,developers,javascript)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Price](https://img.shields.io/badge/price-FREE-0098f7.svg)](https://github.com/codedthemes/berry-free-react-admin-template/blob/main/LICENSE)
[![GitHub package version](https://img.shields.io/github/package-json/v/codedthemes/mantis-free-react-admin-template)](https://github.com/codedthemes/berry-free-react-admin-template/)
[![Download ZIP](https://img.shields.io/badge/Download-ZIP-blue?style=flat-square&logo=github)](https://codedthemes.com/item/berry-mui-free-react-admin-template/)
[![Join Discord](https://img.shields.io/badge/Join-Discord-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.com/invite/p2E2WhCb6s)

Berry is a free Material UI admin dashboard template built with React. It is meant to provide the best possible User Experience with highly customizable feature-rich pages. It is a complete Dashboard Template that has easy and intuitive responsive design whether it is viewed on retina screens or laptops.

✨ Support us! If you like this theme, click the ⭐ (Top right) and let it shine

---

## Project: SAP B1 Approvals Integration (PoC) 🔧
Esta cópia do projeto contém uma extensão (Proof-of-Concept) que implementa uma interface de aprovações para **Purchase Orders** integrando com o **SAP Business One Service Layer** usando a biblioteca `b1-service-layer`.

Principais componentes:
- **Backend**: `server/` — Express que usa `b1-service-layer` para conectar ao Service Layer, gerenciar `ApprovalRequests` (melhor esforço) e armazenar workflows localmente (`server/data/requests.json`).
- **Frontend**: `vite/` — app React (Vite) com páginas para criar, listar e atuar sobre requests.

Páginas principais (frontend):
- `/approvals` — visão geral / ações rápidas (PoC)
- `/approvals/create` — criar um Approval Request (níveis/approvers)
- `/approvals/pending` — lista paginada de requests pendentes (para o approver logado)
- `/approvals/requests/:id` — detalhe do request e ações (aprovar/rejeitar)
- `/login` — página de login (PoC com JWT)

### Quickstart — rodar localmente
1. Backend
```bash
cd server
cp .env.example .env   # revise as credenciais
npm install
npm start
```
2. Frontend
```bash
cd vite
npm install
npm run dev
```
3. Acesse no navegador:
- Frontend: `http://localhost:3000`
- API: `http://localhost:4000`

4. Credenciais de teste (arquivo `server/data/users.json`):
- Admin: `Apiuser` / `Sap@2025`
- Approver: `approver1` / `pass1` (ou `approver2` / `pass2`)

5. Teste rápido:
- Faça login em `/login`, crie um request em `/approvals/create` definindo `approver1` como nível 1, então faça login como `approver1` e aprove em `/approvals/pending`.

> Observações importantes:
> - O arquivo `.env.example` contém a URL do Service Layer e as variáveis esperadas. Por segurança, copie para `.env` e não commite (já existe `.gitignore` que ignora `.env`).
> - O PoC faz um **best-effort** para criar `ApprovalRequests` no SAP; você pode precisar ajustar o payload conforme sua instância B1.
> - Em produção: substitua o store de usuários por um provider real (LDAP/SSO), proteja o `JWT_SECRET`, e use um banco de dados para persistência.

### Endpoints principais da API (PoC)
- `POST /api/auth/login` — login (body: `{ username, password }`) → `{ token, user }`
- `GET /api/auth/me` — obter usuário atual (Authorization: Bearer)
- `POST /api/approvals/request` — criar request (autenticado)
- `GET /api/approvals/requests?status=&page=&pageSize=` — listar requests (autenticado)
- `GET /api/approvals/requests/:id` — detalhe (autenticado)
- `POST /api/approvals/requests/:id/action` — aprovar/rejeitar (autenticado)
- `GET /api/approvals/pending` — obter POs abertos (autenticado)
- `POST /api/approvals/:docEntry/action` — patch simples em PO (autenticado)

---

## Deployment Guide 🚀

This section provides a concise, practical guide to deploy the PoC (backend + frontend) in a production-like environment. It includes Docker examples, recommended environment variables, reverse-proxy (nginx) configuration and notes about security and persistence.

### Recommended environment variables (server/.env)
- SL_BASE_URL — Service Layer URL (e.g. https://.../b1s/v2)
- SL_USER — Service Layer username
- SL_PASS — Service Layer password
- SL_COMPANY — CompanyDB
- PORT — backend port (default 4000)
- JWT_SECRET — secret for signing JWTs (change in production)

### Option A — Docker + docker-compose (recommended for small deployments)
Create a `Dockerfile` for the server and the Vite app, and a `docker-compose.yml` to run them and an nginx proxy.

Example `server/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY . .
EXPOSE 4000
CMD ["node", "index.js"]
```

Example `vite/Dockerfile` (build static assets):
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
COPY vite/ ./
RUN npm ci && npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Example `docker-compose.yml`:
```yaml
version: '3.8'
services:
  server:
    build: ./server
    env_file: ./server/.env
    ports:
      - "4000:4000"
    restart: unless-stopped

  web:
    build: ./vite
    ports:
      - "3000:80"
    restart: unless-stopped

  proxy:
    image: nginx:stable-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deploy/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - web
      - server
```

Example `deploy/nginx.conf` (reverse proxy):
```nginx
server {
  listen 80;
  server_name example.com;

  location /api/ {
    proxy_pass http://server:4000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location / {
    proxy_pass http://web:80/;
  }
}
```

> Tip: Use certbot or a managed TLS solution to get TLS certificates and configure nginx to listen on 443; redirect 80 → 443.

### Option B — Deploy to a PaaS (DigitalOcean App Platform, Heroku, Render)
- Build and publish the `server/` as a Node service; set environment variables in the platform UI. Use the Vite build output served via a static site or a CDN. Use the provider's load balancer / managed TLS.

### Persistence & production concerns
- Do **not** rely on `server/data/requests.json` for production; use a proper DB (Postgres, MySQL, MongoDB). Replace load/save functions with DB adapters.
- Protect secrets: store credentials in a secure secrets manager (Vault, cloud provider secrets) and rotate regularly.
- Audit & logging: add structured logs and integrate with central logging (ELK, Datadog, etc.).
- Health checks: expose `/health` endpoint and configure process manager / orchestrator to restart on failure.
- Backups: if you use a persistent DB, schedule backups and verify restores.

### Running locally with Docker Compose
```bash
# build and start
docker-compose up --build -d
# check logs
docker-compose logs -f server
```

**Quick start using the supplied `deploy/` artifacts:**

If you prefer the included Dockerfile and nginx configuration, from the project root run:

```bash
# from repo root
cd deploy
docker-compose up --build -d
# verify health
curl http://localhost/health
```

This will build the server and web images using the Dockerfiles in `deploy/` and start nginx as a reverse proxy on port 80.

### Development workaround — use host-built frontend (fast)
If you're facing network/certificate issues during the web image build, you can build the frontend on your host and let nginx in Docker serve the static files.

1. Build the frontend locally (use Yarn if available):

```bash
# from repo root
cd vite
# with Yarn (recommended since project has yarn.lock)
yarn install --frozen-lockfile
yarn build
# or with npm (if you prefer)
# npm ci && npm run build
```

2. Start the services using the dev override (it mounts `vite/dist` into nginx):

```bash
cd deploy
# the override file `docker-compose.override.yml` will replace the `web` service to use an nginx image and mount your local build
docker-compose up -d
```

3. Verify:

```bash
curl http://localhost/health
# open http://localhost/ in your browser
```

This is a **development-only** workaround to avoid building the web image inside Docker; it is not a replacement for a proper CA/import fix for CI or production builds. To revert, remove or rename `deploy/docker-compose.override.yml` and run `docker-compose up --build -d` again.

### Monitoring & scaling
- For higher load, scale server instances behind a load balancer and use a shared DB. For SAP Service Layer, consider connection/session limits and connection pooling.
- Use horizontal autoscaling for the server and ensure the frontend is served by a CDN for best performance.

### Final notes
- The PoC demonstrates an integration pattern. Before moving to production, confirm the exact SAP ApprovalRequests payload and test in a SAP B1 sandbox environment.
- Consider using a proper identity provider (SSO) to manage approvers and map them to SAP users.

---


![IMG_8566.jpg](https://berrydashboard.com/imp-images/berry-github-free-repo-1.jpg)

## Table of contents

- [Getting Started](#getting-started)
- [Download](#download)
- [Why Berry?](#why-berry)
- [What's included in Premium Version?](#whats-included-in-premium-version)
- [Documentation](#documentation)
- [Browser support](#browser-support)
- [Technology Stack](#technology-stack)
- [Berry Figma UI Kit](#berry-figma-ui-kit)
- [Other Technologies](#other-technologies)
- 💰[Save more with Big Bundle](#save-more-with-big-bundle)💰
- [More React Dashboard Templates](#more-react-dashboard-templates)
- [Issues?](#issues)
- [License](#license)
- [Contributor](#contributor)
- [Useful Resources](#useful-resources)
- [Community](#community)
- [Follow us](#follow-us)

## Getting Started

Clone from Github

```
git clone https://github.com/codedthemes/berry-free-react-admin-template.git
```

## Download

- Berry Free
  - [Live Preview](https://berrydashboard.com/free/)
  - [Download](https://github.com/codedthemes/berry-free-react-admin-template)
- Berry
  - [Live Preview](https://berrydashboard.com)
  - [Download](https://material-ui.com/store/items/berry-react-material-admin/)

## Why Berry?

Berry offers everything you need to create dashboards. We have included the following high-end features in our initial release:

- Modern aesthetics UI design
- Material-UI components
- Fully Responsive, all modern browser supported
- Easy to use code structure
- Flexible & High-Performance code
- Easy Documentation Guide

## What's included in Premium Version?

[Pro version](https://berrydashboard.com) of Berry react template contains features like TypeScript, Next.js Seed versions, Apps, Authentication Methods (i.e. JWT, Auth0, Firebase, AWS, Supabase), Advance Components, Form Plugins, Layouts, Widgets, and many more.

| [Berry Free](https://berrydashboard.com/free/) | [Berry](https://material-ui.com/store/items/berry-react-material-admin/) |
| ---------------------------------------------- | :----------------------------------------------------------------------- |
| **9** Demo pages                               | **45+** demo pages                                                       |
| -                                              | ✓ Multi-language                                                         |
| -                                              | ✓ Dark/Light Mode 🌓                                                     |
| -                                              | ✓ TypeScript version                                                     |
| -                                              | ✓ Design files (Figma)                                                   |
| -                                              | ✓ 6+ color Options                                                       |
| -                                              | ✓ RTL                                                                    |
| -                                              | ✓ JWT, Firebase, Auth0, AWS, Supabase authentications                    |
| -                                              | ✓ [More components](https://berrydashboard.com/components/autocomplete)  |

## Documentation

[Berry Documentation](https://codedthemes.gitbook.io/berry/) helps you with installation, deployment, and troubleshooting.

## Browser support

<img src="https://org-public-assets.s3.us-west-2.amazonaws.com/logos/chrome.png" width="45" height="45" > <img src="https://org-public-assets.s3.us-west-2.amazonaws.com/logos/edge.png" width="45" height="45" > <img src="https://org-public-assets.s3.us-west-2.amazonaws.com/logos/safari.png" width="45" height="45" > <img src="https://org-public-assets.s3.us-west-2.amazonaws.com/logos/firefox.png" width="45" height="45" > <img src="https://org-public-assets.s3.us-west-2.amazonaws.com/logos/opera.png" width="45" height="45" >

## Technology Stack

- [Material UI V7](https://material-ui.com/)
- [React 19.2](https://react.dev/)
- Built with React Hooks API
- Redux & React Context API for State Management
- React Router for Navigation Routing
- Support of vite
- Code Splitting
- CSS-in-JS where CSS is composed using JavaScript instead of defined in external files

## Berry Figma UI Kit

<div>
  <a href="https://codedthemes.com/item/berry-free-figma-ui-kit/">
    <img src="https://org-public-assets.s3.us-west-2.amazonaws.com/Banners/Figma_Free_Berry.png" width="450" alt="Figma Free">
  </a>&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://codedthemes.com/item/berry-figma-ui-kit/">
    <img src="https://org-public-assets.s3.us-west-2.amazonaws.com/Banners/Figma-Pro-Berry.png" width="450" alt="Figma Pro">
  </a>
</div>

## Other Technologies

| Technology                                                                                                                        | Free                                                                              | Pro                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| <p align="center"><img src="https://org-public-assets.s3.us-west-2.amazonaws.com/logos/Angular.png" width="25" height="25"></p>   | [**Free**](https://codedthemes.com/item/berry-angular-free-admin-template/)       | [**Pro**](https://codedthemes.com/item/berry-angular-admin-dashboard-template/) |
| <p align="center"><img src="https://org-public-assets.s3.us-west-2.amazonaws.com/logos/Bootstrap.png" width="30" height="30"></p> | [**Free**](https://codedthemes.com/item/berry-bootstrap-free-admin-template/)     | [**Pro**](https://codedthemes.com/item/berry-bootstrap-5-admin-template/)       |
| <p align="center"><img src="https://org-public-assets.s3.us-west-2.amazonaws.com/logos/Vue.png" width="25" height="25"></p>       | [**Free**](https://codedthemes.com/item/berry-free-vuetify-vuejs-admin-template/) | [**Pro**](https://codedthemes.com/item/berry-vue-admin-dashboard/)              |

## Save more with Big Bundle

[![bundle-image](https://org-public-assets.s3.us-west-2.amazonaws.com/Banners/Bundle+banner.png)](https://links.codedthemes.com/jhFBJ)

## More React Dashboard Templates

| Dashboard                                                                                                                                                          | FREE                                                                                | PRO                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| <img src="https://org-public-assets.s3.us-west-2.amazonaws.com/logos/Mantis%20with%20name.png"  height="30" style="display:inline-block; vertical-align:middle;">  | [**Free**](https://mantisdashboard.com/free/)                                       | [**Pro**](https://mui.com/store/items/mantis-react-admin-dashboard-template/)</span>  |
| <img src="https://org-public-assets.s3.us-west-2.amazonaws.com/logos/Datta%20with%20name.png" height="30" style="display:inline-block; vertical-align:middle;">    | [**Free**](https://codedthemes.com/item/datta-able-react-free-admin-template/)      | [**Pro**](https://codedthemes.com/item/datta-able-react-admin-template/)</span>       |
| <img src="https://org-public-assets.s3.us-west-2.amazonaws.com/logos/Gradient%20with%20name.png" height="30" style="display:inline-block; vertical-align:middle;"> | [**Free**](https://codedthemes.com/item/gradient-able-reactjs-free-admin-template/) | [**Pro**](https://codedthemes.com/item/gradient-able-reactjs-admin-dashboard/)</span> |

## Issues

To report a bug, please submit an [issue](https://github.com/codedthemes/berry-free-react-admin-template/issues) on Github. We will respond as soon as possible to resolve the issue.

## License

- Licensed cover under [MIT](https://github.com/codedthemes/berry-free-react-admin-template/blob/main/LICENSE)

## Contributor

**CodedThemes Team**

- https://x.com/codedthemes
- https://github.com/codedthemes

**Rakesh Nakrani**

- https://x.com/rakesh_nakrani

**Brijesh Dobariya**

- https://x.com/dobaria_brijesh

## Useful Resources

- [More Admin Templates From CodedThemes](https://codedthemes.com/item/category/admin-templates/)
- [Freebies From CodedThemes](https://codedthemes.com/item/category/free-templates/)
- [Big Bundles](https://codedthemes.com/item/big-bundle/)
- [Figma UI Kits](https://codedthemes.com/item/category/templates/figma/)
- [Affiliate Program](https://codedthemes.com/affiliate/)
- [Blogs](https://blog.codedthemes.com/)

## Community

- 👥Follow [@codedthemes](https://x.com/codedthemes)
- 🔗Join [Discord](https://discord.com/invite/p2E2WhCb6s)
- 🔔Subscribe to [Codedtheme Blogs](https://blog.codedthemes.com/)

## Follow us

- [Twitter](https://twitter.com/codedthemes) 🐦
- [Dribbble](https://dribbble.com/codedthemes) 🏀
- [Github](https://github.com/codedthemes) 🐙
- [LinkedIn](https://www.linkedin.com/company/codedthemes/) 💼
- [Instagram](https://www.instagram.com/codedthemes/) 📷
- [Facebook](https://www.facebook.com/codedthemes) 🟦
