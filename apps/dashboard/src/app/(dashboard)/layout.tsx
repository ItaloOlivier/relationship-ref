'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RelationshipSwitcher } from '@/components/relationship/RelationshipSwitcher';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'Sessions', href: '/dashboard/sessions', icon: '💬' },
  { name: 'Gamification', href: '/dashboard/gamification', icon: '🎮' },
  { name: 'Personality', href: '/dashboard/personality', icon: '🧠' },
  { name: 'Relationships', href: '/dashboard/relationships', icon: '👥' },
  { name: 'Insights', href: '/dashboard/insights', icon: '💡' },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const handleLogout = () => {
    api.logout();
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-card border-r">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold">Relationship Referee</h1>
            </div>
            <div className="mt-8 flex-1 flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t p-4">
              <button
                onClick={handleLogout}
                className="flex-shrink-0 w-full group block"
              >
                <div className="flex items-center">
                  <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                    Sign out
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top bar with relationship switcher */}
          <div className="flex-shrink-0 flex items-center justify-end px-6 py-4 border-b bg-card">
            <RelationshipSwitcher />
          </div>

          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
