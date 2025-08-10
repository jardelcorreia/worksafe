'use client';

import * as React from 'react';
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Table as TableType,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, MoreHorizontal, ArrowUpDown, FileText, Edit } from 'lucide-react';
import { PotentialLevels, StatusLevels } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

function DetailsModal({ inspection, children }: { inspection: SafetyInspection, children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Inspeção</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <strong>Data:</strong>{' '}
              {new Date(inspection.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </div>
            <div>
              <strong>Área:</strong> {inspection.area}
            </div>
            <div>
              <strong>Auditor:</strong> {inspection.auditor}
            </div>
            <div>
              <strong>Tipo de Risco:</strong> {inspection.riskType}
            </div>
            <div>
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
            <div>
              <strong>Status:</strong>{' '}
              <Badge
                  className={cn({
                      'bg-green-600': inspection.status === 'Resolvido',
                      'bg-blue-600': inspection.status === 'Em Andamento',
                  })}
              >
                  {inspection.status}
              </Badge>
            </div>
          </div>
          
          <div>
            <strong>Descrição:</strong>
            <p className="text-muted-foreground mt-1">{inspection.description}</p>
          </div>
          
          <div>
            <strong>Ação Corretiva:</strong>
            <p className="text-muted-foreground mt-1">{inspection.correctiveAction}</p>
          </div>
          
          <div>
            <strong>Responsável:</strong> {inspection.responsible}
          </div>
          
          <div>
            <strong>Prazo Final:</strong>{' '}
            {new Date(inspection.deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </div>
          
          {inspection.photos && inspection.photos.length > 0 && (
            <div>
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
            <Button type="button" variant="outline" className="mt-4 w-full">Fechar</Button>
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

// Mobile Card Component
function MobileInspectionCard({ inspection }: { inspection: SafetyInspection }) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/inspections/${inspection.id}/edit`);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-sm font-medium">
              {inspection.area}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {new Date(inspection.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className={cn('text-xs', {
                'border-red-500 text-red-500': inspection.potential === 'Alto',
                'border-yellow-500 text-yellow-500': inspection.potential === 'Médio',
                'border-green-500 text-green-500': inspection.potential === 'Baixo',
              })}
            >
              {inspection.potential}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Tipo de Risco</p>
          <p className="text-sm">{inspection.riskType}</p>
        </div>
        
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Descrição</p>
          <p className="text-sm leading-relaxed">
            {inspection.description.length > 120 
              ? `${inspection.description.substring(0, 120)}...` 
              : inspection.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Badge
            className={cn('text-xs', {
              'bg-green-600': inspection.status === 'Resolvido',
              'bg-blue-600': inspection.status === 'Em Andamento',
            })}
          >
            {inspection.status}
          </Badge>
          <p className="text-xs text-muted-foreground">
            {inspection.auditor}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DataTableFilters({ table }: { table: TableType<any> }) {
  return (
    <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
      <Input
        placeholder="Filtrar por descrição..."
        value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
        onChange={(event) =>
          table.getColumn('description')?.setFilterValue(event.target.value)
        }
        className="w-full sm:max-w-sm"
      />
      
      <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
        <Select
          value={(table.getColumn('potential')?.getFilterValue() as string) ?? ''}
          onValueChange={(value) =>
            table.getColumn('potential')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Potencial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {PotentialLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
          onValueChange={(value) =>
            table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {StatusLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto hidden md:flex">
            Colunas <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id === 'riskType' ? 'Tipo de Risco' :
                   column.id === 'description' ? 'Descrição' :
                   column.id === 'correctiveAction' ? 'Ação Corretiva' :
                   column.id === 'potential' ? 'Potencial' :
                   column.id === 'status' ? 'Status' :
                   column.id === 'auditor' ? 'Auditor' :
                   column.id === 'date' ? 'Data' :
                   column.id === 'area' ? 'Área' :
                   column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    correctiveAction: false,
    auditor: false,
    riskType: false, // Hide on mobile by default
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const filteredInspections = table.getRowModel().rows.map(row => row.original as SafetyInspection);

  return (
    <div className="w-full space-y-4">
      <DataTableFilters table={table} />
      
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {filteredInspections.length > 0 ? (
          filteredInspections.map((inspection, index) => (
            <MobileInspectionCard key={inspection.id || index} inspection={inspection} />
          ))
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-24">
              <p className="text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="whitespace-nowrap">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="max-w-[200px]">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Nenhum resultado encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
        <p className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {data.length} resultados
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}

// Desktop optimized columns
export const columns: ColumnDef<SafetyInspection>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="whitespace-nowrap px-2 h-8"
        >
          Data
          <ArrowUpDown className="ml-2 h-3 w-3" />
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
    cell: ({ row }) => {
      const area = row.getValue('area') as string;
      return (
        <div className="max-w-[120px]">
          <span className="truncate block" title={area}>{area}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'riskType',
    header: 'Tipo de Risco',
    cell: ({ row }) => {
      const riskType = row.getValue('riskType') as string;
      if (riskType.length <= 25) {
        return <span>{riskType}</span>;
      }
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-pointer max-w-[150px] block truncate" title={riskType}>
                {riskType}
              </span>
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
    header: 'Descrição',
    cell: ({ row }) => {
      const description = row.getValue('description') as string;
      if (description.length <= 40) {
        return <span>{description}</span>;
      }
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-pointer max-w-[200px] block truncate" title={description}>
                {description}
              </span>
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
      if (action.length <= 40) {
        return <span>{action}</span>;
      }
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-pointer max-w-[200px] block truncate" title={action}>
                {action}
              </span>
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
          className={cn('text-xs whitespace-nowrap', {
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
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="whitespace-nowrap px-2 h-8"
      >
        Status
        <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          className={cn('text-xs whitespace-nowrap', {
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
    cell: ({ row }) => {
      const auditor = row.getValue('auditor') as string;
      return (
        <div className="max-w-[100px]">
          <span className="truncate block" title={auditor}>{auditor}</span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ActionsCell,
  },
];