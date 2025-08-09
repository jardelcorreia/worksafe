'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { addRiskType, deleteRiskType } from '@/lib/actions';
import { riskTypes as initialRiskTypes } from '@/lib/data';
import { riskTypeSchema } from '@/lib/types';
import type { RiskType } from '@/lib/types';

export default function RiskTypesPage() {
  const { toast } = useToast();
  const [riskTypes, setRiskTypes] = useState<RiskType[]>(initialRiskTypes);

  const form = useForm<z.infer<typeof riskTypeSchema>>({
    resolver: zodResolver(riskTypeSchema),
    defaultValues: {
      name: '',
    },
  });

  async function handleAddRiskType(values: z.infer<typeof riskTypeSchema>) {
    const newRiskType = { id: Date.now().toString(), name: values.name };
    setRiskTypes((prev) => [...prev, newRiskType]);
    form.reset();
    const result = await addRiskType(newRiskType);
    if (!result.success) {
      toast({
        title: 'Error',
        description: 'Failed to add risk type.',
        variant: 'destructive',
      });
      setRiskTypes((prev) => prev.filter((rt) => rt.id !== newRiskType.id));
    } else {
        toast({
            title: 'Success',
            description: 'Risk Type added successfully.',
        });
    }
  }

  async function handleDeleteRiskType(id: string) {
    const originalRiskTypes = riskTypes;
    setRiskTypes((prev) => prev.filter((rt) => rt.id !== id));
    const result = await deleteRiskType(id);
    if (!result.success) {
      toast({
        title: 'Error',
        description: 'Failed to delete risk type.',
        variant: 'destructive',
      });
      setRiskTypes(originalRiskTypes);
    } else {
      toast({
        title: 'Success',
        description: 'Risk Type deleted successfully.',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Risk Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddRiskType)}
              className="flex items-end gap-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Risk Type Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Chemical Spill" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Adding...' : 'Add Risk Type'}
              </Button>
            </form>
          </Form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskTypes.map((riskType) => (
                  <TableRow key={riskType.id}>
                    <TableCell>{riskType.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRiskType(riskType.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
