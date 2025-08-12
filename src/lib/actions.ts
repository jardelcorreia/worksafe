
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { 
  ref, 
  uploadString, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { analyzeTrends as analyzeTrendsFlow } from '@/ai/flows/trend-spotter';
import { riskForecaster as riskForecasterFlow } from '@/ai/flows/risk-forecaster';
import type { SafetyInspection, Auditor, Area, RiskType } from './types';
import {
  inspectionSchema,
  auditorSchema,
  areaSchema,
  riskTypeSchema,
} from './types';

type DateFilters = {
    from?: Date;
    to?: Date;
}

// Export types for use in client components
export type { AnalyzeTrendsOutput } from '@/ai/flows/trend-spotter';
export type { RiskForecasterOutput } from '@/ai/flows/risk-forecaster';

async function uploadPhotos(inspectionId: string, photos: string[]): Promise<string[]> {
    const photoURLs: string[] = [];
    for (const photo of photos) {
        if (photo.startsWith('data:')) { // It's a new base64 image
            try {
                const storageRef = ref(storage, `inspections/${inspectionId}/${Date.now()}`);
                const snapshot = await uploadString(storageRef, photo, 'data_url');
                const downloadURL = await getDownloadURL(snapshot.ref);
                photoURLs.push(downloadURL);
            } catch (error) {
                console.error("Photo upload failed:", error);
                // Propagate the error to be caught by the calling function
                throw new Error("Falha ao fazer upload de uma ou mais fotos. Verifique a configuração do Storage.");
            }
        } else { // It's an existing URL
            photoURLs.push(photo);
        }
    }
    return photoURLs;
}

// Firestore collection getters
async function getInspections(filters?: DateFilters): Promise<SafetyInspection[]> {
  try {
    const inspectionsCol = collection(db, 'inspections');
    let q = query(inspectionsCol, orderBy('date', 'desc'));

    if (filters?.from) {
        q = query(q, where('date', '>=', filters.from));
    }
    if (filters?.to) {
        q = query(q, where('date', '<=', filters.to));
    }
    
    const inspectionSnapshot = await getDocs(q);
    const inspectionsData = inspectionSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Firestore Timestamps need to be converted to strings for client components
        date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
        deadline: data.deadline instanceof Timestamp ? data.deadline.toDate().toISOString() : data.deadline,
      }
    }) as SafetyInspection[];

    return inspectionsData;

  } catch (error) {
    console.error('Falha ao buscar inspeções do Firestore:', error);
    return [];
  }
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
export async function analyzeTrends(filters?: DateFilters) {
  try {
    const inspections = await fetchInspections(filters);
    if (inspections.length === 0) {
        return { mostFrequentAreas: [], mostFrequentRiskTypes: [], riskSummary: '' };
    }
    const aiInput = inspections.map((i) => ({
      área: i.area,
      tipoDeSituaçãoDeRisco: i.riskType,
      potencial: i.potential,
      descriçãoDaSituaçãoEncontrada: i.description,
    }));
    const result = await analyzeTrendsFlow(aiInput);
    return result;
  } catch (error) {
    console.error('Error in analyzeTrends action:', error);
    return null;
  }
}

