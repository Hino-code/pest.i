# Pesti - Early Warning System for Pest Monitoring and Forecasting

A comprehensive web application for monitoring pest activity in rice fields and forecasting future outbreaks using data-driven models. Developed as a capstone project in partnership with PhilRice-MES.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Pesti is a full-stack early warning system designed to help agricultural researchers and field managers monitor pest activity in rice fields. The system provides real-time visualization, pest monitoring, forecasting, and alert generation to support data-driven agricultural decision-making.

### Core Capabilities

- **Real-time Pest Monitoring**: Track pest activity with interactive dashboards and visualizations
- **Predictive Forecasting**: SARIMA-based models for forecasting pest outbreaks
- **Alert System**: Automated notifications for threshold breaches and critical events
- **Role-based Access Control**: Secure access management for Administrators, Researchers, and Field Managers
- **Responsive Design**: Optimized for desktop and mobile devices
- **Accessibility**: Full ARIA support and keyboard navigation

## ✨ Features

### Dashboard & Analytics

- **Overview Dashboard**: High-level KPIs, trend analysis, and 7-day forecast visualization
- **Pest Analysis**: Detailed behavior and pattern visualization with interactive charts
- **Threshold Management**: Configure and monitor economic thresholds and injury levels
- **Reports**: Comprehensive reporting with weekly and monthly trend analysis

### Forecasting

- **7-Day Forecast**: Short-term pest count predictions with confidence intervals
- **Extended Forecasts**: 14 and 30-day forecast options with risk assessment
- **Historical Comparison**: Compare forecasts against historical data and benchmarks
- **Confidence Intervals**: Visual representation of forecast uncertainty

### User Management

- **Authentication**: Secure JWT-based authentication system
- **Registration**: User registration with admin approval workflow
- **Profile Management**: User profile settings and preferences
- **Role Management**: Administrator, Researcher, Field Manager, and Demo User roles

### Notifications

- **Real-time Alerts**: Critical threshold breach notifications
- **System Notifications**: System status and update notifications
- **Notification Center**: Centralized notification management

## 🛠 Technology Stack

### Frontend

- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite 6.3** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization library
- **Zustand** - State management
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **shadcn/ui** - UI component library

### Backend Integration

- **Express.js** - API server (separate repository)
- **MongoDB** - Database
- **JWT** - Authentication tokens
- **Python** - Forecasting models (SARIMA, KNN)

### Development Tools

- **Vitest** - Testing framework
- **ESLint** - Code linting
- **TypeScript** - Static type checking

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd pest-i
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_USE_MOCKS=true
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

### Environment Variables

| Variable            | Description           | Default                 | Required         |
| ------------------- | --------------------- | ----------------------- | ---------------- |
| `VITE_API_BASE_URL` | Backend API base URL  | `http://localhost:8000` | Yes (production) |
| `VITE_USE_MOCKS`    | Enable mock data mode | `true`                  | No               |

## 📁 Project Structure

```
pest-i/
├── public/                 # Static assets
│   └── favicon.svg        # Application favicon
├── src/
│   ├── app/               # Application core
│   │   ├── layout.tsx     # Main layout component
│   │   ├── providers.tsx  # Context providers
│   │   └── router.tsx     # Routing configuration
│   ├── assets/            # Images and static files
│   │   ├── pest-logo-full.svg
│   │   ├── pest-logo-icon.svg
│   │   └── login-bg.png
│   ├── features/           # Feature modules
│   │   ├── auth/          # Authentication
│   │   ├── dashboard/     # Dashboard pages
│   │   ├── forecasting/    # Forecasting features
│   │   ├── notifications/  # Notification system
│   │   ├── pest-monitoring/ # Pest monitoring
│   │   └── system/        # System management
│   ├── mocks/             # Mock data generators
│   │   ├── forecasting.mock.ts
│   │   └── pests.mock.ts
│   ├── shared/            # Shared resources
│   │   ├── components/    # Reusable components
│   │   ├── config/        # Configuration files
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   ├── providers/     # Context providers
│   │   └── types/         # TypeScript types
│   ├── state/             # State management
│   │   ├── auth-store.ts  # Authentication state
│   │   └── store.ts       # Main application state
│   ├── styles/            # Global styles
│   │   ├── globals.css
│   │   └── tailwind.css
│   └── main.tsx           # Application entry point
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vercel.json            # Vercel deployment config
└── vite.config.ts          # Vite configuration
```

