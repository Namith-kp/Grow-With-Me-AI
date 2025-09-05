
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

export const findMatches = async (currentUser: User, potentialPartners: User[]): Promise<{ matches: Match[], isFallback: boolean }> => {
    // TEMPORARILY DISABLED: Gemini API matching
    // Using fallback matching algorithm instead
    console.log("Gemini API matching temporarily disabled. Using fallback matching algorithm.");
    
    return {
        matches: generateFallbackMatches(currentUser, potentialPartners),
        isFallback: true
    };

    // Original Gemini API code (commented out for temporary disable):
    /*
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
        return {
            matches: matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore),
            isFallback: false
        };

    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        
        // Check if it's a quota exceeded error
        if (error?.error?.code === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            console.warn("Gemini API quota exceeded. Using fallback matching algorithm.");
            return {
                matches: generateFallbackMatches(currentUser, potentialPartners),
                isFallback: true
            };
        }
        
        throw new Error("Failed to fetch matches from the AI. The Gemini API key may be invalid or there could be a network issue.");
    }
    */
};

// Fallback matching algorithm when Gemini API quota is exceeded
const generateFallbackMatches = (currentUser: User, potentialPartners: User[]): Match[] => {
    const matches: Match[] = [];
    
    // Filter out the current user from potential partners
    const otherUsers = potentialPartners.filter(user => user.id !== currentUser.id);
    
    // Simple matching algorithm based on role compatibility and location
    const scoredUsers = otherUsers.map(user => {
        let score = 50; // Base score
        
        // Role compatibility bonus
        if (currentUser.role !== user.role) {
            score += 20; // Different roles are better for co-founding
        }
        
        // Location bonus (same location gets bonus)
        if (currentUser.location && user.location && 
            currentUser.location.toLowerCase() === user.location.toLowerCase()) {
            score += 15;
        }
        
        // Skills overlap bonus
        const commonSkills = currentUser.skills.filter(skill => 
            user.skills.includes(skill)
        );
        score += commonSkills.length * 5;
        
        // Interests overlap bonus
        const commonInterests = currentUser.interests.filter(interest => 
            user.interests.includes(interest)
        );
        score += commonInterests.length * 3;
        
        // Cap score at 100
        score = Math.min(score, 100);
        
        return {
            user,
            score,
            justification: generateFallbackJustification(currentUser, user, score)
        };
    });
    
    // Sort by score and take top 5
    const topMatches = scoredUsers
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    
    return topMatches.map(match => ({
        userId: match.user.id,
        compatibilityScore: match.score,
        justification: match.justification
    }));
};

const generateFallbackJustification = (currentUser: User, matchedUser: User, score: number): string => {
    const reasons: string[] = [];
    
    if (currentUser.role !== matchedUser.role) {
        reasons.push("complementary roles");
    }
    
    if (currentUser.location && matchedUser.location && 
        currentUser.location.toLowerCase() === matchedUser.location.toLowerCase()) {
        reasons.push("same location");
    }
    
    const commonSkills = currentUser.skills.filter(skill => 
        matchedUser.skills.includes(skill)
    );
    if (commonSkills.length > 0) {
        reasons.push("shared skills");
    }
    
    const commonInterests = currentUser.interests.filter(interest => 
        matchedUser.interests.includes(interest)
    );
    if (commonInterests.length > 0) {
        reasons.push("shared interests");
    }
    
    if (reasons.length === 0) {
        return "Good potential match based on profile analysis.";
    }
    
    return `Strong match due to ${reasons.join(", ")}.`;
};
