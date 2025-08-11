'use client';

import { useRouter } from 'next/navigation';
import { useAuth, type Role } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { HardHat, UserCog } from 'lucide-react';

export function UserProfile() {
  const router = useRouter();
  const { role, logout, loading } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  const userDetails: Record<NonNullable<Role>, { name: string; email: string }> = {
    admin: {
      name: 'Usuário Admin',
      email: 'admin@worksafe.com',
    },
    auditor: {
      name: 'Usuário Auditor',
      email: 'auditor@worksafe.com',
    },
  };

  if (loading || !role) {
    return (
        <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-col gap-2 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
    )
  }

  const currentUser = userDetails[role];

  return (
    <div className="flex flex-col gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex cursor-pointer items-center gap-3 p-2">
            <Avatar>
              <AvatarFallback>
                {role === 'admin' ? <UserCog /> : <HardHat />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium">{currentUser.name}</span>
              <span className="text-xs text-muted-foreground">
                {currentUser.email}
              </span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {currentUser.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {currentUser.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/dashboard')}>Perfil</DropdownMenuItem>
          {role === 'admin' && (
            <DropdownMenuItem onClick={() => router.push('/admin/account')}>Configurações da Conta</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
