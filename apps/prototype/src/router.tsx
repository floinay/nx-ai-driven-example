import {
  createRouter,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router';
import { AppLayout } from './app';
import WelcomeScreen from './screens/welcome';
// ── Add new screen imports above ──

const rootRoute = createRootRoute({ component: AppLayout });

const welcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: WelcomeScreen,
});

// ── Add new screen routes above ──

const routeTree = rootRoute.addChildren([
  welcomeRoute,
  // ── Add new screen routes to tree above ──
]);

export const router = createRouter({ routeTree });

export interface ScreenEntry {
  path: string;
  label: string;
}

export const screens: ScreenEntry[] = [
  { path: '/', label: 'Welcome' },
  // ── Add new screen entries above ──
];

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
