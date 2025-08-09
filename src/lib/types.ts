import { z } from 'zod';

export type Auditor = {
  id: string;
  name: string;
};

export type SafetyIncident = {
  id: string;
  timestamp: string;
  area: string;
  auditor: string;
  date: string;
  riskType: string;
  potential: 'High' | 'Medium' | 'Low' | 'No Deviation';
  description: string;
  responsible: string;
  deadline: string;
  status: 'Resolved' | 'In Progress' | 'Satisfactory';
};

export const PotentialLevels = ['High', 'Medium', 'Low', 'No Deviation'] as const;
export const StatusLevels = ['Resolved', 'In Progress', 'Satisfactory'] as const;
export const AreaLevels = [
  'Lingotamento',
  'Aciaria',
  'GTP',
  'Sinterização',
  'Pátio de Matéria Prima',
  'Alto forno',
  'Ponte Rolante',
  'NR 12',
] as const;

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

export const auditorSchema = z.object({
  name: z.string().min(1, 'Auditor name is required.'),
});
