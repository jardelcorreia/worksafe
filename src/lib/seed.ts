
'use server';

import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';

const riskTypesToSeed = [
  'Acesso',
  'Alerta Sonoro / Alarme Sonoro',
  'Animais Peçonhentos',
  'Atropelamento',
  'Ausência de Biombo',
  'Ausência de Botão de Emergência',
  'Ausência de Chuveiro Lava Olhos',
  'Ausência de EPC (Contenção, Kit de Mitigação, etc.)',
  'Ausência de FISPQ',
  'Ausência de Gaiola de Produtos Químicos',
  'Ausência de Quebra Quina',
  'Ausência de Sinaleiro',
  'Ausência de Vigia',
  'Bancada Inadequada',
  'Barba',
  'Buraco na Área de Passagem de Pedestres',
  'Cabo Guia',
  'Caixa de Bloqueio',
  'Calço de Pneus',
  'Chão Escorregadio',
  'Cinta Danificada / Inadequada / sem Identificação',
  'Cinto de Segurança Avariado',
  'Colaborador desconhece os riscos',
  'Colaborador sem EPI',
  'Condutor sem Habilitação',
  'Contaminação da Água',
  'Contaminação do Solo',
  'Contaminação do Ar',
  'Contato com Material Quente',
  'Controle de Entrada e Saída',
  'Descarte Incorreto',
  'Detector de Gás (Filtro Vencido / Desligado / Ausente)',
  'Documentação',
  'Entrada Inadequada',
  'Equipamento Inadequado',
  'Espaço Confinado',
  'Estropo Danificado / sem Identificação',
  'Estrutura Inadequada',
  'Excesso de Material',
  'Exposição a Altas Temperaturas',
  'Exposição a Centelhas',
  'Exposição a Produtos Químicos',
  'Extintor Ausente',
  'Extintor com Falta',
  'Falta de Ancoragem',
  'Falta de Aterramento',
  'Falta de Bloqueio',
  'Falta de Cadeado',
  'Falta de Capacitação',
  'Falta de Check List',
  'Falta de Cinto de Segurança',
  'Falta de Cobertura',
  'Falta de Coleta Seletiva',
  'Falta de Data',
  'Falta de Assinatura',
  'Falta de Detector de Gás',
  'Falta de Documentação',
  'Falta de EPC',
  'Falta de EPI',
  'Falta de Identificação',
  'Falta de Identificação de Risco',
  'Falta de Isolamento',
  'Falta de Liberação',
  'Falta de Linha de Vida',
  'Falta de Medidas de Segurança',
  'Falta de Ponto de Encontro',
  'Falta de Rota de Fuga',
  'Falta de Treinamento',
  'Fio Desencapado',
  'Guarda Corpo Ausente',
  'Guarda Corpo Inadequado',
  'Iluminação Inadequada',
  'Isolamento Caído',
  'Isolamento Deficiente',
  'Isolamento Fora do Padrão',
  'Manilha Inadequada ou sem Identificação',
  'Mapa de Bloqueio',
  'Materiais Espalhados / em Excesso',
  'Material Inflamável/Explosivo Próximo',
  'Moitão Danificado / sem Identificação',
  'Olhal Danificado / sem Identificação',
  'Oxicorte fora do padrão',
  'Patolamento Inadequado',
  'Piso Irregular',
  'Placa de Liberação / Identificação',
  'Plataforma com Vão Aberto',
  'Pneu Avariado',
  'Pranchão Inadequado',
  'Pranchão Danificado',
  'Pranchão Irregular',
  'Quina Viva',
  'Risco de Choque Elétrico',
  'Talha Danificada / sem Identificação',
  'Trava de Segurança',
  'Vazamento de Produto Químico',
  'Vazamento de Óleo',
  'Vergalhão Exposto',
  'Via com Desnível',
  'Via com Obstáculo',
  'Vidro Exposto',
];

async function addDocumentsInBatches(newRiskTypes: string[]) {
    const batchSize = 400; // Firestore allows up to 500 operations per batch
    
    for (let i = 0; i < newRiskTypes.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = newRiskTypes.slice(i, i + batchSize);
        chunk.forEach(name => {
            const docRef = doc(collection(db, 'riskTypes'));
            batch.set(docRef, { name });
        });
        await batch.commit();
    }
}


export async function seedRiskTypes() {
  try {
    const riskTypesCollection = collection(db, 'riskTypes');
    const existingRiskTypesSnapshot = await getDocs(riskTypesCollection);
    const existingRiskTypes = existingRiskTypesSnapshot.docs.map(doc => doc.data().name.toLowerCase());

    const newRiskTypes = riskTypesToSeed.filter(
      (name) => !existingRiskTypes.includes(name.toLowerCase())
    );

    if (newRiskTypes.length === 0) {
      return { success: true, count: 0, message: 'Todos os tipos de risco padrão já estavam cadastrados no banco de dados.' };
    }

    await addDocumentsInBatches(newRiskTypes);
    
    revalidatePath('/admin/risk-types');
    revalidatePath('/incidents/new');

    return { success: true, count: newRiskTypes.length };
  } catch (error: any) {
    console.error('Error seeding risk types:', error);
    const errorMessage = error.message || 'Ocorreu um erro desconhecido.';
    return { success: false, message: `Falha ao popular os tipos de risco: ${errorMessage}` };
  }
}
