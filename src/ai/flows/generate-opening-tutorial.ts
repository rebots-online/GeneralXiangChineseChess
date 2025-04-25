'use server';
/**
 * @fileOverview Generates a tutorial for a specific Xiangqi opening strategy.
 *
 * - generateOpeningTutorial - A function that generates a tutorial on a specific Xiangqi opening strategy.
 * - GenerateOpeningTutorialInput - The input type for the generateOpeningTutorial function.
 * - GenerateOpeningTutorialOutput - The return type for the generateOpeningTutorial function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateOpeningTutorialInputSchema = z.object({
  openingName: z.string().describe('The name of the Xiangqi opening strategy to learn.'),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('The skill level of the tutorial.'),
});
export type GenerateOpeningTutorialInput = z.infer<typeof GenerateOpeningTutorialInputSchema>;

const GenerateOpeningTutorialOutputSchema = z.object({
  tutorialContent: z.string().describe('The content of the Xiangqi opening tutorial.'),
});
export type GenerateOpeningTutorialOutput = z.infer<typeof GenerateOpeningTutorialOutputSchema>;

export async function generateOpeningTutorial(input: GenerateOpeningTutorialInput): Promise<GenerateOpeningTutorialOutput> {
  return generateOpeningTutorialFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOpeningTutorialPrompt',
  input: {
    schema: z.object({
      openingName: z.string().describe('The name of the Xiangqi opening strategy to learn.'),
      skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('The skill level of the tutorial.'),
    }),
  },
  output: {
    schema: z.object({
      tutorialContent: z.string().describe('The content of the Xiangqi opening tutorial.'),
    }),
  },
  prompt: `You are an expert Xiangqi tutor. You will provide a tutorial for the opening called {{{openingName}}}. Tailor the tutorial to the {{{skillLevel}}} level player. The tutorial should include a description of the opening, the goals of the opening, and common moves and responses.`,
});

const generateOpeningTutorialFlow = ai.defineFlow<
  typeof GenerateOpeningTutorialInputSchema,
  typeof GenerateOpeningTutorialOutputSchema
>({
  name: 'generateOpeningTutorialFlow',
  inputSchema: GenerateOpeningTutorialInputSchema,
  outputSchema: GenerateOpeningTutorialOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
