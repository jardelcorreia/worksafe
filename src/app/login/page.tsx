'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';

const adminLoginSchema = z.object({
  password: z.string().min(1, 'A senha é obrigatória.'),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('auditor');

  const form = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      password: '',
    },
  });

  const handleAuditorLogin = () => {
    login('auditor');
    router.push('/dashboard');
  };

  const handleAdminLogin = (values: z.infer<typeof adminLoginSchema>) => {
    const success = login('admin', values.password);
    if (success) {
      router.push('/dashboard');
    } else {
      toast({
        title: 'Senha Incorreta',
        description: 'A senha de administrador está incorreta.',
        variant: 'destructive',
      });
      form.setError('password', {
        type: 'manual',
        message: 'Senha incorreta.',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
           <Logo />
        </div>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="auditor">Auditor</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>
        <TabsContent value="auditor">
          <Card>
            <CardHeader>
              <CardTitle>Login como Auditor</CardTitle>
              <CardDescription>
                Acesso para registro e consulta de inspeções de segurança.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={handleAuditorLogin}>
                Entrar como Auditor
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="admin">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAdminLogin)}>
              <Card>
                <CardHeader>
                  <CardTitle>Login como Admin</CardTitle>
                  <CardDescription>
                    Acesso total ao sistema, incluindo configurações.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Digite a senha de admin"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Entrando...' : 'Entrar como Admin'}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
