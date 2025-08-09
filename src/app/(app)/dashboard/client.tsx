'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ListChecks,
  Loader2,
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
import { analyzeTrends, riskForecaster } from '@/lib/actions';
import type {
  AnalyzeTrendsOutput,
  RiskForecasterOutput,
} from '@/lib/actions';
import { incidents } from '@/lib/data';

export function DashboardClient() {
  const [trends, setTrends] = useState<AnalyzeTrendsOutput | null>(null);
  const [forecast, setForecast] = useState<RiskForecasterOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getAIFeatures() {
      setLoading(true);
      try {
        const trendData = await analyzeTrends();
        setTrends(trendData);

        if (trendData?.riskSummary) {
          const forecastData = await riskForecaster(trendData.riskSummary);
          setForecast(forecastData);
        }
      } catch (error) {
        console.error('Error getting AI features:', error);
      } finally {
        setLoading(false);
      }
    }
    getAIFeatures();
  }, []);

  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter(
    (i) => i.status === 'Resolved'
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
              Total Incidents
            </CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIncidents}</div>
            <p className="text-xs text-muted-foreground">
              Total incidents recorded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resolved Incidents
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedIncidents}</div>
            <p className="text-xs text-muted-foreground">
              {((resolvedIncidents / totalIncidents) * 100).toFixed(1)}% resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-lg">Analyzing data with AI...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Most Frequent Incident Areas</CardTitle>
              <CardDescription>
                Top areas where safety incidents occur.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: 'Incidents',
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
              <CardTitle>Most Frequent Risk Types</CardTitle>
              <CardDescription>
                Top types of risks identified in incidents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: 'Incidents',
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
              <CardTitle>AI Trend Summary</CardTitle>
              <CardDescription>
                Overall risk trends and potential areas for improvement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{trends?.riskSummary}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive" /> Predictive Risk
                Alerts
              </CardTitle>
              <CardDescription>
                Potential future safety incidents based on trends.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2">Predicted Incidents:</h4>
              <p className="text-sm mb-4">{forecast?.predictedIncidents}</p>
              <h4 className="font-semibold mb-2">Reasoning:</h4>
              <p className="text-sm">{forecast?.reasoning}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="text-primary" /> Preventative Actions
              </CardTitle>
              <CardDescription>
                Suggested actions to mitigate predicted incidents.
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
