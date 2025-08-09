'use server';

/**
 * @fileOverview Trend Spotter AI agent.
 *
 * - analyzeTrends - A function that analyzes safety inspection trends.
 * - AnalyzeTrendsInput - The input type for the analyzeTrends function.
 * - AnalyzeTrendsOutput - The return type for the analyzeTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTrendsInputSchema = z.array(
  z.object({
    área: z.string().describe('A área onde a inspeção ocorreu.'),
    tipoDeSituaçãoDeRisco: z.string().describe('O tipo de situação de risco.'),
    potencial: z.string().describe('O nível de risco potencial (e.g., Alto, Médio, Baixo, Sem Desvio).'),
    descriçãoDaSituaçãoEncontrada: z
      .string()
      .describe('Uma descrição detalhada da situação encontrada.'),
  })
);
export type AnalyzeTrendsInput = z.infer<typeof AnalyzeTrendsInputSchema>;

const AnalyzeTrendsOutputSchema = z.object({
  mostFrequentAreas: z
    .array(z.object({area: z.string(), count: z.number()}))
    .describe('As áreas de inspeções mais frequentes, com suas contagens.'),
  mostFrequentRiskTypes: z
    .array(z.object({riskType: z.string(), count: z.number()}))
    .describe('Os tipos de risco mais frequentes, com suas contagens.'),
  riskSummary: z
    .string()
    .describe('Um resumo das tendências gerais de risco e potenciais áreas para melhoria.'),
});
export type AnalyzeTrendsOutput = z.infer<typeof AnalyzeTrendsOutputSchema>;

export async function analyzeTrends(input: AnalyzeTrendsInput): Promise<AnalyzeTrendsOutput> {
  return analyzeTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTrendsPrompt',
  input: {schema: AnalyzeTrendsInputSchema},
  output: {schema: AnalyzeTrendsOutputSchema},
  prompt: `Você é um analista de segurança de IA encarregado de identificar tendências em inspeções de segurança no trabalho.

  Analise os seguintes dados de inspeções de segurança para identificar as áreas de inspeções e os tipos de risco mais frequentes.
  Forneça um resumo das tendências gerais de risco e potenciais áreas para melhoria.
  
  Responda em português brasileiro.

  Dados de Inspeções de Segurança:
  {{#each this}}
  - Area: {{this.área}}, Tipo de Risco: {{this.tipoDeSituaçãoDeRisco}}, Potencial: {{this.potencial}}, Descrição: {{this.descriçãoDaSituaçãoEncontrada}}
  {{/each}}
  `,
});

const analyzeTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeTrendsFlow',
    inputSchema: AnalyzeTrendsInputSchema,
    outputSchema: AnalyzeTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
