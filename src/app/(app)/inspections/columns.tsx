
'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  ArrowUpDown,
  FileText,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

function DetailsModal({ inspection, children }: { inspection: SafetyInspection, children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Inspeção</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="md:col-span-1">
            <strong>Data:</strong>{' '}
            {new Date(inspection.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </div>
          <div className="md:col-span-1">
            <strong>Área:</strong> {inspection.area}
          </div>
          <div className="md:col-span-1">
            <strong>Auditor:</strong> {inspection.auditor}
          </div>
          <div className="md:col-span-1">
            <strong>Tipo de Risco:</strong> {inspection.riskType}
          </div>
          <div className="md:col-span-1">
            <strong>Potencial:</strong>{' '}
            <Badge
                variant="outline"
                className={cn({
                    'border-red-500 text-red-500': inspection.potential === 'Alto',
                    'border-yellow-500 text-yellow-500': inspection.potential === 'Médio',
                    'border-green-500 text-green-500': inspection.potential === 'Baixo',
                })}
            >
                {inspection.potential}
            </Badge>
          </div>
          <div className="md:col-span-1">
            <strong>Status da Ação Corretiva:</strong>{' '}
            <Badge
                className={cn({
                    'bg-green-600': inspection.status === 'Resolvido',
                    'bg-blue-600': inspection.status === 'Em Andamento',
                })}
            >
                {inspection.status}
            </Badge>
          </div>
          <div className="col-span-full">
            <strong>Descrição da Situação Encontrada:</strong>
            <p className="text-muted-foreground">{inspection.description}</p>
          </div>
          <div className="col-span-full">
            <strong>Ação Corretiva:</strong>
            <p className="text-muted-foreground">{inspection.correctiveAction}</p>
          </div>
           <div className="col-span-full">
            <strong>Responsável pela Ação Corretiva:</strong> {inspection.responsible}
          </div>
          <div className="col-span-full">
            <strong>Prazo Final:</strong>{' '}
            {new Date(inspection.deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </div>
          {inspection.photos && inspection.photos.length > 0 && (
            <div className="col-span-full">
              <strong>Fotos:</strong>
              <Carousel className="w-full mt-2">
                <CarouselContent>
                  {inspection.photos.map((photo, index) => (
                    <CarouselItem key={index}>
                      <Image
                        src={photo}
                        alt={`Foto da inspeção ${index + 1}`}
                        width={600}
                        height={400}
                        className="rounded-md object-cover w-full aspect-video"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}
        </div>
        <DialogClose asChild>
            <Button type="button" variant="outline" className="mt-4">Fechar</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function ActionsCell({ row }: { row: any }) {
  const router = useRouter();
  const inspection = row.original as SafetyInspection;

  const handleEdit = () => {
    router.push(`/inspections/${inspection.id}/edit`);
  };

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
        <DetailsModal inspection={inspection}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <FileText className="mr-2 h-4 w-4" />
                Ver Detalhes
            </DropdownMenuItem>
        </DetailsModal>
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
    cell: ({ row }) =>
      new Date(row.getValue('date')).toLocaleDateString('pt-BR', {
        timeZone: 'UTC',
      }),
  },
  {
    accessorKey: 'area',
    header: 'Área',
  },
  {
    accessorKey: 'riskType',
    header: 'Tipo de Risco',
    cell: ({ row }) => {
      const riskType = row.getValue('riskType') as string;
      if (riskType.length <= 30) {
        return <span>{riskType}</span>;
      }
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-pointer">{`${riskType.substring(
                0,
                30
              )}...`}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{riskType}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Descrição da Situação Encontrada',
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
              <span className="cursor-pointer">{`${action.substring(
                0,
                50
              )}...`}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{action}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
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
    header: 'Status da Ação Corretiva',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          className={cn({
            'bg-green-600': status === 'Resolvido',
            'bg-blue-600': status === 'Em Andamento',
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
    id: 'actions',
    cell: ActionsCell,
  },
];
