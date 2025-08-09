
import { z } from 'zod';

export type Auditor = {
  id: string;
  name: string;
};

export type Area = {
  id: string;
  name: string;
};

export type RiskType = {
  id: string;
  name: string;
};

export type SafetyInspection = {
  id: string;
  timestamp: string;
  area: string;
  auditor: string;
  date: string;
  riskType: string;
  potential: 'Alto' | 'Médio' | 'Baixo' | 'Sem Desvio';
  description: string;
  correctiveAction: string;
  responsible: string;
  deadline: string;
  status: 'Resolvido' | 'Em Andamento' | 'Satisfatório';
  photos?: string[];
};

export const PotentialLevels = ['Alto', 'Médio', 'Baixo', 'Sem Desvio'] as const;
export const StatusLevels = ['Resolvido', 'Em Andamento', 'Satisfatório'] as const;

export const inspectionSchema = z.object({
  area: z.string().min(1, 'Área é obrigatória.'),
  auditor: z.string().min(1, 'Auditor é obrigatório.'),
  date: z.string(),
  riskType: z.string().min(1, 'Tipo de Risco é obrigatório.'),
  potential: z.enum(PotentialLevels),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  correctiveAction: z.string().min(1, 'Ação corretiva é obrigatória.'),
  responsible: z.string().min(1, 'Responsável pela ação corretiva é obrigatório(a).'),
  deadline: z.string(),
  status: z.enum(StatusLevels),
  photos: z.array(z.string()).optional(),
});

export const auditorSchema = z.object({
  name: z.string().min(1, 'Nome do auditor é obrigatório.'),
});

export const areaSchema = z.object({
    name: z.string().min(1, 'Nome da área é obrigatório.'),
});

export const riskTypeSchema = z.object({
    name: z.string().min(1, 'Nome do tipo de risco é obrigatório.'),
});
