
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ListChecks,
  Loader2,
  Info,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

export function DashboardClient() {
  const [trends, setTrends] = useState<AnalyzeTrendsOutput | null>(null);
  const [forecast, setForecast] = useState<RiskForecasterOutput | null>(null);
  const [inspections, setInspections] = useState<SafetyInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    async function getAIFeatures() {
      setLoading(true);
      try {
        const inspectionsData = await fetchInspections();
        setInspections(inspectionsData);

        if (inspectionsData.length > 0) {
          setHasData(true);
          const trendData = await analyzeTrends();
          setTrends(trendData);

          if (trendData?.riskSummary) {
            const forecastData = await riskForecaster(trendData.riskSummary);
            setForecast(forecastData);
          }
        } else {
          setHasData(false);
        }
      } catch (error) {
        console.error('Erro ao obter recursos de IA:', error);
      } finally {
        setLoading(false);
      }
    }
    getAIFeatures();
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
              Total de inspeções registradas
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
                Ainda não há inspeções registradas. Assim que a primeira inspeção for adicionada, os insights de IA aparecerão aqui.
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
