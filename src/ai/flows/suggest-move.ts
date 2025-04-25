// Server side code, must be marked with 'use server'
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting the next move in a Chinese Chess (Xiangqi) game.
 *
 * - suggestMove - A function that takes the current game state and returns an AI-powered suggestion for the next move.
 * - SuggestMoveInput - The input type for the suggestMove function, including the game state.
 * - SuggestMoveOutput - The return type for the suggestMove function, providing the suggested move and rationale.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

const SuggestMoveInputSchema = z.object({
  gameState: z.string().describe('The current state of the Xiangqi game, in a suitable format like FEN.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium').describe('The difficulty level of the AI suggestion.'),
});
export type SuggestMoveInput = z.infer<typeof SuggestMoveInputSchema>;

const SuggestMoveOutputSchema = z.object({
  suggestedMove: z.string().describe('The suggested move in a standard algebraic notation.'),
  rationale: z.string().describe('The AI rationale for suggesting this move, including potential benefits and risks.'),
});
export type SuggestMoveOutput = z.infer<typeof SuggestMoveOutputSchema>;

export async function suggestMove(input: SuggestMoveInput): Promise<SuggestMoveOutput> {
  return suggestMoveFlow(input);
}

const suggestMovePrompt = ai.definePrompt({
  name: 'suggestMovePrompt',
  input: {
    schema: z.object({
      gameState: z.string().describe('The current state of the Xiangqi game.'),
      difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level for the AI suggestion.'),
    }),
  },
  output: {
    schema: z.object({
      suggestedMove: z.string().describe('The suggested move in standard algebraic notation.'),
      rationale: z.string().describe('The AI rationale for suggesting this move, including potential benefits and risks.'),
    }),
  },
  prompt: `You are an expert Chinese Chess (Xiangqi) strategist. Given the current game state and the desired difficulty level, suggest the best next move and explain your reasoning.\n\nGame State:\n{{gameState}}\n\nDifficulty Level: {{difficulty}}\n\nConsider the principles of Xiangqi strategy, such as controlling key files, protecting your pieces, attacking the opponent's weaknesses, and planning for the endgame. Prioritize moves that lead to a favorable position or material advantage.\n\nSuggested Move: (Provide the move in standard algebraic notation)\nRationale: (Explain why this move is recommended, including potential benefits and risks. Keep explanation short and succinct.)`,
});

const suggestMoveFlow = ai.defineFlow<
  typeof SuggestMoveInputSchema,
  typeof SuggestMoveOutputSchema
>({
  name: 'suggestMoveFlow',
  inputSchema: SuggestMoveInputSchema,
  outputSchema: SuggestMoveOutputSchema,
}, async (input) => {
  const { output } = await suggestMovePrompt(input);
  return output!;
});
