'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { SafetyInspection } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const columns: ColumnDef<SafetyInspection>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => new Date(row.getValue('date')).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
  },
  {
    accessorKey: 'area',
    header: 'Área',
  },
  {
    accessorKey: 'riskType',
    header: 'Tipo de Risco',
  },
  {
    accessorKey: 'description',
    header: 'Descrição',
    cell: ({ row }) => {
      const description = row.getValue('description') as string;
      if (description.length <= 50) {
        return <span>{description}</span>;
      }
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-pointer">{`${description.substring(
                0,
                50
              )}...`}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: 'correctiveAction',
    header: 'Ação Corretiva',
    cell: ({ row }) => {
        const action = row.getValue('correctiveAction') as string;
        if (action.length <= 50) {
            return <span>{action}</span>;
        }
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="cursor-pointer">{`${action.substring(0, 50)}...`}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="max-w-xs">{action}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }
  },
  {
    accessorKey: 'potential',
    header: 'Potencial',
    cell: ({ row }) => {
      const potential = row.getValue('potential') as string;
      return (
        <Badge
          variant="outline"
          className={cn({
            'border-red-500 text-red-500': potential === 'Alto',
            'border-yellow-500 text-yellow-500': potential === 'Médio',
            'border-green-500 text-green-500': potential === 'Baixo',
          })}
        >
          {potential}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          className={cn({
            'bg-green-600': status === 'Resolvido',
            'bg-blue-600': status === 'Em Andamento',
            'bg-gray-600': status === 'Satisfatório',
          })}
        >
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'auditor',
    header: 'Auditor',
  },
  {
    accessorKey: 'photos',
    header: 'Fotos',
    cell: ({ row }) => {
      const photos = row.getValue('photos') as string[];
      if (photos && photos.length > 0) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Camera className="h-5 w-5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{photos.length} foto(s) anexada(s)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return null;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const inspection = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(inspection.id)}
            >
              Copiar ID da Inspeção
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem>Editar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
