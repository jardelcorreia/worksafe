
'use client';

import * as React from 'react';
import Link from 'next/link';
import { PlusCircle, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchInspections } from '@/lib/actions';
import { columns, DataTable } from './data-table';
import type { SafetyInspection } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function InspectionsPage() {
  const [data, setData] = React.useState<SafetyInspection[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadInspections() {
      setLoading(true);
      try {
        const inspectionsData = await fetchInspections();
        setData(inspectionsData);
      } catch (error) {
        console.error("Failed to fetch inspections", error);
        // Optionally, show a toast message here
      } finally {
        setLoading(false);
      }
    }
    loadInspections();
  }, []);
  

  if (loading) {
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
            <Card>
                <CardContent className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {/* Botão para Desktop */}
        <Button asChild className="hidden md:inline-flex">
          <Link href="/inspections/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Nova Inspeção
          </Link>
        </Button>
      </div>

      <DataTable columns={columns} data={data} setData={setData} />

      {/* Botão Flutuante para Mobile */}
      <Button
        asChild
        className={cn(
          "md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg",
          "flex items-center justify-center"
        )}
      >
        <Link href="/inspections/new">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Adicionar Nova Inspeção</span>
        </Link>
      </Button>
    </div>
  );
}
