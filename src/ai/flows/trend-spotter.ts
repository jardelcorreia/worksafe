'use server';

/**
 * @fileOverview Trend Spotter AI agent.
 *
 * - analyzeTrends - A function that analyzes safety incident trends.
 * - AnalyzeTrendsInput - The input type for the analyzeTrends function.
 * - AnalyzeTrendsOutput - The return type for the analyzeTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTrendsInputSchema = z.array(
  z.object({
    área: z.string().describe('The area where the incident occurred.'),
    tipoDeSituaçãoDeRisco: z.string().describe('The type of risk situation.'),
    potencial: z.string().describe('The potential risk level (e.g., Alto, Médio, Baixo, Sem Desvio).'),
    descriçãoDaSituaçãoInsegura: z
      .string()
      .describe('A detailed description of the unsafe situation.'),
  })
);
export type AnalyzeTrendsInput = z.infer<typeof AnalyzeTrendsInputSchema>;

const AnalyzeTrendsOutputSchema = z.object({
  mostFrequentAreas: z
    .array(z.object({area: z.string(), count: z.number()}))
    .describe('The most frequent incident areas, with their counts.'),
  mostFrequentRiskTypes: z
    .array(z.object({riskType: z.string(), count: z.number()}))
    .describe('The most frequent types of risk, with their counts.'),
  riskSummary: z
    .string()
    .describe('A summary of the overall risk trends and potential areas for improvement.'),
});
export type AnalyzeTrendsOutput = z.infer<typeof AnalyzeTrendsOutputSchema>;

export async function analyzeTrends(input: AnalyzeTrendsInput): Promise<AnalyzeTrendsOutput> {
  return analyzeTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTrendsPrompt',
  input: {schema: AnalyzeTrendsInputSchema},
  output: {schema: AnalyzeTrendsOutputSchema},
  prompt: `You are an AI safety analyst tasked with identifying trends in workplace safety incidents.

  Analyze the following safety incident data to identify the most frequent incident areas and types of risk.
  Provide a summary of the overall risk trends and potential areas for improvement.

  Safety Incident Data:
  {{#each this}}
  - Area: {{this.área}}, Risk Type: {{this.tipoDeSituaçãoDeRisco}}, Potential: {{this.potencial}}, Description: {{this.descriçãoDaSituaçãoInsegura}}
  {{/each}}

  Provide output as JSON in the following format:
  {
    "mostFrequentAreas": [{"area": "area1", "count": 123}, {"area": "area2", "count": 456}],
    "mostFrequentRiskTypes": [{"riskType": "riskType1", "count": 789}, {"riskType": "riskType2", "count": 101}],
    "riskSummary": "Overall risk trends and potential areas for improvement."
  }
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
