
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

// VERSÃO AINDA MAIS DETALHADA da função uploadPhotos para debug
async function uploadPhotos(inspectionId: string, photos: string[]): Promise<string[]> {
    console.log(`[uploadPhotos] ========== INÍCIO DEBUG ==========`);
    console.log(`[uploadPhotos] inspectionId: ${inspectionId}`);
    console.log(`[uploadPhotos] Quantidade de fotos: ${photos.length}`);
    console.log(`[uploadPhotos] Storage bucket: ${storage.app.options.storageBucket}`);
    
    // Verificar cada foto antes de processar
    photos.forEach((photo, index) => {
        console.log(`[uploadPhotos] Foto ${index}:`);
        console.log(`  - Tipo: ${typeof photo}`);
        console.log(`  - Tamanho: ${photo.length} caracteres`);
        console.log(`  - Começa com data:image: ${photo.startsWith('data:image')}`);
        console.log(`  - Começa com https: ${photo.startsWith('https:')}`);
        console.log(`  - Primeiros 100 chars: ${photo.substring(0, 100)}...`);
    });
    
    const photoURLs: string[] = [];
    
    for (const [index, photo] of photos.entries()) {
        console.log(`[uploadPhotos] ========== PROCESSANDO FOTO ${index} ==========`);
        
        if (photo.startsWith('data:image')) {
            try {
                console.log(`[uploadPhotos] Foto ${index} - É base64, processando...`);
                
                // Validar formato base64
                const parts = photo.split(',');
                if (parts.length !== 2) {
                    throw new Error(`Foto ${index}: Formato base64 inválido - não tem vírgula`);
                }
                
                const header = parts[0]; // data:image/jpeg;base64
                const base64Data = parts[1];
                
                console.log(`[uploadPhotos] Foto ${index} - Header: ${header}`);
                console.log(`[uploadPhotos] Foto ${index} - Base64 length: ${base64Data.length}`);
                
                if (!base64Data || base64Data.length === 0) {
                    throw new Error(`Foto ${index}: Dados base64 vazios`);
                }
                
                // Verificar se é uma imagem válida
                if (!header.includes('image/')) {
                    throw new Error(`Foto ${index}: Não é uma imagem - header: ${header}`);
                }
                
                // Criar path único
                const timestamp = Date.now();
                const randomId = Math.random().toString(36).substring(7);
                const extension = header.includes('jpeg') || header.includes('jpg') ? 'jpg' : 'png';
                const fileName = `${timestamp}_${randomId}_${index}.${extension}`;
                const storagePath = `inspections/${inspectionId}/${fileName}`;
                
                console.log(`[uploadPhotos] Foto ${index} - Caminho: ${storagePath}`);
                console.log(`[uploadPhotos] Foto ${index} - Nome do arquivo: ${fileName}`);
                
                // Criar referência
                console.log(`[uploadPhotos] Foto ${index} - Criando referência...`);
                const storageRef = ref(storage, storagePath);
                console.log(`[uploadPhotos] Foto ${index} - Referência criada com sucesso`);
                
                // Tentar upload
                console.log(`[uploadPhotos] Foto ${index} - Iniciando uploadString...`);
                console.log(`[uploadPhotos] Foto ${index} - Usando método: data_url`);
                
                const snapshot = await uploadString(storageRef, photo, 'data_url');
                console.log(`[uploadPhotos] Foto ${index} - Upload concluído!`);
                console.log(`[uploadPhotos] Foto ${index} - Snapshot:`, {
                    bytesTransferred: snapshot.bytesTransferred,
                    totalBytes: snapshot.totalBytes,
                    state: snapshot.state
                });
                
                // Obter URL
                console.log(`[uploadPhotos] Foto ${index} - Obtendo URL de download...`);
                const downloadURL = await getDownloadURL(snapshot.ref);
                console.log(`[uploadPhotos] Foto ${index} - URL obtida: ${downloadURL}`);
                
                photoURLs.push(downloadURL);
                console.log(`[uploadPhotos] Foto ${index} - ✅ SUCESSO COMPLETO`);
                
            } catch (error) {
                console.error(`[uploadPhotos] ❌ ERRO na foto ${index}:`, error);
                
                // Análise detalhada do erro
                if (error && typeof error === 'object') {
                    const err = error as any;
                    console.error(`[uploadPhotos] Código do erro: ${err.code}`);
                    console.error(`[uploadPhotos] Mensagem do erro: ${err.message}`);
                    console.error(`[uploadPhotos] Stack trace:`, err.stack);
                    
                    if (err.serverResponse) {
                        console.error(`[uploadPhotos] Resposta do servidor:`, err.serverResponse);
                    }
                }
                
                throw new Error(`Falha no upload da foto ${index + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            }
            
        } else if (photo.startsWith('https://firebasestorage.googleapis.com')) {
            console.log(`[uploadPhotos] Foto ${index} - URL existente, mantendo: ${photo}`);
            photoURLs.push(photo);
            
        } else {
            console.warn(`[uploadPhotos] Foto ${index} - Formato não reconhecido`);
            console.warn(`[uploadPhotos] Foto ${index} - Tipo: ${typeof photo}`);
            console.warn(`[uploadPhotos] Foto ${index} - Valor: ${photo.substring(0, 200)}...`);
        }
    }
    
    console.log(`[uploadPhotos] ========== RESULTADO FINAL ==========`);
    console.log(`[uploadPhotos] Fotos processadas: ${photos.length}`);
    console.log(`[uploadPhotos] URLs geradas: ${photoURLs.length}`);
    console.log(`[uploadPhotos] URLs finais:`, photoURLs);
    
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
        
        // This is a simpler approach than trying to diff the arrays.
        // 1. Delete all existing photos for this inspection from Storage.
        const storageFolderRef = ref(storage, `inspections/${id}`);
        try {
            const existingFiles = await listAll(storageFolderRef);
            await Promise.all(existingFiles.items.map(fileRef => deleteObject(fileRef)));
        } catch (error) {
            console.log('No existing folder to delete, or other error. Continuing...');
        }
        
        // 2. Upload all photos from the form submission as if they are new.
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

        // Delete from Storage first
        try {
            const storageFolderRef = ref(storage, `inspections/${id}`);
            const existingFiles = await listAll(storageFolderRef);
            await Promise.all(existingFiles.items.map(fileRef => deleteObject(fileRef)));
        } catch (error) {
             // It's okay if the folder doesn't exist.
            console.log(`Could not delete storage folder for inspection ${id}. It might not exist.`);
        }
        
        // Delete from Firestore
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

    