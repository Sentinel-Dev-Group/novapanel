# NovaPanel

A modern, advanced game server & hosting panel built for Debian 13.
Designed as a feature-rich alternative to Pterodactyl/Pelican with a
built-in REST API, real-time console, and a React + Tailwind frontend.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS    |
| Backend    | Node.js + Express 5               |
| Database   | MariaDB + Sequelize ORM           |
| Real-time  | Socket.io                         |
| Containers | Docker via Dockerode              |
| Auth       | JWT + Refresh Tokens + Bcrypt     |
| Proxy      | Nginx                             |
| Process    | PM2                               |

---

## Project Structure
```
novapanel/
├── api/               # Express REST API + Socket.io
│   └── src/
│       ├── config/    # Database & environment config
│       ├── controllers/
│       ├── middleware/
│       ├── models/    # Sequelize / MariaDB models
│       ├── routes/
│       ├── services/
│       └── utils/
├── panel/             # React + Vite + Tailwind frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── store/
│       └── lib/
├── daemon/            # Node agent — runs on each game node
├── database/          # SQL migrations & seeds
├── scripts/           # VPS install & update scripts
├── nginx/             # Reverse proxy config
└── .github/workflows/ # CI/CD auto deploy
```

---

## Local Development Setup

### Prerequisites
- Node.js 22+
- MariaDB (local or remote)
- Git

### 1. Clone the repo
```bash
git clone https://github.com/YOU/novapanel.git
cd novapanel
```

### 2. Set up the API
```bash
cd api
npm install
cp .env.example .env
```

Edit `.env` and fill in your database credentials and JWT secrets.

### 3. Start the API
```bash
npm run dev
```

API runs at `http://localhost:3000`

### 4. Verify it's working

Open your browser and visit:
```
http://localhost:3000/health
http://localhost:3000/api/ping
```

---

## API Endpoints

### Auth
| Method | Endpoint              | Protected | Description          |
|--------|-----------------------|-----------|----------------------|
| POST   | /api/auth/register    | No        | Create a new account |
| POST   | /api/auth/login       | No        | Log in               |
| POST   | /api/auth/refresh     | No        | Refresh access token |
| POST   | /api/auth/logout      | Yes       | Log out              |
| GET    | /api/auth/me          | Yes       | Get current user     |

### Servers _(coming soon)_
| Method | Endpoint              | Protected | Description          |
|--------|-----------------------|-----------|----------------------|
| GET    | /api/servers          | Yes       | List your servers    |
| POST   | /api/servers          | Yes       | Create a server      |
| GET    | /api/servers/:id      | Yes       | Get server details   |
| PATCH  | /api/servers/:id      | Yes       | Update a server      |
| DELETE | /api/servers/:id      | Yes       | Delete a server      |
| POST   | /api/servers/:id/start| Yes       | Start a server       |
| POST   | /api/servers/:id/stop | Yes       | Stop a server        |

### Nodes _(coming soon)_
| Method | Endpoint              | Protected | Description          |
|--------|-----------------------|-----------|----------------------|
| GET    | /api/nodes            | Yes       | List all nodes       |
| POST   | /api/nodes            | Yes       | Add a node           |
| GET    | /api/nodes/:id        | Yes       | Get node details     |
| DELETE | /api/nodes/:id        | Yes       | Remove a node        |

---

## Environment Variables

Copy `api/.env.example` to `api/.env` and fill in the values.

| Variable               | Description                              |
|------------------------|------------------------------------------|
| APP_PORT               | Port the API runs on (default 3000)      |
| NODE_ENV               | development or production                |
| DB_HOST                | MariaDB host                             |
| DB_PORT                | MariaDB port (default 3306)              |
| DB_NAME                | Database name                            |
| DB_USER                | Database user                            |
| DB_PASS                | Database password                        |
| JWT_SECRET             | Secret for signing access tokens         |
| JWT_EXPIRES_IN         | Access token lifetime (default 15m)      |
| JWT_REFRESH_SECRET     | Secret for signing refresh tokens        |
| JWT_REFRESH_EXPIRES_IN | Refresh token lifetime (default 7d)      |
| BCRYPT_ROUNDS          | Password hash rounds (default 12)        |
| CORS_ORIGIN            | Frontend URL (default http://localhost:5173) |

---

## User Roles

| Role  | Description                                              |
|-------|----------------------------------------------------------|
| root  | Full access — set manually in the database only          |
| admin | Manage all users, nodes and servers                      |
| user  | Standard client — can only see and manage own servers    |

---

## VPS Deployment

_Coming soon — full install script for Debian 13_
```bash
bash <(curl -s https://raw.githubusercontent.com/YOU/novapanel/main/scripts/install.sh)
```

---

## Roadmap

- [x] Project scaffold
- [x] MariaDB models (User, Node, Server, Allocation, AuditLog)
- [x] JWT authentication (register, login, refresh, logout)
- [ ] Server management API
- [ ] Node management API
- [ ] React frontend
- [ ] Real-time console (Socket.io)
- [ ] Live resource metrics
- [ ] File manager
- [ ] Backup system
- [ ] 2FA support
- [ ] Admin panel
- [ ] VPS install script
- [ ] Nginx + SSL setup
- [ ] Daemon (node agent)

---

## License

MIT — do whatever you want with it.