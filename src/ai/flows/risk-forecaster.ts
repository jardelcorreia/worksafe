'use server';

/**
 * @fileOverview This file defines a Genkit flow for predicting potential safety incidents based on historical data and identified trends.
 *
 * - riskForecaster - A function that triggers the risk forecasting process.
 * - RiskForecasterInput - The input type for the riskForecaster function.
 * - RiskForecasterOutput - The return type for the riskForecaster function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RiskForecasterInputSchema = z.object({
  historicalData: z.string().describe('Uma string contendo dados históricos de incidentes de segurança em um formato legível.'),
  identifiedTrends: z.string().describe('Uma string contendo as tendências identificadas a partir dos dados históricos.'),
});
export type RiskForecasterInput = z.infer<typeof RiskForecasterInputSchema>;

const RiskForecasterOutputSchema = z.object({
  predictedIncidents: z.string().describe('Uma descrição de potenciais futuros incidentes de segurança.'),
  reasoning: z.string().describe('A justificativa para os incidentes previstos, com base nos dados históricos e nas tendências identificadas.'),
  preventativeActions: z.string().describe('Sugestões de ações preventivas para mitigar os incidentes de segurança previstos.'),
});
export type RiskForecasterOutput = z.infer<typeof RiskForecasterOutputSchema>;

export async function riskForecaster(input: RiskForecasterInput): Promise<RiskForecasterOutput> {
  return riskForecasterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'riskForecasterPrompt',
  input: {schema: RiskForecasterInputSchema},
  output: {schema: RiskForecasterOutputSchema},
  prompt: `Você é um especialista em segurança encarregado de prever potenciais incidentes de segurança com base em dados históricos e tendências identificadas.

  Responda em português brasileiro.

  Dados Históricos: {{{historicalData}}}
  Tendências Identificadas: {{{identifiedTrends}}}

  Com base nos dados históricos e nas tendências identificadas, preveja potenciais incidentes de segurança futuros, forneça a justificativa para suas previsões e sugira ações preventivas para mitigar os incidentes previstos.

  Apresente os incidentes previstos, a justificativa e as ações preventivas em um formato bem estruturado e de fácil leitura.
  `,
});

const riskForecasterFlow = ai.defineFlow(
  {
    name: 'riskForecasterFlow',
    inputSchema: RiskForecasterInputSchema,
    outputSchema: RiskForecasterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
