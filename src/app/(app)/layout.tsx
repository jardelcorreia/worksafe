'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AreaChart,
  FilePlus2,
  List,
  ShieldCheck,
  PanelLeft,
  Users,
  Settings,
  Building,
  AlertTriangleIcon,
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
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: AreaChart,
  },
  {
    href: '/incidents',
    label: 'Incidentes',
    icon: List,
    exactMatch: true,
  },
  {
    href: '/incidents/new',
    label: 'Novo Incidente',
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
        icon: AlertTriangleIcon,
    },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isSettingsActive = settingsMenuItems.some(item => pathname.startsWith(item.href));

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    item.exactMatch ? pathname === item.href : pathname.startsWith(item.href)
                  }
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
             <Collapsible defaultOpen={isSettingsActive}>
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            isSubmenu
                            className="w-full"
                            tooltip="Configurações"
                            >
                                <Settings />
                                <span>Configurações</span>
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                </SidebarMenuItem>

                <CollapsibleContent asChild>
                    <SidebarMenuSub>
                        {settingsMenuItems.map((item) => (
                             <SidebarMenuSubItem key={item.href}>
                                <SidebarMenuSubButton asChild isActive={pathname.startsWith(item.href)}>
                                    <Link href={item.href}>
                                        <item.icon/>
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                             </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
             </Collapsible>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex cursor-pointer items-center gap-3 p-2">
                <Avatar>
                  <AvatarImage src="https://placehold.co/40x40" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium">Usuário Admin</span>
                  <span className="text-xs text-muted-foreground">
                    admin@worksafe.ai
                  </span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Usuário Admin
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@worksafe.ai
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/50 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold md:text-2xl font-headline flex-1">
            {[...menuItems, ...settingsMenuItems].find((item) => pathname.startsWith(item.href))?.label}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
