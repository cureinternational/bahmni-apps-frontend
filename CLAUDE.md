# CLAUDE.md
Test commit
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is **Bahmni Clinical Frontend**, a monorepo built with **NX** containing React TypeScript applications for healthcare management. The project uses **Yarn workspaces** for dependency management and includes multiple applications (clinical, orders, registration) and shared packages (design-system, services, widgets).

## Essential Commands

### Development
```bash
# Start development server for distro (main application)
yarn nx serve distro

# Build specific app or package
yarn nx build clinical
yarn nx build orders
yarn nx build bahmni-design-system

# Build all packages and the distro
yarn nx build distro
```

### Testing
```bash
# Run tests for a specific project
yarn nx test clinical
yarn nx test bahmni-widgets

# Run tests with coverage
yarn nx test clinical --coverage

# Run tests in watch mode (add --watch flag)
yarn nx test clinical --watch
```

### Linting and Formatting
```bash
# Run ESLint on all projects
yarn nx run-many --all --target=lint

# Format code with Prettier (via NX)
yarn nx format:write

# Check formatting
yarn nx format:check
```

### NX Commands
```bash
# Run a target for all projects
yarn nx run-many --all --target=build

# Show project dependency graph
yarn nx graph

# Clear NX cache
yarn nx reset
```

## Project Architecture

### Monorepo Structure

```
bahmni-apps-frontend/
├── apps/                           # Standalone applications
│   ├── clinical/                   # Clinical consultation module
│   ├── orders/                     # Orders management module
│   ├── registration/               # Patient registration module
│   └── sample-app-module/          # Example/template app
├── packages/                       # Shared libraries
│   ├── bahmni-design-system/       # UI components based on Carbon Design System
│   ├── bahmni-services/            # API services and utilities (axios, i18n, events)
│   └── bahmni-widgets/             # Clinical data visualization widgets
└── distro/                         # Distribution package that bundles all apps
```

### Key Design Patterns

1. **Component-Based Architecture**: All apps follow React component patterns with clear separation of UI and logic
2. **Context API for State**: Global state managed via React Context and custom hooks (not Redux)
3. **Service Layer**: API calls abstracted in `@bahmni/services` package using axios
4. **Custom Hooks**: Business logic encapsulated in reusable hooks
5. **Event-Driven Pub-Sub**: Window CustomEvents with setTimeout for cross-component communication (see consultation event system)
6. **TanStack Query**: Data fetching and caching using `@tanstack/react-query`

### App Structure Pattern

Each app follows this structure:
```
apps/{app-name}/
├── public/
│   └── locales/              # Translation files (locale_en.json, locale_es.json)
├── src/
│   ├── components/           # React components
│   ├── contexts/             # React contexts for state
│   ├── hooks/                # Custom React hooks
│   ├── pages/                # Top-level page components
│   ├── providers/            # Context providers
│   ├── services/             # App-specific services
│   ├── stores/               # Zustand stores (where applicable)
│   ├── utils/                # Utility functions
│   ├── constants/            # Constants including app namespace
│   ├── models/               # TypeScript types
│   ├── App.tsx               # Main app component
│   └── index.ts              # Package exports
├── package.json              # Must export ./locales/* for i18n
└── vite.config.ts            # Must set copyPublicDir: true
```

## Internationalization (i18n)

The project uses a **namespace-based i18n system** with i18next:

1. **Each app has its own namespace** defined in `src/constants/app.ts`
2. **Translation files** live in `public/locales/locale_{lang}.json`
3. **Two-tier loading**: Bundled translations + optional config overrides from `/bahmni_config/openmrs/i18n/{namespace}/`
4. **Fallback**: Always falls back to English if translation missing
5. **Storage key**: `NG_TRANSLATE_LANG_KEY` in localStorage (for AngularJS compatibility)

**Key files:**
- `packages/bahmni-services/src/i18n/i18n.ts` - Initialization
- `packages/bahmni-services/src/i18n/translationService.ts` - Translation loading
- See `docs/i18n-guide.md` for comprehensive guide

**Usage in components:**
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
return <button>{t('BUTTON_SAVE')}</button>;
```

## Event System

The codebase uses **Window CustomEvents with setTimeout** for decoupled cross-component communication:

- **Publisher**: `dispatchConsultationSaved()` from `@bahmni/services`
- **Subscriber**: `useConsultationSaved()` hook
- **Pattern**: Async pub-sub with selective refetch based on metadata
- **Security**: Events stay in-process, suitable for PHI data
- **Memory safety**: useRef pattern prevents leaks

See `docs/consultation-event-system.md` for full technical design.

## Testing

### Test Configuration
- **Framework**: Jest with jsdom
- **Testing Library**: @testing-library/react
- **Coverage threshold**: 90% for lines, branches, functions, statements
- **Setup file**: Root-level `setupTests.ts`

### Test Organization
- Tests can be co-located with components or in `__tests__` directories
- Mock data in `__mocks__` directories
- Use `setupTests.i18n.ts` for i18n test setup

### Running Single Test
```bash
# Run a specific test file
yarn nx test clinical --testFile=ComponentName.test.tsx

