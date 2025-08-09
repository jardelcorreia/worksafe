import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchInspections } from '@/lib/actions';
import { columns } from './columns';
import { DataTable } from './data-table';

export default async function InspectionsPage() {
  const data = await fetchInspections();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button asChild>
          <Link href="/inspections/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Nova Inspeção
          </Link>
        </Button>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
