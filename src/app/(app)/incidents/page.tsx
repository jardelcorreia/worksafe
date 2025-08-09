import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { incidents } from '@/lib/data';
import { columns } from './columns';
import { DataTable } from './data-table';

export default async function IncidentsPage() {
  const data = incidents;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button asChild>
          <Link href="/incidents/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Novo Incidente
          </Link>
        </Button>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
