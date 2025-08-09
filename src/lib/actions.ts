'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { analyzeTrends as analyzeTrendsFlow } from '@/ai/flows/trend-spotter';
import { riskForecaster as riskForecasterFlow } from '@/ai/flows/risk-forecaster';
import { incidents, auditors } from './data';
import type { SafetyIncident, Auditor } from './types';
import { incidentSchema, auditorSchema } from './types';

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

export async function addAuditor(data: z.infer<typeof auditorSchema>) {
  const newAuditor: Auditor = {
    id: String(auditors.length + 1),
    name: data.name,
  };
  auditors.push(newAuditor);
  revalidatePath('/admin/auditors');
  return { success: true, message: 'Auditor added successfully.' };
}

export async function deleteAuditor(id: string) {
  const index = auditors.findIndex((a) => a.id === id);
  if (index !== -1) {
    auditors.splice(index, 1);
    revalidatePath('/admin/auditors');
    return { success: true, message: 'Auditor deleted successfully.' };
  }
  return { success: false, message: 'Auditor not found.' };
}
