# Architecture Documentation

## System Architecture

Pesti follows a modern, scalable frontend architecture with clear separation of concerns and feature-based organization.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Features   │  │    Shared    │  │    State     │ │
│  │   Modules    │  │  Components  │  │  Management  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (Express.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Auth API   │  │  Data API    │  │  Forecast    │ │
│  │              │  │              │  │    API       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Data Layer                                  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   MongoDB    │  │  Python      │                    │
│  │   Database   │  │  Models      │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Architecture

The application follows a **feature-based architecture** with clear separation:

```
src/
├── app/                    # Application shell
│   ├── layout.tsx         # Main layout, routing, auth
│   ├── providers.tsx      # Context providers
│   └── router.tsx         # Route configuration
│
├── features/               # Feature modules (self-contained)
│   ├── auth/              # Authentication feature
│   ├── dashboard/         # Dashboard feature
│   ├── forecasting/       # Forecasting feature
│   ├── notifications/     # Notifications feature
│   ├── pest-monitoring/   # Pest monitoring feature
│   └── system/            # System management feature
│
├── shared/                 # Shared resources
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── config/            # Configuration files
│
└── state/                  # Global state management
    ├── auth-store.ts      # Authentication state
    └── store.ts           # Application state
```

### State Management

**Zustand** is used for state management with separate stores:

- **`auth-store.ts`**: Authentication state, user session
- **`store.ts`**: Dashboard data, filters, forecasts, alerts

**State Flow**:

```
User Action → Component → Store Action → API Call → Store Update → UI Re-render
```

### Data Flow

1. **Initial Load**: Components fetch data from stores
2. **Store Initialization**: Stores fetch from API or use mock data
3. **Data Updates**: User actions trigger store updates
4. **Reactive Updates**: Components automatically re-render on store changes

### Routing

**Client-side routing** managed through state:

- No router library (React Router)
- Navigation handled via `AppSection` state
- Lazy loading for code splitting
- Route configuration in `router.tsx`

## Component Patterns

### Feature Modules

Each feature module is self-contained:

```typescript
features/
└── dashboard/
    ├── components/         # Feature-specific components
    │   ├── kpi-cards.tsx
    │   └── loading-skeleton.tsx
    └── pages/             # Feature pages
        ├── overview-page.tsx
        └── reports-page.tsx
```

### Shared Components

Reusable components in `shared/components/`:

- **UI Components**: shadcn/ui based components
- **Chart Components**: Chart styling and configuration
- **Filters**: Shared filter components
- **Layout Components**: Sidebar, headers, etc.

## Data Management

### Mock Data System

For development and demonstration:

- **`pests.mock.ts`**: Generates realistic pest observation data
- **`forecasting.mock.ts`**: Generates forecast data with confidence intervals
- **Caching**: Mock data is cached for performance
- **Fallback**: Automatically falls back to mocks if API fails

### API Integration

- **`api-client.ts`**: Centralized API client with error handling
- **`data-service.ts`**: Data access layer abstraction
- **Environment-based**: Switches between API and mocks via `VITE_USE_MOCKS`

## Styling Architecture

### Tailwind CSS

- **Utility-first**: Tailwind utility classes
- **Custom Theme**: Extended Tailwind config for brand colors
- **Responsive**: Mobile-first responsive design
- **Dark Mode**: Theme toggle support

### Component Styling

- **Inline Styles**: For dynamic values
- **Tailwind Classes**: For static styling
- **CSS Variables**: For theme colors and spacing
- **Chart Styles**: Centralized in `chart-styles.ts`

## Performance Optimizations

### Code Splitting

- **Lazy Loading**: Routes loaded on demand
- **Dynamic Imports**: Feature modules loaded as needed
- **Bundle Optimization**: Vite optimizes production builds

### Data Optimization

- **Memoization**: `useMemo` for expensive computations
- **Caching**: Mock data and API responses cached
- **Debouncing**: Filter inputs debounced
- **Virtualization**: Large lists use virtualization (if needed)

### Rendering Optimization

- **React.memo**: Prevent unnecessary re-renders
- **useCallback**: Memoize callback functions
- **Conditional Rendering**: Render only visible components

## Security Architecture

### Authentication Flow

```
1. User Login → JWT Token → Stored in Zustand
2. API Requests → Include JWT in Headers
3. Token Refresh → Automatic refresh on expiry
4. Logout → Clear token and state
```

### Authorization

- **Role-based**: Routes and features filtered by role
- **Component-level**: Components check user role
- **API-level**: Backend validates permissions

### Data Security

- **Input Validation**: Zod schemas validate all inputs
- **XSS Protection**: React escapes by default
- **HTTPS**: Enforced in production
- **Secure Storage**: Tokens stored in memory (not localStorage)

## Testing Strategy

### Test Structure

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: Feature workflow tests
- **Test Location**: Co-located with source files (`.test.ts`)

### Testing Tools

- **Vitest**: Test runner and framework
- **React Testing Library**: Component testing
- **jsdom**: DOM simulation

## Build & Deployment

### Build Process

1. **Type Checking**: TypeScript compilation
2. **Bundling**: Vite bundles and optimizes
3. **Code Splitting**: Automatic code splitting
4. **Asset Optimization**: Images and fonts optimized
5. **Output**: Production build in `dist/`

### Deployment Strategy

- **Static Hosting**: Vercel hosts static files
- **SPA Routing**: `vercel.json` handles client-side routing
- **Environment Variables**: Configured in Vercel dashboard
- **CDN**: Automatic CDN distribution

## Technology Decisions

### Why React?

- **Component Reusability**: DRY principle
- **Large Ecosystem**: Rich library ecosystem
- **Performance**: Virtual DOM and optimizations
- **Developer Experience**: Excellent tooling

### Why TypeScript?

- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Autocomplete and refactoring
- **Documentation**: Types serve as documentation
- **Maintainability**: Easier to maintain large codebases

### Why Zustand?

- **Simplicity**: Minimal boilerplate
- **Performance**: Lightweight and fast
- **TypeScript**: Excellent TypeScript support
- **Flexibility**: Works well with React

### Why Vite?

- **Speed**: Fast HMR and build times
- **Modern**: ES modules and modern tooling
- **Plugin Ecosystem**: Rich plugin ecosystem
- **Developer Experience**: Excellent DX

## Future Considerations

### Scalability

- **Micro-frontends**: Consider if features grow significantly
- **State Management**: May need Redux for complex state
- **Caching Strategy**: Implement service workers for offline support

### Performance

- **Service Workers**: Offline functionality
- **Image Optimization**: Implement next-gen formats
- **Bundle Analysis**: Regular bundle size monitoring

### Maintainability

- **Documentation**: Keep documentation updated
- **Code Reviews**: Enforce code review process
- **Testing**: Increase test coverage
- **Refactoring**: Regular refactoring cycles
