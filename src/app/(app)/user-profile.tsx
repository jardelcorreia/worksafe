'use client';

import { useRouter } from 'next/navigation';
import { useAuth, type Role } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

export function UserProfile() {
  const router = useRouter();
  const { role, logout, loading } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  const userDetails: Record<NonNullable<Role>, { name: string; email: string; avatar: string; fallback: string }> = {
    admin: {
      name: 'Usuário Admin',
      email: 'admin@worksafe.com',
      avatar: 'https://placehold.co/40x40',
      fallback: 'AD',
    },
    auditor: {
      name: 'Usuário Auditor',
      email: 'auditor@worksafe.com',
      avatar: 'https://placehold.co/40x40',
      fallback: 'AU',
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
              <AvatarImage src={currentUser.avatar} data-ai-hint="avatar person" />
              <AvatarFallback>{currentUser.fallback}</AvatarFallback>
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
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          {role === 'admin' && (
            <DropdownMenuItem>Configurações da Conta</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
