
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
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    getAIFeatures: (filterDate?: DateRange) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
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

    // This useEffect will run ONLY ONCE when the provider first loads.
    useEffect(() => {
        getAIFeatures(date);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const value = {
        trends,
        forecast,
        inspections,
        loading,
        hasData,
        date,
        setDate,
        getAIFeatures
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
