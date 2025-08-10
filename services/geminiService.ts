
import { GoogleGenAI, Type } from "@google/genai";
import { User, Match } from '../types';

// The GoogleGenAI instance is initialized using the API key from environment variables.
// Using Vite's import.meta.env to access environment variables in the browser
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            userId: {
                type: Type.STRING,
                description: 'The unique ID (string) of the matched user.',
            },
            compatibilityScore: {
                type: Type.NUMBER,
                description: 'A score from 0 to 100 indicating the compatibility between the two users.',
            },
            justification: {
                type: Type.STRING,
                description: 'A brief, one-sentence explanation for why this is a good match.',
            },
        },
        required: ['userId', 'compatibilityScore', 'justification'],
    },
};

export const findMatches = async (currentUser: User, potentialPartners: User[]): Promise<Match[]> => {
    const model = "gemini-2.5-flash";

    const prompt = `
        You are an expert co-founder matching AI. Your task is to find the best possible co-founders for a given user from a list of potential partners. Analyze the profiles carefully and return the top 5 matches based on role compatibility, shared interests, complementary skills, and stated goals.

        Current User Profile:
        - User ID: ${currentUser.id}
        - Name: ${currentUser.name}
        - Role: ${currentUser.role}
        - Location: ${currentUser.location}
        - Interests: ${currentUser.interests.join(', ')}
        - Skills: ${currentUser.skills.join(', ')}
        - Experience: ${currentUser.experience}
        - Looking For: ${currentUser.lookingFor}

        List of Potential Partners:
        ${potentialPartners.map(p => `
        ---
        User ID: ${p.id}
        Name: ${p.name}
        Role: ${p.role}
        Location: ${p.location}
        Interests: ${p.interests.join(', ')}
        Skills: ${p.skills.join(', ')}
        Experience: ${p.experience}
        Looking For: ${p.lookingFor}
        `).join('')}

        Based on this information, provide a ranked list of the top 5 most compatible partners for ${currentUser.name}. Your response must be a JSON array of objects, conforming to the provided schema. The justification should be concise and highlight the key reason for the match.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonText = response.text.trim();
        const matches: Match[] = JSON.parse(jsonText);
        
        // Sort by compatibility score in descending order
        return matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to fetch matches from the AI. The Gemini API key may be invalid or there could be a network issue.");
    }
};
