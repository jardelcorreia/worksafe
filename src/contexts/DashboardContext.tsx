'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import {
    analyzeTrends,
    riskForecaster,
    fetchInspections,
    type AnalyzeTrendsOutput,
    type RiskForecasterOutput,
} from '@/lib/actions';
import type { SafetyInspection } from '@/lib/types';

interface CachedData {
    trends: AnalyzeTrendsOutput;
    forecast: RiskForecasterOutput;
    inspectionCount: number;
    timestamp: number;
}
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

const CACHE_KEY_PREFIX = 'worksafe-ai-cache-';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [trends, setTrends] = useState<AnalyzeTrendsOutput | null>(null);
    const [forecast, setForecast] = useState<RiskForecasterOutput | null>(null);
    const [inspections, setInspections] = useState<SafetyInspection[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [analysisPerformed, setAnalysisPerformed] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>(() => {
        try {
            const savedDate = localStorage.getItem('worksafe-date-range');
            if (savedDate) {
                const { from, to } = JSON.parse(savedDate);
                return { from: new Date(from), to: new Date(to) };
            }
        } catch (error) {
            console.error("Failed to parse date from localStorage", error);
        }
        return { from: addDays(new Date(), -7), to: new Date() };
    });

    const getCacheKey = (d: DateRange | undefined): string => {
        if (!d?.from || !d?.to) return '';
        const from = startOfDay(d.from).toISOString().split('T')[0];
        const to = endOfDay(d.to).toISOString().split('T')[0];
        return `${CACHE_KEY_PREFIX}${from}_${to}`;
    }

    const getInspectionsForDateRange = useCallback(async (filterDate?: DateRange) => {
        setLoading(true);
        setTrends(null);
        setForecast(null);
        setAnalysisPerformed(false);
        try {
            const inspectionsData = await fetchInspections({
                from: filterDate?.from,
                to: filterDate?.to
            });
            const currentHasData = inspectionsData.length > 0;
            setInspections(inspectionsData);
            setHasData(currentHasData);

            // Try to load from cache after fetching inspections
            if (currentHasData) {
                const cacheKey = getCacheKey(filterDate);
                try {
                    const cachedItem = localStorage.getItem(cacheKey);
                    if (cachedItem) {
                        const cachedData: CachedData = JSON.parse(cachedItem);
                        const isCacheValid = (
                            cachedData.inspectionCount === inspectionsData.length &&
                            (Date.now() - cachedData.timestamp) < CACHE_TTL
                        );

                        if (isCacheValid) {
                            setTrends(cachedData.trends);
                            setForecast(cachedData.forecast);
                            setAnalysisPerformed(true);
                        }
                    }
                } catch (error) {
                    console.error("Failed to read from cache", error);
                }
            }

        } catch (error) {
            console.error('Falha ao buscar inspeções:', error);
            setInspections([]);
            setHasData(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (date) {
            try {
                localStorage.setItem('worksafe-date-range', JSON.stringify(date));
            } catch (error) {
                console.error("Failed to save date to localStorage", error);
            }
            getInspectionsForDateRange(date);
        }
    }, [date, getInspectionsForDateRange]);


    const getAIFeatures = useCallback(async (filterDate?: DateRange) => {
        if (inspections.length === 0) {
            setHasData(false);
            setTrends(null);
            setForecast(null);
            setAnalysisPerformed(true);
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
                
                // Save to cache on successful analysis
                const cacheKey = getCacheKey(filterDate);
                const cacheData: CachedData = {
                    trends: trendData,
                    forecast: forecastData,
                    inspectionCount: inspections.length,
                    timestamp: Date.now()
                };
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
                } catch (error) {
                    console.error("Failed to save to cache", error);
                }
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
