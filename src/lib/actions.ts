
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
  deleteObject,
  listAll
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
    if (!photos || photos.length === 0) {
        return [];
    }

    const photoURLs: string[] = [];
    
    for (const [index, photo] of photos.entries()) {
        if (photo.startsWith('data:image')) {
            try {
                const storageRef = ref(storage, `inspections/${inspectionId}/${Date.now()}_${index}`);
                const snapshot = await uploadString(storageRef, photo, 'data_url');
                const downloadURL = await getDownloadURL(snapshot.ref);
                photoURLs.push(downloadURL);
            } catch (error) {
                console.error(`Error uploading photo ${index} for inspection ${inspectionId}:`, error);
                throw new Error('Falha ao fazer upload de uma das fotos. A operação foi cancelada.');
            }
        } else if (photo.startsWith('https://firebasestorage.googleapis.com')) {
            photoURLs.push(photo);
        }
    }
    
    return photoURLs;
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
      const inspectionsCollection = collection(db, 'inspections');
      let q = query(inspectionsCollection, orderBy('date', 'desc'));
  
      const querySnapshot = await getDocs(q);
      
      let inspectionsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Firestore Timestamps need to be converted to JS Dates.
        const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
        const deadline = data.deadline instanceof Timestamp ? data.deadline.toDate().toISOString() : data.deadline;
        
        return {
          id: doc.id,
          ...data,
          date: date,
          deadline: deadline,
        }
      }) as SafetyInspection[];
  
      // Manual filtering for date range if provided
      if (filters?.from || filters?.to) {
          const fromDate = filters.from ? new Date(filters.from).getTime() : null;
          const toDate = filters.to ? new Date(filters.to).getTime() : null;
          
          inspectionsData = inspectionsData.filter(inspection => {
              const inspectionDate = new Date(inspection.date).getTime();
              if (fromDate && inspectionDate < fromDate) return false;
              if (toDate && inspectionDate > toDate) return false;
              return true;
          });
      }
      
      return inspectionsData;
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
        const data = docSnap.data();
        return { 
            id: docSnap.id, 
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
            deadline: data.deadline instanceof Timestamp ? data.deadline.toDate().toISOString() : data.deadline,
        } as SafetyInspection;
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
        photos: [], 
    });
    
    const finalPhotoURLs = await uploadPhotos(docRef.id, data.photos || []);
    
    await updateDoc(docRef, { photos: finalPhotoURLs });

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
        
        // 1. Delete all existing photos for this inspection from Storage.
        // This is a simpler approach than trying to diff the arrays.
        // It prevents errors from trying to re-upload existing images.
        const storageFolderRef = ref(storage, `inspections/${id}`);
        const existingFiles = await listAll(storageFolderRef);
        await Promise.all(existingFiles.items.map(fileRef => deleteObject(fileRef)));

        // 2. Upload all photos from the form submission as if they are new.
        // The `uploadPhotos` function will handle both base64 and existing URLs gracefully.
        const finalPhotoURLs = await uploadPhotos(id, data.photos || []);
        
        // 3. Update the document in Firestore with the new data and photo URLs.
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

        const photos = docSnap.data().photos || [];
        for (const photoUrl of photos) {
            if (photoUrl.startsWith('https://firebasestorage.googleapis.com')) {
                try {
                    const photoRef = ref(storage, photoUrl);
                    await deleteObject(photoRef);
                } catch (error) {
                    if (error instanceof Error && 'code' in error && (error as any).code !== 'storage/object-not-found') {
                        console.error('Error deleting photo from storage:', error);
                    }
                }
            }
        }
        
        const storageFolderRef = ref(storage, `inspections/${id}`);
        const existingFiles = await listAll(storageFolderRef);
        await Promise.all(existingFiles.items.map(fileRef => deleteObject(fileRef)));

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

    