
'use server';

import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
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
    'Contaminação (Água, Solo, Ar)',
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
    'Exposição (Altas Temperaturas / Centelhas / Produtos Químicos)',
    'Extintor (Ausente / Falta)',
    'Falta de (Ancoragem / Aterramento / Bloqueio / Cadeado / Capacitação / Check List / Cinto de Segurança / Cobertura / Coleta Seletiva / Data / Assinatura / Detector de Gás / Documentação / EPC / EPI / Identificação / Identificação de Risco / Isolamento / Liberação / Linha de Vida / Medidas de Segurança / Ponto de Encontro / Rota de Fuga / Treinamento)',
    'Fio Desencapado',
    'Guarda Corpo (Ausente / Inadequado)',
    'Iluminação Inadequada',
    'Isolamento (Caído / Deficiente / Fora do Padrão)',
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
    'Pranchão (Inadequado / Danificado / Irregular)',
    'Quina Viva',
    'Risco de Choque Elétrico',
    'Talha Danificada / sem Identificação',
    'Trava de Segurança',
    'Vazamento (Produto Químico / Óleo)',
    'Vergalhão Exposto',
    'Via com (Desnível / Obstáculo)',
    'Vidro Exposto'
];

export async function seedRiskTypes() {
  try {
    const riskTypesCollection = collection(db, 'riskTypes');
    const existingRiskTypesSnapshot = await getDocs(riskTypesCollection);
    const existingRiskTypes = existingRiskTypesSnapshot.docs.map(doc => doc.data().name.toLowerCase());

    const newRiskTypes = riskTypesToSeed.filter(
      (name) => !existingRiskTypes.includes(name.toLowerCase())
    );

    if (newRiskTypes.length === 0) {
      return { success: true, count: 0, message: 'Todos os tipos de risco já estão cadastrados.' };
    }

    const promises = newRiskTypes.map((name) =>
      addDoc(riskTypesCollection, { name })
    );
    await Promise.all(promises);
    
    revalidatePath('/admin/risk-types');
    revalidatePath('/incidents/new');

    return { success: true, count: newRiskTypes.length };
  } catch (error) {
    console.error('Error seeding risk types:', error);
    return { success: false, message: 'Falha ao popular os tipos de risco.' };
  }
}
