
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
    analysisPerformed: boolean;
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    getAIFeatures: (filterDate?: DateRange) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [trends, setTrends] = useState<AnalyzeTrendsOutput | null>(null);
    const [forecast, setForecast] = useState<RiskForecasterOutput | null>(null);
    const [inspections, setInspections] = useState<SafetyInspection[]>([]);
    const [loading, setLoading] = useState(false); // Only true during AI analysis
    const [hasData, setHasData] = useState(false);
    const [analysisPerformed, setAnalysisPerformed] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const getInspectionsForDateRange = useCallback(async (filterDate?: DateRange) => {
        setLoading(true);
        // Reset previous results
        setTrends(null);
        setForecast(null);
        setHasData(false);
        setAnalysisPerformed(false);
        try {
            const inspectionsData = await fetchInspections({
                from: filterDate?.from,
                to: filterDate?.to
            });
            setInspections(inspectionsData);
            if (inspectionsData.length > 0) {
                setHasData(true);
            }
        } catch (error) {
            console.error('Falha ao buscar inspeções:', error);
            setInspections([]);
            setHasData(false);
        } finally {
            setLoading(false);
        }
    }, []);

    const getAIFeatures = useCallback(async (filterDate?: DateRange) => {
        setLoading(true);
        setAnalysisPerformed(true);
        setTrends(null);
        setForecast(null);
        
        try {
            // Re-fetch inspections for the selected range to ensure data is current
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
            setHasData(false);
        } finally {
            setLoading(false);
        }
    }, []);

    // This useEffect will run ONLY ONCE to load the initial inspection data without AI analysis.
    useEffect(() => {
        getInspectionsForDateRange(date);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);


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
