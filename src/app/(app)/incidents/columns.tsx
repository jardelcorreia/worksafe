'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
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
import type { SafetyIncident } from '@/lib/types';
import { cn } from '@/lib/utils';

export const columns: ColumnDef<SafetyIncident>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => new Date(row.getValue('date')).toLocaleDateString(),
  },
  {
    accessorKey: 'area',
    header: 'Area',
  },
  {
    accessorKey: 'riskType',
    header: 'Risk Type',
  },
  {
    accessorKey: 'potential',
    header: 'Potential',
    cell: ({ row }) => {
      const potential = row.getValue('potential') as string;
      return (
        <Badge
          variant="outline"
          className={cn({
            'border-red-500 text-red-500': potential === 'High',
            'border-yellow-500 text-yellow-500': potential === 'Medium',
            'border-green-500 text-green-500': potential === 'Low',
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
            'bg-green-600': status === 'Resolved',
            'bg-blue-600': status === 'In Progress',
            'bg-gray-600': status === 'Satisfactory',
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
    cell: ({ row }) => {
      const incident = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(incident.id)}
            >
              Copy Incident ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
