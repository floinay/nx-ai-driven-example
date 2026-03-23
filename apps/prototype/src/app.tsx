import { Outlet, Link, useRouterState } from '@tanstack/react-router';
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
          <span className="font-semibold text-sm">MetaCRM</span>
        </div>

        <nav className="flex flex-col gap-1">
          {screens.map((s) => (
            <Link
              key={s.path}
              to={s.path}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                currentPath === s.path
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
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
