'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Role = 'admin' | 'auditor';

export function UserProfile() {
  const [role, setRole] = useState<Role>('admin');

  const user = {
    admin: {
      name: 'Usuário Admin',
      email: 'admin@worksafe.ai',
      avatar: 'https://placehold.co/40x40',
      fallback: 'AD',
    },
    auditor: {
      name: 'Usuário Auditor',
      email: 'auditor@worksafe.ai',
      avatar: 'https://placehold.co/40x40',
      fallback: 'AU',
    },
  };

  const currentUser = user[role];

  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center space-x-2 px-2">
        <Switch
          id="role-switch"
          checked={role === 'admin'}
          onCheckedChange={(checked) => setRole(checked ? 'admin' : 'auditor')}
          className="group-data-[collapsible=icon]:hidden"
        />
        <Label htmlFor="role-switch" className="text-sm group-data-[collapsible=icon]:hidden">
          Modo Admin
        </Label>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex cursor-pointer items-center gap-3 p-2">
            <Avatar>
              <AvatarImage src={currentUser.avatar} />
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
          <DropdownMenuItem>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
