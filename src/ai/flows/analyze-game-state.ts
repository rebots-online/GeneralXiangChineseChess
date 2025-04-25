// filename: src/ai/flows/analyze-game-state.ts
'use server';
/**
 * @fileOverview Analyzes the Xiangqi game state and provides insights.
 *
 * - analyzeGameState - A function that analyzes the game state.
 * - AnalyzeGameStateInput - The input type for the analyzeGameState function.
 * - AnalyzeGameStateOutput - The return type for the analyzeGameState function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnalyzeGameStateInputSchema = z.object({
  boardState: z
    .string()
    .describe(
      'A string representing the current state of the Xiangqi board. Use standard notation.'
    ),
  currentPlayer: z
    .enum(['red', 'black'])
    .describe('The current player (red or black).'),
  moveHistory: z
    .string()
    .optional()
    .describe(
      'A string representing the history of moves made in the game, in standard notation.'
    ),
});
export type AnalyzeGameStateInput = z.infer<typeof AnalyzeGameStateInputSchema>;

const AnalyzeGameStateOutputSchema = z.object({
  threats: z
    .array(z.string())
    .describe('A list of potential threats to the current player.'),
  opportunities: z
    .array(z.string())
    .describe('A list of potential opportunities for the current player.'),
  suggestedMoves: z
    .array(z.string())
    .describe('A list of suggested moves for the current player.'),
  explanation: z
    .string()
    .describe('An explanation of the current game state analysis.'),
});
export type AnalyzeGameStateOutput = z.infer<typeof AnalyzeGameStateOutputSchema>;

export async function analyzeGameState(input: AnalyzeGameStateInput): Promise<AnalyzeGameStateOutput> {
  return analyzeGameStateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeGameStatePrompt',
  input: {
    schema: z.object({
      boardState: z
        .string()
        .describe(
          'A string representing the current state of the Xiangqi board. Use standard notation.'
        ),
      currentPlayer: z
        .enum(['red', 'black'])
        .describe('The current player (red or black).'),
      moveHistory: z
        .string()
        .optional()
        .describe(
          'A string representing the history of moves made in the game, in standard notation.'
        ),
    }),
  },
  output: {
    schema: z.object({
      threats: z
        .array(z.string())
        .describe('A list of potential threats to the current player.'),
      opportunities: z
        .array(z.string())
        .describe('A list of potential opportunities for the current player.'),
      suggestedMoves: z
        .array(z.string())
        .describe('A list of suggested moves for the current player.'),
      explanation: z
        .string()
        .describe('An explanation of the current game state analysis.'),
    }),
  },
  prompt: `You are an expert Xiangqi (Chinese Chess) analyst.

You are given the current board state, the current player, and the move history.

Board State: {{{boardState}}}
Current Player: {{{currentPlayer}}}
Move History: {{{moveHistory}}}

Analyze the game state and provide insights into potential threats, opportunities, and suggested moves for the current player.
Explain your reasoning.

Format your response as a JSON object with the following keys:
- threats: A list of potential threats to the current player.
- opportunities: A list of potential opportunities for the current player.
- suggestedMoves: A list of suggested moves for the current player.
- explanation: An explanation of the current game state analysis.
`,
});

const analyzeGameStateFlow = ai.defineFlow<
  typeof AnalyzeGameStateInputSchema,
  typeof AnalyzeGameStateOutputSchema
>({
  name: 'analyzeGameStateFlow',
  inputSchema: AnalyzeGameStateInputSchema,
  outputSchema: AnalyzeGameStateOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
