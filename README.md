# KaiCyber Dashboard

A comprehensive vulnerability analysis platform for cybersecurity professionals. This dashboard provides advanced visualization, comparison, and detailed analysis of security vulnerabilities with real-time data fetching from remote sources.


**Hosted on:** https://vulnerability-dashboard.netlify.app/landing

## Features

- **Vulnerability Dashboard**: Interactive overview with charts and metrics
- **Individual Vulnerability Details**: Comprehensive view of each vulnerability with CVSS scores and risk factors
- **Vulnerability Comparison**: Side-by-side comparison of up to 4 vulnerabilities
- **Real-time Data**: Fetches latest vulnerability data from GitHub repository
- **Dark/Light Theme**: Adaptive theming for better user experience
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Data Export**: CSV export functionality for vulnerability data

> **_NOTE:_**  **When a user opens the website for the first time, the data is ingested into IndexedDB. This process happens in the background while the user can continue using the website,  viewing dashboards, searching for vulnerabilities, and comparing them. Once the ingestion is complete, the dashboards are automatically refreshed, and the user will see the updated data. While the ingestion is still in progress, the user can manually refresh the dashboards to view the latest available data.**

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI) v7
- **State Management**: React Context API and Hooks
- **Data Storage**: IndexedDB with Dexie.js
- **Charts**: Recharts
- **Routing**: React Router v7
- **Build Tool**: Create React App
- **Deployment**: Netlify

## Prerequisites

- Node.js 18.x or higher
- npm 10.x or higher
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/KaiCyberDashboard.git
   cd KaiCyberDashboard
   ```

2. **Navigate to the React app directory**
   ```bash
   cd react-dashboard
   ```

3. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Data Source

The application fetches vulnerability data from a remote GitHub repository using the GitHub API. The data is automatically loaded on first visit and cached locally for improved performance.

**Data Flow:**
1. App checks for cached data in IndexedDB
2. If no data exists, fetches from GitHub API
3. Data is processed and stored in IndexedDB
4. Subsequent visits use cached data for fast loading

## Project Structure

```
react-dashboard/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── charts/           # Chart components
│   │   ├── DashboardPage.tsx
│   │   ├── VulnerabilitiesPage.tsx
│   │   ├── IndividualVulnerabilityPage.tsx
│   │   └── VulnerabilityComparisonPage.tsx
│   ├── contexts/
│   │   └── PreferencesContext.tsx
│   ├── db/
│   │   └── db.ts            # IndexedDB configuration
│   ├── services/
│   │   ├── DataService.ts   # Data management
│   │   └── DashboardService.ts
│   ├── types/
│   │   └── preferences.ts
│   ├── utils/
│   │   └── csvExport.ts
│   ├── worker/
│   │   └── worker.ts        # Web Worker for data processing
│   ├── App.tsx
│   └── index.tsx
├── package.json
└── netlify.toml
```

## Configuration

### Environment Variables

No environment variables are required for basic functionality. The app uses GitHub API for data fetching.

### Data Source Configuration

To change the data source, modify the `GITHUB_API_URL` in `src/worker/worker.ts`:

```typescript
const GITHUB_API_URL = "https://api.github.com/repos/your-username/your-repo/contents/your-data-file.json";
```
