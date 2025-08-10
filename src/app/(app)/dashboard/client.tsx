
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
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
import { analyzeTrends, riskForecaster, fetchInspections } from '@/lib/actions';
import type {
  AnalyzeTrendsOutput,
  RiskForecasterOutput,
} from '@/lib/actions';
import type { SafetyInspection } from '@/lib/types';
import { cn } from '@/lib/utils';


export function DashboardClient() {
  const [trends, setTrends] = useState<AnalyzeTrendsOutput | null>(null);
  const [forecast, setForecast] = useState<RiskForecasterOutput | null>(null);
  const [inspections, setInspections] = useState<SafetyInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const getAIFeatures = useCallback(async (filterDate?: DateRange) => {
      setLoading(true);
      // Reset previous results for a clean analysis
      setTrends(null);
      setForecast(null);
      setHasData(false);
      try {
        const inspectionsData = await fetchInspections({
            from: filterDate?.from,
            to: filterDate?.to
        });
        setInspections(inspectionsData);

        if (inspectionsData.length > 0) {
          setHasData(true);
          const trendData = await analyzeTrends({
            from: filterDate?.from,
            to: filterDate?.to
          });
          setTrends(trendData);

          if (trendData?.riskSummary) {
            const forecastData = await riskForecaster(trendData.riskSummary, {
                from: filterDate?.from,
                to: filterDate?.to
            });
            setForecast(forecastData);
          }
        } else {
          setHasData(false);
        }
      } catch (error) {
        console.error('Falha ao buscar dados para o dashboard:', error);
      } finally {
        setLoading(false);
      }
    }, []);

  // This useEffect will run ONLY ONCE when the component first loads.
  useEffect(() => {
    getAIFeatures(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const areaChartData = useMemo(
    () => trends?.mostFrequentAreas || [],
    [trends]
  );
  const riskTypeChartData = useMemo(
    () => trends?.mostFrequentRiskTypes || [],
    [trends]
  );

  return (
    <div className="grid gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <Popover>
            <PopoverTrigger asChild>
                <Button
                id="date"
                variant={'outline'}
                className={cn(
                    'w-full sm:w-[300px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                    date.to ? (
                    <>
                        {format(date.from, 'LLL dd, y', { locale: ptBR })} -{' '}
                        {format(date.to, 'LLL dd, y', { locale: ptBR })}
                    </>
                    ) : (
                    format(date.from, 'LLL dd, y', { locale: ptBR })
                    )
                ) : (
                    <span>Escolha um período</span>
                )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={ptBR}
                />
            </PopoverContent>
            </Popover>
            <Button onClick={() => getAIFeatures(date)} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Analisar Período
            </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Inspeções
            </CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInspections}</div>
            <p className="text-xs text-muted-foreground">
              Total de inspeções registradas no período
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inspeções Resolvidas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedInspections}</div>
            <p className="text-xs text-muted-foreground">
              {totalInspections > 0 ? ((resolvedInspections / totalInspections) * 100).toFixed(1) : 0}% resolvidas
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspeções Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInspections}</div>
             <p className="text-xs text-muted-foreground">
              Inspeções com status "Em Andamento"
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alto Potencial</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPotentialInspections}</div>
            <p className="text-xs text-muted-foreground">
              Inspeções classificadas como "Alto"
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-lg">Analisando dados...</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Áreas com Maior Frequência de Inspeções</CardTitle>
              <CardDescription>
                Principais áreas onde ocorrem inspeções de segurança.
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
                <BarChart data={areaChartData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="area"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Risco Mais Frequentes</CardTitle>
              <CardDescription>
                Principais tipos de riscos identificados nas inspeções.
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
                <BarChart data={riskTypeChartData} layout="vertical" accessibilityLayer>
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="riskType" type="category" tickLine={false} tickMargin={10} axisLine={false} width={150} />
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
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumo de Tendências por IA</CardTitle>
              <CardDescription>
                Tendências gerais de risco e potenciais áreas para melhoria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{trends?.riskSummary}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive" /> Alertas Preditivos de Risco
              </CardTitle>
              <CardDescription>
                Potenciais futuros problemas de segurança com base nas tendências.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2">Problemas Previstos:</h4>
              <p className="text-sm mb-4">{forecast?.predictedIssues}</p>
              <h4 className="font-semibold mb-2">Justificativa:</h4>
              <p className="text-sm">{forecast?.reasoning}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="text-primary" /> Ações Preventivas
              </CardTitle>
              <CardDescription>
                Ações sugeridas para mitigar os problemas previstos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{forecast?.preventativeActions}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
