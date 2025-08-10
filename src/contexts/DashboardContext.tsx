
'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import {
    analyzeTrends,
    riskForecaster,
    fetchInspections,
    type AnalyzeTrendsOutput,
    type RiskForecasterOutput,
} from '@/lib/actions';
import type { SafetyInspection } from '@/lib/types';

interface DashboardContextType {
    trends: AnalyzeTrendsOutput | null;
    forecast: RiskForecasterOutput | null;
    inspections: SafetyInspection[];
    loading: boolean;
    hasData: boolean;
    analysisPerformed: boolean; // Novo estado para controlar se a análise foi feita
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    getAIFeatures: (filterDate?: DateRange) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [trends, setTrends] = useState<AnalyzeTrendsOutput | null>(null);
    const [forecast, setForecast] = useState<RiskForecasterOutput | null>(null);
    const [inspections, setInspections] = useState<SafetyInspection[]>([]);
    const [loading, setLoading] = useState(false); // Inicia como falso
    const [hasData, setHasData] = useState(false);
    const [analysisPerformed, setAnalysisPerformed] = useState(false); // Novo estado
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const getInspectionsForDateRange = useCallback(async (filterDate?: DateRange) => {
        setLoading(true);
        // Limpa os resultados da IA sempre que o período de data muda
        setTrends(null);
        setForecast(null);
        setAnalysisPerformed(false);
        try {
            const inspectionsData = await fetchInspections({
                from: filterDate?.from,
                to: filterDate?.to
            });
            setInspections(inspectionsData);
            setHasData(inspectionsData.length > 0);
        } catch (error) {
            console.error('Falha ao buscar inspeções:', error);
            setInspections([]);
            setHasData(false);
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Efeito para buscar os dados de inspeção quando o período de data muda
    useEffect(() => {
        getInspectionsForDateRange(date);
    }, [date, getInspectionsForDateRange]);


    const getAIFeatures = useCallback(async (filterDate?: DateRange) => {
        // Usa as inspeções já carregadas que correspondem ao período
        if (inspections.length === 0) {
            setHasData(false);
            setTrends(null);
            setForecast(null);
            setAnalysisPerformed(true); // Marca que a tentativa foi feita
            return;
        }

        setLoading(true);
        setAnalysisPerformed(true);
        setTrends(null);
        setForecast(null);
        
        try {
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
        } catch (error) {
            console.error('Falha ao buscar dados para o dashboard:', error);
            setHasData(false);
        } finally {
            setLoading(false);
        }
    }, [inspections]);


    const value = {
        trends,
        forecast,
        inspections,
        loading,
        hasData,
        date,
        setDate,
        getAIFeatures,
        analysisPerformed
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
