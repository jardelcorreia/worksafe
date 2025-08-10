
'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, isSameDay } from 'date-fns';
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

const CACHE_KEY = 'dashboardAnalysisCache';

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [trends, setTrends] = useState<AnalyzeTrendsOutput | null>(null);
    const [forecast, setForecast] = useState<RiskForecasterOutput | null>(null);
    const [inspections, setInspections] = useState<SafetyInspection[]>([]);
    const [loading, setLoading] = useState(true); // Start with loading true for initial fetch
    const [hasData, setHasData] = useState(false);
    const [analysisPerformed, setAnalysisPerformed] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const getInspectionsForDateRange = useCallback(async (filterDate?: DateRange) => {
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
        }
    }, []);
    
    // Effect to load initial data and check cache
    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            
            // Try to load from cache first
            try {
                const cachedData = localStorage.getItem(CACHE_KEY);
                if (cachedData && date?.from && date?.to) {
                    const { trends, forecast, from, to } = JSON.parse(cachedData);
                    // Check if cache is for the same date range
                    if (isSameDay(new Date(from), date.from) && isSameDay(new Date(to), date.to)) {
                        setTrends(trends);
                        setForecast(forecast);
                        setAnalysisPerformed(true);
                    } else {
                        // Clear cache if dates are different
                        localStorage.removeItem(CACHE_KEY);
                        setAnalysisPerformed(false);
                        setTrends(null);
                        setForecast(null);
                    }
                }
            } catch (e) {
                console.error("Failed to read from localStorage", e);
                setAnalysisPerformed(false);
            }

            await getInspectionsForDateRange(date);
            setLoading(false);
        };
        
        loadDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);


    const getAIFeatures = useCallback(async (filterDate?: DateRange) => {
        setLoading(true);
        setAnalysisPerformed(true);
        setTrends(null);
        setForecast(null);
        
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

                    // Cache the new results
                    try {
                        const cachePayload = {
                            trends: trendData,
                            forecast: forecastData,
                            from: filterDate?.from,
                            to: filterDate?.to
                        };
                        localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
                    } catch (e) {
                         console.error("Failed to write to localStorage", e);
                    }
                }
            } else {
                setHasData(false);
                // Clear cache if no data found
                 try {
                    localStorage.removeItem(CACHE_KEY);
                } catch(e) {
                    console.error("Failed to remove from localStorage", e);
                }
            }
        } catch (error) {
            console.error('Falha ao buscar dados para o dashboard:', error);
            setHasData(false);
        } finally {
            setLoading(false);
        }
    }, []);


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
