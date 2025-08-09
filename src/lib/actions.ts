'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { analyzeTrends as analyzeTrendsFlow } from '@/ai/flows/trend-spotter';
import { riskForecaster as riskForecasterFlow } from '@/ai/flows/risk-forecaster';
import { incidents } from './data';
import type { SafetyIncident } from './types';

// Export types for use in client components
export type { AnalyzeTrendsOutput } from '@/ai/flows/trend-spotter';
export type { RiskForecasterOutput } from '@/ai/flows/risk-forecaster';

// AI Actions
export async function analyzeTrends() {
  try {
    const aiInput = incidents.map((i) => ({
      área: i.area,
      tipoDeSituaçãoDeRisco: i.riskType,
      potencial: i.potential,
      descriçãoDaSituaçãoInsegura: i.description,
    }));
    const result = await analyzeTrendsFlow(aiInput);
    return result;
  } catch (error) {
    console.error('Error in analyzeTrends action:', error);
    return null;
  }
}

export async function riskForecaster(identifiedTrends: string) {
  try {
    const historicalData = incidents
      .map(
        (i) =>
          `On ${i.date} in ${i.area}, an incident of type '${i.riskType}' with ${i.potential} potential occurred. Description: ${i.description}`
      )
      .join('\n');

    const result = await riskForecasterFlow({
      historicalData,
      identifiedTrends,
    });
    return result;
  } catch (error) {
    console.error('Error in riskForecaster action:', error);
    return null;
  }
}

// Data Actions
export const incidentSchema = z.object({
  area: z.string().min(1, 'Area is required.'),
  auditor: z.string().min(1, 'Auditor is required.'),
  date: z.string(),
  riskType: z.string().min(1, 'Risk Type is required.'),
  potential: z.enum(['High', 'Medium', 'Low', 'No Deviation']),
  description: z.string().min(1, 'Description is required.'),
  responsible: z.string().min(1, 'Responsible person/action is required.'),
  deadline: z.string(),
  status: z.enum(['Resolved', 'In Progress', 'Satisfactory']),
});

export async function addIncident(data: z.infer<typeof incidentSchema>) {
  const newIncident: SafetyIncident = {
    ...data,
    id: String(incidents.length + 1),
    timestamp: new Date().toLocaleString('en-US'),
    date: new Date(data.date).toISOString().split('T')[0],
    deadline: new Date(data.deadline).toISOString().split('T')[0],
  };

  // In a real app, you'd save this to a database
  incidents.unshift(newIncident);
  revalidatePath('/incidents');
  revalidatePath('/dashboard');
  return { success: true, message: 'Incident added successfully.' };
}
