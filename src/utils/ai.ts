import type { UserProfile, DetectedField, MappingResult } from '../types';

export const callGeminiApi = async (prompt: string, apiKey: string, systemInstruction?: string) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textResponse) {
    throw new Error('Invalid response from Gemini');
  }

  return JSON.parse(textResponse);
};

export const parseResumeWithGemini = async (text: string, apiKey: string): Promise<Partial<UserProfile>> => {
  const systemInstruction = `You are an expert resume parsing AI. 
Extract the following information from the provided resume text into a strict JSON object. 
Keys must exactly match: firstName, lastName, email, phone, location, linkedin, github, portfolio, education, skills, workExperience, projects, certifications.
If a field is missing, return an empty string for it. 
Format dates nicely. Summarize long paragraphs for experience/projects into concise bullet points.`;

  return await callGeminiApi(text, apiKey, systemInstruction) as Partial<UserProfile>;
};

export const mapFieldsWithGemini = async (fields: DetectedField[], profile: UserProfile, apiKey: string): Promise<MappingResult[]> => {
  const systemInstruction = `You are an AI assistant that maps HTML form fields to a user's profile data.
You will be provided with a JSON array of 'DetectedField' objects found on a job application page, and the 'UserProfile' JSON object.
Your task is to determine which profile field should be filled into which form field.
Return a JSON array of objects, where each object has:
- domId: (string) the domId of the field
- detectedLabel: (string) the label of the field
- mappedProfileKey: (string) the exact key from UserProfile, or 'fullName' if it asks for full name. Return null if no match.
- mappedValue: (string) the actual string value from the profile to inject. Return null if no match.
- confidence: (string) 'high' if you are very certain, 'low' if it requires user review, or 'none' if it shouldn't be mapped.

Do not map fields that ask for data not present in the profile.`;

  const prompt = `
UserProfile Data:
${JSON.stringify(profile, null, 2)}

Detected Form Fields:
${JSON.stringify(fields, null, 2)}
`;

  return await callGeminiApi(prompt, apiKey, systemInstruction) as MappingResult[];
};