# Run tests matching a pattern
yarn nx test clinical --testNamePattern="should render"
```

## Carbon Design System

The project uses IBM's **Carbon Design System** via `@carbon/react`:

- UI components from `@carbon/react`
- Layout utilities from `@carbon/layout`
- Custom wrapper components in `@bahmni/design-system`
- SCSS styling with Carbon tokens

## Important Patterns

### API Services
All API calls go through `@bahmni/services`:
```typescript
import { fetchConditions } from '@bahmni/services';
```

Services use axios and handle error cases consistently.

### Query Keys Pattern
TanStack Query keys are exported from widgets:
```typescript
// In @bahmni/widgets
export const conditionsQueryKeys = (patientUUID: string) =>
  ['conditions', patientUUID];
```

### State Management
- **Global state**: React Context + custom hooks
- **Server state**: TanStack Query
- **Local state**: Zustand stores in some apps
- **No Redux**: Project does not use Redux

### Webpack Configuration
The distro webpack config (`distro/webpack.config.js`):
- Configures dev server proxy for `/bahmni_config` and `/openmrs`
- Copies locale files from apps to dist
- Uses aliases in development mode to link to app source
- Injects service worker for PWA support in production

## Cross-Package Dependencies

Package dependency flow:
```
apps/clinical ──┐
apps/orders ────┼──> @bahmni/widgets ──> @bahmni/design-system ──> @bahmni/services
apps/registration┘
```

When making changes:
1. **Services package** changes require rebuilding dependent packages
2. **Design system** changes require rebuilding widgets and apps
3. Use `yarn nx run-many --all --target=build` for full rebuild

## Development Workflow

1. **Start development**: `yarn nx serve distro` (runs on port 3000)
2. **Development mode aliases**: Webpack aliases point to `src` folders, so changes reflect immediately
3. **Production build**: Run `yarn nx build distro` after building all packages
4. **Husky hooks**: Pre-commit runs lint-staged which lints and formats changed files

## File Naming Conventions

- **Components**: PascalCase (e.g., `ConsultationPad.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `usePatientData.ts`)
- **Services**: camelCase with `Service` suffix (e.g., `conditionService.ts`)
- **Types**: PascalCase (e.g., `PatientDetails.ts`)
- **Constants**: SCREAMING_SNAKE_CASE in files named `constants.ts`
- **Translation files**: `locale_{lang}.json` (e.g., `locale_en.json`)

## Important Configuration Files

- `nx.json` - NX workspace configuration, plugins, and target defaults
- `tsconfig.base.json` - Base TypeScript configuration for all projects
- `eslint.config.ts` - Root ESLint configuration
- `jest.config.ts` - Root Jest configuration
- `.prettierrc.json` - Prettier formatting rules
- `package.json` - Workspace dependencies and lint-staged config

## Git Workflow

- **Main branch**: `cure-master`
- **Commit message format**: "Author | JIRA-ID | Description"
- **Co-authored commits**: Add "Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
- **Pre-commit hooks**: Lint and format staged files
- **Never commit**: `.env` files, credentials, or large binaries

## Documentation

Comprehensive guides available in `docs/`:
- `architecture.md` - Overall architecture
- `project-structure.md` - Directory structure
- `i18n-guide.md` - Internationalization implementation
- `consultation-event-system.md` - Event-driven architecture
- `sortable-data-table-guide.md` - Data table component usage
- `global-notification-guide.md` - Notification system
- `setup-guide.md` - Development environment setup

## Common Gotchas

1. **Node.js version**: Requires Node v18+ (the project has issues with older versions)
2. **i18n initialization**: Apps must call `initAppI18n(NAMESPACE)` before rendering
3. **Locale exports**: Apps must export locales in package.json: `"./locales/*": "./dist/locales/*"`
4. **Webpack proxy**: Dev server proxies `/bahmni_config` and `/openmrs` to `https://localhost/`
5. **Public path**: Defaults to `/bahmni-new/` - can be overridden with PUBLIC_PATH env var
6. **Coverage threshold**: Tests must maintain 90% coverage on all metrics
7. **Building apps**: Must run `yarn nx build {app}` before building distro in production
