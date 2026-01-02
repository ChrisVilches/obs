Act as an expert full-stack developer. Create a monorepo containing a coupled Express backend and a React frontend (built with Vite) based on the following specifications.

### 1. Repository Directory Structure
Setup a single repository containing a root folder with two subfolders:
- `/backend` (Express app)
- `/frontend` (React + Vite app)
- A root `package.json` to manage both systems together.

### 2. Root Configurations
In the root `package.json`, configure the following:
- Use npm workspaces or scripts using the `concurrently` package.
- Provide a `npm run install-all` script to install dependencies for both apps using `--prefix`.
- Provide a `npm run dev` script to run the Vite dev server and the Express backend simultaneously.
- Provide a `npm run build` script that builds the frontend production bundle.
- Provide a `npm start` script that boots up the production Express server.

### 3. Backend (Express) Setup
In `/backend/src/server.js`, implement a strict route-matching order of operations to handle APIs, hosted media, static assets, and clean client-side routing:
1. **API Routes:** Mount under `/api/...`. Add a sample `GET /api/data` endpoint.
2. **Hosted Media/Images:** Create an `/backend/uploads/` folder. Use `express.static` to intercept and serve files from this folder whenever a request hits the `/uploads` path prefix.
3. **Frontend UI Assets:** Use `express.static` to serve static production files out of the `/frontend/dist` directory.
4. **React Router Catch-All:** Add a bottom-priority wildcard route (`app.get('*', ...)`) that catches all other requests and responds with the `/frontend/dist/index.html` file. This is crucial for supporting modern, non-hash HTML5 History API routing on page refreshes.

### 4. Frontend (React + Vite) Setup
In `/frontend`:
- Initialize a standard modern React application using Vite.
- Set up `react-router-dom` using `BrowserRouter` (clean URLs, no hash routes). Create a couple of dummy route components (e.g., Home and Dashboard) to prove routing works on page refresh.
- In `vite.config.js`, configure the `server.proxy` utility so that during local development, any frontend request hitting `/api` or `/uploads` is transparently proxied to the Express backend port (e.g., `http://localhost:5000`).
- Ensure frontend components can render hosted images seamlessly via relative paths (e.g., `<img src="/uploads/sample.jpg" />`).

Please generate the complete file structures, configuration files, and starter source code for both applications based on these requirements.
