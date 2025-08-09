
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { analyzeTrends as analyzeTrendsFlow } from '@/ai/flows/trend-spotter';
import { riskForecaster as riskForecasterFlow } from '@/ai/flows/risk-forecaster';
import type { SafetyInspection, Auditor, Area, RiskType } from './types';
import {
  inspectionSchema,
  auditorSchema,
  areaSchema,
  riskTypeSchema,
} from './types';

// Export types for use in client components
export type { AnalyzeTrendsOutput } from '@/ai/flows/trend-spotter';
export type { RiskForecasterOutput } from '@/ai/flows/risk-forecaster';

// Firestore collection getters
async function getInspections(): Promise<SafetyInspection[]> {
  const inspectionsCol = query(
    collection(db, 'inspections'),
    orderBy('date', 'desc')
  );
  const inspectionSnapshot = await getDocs(inspectionsCol);
  return inspectionSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SafetyInspection[];
}

async function getAuditors(): Promise<Auditor[]> {
  const auditorsCol = query(
    collection(db, 'auditors'),
    orderBy('name', 'asc')
  );
  const auditorSnapshot = await getDocs(auditorsCol);
  return auditorSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Auditor[];
}

async function getAreas(): Promise<Area[]> {
  const areasCol = query(collection(db, 'areas'), orderBy('name', 'asc'));
  const areaSnapshot = await getDocs(areasCol);
  return areaSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Area[];
}

async function getRiskTypes(): Promise<RiskType[]> {
    const riskTypesCol = query(collection(db, 'riskTypes'), orderBy('name', 'asc'));
    const riskTypeSnapshot = await getDocs(riskTypesCol);
    return riskTypeSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as RiskType[];
}


// AI Actions
export async function analyzeTrends() {
  try {
    const inspections = await getInspections();
    const aiInput = inspections.map((i) => ({
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
    const inspections = await getInspections();
    const historicalData = inspections
      .map(
        (i) =>
          `Em ${i.date} em ${i.area}, ocorreu uma inspeção do tipo '${i.riskType}' com potencial ${i.potential}. Descrição: ${i.description}`
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

// Inspection Actions
export async function fetchInspections() {
  return await getInspections();
}

export async function addInspection(data: z.infer<typeof inspectionSchema>) {
  try {
    await addDoc(collection(db, 'inspections'), {
      ...data,
      timestamp: new Date().toLocaleString('en-US'),
      date: new Date(data.date).toISOString().split('T')[0],
      deadline: new Date(data.deadline).toISOString().split('T')[0],
      photos: data.photos || [],
    });
    revalidatePath('/inspections');
    revalidatePath('/dashboard');
    return { success: true, message: 'Inspeção adicionada com sucesso.' };
  } catch (error) {
    console.error('Error adding inspection:', error);
    return { success: false, message: 'Falha ao adicionar inspeção.' };
  }
}

// Auditor Actions
export async function fetchAuditors() {
    return await getAuditors();
}

export async function addAuditor(data: z.infer<typeof auditorSchema>) {
  try {
    await addDoc(collection(db, 'auditors'), data);
    revalidatePath('/admin/auditors');
    revalidatePath('/inspections/new');
    return { success: true, message: 'Auditor adicionado com sucesso.' };
  } catch (error) {
    console.error('Error adding auditor:', error);
    return { success: false, message: 'Falha ao adicionar auditor.' };
  }
}

export async function deleteAuditor(id: string) {
  try {
    await deleteDoc(doc(db, 'auditors', id));
    revalidatePath('/admin/auditors');
    revalidatePath('/inspections/new');
    return { success: true, message: 'Auditor excluído com sucesso.' };
  } catch (error) {
    console.error('Error deleting auditor:', error);
    return { success: false, message: 'Falha ao excluir auditor.' };
  }
}

// Area Actions
export async function fetchAreas() {
    return await getAreas();
}

export async function addArea(data: z.infer<typeof areaSchema>) {
  try {
    await addDoc(collection(db, 'areas'), data);
    revalidatePath('/admin/areas');
    revalidatePath('/inspections/new');
    return { success: true, message: 'Área adicionada com sucesso.' };
  } catch (error) {
    console.error('Error adding area:', error);
    return { success: false, message: 'Falha ao adicionar área.' };
  }
}

export async function deleteArea(id: string) {
  try {
    await deleteDoc(doc(db, 'areas', id));
    revalidatePath('/admin/areas');
    revalidatePath('/inspections/new');
    return { success: true, message: 'Área excluída com sucesso.' };
  } catch (error) {
    console.error('Error deleting area:', error);
    return { success: false, message: 'Falha ao excluir área.' };
  }
}

// RiskType Actions
export async function fetchRiskTypes() {
    return await getRiskTypes();
}

export async function addRiskType(data: z.infer<typeof riskTypeSchema>) {
    try {
        await addDoc(collection(db, 'riskTypes'), data);
        revalidatePath('/admin/risk-types');
        revalidatePath('/inspections/new');
        return { success: true, message: 'Tipo de risco adicionado com sucesso.' };
    } catch (error) {
        console.error('Error adding risk type:', error);
        return { success: false, message: 'Falha ao adicionar tipo de risco.' };
    }
}

export async function deleteRiskType(id: string) {
    try {
        await deleteDoc(doc(db, 'riskTypes', id));
        revalidatePath('/admin/risk-types');
        revalidatePath('/inspections/new');
        return { success: true, message: 'Tipo de risco excluído com sucesso.' };
    } catch (error) {
        console.error('Error deleting risk type:', error);
        return { success: false, message: 'Falha ao excluir tipo de risco.' };
    }
}
