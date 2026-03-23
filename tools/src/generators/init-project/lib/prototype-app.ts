/**
 * Scaffolds apps/prototype/ — a Vite + React + Tailwind + shadcn/ui prototype app.
 */
import { Tree } from '@nx/devkit';
import type { ProjectConfig } from '../generator';

const APP_DIR = 'apps/prototype';

export function writePrototypeApp(tree: Tree, config: ProjectConfig): void {
  tree.write(`${APP_DIR}/project.json`, projectJson());
  tree.write(`${APP_DIR}/package.json`, packageJson());
  tree.write(`${APP_DIR}/tsconfig.json`, tsconfigJson());
  tree.write(`${APP_DIR}/vite.config.ts`, viteConfig());
  tree.write(`${APP_DIR}/tailwind.config.ts`, tailwindConfig());
  tree.write(`${APP_DIR}/postcss.config.js`, postcssConfig());
  tree.write(`${APP_DIR}/index.html`, indexHtml(config));
  tree.write(`${APP_DIR}/src/main.tsx`, mainTsx());
  tree.write(`${APP_DIR}/src/app.tsx`, appTsx(config));
  tree.write(`${APP_DIR}/src/router.tsx`, routerTsx());
  tree.write(`${APP_DIR}/src/screens/welcome.tsx`, welcomeScreen(config));
  tree.write(`${APP_DIR}/src/lib/utils.ts`, utilsTs());
  tree.write(`${APP_DIR}/src/globals.css`, globalsCss());

  // shadcn/ui components
  tree.write(`${APP_DIR}/src/components/ui/button.tsx`, buttonComponent());
  tree.write(`${APP_DIR}/src/components/ui/card.tsx`, cardComponent());
  tree.write(`${APP_DIR}/src/components/ui/badge.tsx`, badgeComponent());
  tree.write(`${APP_DIR}/src/components/ui/separator.tsx`, separatorComponent());
  tree.write(`${APP_DIR}/src/components/ui/input.tsx`, inputComponent());
  tree.write(`${APP_DIR}/src/components/ui/label.tsx`, labelComponent());
}

// ---------------------------------------------------------------------------
// Config files
// ---------------------------------------------------------------------------

function projectJson(): string {
  return JSON.stringify(
    {
      name: 'prototype',
      $schema: '../../node_modules/nx/schemas/project-schema.json',
      sourceRoot: 'apps/prototype/src',
      projectType: 'application',
      tags: ['type:prototype'],
      targets: {
        build: {
          executor: '@nx/vite:build',
          outputs: ['{options.outputPath}'],
          options: { outputPath: 'dist/apps/prototype' },
        },
        serve: {
          executor: '@nx/vite:dev-server',
          defaultConfiguration: 'development',
          options: { buildTarget: 'prototype:build' },
          configurations: {
            development: { buildTarget: 'prototype:build:development', hmr: true },
            production: { buildTarget: 'prototype:build:production' },
          },
        },
      },
    },
    null,
    2
  );
}

function packageJson(): string {
  return JSON.stringify(
    {
      name: 'prototype',
      version: '0.0.0',
      private: true,
    },
    null,
    2
  );
}

function tsconfigJson(): string {
  return JSON.stringify(
    {
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        jsx: 'react-jsx',
        allowImportingTsExtensions: true,
        noEmit: true,
        baseUrl: './src',
        paths: {
          '@/*': ['./*'],
        },
      },
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      references: [{ path: './tsconfig.node.json' }],
    },
    null,
    2
  );
}

function viteConfig(): string {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import path from 'path';

export default defineConfig({
  root: __dirname,
  plugins: [react(), nxViteTsPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4500,
    host: 'localhost',
  },
  preview: {
    port: 4500,
  },
  build: {
    outDir: '../../dist/apps/prototype',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
});
`;
}

function tailwindConfig(): string {
  return `import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
} satisfies Config;
`;
}

function postcssConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

function indexHtml(config: ProjectConfig): string {
  return `<!DOCTYPE html>
<html lang="en" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.name} — Prototype</title>
  </head>
  <body class="h-full bg-background text-foreground">
    <div id="root" class="h-full"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Source files
// ---------------------------------------------------------------------------

function mainTsx(): string {
  return `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import './globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
`;
}

function appTsx(config: ProjectConfig): string {
  return `import { Outlet, Link, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { screens } from './router';

export function AppLayout() {
  const [dark, setDark] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 px-2 py-1">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">${config.name}</span>
        </div>

        <nav className="flex flex-col gap-1">
          {screens.map((s) => (
            <Link
              key={s.path}
              to={s.path}
              className={\`px-3 py-2 rounded-md text-sm transition-colors \${
                currentPath === s.path
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }\`}
            >
              {s.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDark(!dark)}
            className="w-full justify-start gap-2"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? 'Light mode' : 'Dark mode'}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
`;
}

function routerTsx(): string {
  return `import {
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
`;
}

function welcomeScreen(config: ProjectConfig): string {
  return `import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Feature {
  title: string;
  description: string;
  status: 'ready' | 'planned' | 'in-progress';
}

const FEATURES: Feature[] = [
  { title: 'Agent-driven development', description: '12 specialized AI agents for your workflow', status: 'ready' },
  { title: 'Spec-based planning', description: 'Structured specs with acceptance criteria', status: 'ready' },
  { title: 'Quality gates', description: 'Automated review, testing, and QA', status: 'ready' },
  { title: 'Prototype playground', description: 'This app — design screens with Tailwind + shadcn/ui', status: 'ready' },
];

export default function WelcomeScreen() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">${config.name}</h1>
        <p className="text-muted-foreground mt-1">${config.description}</p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{f.title}</CardTitle>
                <Badge variant={f.status === 'ready' ? 'default' : 'secondary'}>
                  {f.status}
                </Badge>
              </div>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Getting started</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>This is the prototype playground for <strong>${config.name}</strong>.</p>
          <p>Use the <code className="bg-muted px-1 py-0.5 rounded">prototype-designer</code> agent to generate new screens here.</p>
          <p>Each screen uses Tailwind CSS and shadcn/ui components with mock data only.</p>
        </CardContent>
      </Card>
    </div>
  );
}
`;
}

function utilsTs(): string {
  return `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
}

function globalsCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;
}

// ---------------------------------------------------------------------------
// shadcn/ui components (minimal set)
// ---------------------------------------------------------------------------

function buttonComponent(): string {
  return `import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants: Record<string, string> = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };
    const sizes: Record<string, string> = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
`;
}

function cardComponent(): string {
  return `import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props} />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
`;
}

function badgeComponent(): string {
  return `import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground',
  };
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
`;
}

function separatorComponent(): string {
  return `import * as React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = 'Separator';

export { Separator };
`;
}

function inputComponent(): string {
  return `import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
`;
}

function labelComponent(): string {
  return `import * as React from 'react';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Label.displayName = 'Label';

export { Label };
`;
}
