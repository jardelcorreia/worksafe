
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
import { ShieldCheck } from 'lucide-react';

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
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="hidden bg-primary/90 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-10">
        <div className="text-center text-primary-foreground">
            <Logo />
            <h1 className="mt-4 text-4xl font-bold font-headline">WorkSafe</h1>
            <p className="mt-2 text-lg text-primary-foreground/80">
                Segurança em primeiro lugar, sempre.
            </p>
            <ShieldCheck className="mx-auto mt-10 h-32 w-32 text-primary-foreground/20" strokeWidth={1} />
        </div>
      </div>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
            <div className="lg:hidden text-center">
                <Logo />
            </div>
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
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
      </div>
    </div>
  );
}