export async function riskForecaster(identifiedTrends: string, filters?: DateFilters) {
  try {
    const inspections = await fetchInspections(filters);
    if (inspections.length === 0) {
        return { predictedIssues: '', reasoning: '', preventativeActions: '' };
    }
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
export async function fetchInspections(filters?: DateFilters) {
  try {
    const inspectionsCol = collection(db, 'inspections');
    let q = query(inspectionsCol);

    const queryConstraints = [orderBy('date', 'desc')];

    if (filters?.from) {
        const fromDate = new Date(filters.from);
        queryConstraints.push(where('date', '>=', fromDate.toISOString().split('T')[0]));
    }
    if (filters?.to) {
        const toDate = new Date(filters.to);
        queryConstraints.push(where('date', '<=', toDate.toISOString().split('T')[0]));
    }
    
    q = query(inspectionsCol, ...queryConstraints);

    const inspectionSnapshot = await getDocs(q);

    return inspectionSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SafetyInspection[];
  } catch (error) {
    console.error('Falha ao buscar inspeções do Firestore:', error);
    return [];
  }
}

export async function fetchInspectionById(id: string) {
    try {
      const docRef = doc(db, 'inspections', id);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as SafetyInspection;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching inspection by ID:', error);
      return null;
    }
}

export async function addInspection(data: z.infer<typeof inspectionSchema>) {
  try {
    const docRef = await addDoc(collection(db, 'inspections'), {
      ...data,
      date: new Date(data.date),
      deadline: new Date(data.deadline),
      photos: [], // Start with no photos
    });

    // Now upload photos and get their URLs
    const photoURLs = await uploadPhotos(docRef.id, data.photos || []);
    
    // Update the document with the photo URLs
    await updateDoc(docRef, { photos: photoURLs });

    revalidatePath('/inspections');
    revalidatePath('/dashboard');
    return { success: true, message: 'Inspeção adicionada com sucesso.' };
  } catch (error) {
    console.error('Error adding inspection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao adicionar inspeção.';
    return { success: false, message: errorMessage };
  }
}

export async function updateInspection(id: string, data: z.infer<typeof inspectionSchema>) {
    try {
        const docRef = doc(db, 'inspections', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, message: 'Inspeção não encontrada.' };
        }

        const originalPhotos: string[] = docSnap.data().photos || [];
        const submittedPhotos: string[] = data.photos || [];

        // Upload new photos (base64) and get their URLs, keep existing URLs
        const finalPhotoURLs = await uploadPhotos(id, submittedPhotos);

        // Determine which photos to delete from storage
        const photosToDelete = originalPhotos.filter(
            (originalUrl) => !finalPhotoURLs.includes(originalUrl)
        );

        // Delete photos from Storage
        for (const photoUrl of photosToDelete) {
            try {
                const photoRef = ref(storage, photoUrl);
                await deleteObject(photoRef);
            } catch (error) {
                // If the object does not exist, we can ignore the error
                if (error instanceof Error && 'code' in error && (error as any).code !== 'storage/object-not-found') {
                    console.error('Error deleting photo from storage:', error);
                    // Decide if you want to stop the whole process or just log the error
                }
            }
        }

        // Update the document in Firestore
        await updateDoc(docRef, {
            ...data,
            date: new Date(data.date),
            deadline: new Date(data.deadline),
            photos: finalPhotoURLs,
        });

        revalidatePath('/inspections');
        revalidatePath(`/inspections/${id}/edit`);
        revalidatePath('/dashboard');
        return { success: true, message: 'Inspeção atualizada com sucesso.' };

    } catch (error) {
        console.error('Error updating inspection:', error);
        const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar inspeção.';
        return { success: false, message: errorMessage };
    }
}

export async function deleteInspection(id: string) {
    try {
        const docRef = doc(db, 'inspections', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, message: 'Inspeção não encontrada.' };
        }

        // Delete photos from storage
        const photos = docSnap.data().photos || [];
        for (const photoUrl of photos) {
            try {
                const photoRef = ref(storage, photoUrl);
                await deleteObject(photoRef);
            } catch (error) {
                if (error instanceof Error && 'code' in error && (error as any).code !== 'storage/object-not-found') {
                    console.error('Error deleting photo from storage:', error);
                    // Continue to delete the inspection even if a photo fails to delete
                }
            }
        }

        // Delete the firestore document
        await deleteDoc(docRef);

        revalidatePath('/inspections');
        revalidatePath('/dashboard');
        return { success: true, message: 'Inspeção excluída com sucesso.' };
    } catch (error) {
        console.error('Error deleting inspection:', error);
        return { success: false, message: 'Falha ao excluir inspeção.' };
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
        await deleteDoc(doc(db, 'riskTypes'), id);
        revalidatePath('/admin/risk-types');
        revalidatePath('/inspections/new');
        return { success: true, message: 'Tipo de risco excluído com sucesso.' };
    } catch (error) {
        console.error('Error deleting risk type:', error);
        return { success: false, message: 'Falha ao excluir tipo de risco.' };
    }
}

    