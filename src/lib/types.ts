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