## 🎨 Key Features

### Dashboard Overview

- **KPI Cards**: Total observations, average pest count, threshold status, action rate
- **7-Day Forecast Chart**: Visual forecast with confidence intervals and threshold lines
- **Threshold Status Breakdown**: Radial chart showing critical, warning, and normal status
- **Action Tracker**: Bar chart of action types taken
- **Recent Alerts**: List of high-priority alerts

### Forecasting System

- **Interactive Charts**: Historical data with forecast projections
- **Confidence Intervals**: Visual representation of forecast uncertainty
- **Risk Assessment**: Automatic risk level calculation (High, Moderate, Low)
- **Threshold Awareness**: Visual indicators when forecasts exceed economic thresholds
- **Multiple Time Horizons**: 7, 14, and 30-day forecast options

### Data Visualization

- **Line Charts**: Trend analysis and forecasting
- **Bar Charts**: Comparative analysis
- **Radial Charts**: Status breakdowns
- **Area Charts**: Confidence intervals and risk zones
- **Responsive Design**: Charts adapt to screen size

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Start backend server (if available)
npm run dev:server

# Start both frontend and backend
npm run dev:all
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting and formatting
- **Component Structure**: Feature-based organization
- **Naming Conventions**: PascalCase for components, camelCase for functions

### Testing

The project uses Vitest for unit testing. Test files are located alongside their source files with `.test.ts` or `.test.tsx` extensions.

```bash
npm run test
```

## 🚢 Deployment

### Vercel Deployment

This project is configured for deployment on Vercel.

1. **Push to GitHub**

   ```bash
   git push origin main
   ```

2. **Import to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Configure Environment Variables**

   - `VITE_API_BASE_URL`: Your production API URL
   - `VITE_USE_MOCKS`: Set to `false` for production

4. **Deploy**
   - Vercel will automatically build and deploy
   - The `vercel.json` file handles SPA routing

### Build Configuration

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x or higher

### Production Checklist

- [ ] Set `VITE_USE_MOCKS=false`
- [ ] Configure `VITE_API_BASE_URL` to production API
- [ ] Verify all environment variables are set
- [ ] Test authentication flow
- [ ] Verify API connectivity
- [ ] Check console for errors
- [ ] Test responsive design on mobile devices

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Technical architecture and design decisions
- **[API.md](./docs/API.md)** - API integration guide and endpoint documentation
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Detailed deployment instructions for Vercel
- **[PROJECT_SUMMARY.md](./docs/PROJECT_SUMMARY.md)** - Project overview and summary

## 👥 User Roles

### Administrator

- Full system access
- User management and approvals
- System configuration
- All dashboard and analysis features

### Researcher

- Access to all monitoring and analysis features
- Forecast viewing and analysis
- Report generation
- No user management access

### Field Manager

- Dashboard and monitoring access
- Threshold management
- Action tracking
- Limited analysis features

### Demo User

- Read-only access to demo data
- Limited feature access for demonstration purposes

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Feature access based on user roles
- **Input Validation**: Zod schema validation for all forms
- **XSS Protection**: React's built-in XSS protection
- **Secure API Communication**: HTTPS in production

## 🐛 Troubleshooting

### Common Issues

**Issue**: Application won't start

- **Solution**: Ensure Node.js 18+ is installed and run `npm install`

**Issue**: API calls failing

- **Solution**: Check `VITE_API_BASE_URL` environment variable and backend server status

**Issue**: Mock data not loading

- **Solution**: Verify `VITE_USE_MOCKS=true` or check mock data generators

**Issue**: Build fails

- **Solution**: Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

## 📝 License

This project is developed as a capstone project. All rights reserved.

## 🙏 Acknowledgments

- **PhilRice-MES** - Project partner and domain expertise
- **shadcn/ui** - UI component library (MIT License)
- **Recharts** - Charting library
- **Radix UI** - Accessible component primitives

## 📞 Support

For issues, questions, or contributions, please refer to the project repository or contact the development team.

---

**Version**: 0.1.0  
**Last Updated**: December 2024
