'use client';

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';


const adminLoginSchema = z.object({
  password: z.string().min(1, 'A senha é obrigatória.'),
});

export default function LoginPage() {
  const router = useRouter();
  const { login, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('auditor');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const form = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      password: '',
    },
  });

  useEffect(() => {
    if (!authLoading && role) {
      router.replace('/dashboard');
    }
  }, [role, authLoading, router]);

  const handleAuditorLogin = async () => {
    setIsLoggingIn(true);
    const success = await login('auditor');
    if (success) {
      router.push('/dashboard');
    } else {
      toast({
        title: 'Falha no Login',
        description: 'Não foi possível entrar como auditor.',
        variant: 'destructive',
      });
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogin = async (values: z.infer<typeof adminLoginSchema>) => {
    setIsLoggingIn(true);
    const success = await login('admin', values.password);
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
      setIsLoggingIn(false);
    }
  };

  if (authLoading || (!authLoading && role)) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Mobile and Tablet Layout */}
      <div className="lg:hidden">
        <div className="flex min-h-screen flex-col">
          {/* Header with branding - mobile */}
          <div className="bg-gradient-to-r from-primary to-primary/90 px-6 py-8 text-center text-primary-foreground">
            <div className="mx-auto max-w-sm">
              <Logo />
              <p className="mt-2 text-sm text-primary-foreground/90 sm:text-base">
                Segurança em primeiro lugar, sempre.
              </p>
            </div>
          </div>

          {/* Login form - mobile */}
          <div className="flex-1 px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-sm space-y-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="auditor" className="text-sm">
                    Auditor
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="text-sm">
                    Admin
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="auditor" className="mt-0">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="space-y-2 pb-4">
                      <CardTitle className="text-lg">Login como Auditor</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        Acesso para registro e consulta de inspeções de segurança.
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2">
                      <Button 
                        className="w-full h-11 font-medium" 
                        onClick={handleAuditorLogin}
                        disabled={isLoggingIn}
                      >
                         {isLoggingIn && activeTab === 'auditor' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Entrando...
                            </>
                          ) : (
                            'Entrar como Auditor'
                          )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="admin" className="mt-0">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAdminLogin)}>
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="space-y-2 pb-4">
                          <CardTitle className="text-lg">Login como Admin</CardTitle>
                          <CardDescription className="text-sm leading-relaxed">
                            Acesso total ao sistema, incluindo configurações.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pb-4">
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  Senha
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="Digite a senha de admin"
                                    className="h-11"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Button 
                            type="submit" 
                            className="w-full h-11 font-medium" 
                            disabled={isLoggingIn}
                          >
                             {isLoggingIn && activeTab === 'admin' ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Entrando...
                              </>
                            ) : (
                              'Entrar como Admin'
                            )}
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
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:min-h-screen lg:grid-cols-2">
        {/* Left panel - branding */}
        <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 flex flex-col items-center justify-center p-12 text-primary-foreground">
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
          <div className="relative z-10 text-center max-w-md">
            <Logo size="large" />
            <p className="mt-4 text-xl text-primary-foreground/90 leading-relaxed">
              Segurança em primeiro lugar, sempre.
            </p>
          </div>
        </div>

        {/* Right panel - login form */}
        <div className="flex items-center justify-center bg-muted/30 p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight">
                Bem-vindo de volta
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Escolha seu tipo de acesso para continuar
              </p>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8 p-1 h-11">
                <TabsTrigger 
                  value="auditor" 
                  className="font-medium data-[state=active]:bg-background"
                >
                  Auditor
                </TabsTrigger>
                <TabsTrigger 
                  value="admin" 
                  className="font-medium data-[state=active]:bg-background"
                >
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="auditor" className="mt-0">
                <Card className="border-0 shadow-lg bg-background">
                  <CardHeader className="space-y-3 pb-6">
                    <CardTitle className="text-xl">Login como Auditor</CardTitle>
                    <CardDescription className="leading-relaxed">
                      Acesso para registro e consulta de inspeções de segurança.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      className="w-full h-12 text-base font-medium" 
                      onClick={handleAuditorLogin}
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn && activeTab === 'auditor' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Entrando...
                            </>
                          ) : (
                            'Entrar como Auditor'
                          )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="admin" className="mt-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAdminLogin)}>
                    <Card className="border-0 shadow-lg bg-background">
                      <CardHeader className="space-y-3 pb-6">
                        <CardTitle className="text-xl">Login como Admin</CardTitle>
                        <CardDescription className="leading-relaxed">
                          Acesso total ao sistema, incluindo configurações e relatórios.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 pb-6">
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">
                                Senha do Administrador
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Digite a senha de administrador"
                                  className="h-12 text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                      <CardFooter>
                        <Button 
                          type="submit" 
                          className="w-full h-12 text-base font-medium" 
                          disabled={isLoggingIn}
                        >
                          {isLoggingIn && activeTab === 'admin' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Entrando...
                            </>
                          ) : (
                            'Entrar como Admin'
                          )}
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
    </div>
  );
}
