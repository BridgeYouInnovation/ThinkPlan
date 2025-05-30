
import { AIResponse } from './types.ts';

export async function callOpenAI(
  systemPrompt: string, 
  userPrompt: string, 
  openAIApiKey: string
): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const aiResult = await response.json();
  let aiResponseContent = aiResult.choices[0].message.content;
  
  // Clean up any potential markdown formatting
  aiResponseContent = aiResponseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  console.log('AI Response Content:', aiResponseContent);
  
  try {
    return JSON.parse(aiResponseContent);
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError);
    console.error('Raw AI Response:', aiResponseContent);
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}
