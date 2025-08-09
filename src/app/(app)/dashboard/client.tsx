
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ListChecks,
  Loader2,
  Info,
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
import { analyzeTrends, riskForecaster, fetchIncidents } from '@/lib/actions';
import type {
  AnalyzeTrendsOutput,
  RiskForecasterOutput,
} from '@/lib/actions';
import type { SafetyIncident } from '@/lib/types';

export function DashboardClient() {
  const [trends, setTrends] = useState<AnalyzeTrendsOutput | null>(null);
  const [forecast, setForecast] = useState<RiskForecasterOutput | null>(null);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    async function getAIFeatures() {
      setLoading(true);
      try {
        const incidentsData = await fetchIncidents();
        setIncidents(incidentsData);

        if (incidentsData.length > 0) {
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

  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter(
    (i) => i.status === 'Resolvido'
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
              Total de Incidentes
            </CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIncidents}</div>
            <p className="text-xs text-muted-foreground">
              Total de incidentes registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Incidentes Resolvidos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedIncidents}</div>
            <p className="text-xs text-muted-foreground">
              {totalIncidents > 0 ? ((resolvedIncidents / totalIncidents) * 100).toFixed(1) : 0}% resolvidos
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
                Ainda não há incidentes registrados. Assim que o primeiro incidente for adicionado, os insights de IA aparecerão aqui.
            </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Áreas com Maior Frequência de Incidentes</CardTitle>
              <CardDescription>
                Principais áreas onde ocorrem incidentes de segurança.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: 'Incidentes',
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
                Principais tipos de riscos identificados nos incidentes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: 'Incidentes',
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
                Potenciais futuros incidentes de segurança com base nas tendências.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2">Incidentes Previstos:</h4>
              <p className="text-sm mb-4">{forecast?.predictedIncidents}</p>
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
                Ações sugeridas para mitigar os incidentes previstos.
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

    