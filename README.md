# Forge Operations Dashboard

A responsive infrastructure operations dashboard built with React, Vite, Python's standard-library HTTP server, and SQLite. It gives an at-a-glance view of service health, availability, regions, owners, and recent updates. Search and status filters narrow the service list; selecting a row opens a detailed service panel. New service records are validated by the API and persist in a local SQLite database.

> The included service and incident data is fictional demo data. This project is a portfolio prototype, not an Apple internal system or production service.

## Features

- Responsive overview with service, health, attention, and incident summary cards.
- Search by service, team, or region and filter by service status.
- Keyboard-accessible service rows, labelled controls, live status messages, and detail dialogs.
- Python REST endpoints: `GET /api/services` and `POST /api/services`.
- SQLite seed data, server-side validation, bounded request size, and clear API failure feedback.
- Vite development proxy keeps browser API calls same-origin during development.

## Requirements

- Node.js 20.19+ or 22.12+ and npm (required by Vite 7).
- Python 3.10+ (no third-party Python packages required).
- Git for version control.

## Run locally

Open a terminal in the project folder and install the frontend dependencies:

```bash
npm install
```

Start the API in one terminal:

```bash
python server.py
```

On Windows, `py server.py` works as well. Keep it running; the API listens on `http://127.0.0.1:8765` and creates `data/forge.db` on first start. Port `8765` avoids common local port conflicts; the Vite proxy uses the same port. To choose another port, set `FORGE_API_PORT` before starting both the API and Vite.

Open a second terminal in the same project folder and start the React app:

```bash
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). The Vite server forwards `/api` requests to the Python API. If the API is stopped, the interface displays its demo data and indicates that it is disconnected; adding or refreshing data requires the API to be running.

## Build for deployment

```bash
npm run build
npm run preview
```

The static frontend is written to `dist/`. The Python API must be hosted separately and the deployment web server must route `/api` to it. The development proxy is not a production API host.

## API examples

```bash
curl http://127.0.0.1:8765/api/services
curl -X POST http://127.0.0.1:8765/api/services \
  -H "Content-Type: application/json" \
  -d '{"name":"Event Processor","team":"Platform Systems","region":"US West"}'
```

Valid regions are `US West`, `US East`, `EU Central`, `AP South`, and `Global`. New records start with a healthy status and placeholder metrics so the sample UI remains readable.

## Project layout

```text
src/main.jsx       React interface and API interactions
src/styles.css     Responsive dashboard styling
server.py          Python REST API and SQLite initialization
vite.config.js     React setup and local API proxy
```

## Design and implementation notes

- **Frontend:** React state drives the search, status filter, detail drawer, add-service dialog, toast messages, and summary counts. The layout adapts for tablet and mobile widths.
- **Backend:** Python's `ThreadingHTTPServer` exposes two small JSON endpoints. Keeping the server on loopback limits this demo's network exposure. SQLite parameterized statements keep user input out of SQL syntax.
- **Validation and failure handling:** The API limits request bodies, checks required field lengths and allowed regions, and returns JSON error messages. The UI shows feedback when the API cannot be reached.
- **Accessibility:** Semantic landmarks and table headers, explicit form labels, keyboard operation for service rows, visible focus states, dialog labels, and an `aria-live` status region are included. A production iteration should add tested focus trapping/restoration for dialogs and verify WCAG contrast with an audit tool.
- **Operational scope:** Metrics and incidents are static sample values; there is no authentication, authorization, audit trail, telemetry pipeline, or real service integration. Those are required before adapting the prototype for real operational use.

## Step-by-step: publish this project to GitHub

### 1. Check the project locally

Run the app using the steps above. Try searching for a service, selecting a status filter, opening a service detail, adding a service, refreshing the page, and confirming the new service remains. Then build the frontend with `npm run build`.

### 2. Create a GitHub repository

1. Sign in at [github.com](https://github.com).
2. Select **+** → **New repository**.
3. Enter a name such as `forge-operations-dashboard` and a short description.
4. Choose **Public** for a portfolio project or **Private** if you want to keep it restricted.
5. Leave **Add a README**, `.gitignore`, and license unchecked because this project already has a README and `.gitignore`.
6. Select **Create repository** and copy the repository's HTTPS URL, such as `https://github.com/YOUR-USERNAME/forge-operations-dashboard.git`.

### 3. Initialize Git and create the first commit

From the project folder, run:

```bash
git init
git add .
git status
git commit -m "Build Forge operations dashboard"
```

Review `git status` before committing. The database, installed packages, and build output are excluded by `.gitignore`.

### 4. Link the GitHub repository and push

Replace the example URL with the URL you copied in step 2:

```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/forge-operations-dashboard.git
git push -u origin main
```

If GitHub asks you to authenticate, complete the browser sign-in prompt or use GitHub's supported credential manager. Do not put a password or personal access token directly in the remote URL.

### 5. Confirm the published project

Refresh the repository page on GitHub. Confirm the source files and README appear. In the repository settings, add a short description and topics such as `react`, `python`, `sqlite`, `fullstack`, and `dashboard`. Keep `node_modules`, `dist`, local databases, and secrets out of commits.

### Later updates

After editing files, review and publish changes with:

```bash
git status
git add .
git commit -m "Describe the update"
git push
```
