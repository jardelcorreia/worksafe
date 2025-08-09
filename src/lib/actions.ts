'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { analyzeTrends as analyzeTrendsFlow } from '@/ai/flows/trend-spotter';
import { riskForecaster as riskForecasterFlow } from '@/ai/flows/risk-forecaster';
import { incidents, auditors, areas, riskTypes } from './data';
import type { SafetyIncident, Auditor, Area, RiskType } from './types';
import { incidentSchema, auditorSchema, areaSchema, riskTypeSchema } from './types';

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
          `Em ${i.date} em ${i.area}, ocorreu um incidente do tipo '${i.riskType}' com potencial ${i.potential}. Descrição: ${i.description}`
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

// Incident Actions
export async function addIncident(data: z.infer<typeof incidentSchema>) {
  const newIncident: SafetyIncident = {
    ...data,
    id: String(incidents.length + 1),
    timestamp: new Date().toLocaleString('en-US'),
    date: new Date(data.date).toISOString().split('T')[0],
    deadline: new Date(data.deadline).toISOString().split('T')[0],
    photos: data.photos || [],
  };

  // In a real app, you'd save this to a database
  incidents.unshift(newIncident);
  revalidatePath('/incidents');
  revalidatePath('/dashboard');
  return { success: true, message: 'Incidente adicionado com sucesso.' };
}

// Auditor Actions
export async function addAuditor(data: z.infer<typeof auditorSchema>) {
  const newAuditor: Auditor = {
    id: String(auditors.length + 1),
    name: data.name,
  };
  auditors.push(newAuditor);
  revalidatePath('/admin/auditors');
  revalidatePath('/incidents/new');
  return { success: true, message: 'Auditor adicionado com sucesso.' };
}

export async function deleteAuditor(id: string) {
  const index = auditors.findIndex((a) => a.id === id);
  if (index !== -1) {
    auditors.splice(index, 1);
    revalidatePath('/admin/auditors');
    revalidatePath('/incidents/new');
    return { success: true, message: 'Auditor excluído com sucesso.' };
  }
  return { success: false, message: 'Auditor não encontrado.' };
}

// Area Actions
export async function addArea(data: z.infer<typeof areaSchema>) {
    const newArea: Area = {
      id: String(areas.length + 1),
      name: data.name,
    };
    areas.push(newArea);
    revalidatePath('/admin/areas');
    revalidatePath('/incidents/new');
    return { success: true, message: 'Área adicionada com sucesso.' };
  }
  
  export async function deleteArea(id: string) {
    const index = areas.findIndex((a) => a.id === id);
    if (index !== -1) {
      areas.splice(index, 1);
      revalidatePath('/admin/areas');
      revalidatePath('/incidents/new');
      return { success: true, message: 'Área excluída com sucesso.' };
    }
    return { success: false, message: 'Área não encontrada.' };
  }

// Risk Type Actions
export async function addRiskType(data: z.infer<typeof riskTypeSchema>) {
    const newRiskType: RiskType = {
        id: String(riskTypes.length + 1),
        name: data.name,
    };
    riskTypes.push(newRiskType);
    revalidatePath('/admin/risk-types');
    revalidatePath('/incidents/new');
    return { success: true, message: 'Tipo de Risco adicionado com sucesso.' };
}

export async function deleteRiskType(id: string) {
    const index = riskTypes.findIndex((rt) => rt.id === id);
    if (index !== -1) {
        riskTypes.splice(index, 1);
        revalidatePath('/admin/risk-types');
        revalidatePath('/incidents/new');
        return { success: true, message: 'Tipo de Risco excluído com sucesso.' };
    }
    return { success: false, message: 'Tipo de Risco não encontrado.' };
}