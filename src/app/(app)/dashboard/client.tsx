
'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
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
  Sparkles,
  Plus,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Text } from 'recharts';
import { format, subMonths } from 'date-fns';
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
import { useIsMobile } from '@/hooks/use-mobile';


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
    analysisPerformed,
  } = useDashboard();
  const isMobile = useIsMobile();

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
    <div className="w-full max-w-7xl mx-auto">
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-full sm:w-[280px] md:w-[320px] justify-start text-left font-normal h-11 px-3',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-sm">
                    {date?.from ? (
                      date.to ? (
                        <>
                          <span className="block sm:hidden">
                            {format(date.from, 'dd/MM/yy', { locale: ptBR })} - {format(date.to, 'dd/MM/yy', { locale: ptBR })}
                          </span>
                           <span className="hidden sm:block">
                            {format(date.from, 'dd/MM/yyyy', { locale: ptBR })} - {format(date.to, 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </>
                      ) : (
                        format(date.from, 'dd/MM/yyyy', { locale: ptBR })
                      )
                    ) : (
                      <span>Selecionar período</span>
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={
                    isMobile 
                      ? date?.from 
                      : (date?.from ? subMonths(date.from, 1) : undefined)
                  }
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={isMobile ? 1 : 2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              onClick={() => getAIFeatures(date)} 
              disabled={loading} 
              className="w-full sm:w-auto whitespace-nowrap h-11 px-4 font-medium"
              size="default"
            >
              {loading && analysisPerformed ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4 flex-shrink-0" />
              )}
              <span className="truncate">Analisar com IA</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                Total de Inspeções
              </CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold">{totalInspections}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">
                Total no período
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                Resolvidas
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{resolvedInspections}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">
                {totalInspections > 0 ? ((resolvedInspections / totalInspections) * 100).toFixed(1) : 0}% concluídas
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{pendingInspections}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">
                Em andamento
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Alto Risco</CardTitle>
              <ShieldAlert className="h-4 w-4 text-red-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{highPotentialInspections}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">
                Potencial alto
              </p>
            </CardContent>
          </Card>
        </div>

        {loading && !analysisPerformed ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 md:p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-base md:text-lg text-center">Carregando inspeções...</p>
          </div>
        ) : loading && analysisPerformed ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 md:p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-base md:text-lg text-center">Analisando dados...</p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              A IA está processando as informações, isso pode levar alguns segundos
            </p>
          </div>
        ) : !analysisPerformed ? (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Pronto para análise</AlertTitle>
              <AlertDescription className="text-sm">
                {!hasData
                  ? 'Não há dados no período selecionado. Ajuste as datas e tente novamente.'
                  : 'Clique no botão "Analisar com IA" para gerar gráficos e insights sobre o período selecionado.'
                }
              </AlertDescription>
            </Alert>
        ) : !hasData ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Nenhum dado disponível</AlertTitle>
            <AlertDescription className="text-sm">
              Não foram encontradas inspeções para o período selecionado. 
              Ajuste as datas e tente novamente.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4 md:space-y-6 w-full">
            <div className="grid gap-4 md:gap-6 lg:grid-cols-2 w-full">
              <Card className="hover:shadow-md transition-shadow min-w-0">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="truncate">
                    Áreas Mais Inspecionadas
                  </CardTitle>
                  <CardDescription>
                    Principais áreas de inspeções
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <ChartContainer
                    config={{
                      count: {
                        label: 'Inspeções',
                        color: 'hsl(var(--primary))',
                      },
                    }}
                    className="h-[200px] sm:h-[250px] md:h-[300px] w-full"
                  >
                    <BarChart 
                      data={areaChartData} 
                      accessibilityLayer
                      margin={{ top: 5, right: 5, left: 5, bottom: 50 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="area"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        fontSize={10}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        interval={0}
                      />
                      <YAxis 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow min-w-0">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="truncate">
                    Tipos de Risco
                  </CardTitle>
                  <CardDescription>
                    Principais riscos identificados
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <ChartContainer
                    config={{
                      count: {
                        label: 'Inspeções',
                        color: 'hsl(var(--accent))',
                      },
                    }}
                    className="h-[200px] sm:h-[250px] md:h-[300px] w-full"
                  >
                    <BarChart 
                      data={riskTypeChartData} 
                      layout="vertical" 
                      accessibilityLayer
                      margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <YAxis 
                        dataKey="riskType" 
                        type="category" 
                        tickLine={false} 
                        tickMargin={8} 
                        axisLine={false} 
                        width={80}
                        fontSize={9}
                        tick={<CustomizedYAxisTick />}
                      />
                      <XAxis 
                        type="number" 
                        hide 
                      />
                      <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="var(--color-count)" 
                        radius={[0, 2, 2, 0]} 
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="hover:shadow-md transition-shadow w-full">
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle>
                  Resumo de Tendências por IA
                </CardTitle>
                <CardDescription>
                  Análise inteligente de riscos
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm leading-relaxed">{trends?.riskSummary}</p>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:gap-6 lg:grid-cols-2 w-full">
              <Card className="hover:shadow-md transition-shadow min-w-0">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="text-destructive h-4 w-4 flex-shrink-0" /> 
                    <span className="truncate">Alertas Preditivos</span>
                  </CardTitle>
                  <CardDescription>
                    Problemas previstos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Problemas Previstos:</h4>
                    <p className="text-sm leading-relaxed">{forecast?.predictedIssues}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Justificativa:</h4>
                    <p className="text-sm leading-relaxed">{forecast?.reasoning}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow min-w-0">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="text-primary h-4 w-4 flex-shrink-0" /> 
                    <span className="truncate">Ações Preventivas</span>
                  </CardTitle>
                  <CardDescription>
                    Medidas sugeridas
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm leading-relaxed">{forecast?.preventativeActions}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

       {/* Botão Flutuante para Mobile */}
       <Button
        asChild
        className={cn(
          "md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg",
          "flex items-center justify-center z-50"
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
