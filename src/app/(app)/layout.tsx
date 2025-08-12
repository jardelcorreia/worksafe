
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AreaChart,
  FilePlus2,
  List,
  Settings,
  Users,
  Building,
  AlertTriangleIcon,
  KeyRound,
  ClipboardList,
  HardHat,
  UserCog,
  Bug,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { UserProfile } from './user-profile';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { Skeleton } from '@/components/ui/skeleton';

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: AreaChart,
  },
  {
    href: '/inspections',
    label: 'Inspeções',
    icon: List,
    exactMatch: true,
  },
  {
    href: '/inspections/new',
    label: 'Nova Inspeção',
    icon: FilePlus2,
  },
];

const settingsMenuItems = [
  {
    href: '/admin/auditors',
    label: 'Auditores',
    icon: Users,
  },
  {
    href: '/admin/areas',
    label: 'Áreas',
    icon: Building,
  },
  {
    href: '/admin/risk-types',
    label: 'Tipos de Risco',
    icon: ClipboardList,
  },
  {
    href: '/admin/account',
    label: 'Conta',
    icon: KeyRound,
  },
  {
    href: '/admin/debug',
    label: 'Debug Storage',
    icon: Bug,
  }
];

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, loading } = useAuth();
  const { setOpenMobile } = useSidebar();

  React.useEffect(() => {
    if (!loading && !role) {
      router.replace('/login');
    }
  }, [role, loading, router]);

  const handleNavigate = (href: string) => {
    router.push(href);
    setOpenMobile(false);
  };

  const isSettingsActive = settingsMenuItems.some((item) =>
    pathname.startsWith(item.href)
  );
  
  const currentItem = [...menuItems, ...settingsMenuItems].find((item) => {
    if (item.exactMatch) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  });

  if (loading || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={
                    item.exactMatch
                      ? pathname === item.href
                      : pathname.startsWith(item.href)
                  }
                  onClick={() => handleNavigate(item.href)}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {role === 'admin' && (
              <Collapsible defaultOpen={isSettingsActive}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isSubmenu className="w-full">
                      <Settings />
                      <span>Configurações</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>

                <CollapsibleContent asChild>
                  <SidebarMenuSub>
                    {settingsMenuItems.map((item) => (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton
                          isActive={pathname.startsWith(item.href)}
                          onClick={() => handleNavigate(item.href)}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <UserProfile />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <DashboardProvider>
            <header className="flex h-14 items-center gap-4 border-b bg-background/50 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg md:text-xl font-semibold font-headline flex-1">
                {currentItem?.label || 'Dashboard'}
            </h1>
            </header>
            <main className="flex-1 p-4 sm:p-6">{children}</main>
        </DashboardProvider>
      </SidebarInset>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppContent>{children}</AppContent>
    </SidebarProvider>
  )
}
