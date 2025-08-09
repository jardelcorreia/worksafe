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
  historicalData: z.string().describe('A string containing historical safety incident data in a readable format.'),
  identifiedTrends: z.string().describe('A string containing identified trends from the historical data.'),
});
export type RiskForecasterInput = z.infer<typeof RiskForecasterInputSchema>;

const RiskForecasterOutputSchema = z.object({
  predictedIncidents: z.string().describe('A string containing a description of potential future safety incidents.'),
  reasoning: z.string().describe('A string containing the reasoning behind the predicted incidents, based on the historical data and identified trends.'),
  preventativeActions: z.string().describe('A string containing suggested preventative actions to mitigate the predicted safety incidents.'),
});
export type RiskForecasterOutput = z.infer<typeof RiskForecasterOutputSchema>;

export async function riskForecaster(input: RiskForecasterInput): Promise<RiskForecasterOutput> {
  return riskForecasterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'riskForecasterPrompt',
  input: {schema: RiskForecasterInputSchema},
  output: {schema: RiskForecasterOutputSchema},
  prompt: `You are a safety expert tasked with predicting potential safety incidents based on historical data and identified trends.

  Historical Data: {{{historicalData}}}
  Identified Trends: {{{identifiedTrends}}}

  Based on the historical data and identified trends, predict potential future safety incidents, provide reasoning for your predictions, and suggest preventative actions to mitigate the predicted incidents.

  Output the predictedIncidents, reasoning, and preventativeActions in a well-structured and readable format.
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
