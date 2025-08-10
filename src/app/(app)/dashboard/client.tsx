
'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ListChecks,
  Loader2,
  Info,
  ShieldAlert,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Text } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDashboard } from '@/contexts/DashboardContext';
import { cn } from '@/lib/utils';


const CustomizedYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const value = payload.value;
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const maxLength = isMobile ? 10 : 15;
    const truncatedValue = value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;

    return (
        <Text {...props} x={x} y={y} width={props.width} title={value} fontSize={11}>
            {truncatedValue}
        </Text>
    );
};


export function DashboardClient() {
  const {
    trends,
    forecast,
    inspections,
    loading,
    hasData,
    date,
    setDate,
    getAIFeatures,
  } = useDashboard();

  const totalInspections = inspections.length;
  const resolvedInspections = inspections.filter(
    (i) => i.status === 'Resolvido'
  ).length;
  const pendingInspections = inspections.filter(
    (i) => i.status === 'Em Andamento'
  ).length;
  const highPotentialInspections = inspections.filter(
    (i) => i.potential === 'Alto'
  ).length;

  const areaChartData = useMemo(() => {
    return trends?.mostFrequentAreas || [];
  }, [trends]);

  const riskTypeChartData = useMemo(() => {
    return trends?.mostFrequentRiskTypes || [];
  }, [trends]);

  return (
    <div className="grid gap-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Popover>
            <PopoverTrigger asChild>
                <Button
                id="date"
                variant={'outline'}
                className={cn(
                    'w-full sm:w-auto sm:max-w-xs justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span className="truncate">
                    {date?.from ? (
                        date.to ? (
                        <>
                            {format(date.from, 'dd/MM/yy', { locale: ptBR })} -{' '}
                            {format(date.to, 'dd/MM/yy', { locale: ptBR })}
                        </>
                        ) : (
                        format(date.from, 'LLL dd, y', { locale: ptBR })
                        )
                    ) : (
                        <span>Escolha um período</span>
                    )}
                </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={1}
                    className="md:hidden"
                    locale={ptBR}
                />
                 <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    className="hidden md:block"
                    locale={ptBR}
                />
            </PopoverContent>
            </Popover>
            <Button onClick={() => getAIFeatures(date)} disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Analisar Período
            </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Inspeções
            </CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInspections}</div>
            <p className="text-xs text-muted-foreground">
              Total de inspeções no período
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inspeções Resolvidas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedInspections}</div>
            <p className="text-xs text-muted-foreground">
              {totalInspections > 0 ? ((resolvedInspections / totalInspections) * 100).toFixed(1) : 0}% resolvidas
            </p>
          </CardContent>
        </Card>
         <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspeções Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingInspections}</div>
             <p className="text-xs text-muted-foreground">
              Inspeções "Em Andamento"
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alto Potencial</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highPotentialInspections}</div>
            <p className="text-xs text-muted-foreground">
              Inspeções com risco "Alto"
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium">Analisando dados...</p>
          <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
        </div>
      ) : !hasData ? (
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Nenhum dado para analisar</AlertTitle>
            <AlertDescription>
                Não foram encontradas inspeções para o período selecionado. Por favor, ajuste as datas e tente novamente.
            </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Áreas com Maior Frequência</CardTitle>
              <CardDescription>
                Principais áreas onde ocorrem inspeções.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: 'Inspeções',
                    color: 'hsl(var(--primary))',
                  },
                }}
                className="h-[300px] w-full"
              >
                <BarChart data={areaChartData} accessibilityLayer margin={{ bottom: 50 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="area"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Tipos de Risco Mais Frequentes</CardTitle>
              <CardDescription>
                Principais riscos identificados nas inspeções.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: 'Inspeções',
                    color: 'hsl(var(--accent))',
                  },
                }}
                className="h-[300px] w-full"
              >
                <BarChart data={riskTypeChartData} layout="vertical" accessibilityLayer margin={{ left: 10 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis 
                    dataKey="riskType" 
                    type="category" 
                    tickLine={false} 
                    tickMargin={5} 
                    axisLine={false} 
                    width={80}
                    interval={0}
                    tick={<CustomizedYAxisTick />}
                  />
                  <XAxis type="number" hide />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Resumo de Tendências por IA</CardTitle>
              <CardDescription>
                Análise de tendências gerais de risco e melhorias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{trends?.riskSummary}</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <AlertTriangle className="text-destructive" /> Alertas Preditivos de Risco
              </CardTitle>
              <CardDescription>
                Potenciais futuros problemas de segurança.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1 text-sm">Problemas Previstos:</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{forecast?.predictedIssues}</p>
              </div>
               <div>
                <h4 className="font-semibold mb-1 text-sm">Justificativa:</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{forecast?.reasoning}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <BarChart2 className="text-primary" /> Ações Preventivas
              </CardTitle>
              <CardDescription>
                Ações sugeridas para mitigar os problemas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{forecast?.preventativeActions}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
