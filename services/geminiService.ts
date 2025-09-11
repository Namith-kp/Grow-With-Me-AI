
import { GoogleGenAI, Type } from "@google/genai";
import { User, Match, Role, NearMatch } from '../types';
import { firestoreService } from './firestoreService';

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

export const findMatches = async (currentUser: User, potentialPartners: User[]): Promise<{ matches: Match[], nearMatches: NearMatch[], isFallback: boolean }> => {
    // TEMPORARILY DISABLED: Gemini API matching
    // Using fallback matching algorithm instead
    console.log("Gemini API matching temporarily disabled. Using fallback matching algorithm.");
    // Enrich with idea counts for activity scoring
    let ideaCounts: Record<string, number> = {};
    try {
        const ids = [currentUser.id, ...potentialPartners.map(u => u.id)];
        ideaCounts = await firestoreService.getIdeaCountsByUserIds(ids);
    } catch (e) {
        console.warn('Failed to fetch idea counts for matching, continuing without:', e);
    }

    // Progressive relaxation: exact → country → global, and relaxing min score
    const desiredTopK = 5;
    const attempts = [
        { locationMode: 'exact' as const, minScore: 50 },
        { locationMode: 'country' as const, minScore: 40 },
        { locationMode: 'any' as const, minScore: 30 },
    ];

    let combined: Match[] = [];
    let nearCombined: NearMatch[] = [];
    const seen = new Set<string>();
    for (const attempt of attempts) {
        const { matches: pass, near } = generateFallbackMatches(currentUser, potentialPartners, ideaCounts, {
            locationMode: attempt.locationMode,
            minScore: attempt.minScore,
            topK: desiredTopK,
        });
        for (const m of pass) {
            if (!seen.has(m.userId)) {
                seen.add(m.userId);
                combined.push(m);
            }
        }
        // Collect near matches too
        nearCombined.push(...near.filter(n => !seen.has(n.userId)));
        if (combined.length >= desiredTopK) break;
    }

    // Take the best topK overall
    combined = combined.sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, desiredTopK);

    // Keep top near matches by proximity (not overlapping with final matches), and de-duplicate by userId
    const finalMatchIds = new Set(combined.map(m => m.userId));
    const uniqueNearMap = new Map<string, NearMatch>();
    nearCombined.forEach(n => {
        if (finalMatchIds.has(n.userId)) return;
        const existing = uniqueNearMap.get(n.userId);
        if (!existing || n.proximityScore > existing.proximityScore) {
            uniqueNearMap.set(n.userId, n);
        }
    });
    const nearDeduped = Array.from(uniqueNearMap.values())
        .sort((a, b) => b.proximityScore - a.proximityScore)
        .slice(0, 5);

    return {
        matches: combined,
        nearMatches: nearDeduped,
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

// Utilities
const yearsFromDob = (dob?: string): number | null => {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const diff = Date.now() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

const normalize = (value: number, max: number): number => {
    if (max <= 0) return 0;
    const n = Math.max(0, Math.min(value / max, 1));
    return n;
};

const overlapCount = (a: string[] = [], b: string[] = []): number => a.filter(x => b.includes(x)).length;

const rolesComplementary = (a: Role, b: Role): boolean => {
    if (a === b) return false;
    const set = new Set([a, b]);
    return (
        (set.has(Role.Founder) && set.has(Role.Developer)) ||
        (set.has(Role.Founder) && set.has(Role.Investor)) ||
        (set.has(Role.Developer) && set.has(Role.Investor))
    );
};

// Fallback matching algorithm when Gemini API quota is exceeded (enhanced weighted scoring)
type RelaxOptions = { locationMode: 'exact' | 'country' | 'any'; minScore: number; topK: number };

const generateFallbackMatches = (currentUser: User, potentialPartners: User[], ideaCounts: Record<string, number> = {}, relax?: RelaxOptions): { matches: Match[]; near: NearMatch[] } => {
    const matches: Match[] = [];
    
    // Filter out the current user from potential partners
    const otherUsers = potentialPartners.filter(user => user.id !== currentUser.id);
    
    // Precompute max idea count for normalization
    const maxIdeaCount = Math.max(0, ...otherUsers.map(u => ideaCounts[u.id] || 0));

    // Weighted scoring
    const scoredUsers = otherUsers.map(user => {
        let score = 0; // start from 0, add weights

        // 1) Role complementarity (0-20)
        if (rolesComplementary(currentUser.role, user.role)) score += 18;
        else if (currentUser.role !== user.role) score += 10; // different but not ideal pair

        // 2) Location proximity (0-10)
        const locA = currentUser.location?.toLowerCase();
        const locB = user.location?.toLowerCase();
        if (locA && locB) {
            const sameExact = locA === locB;
            const sameCountry = locA.split(',').pop()?.trim() === locB.split(',').pop()?.trim();
            if (sameExact) score += 10; 
            else if (sameCountry) score += 6;
            // If relaxation says 'any', we don't penalize but also don't add extra points beyond what's above
        }

        // 3) Domain/interest alignment (0-15)
        const commonInterests = overlapCount(currentUser.interests, user.interests);
        score += Math.min(commonInterests * 3, 15);

        // 4) Skills overlap/complementarity (0-20)
        const commonSkills = overlapCount(currentUser.skills, user.skills);
        score += Math.min(commonSkills * 4, 20);

        // 5) Experience alignment (0-10)
        if (currentUser.experience && user.experience) {
            if (currentUser.experience === user.experience) score += 8;
            else score += 4;
        }

        // 6) Investor-investment domain/budget compatibility (0-10)
        if ((currentUser.role === Role.Investor && user.role === Role.Founder) || (currentUser.role === Role.Founder && user.role === Role.Investor)) {
            const investor = currentUser.role === Role.Investor ? currentUser : user;
            if (investor.investorProfile) {
                // Domain touch with interests
                const domainOverlap = overlapCount(investor.investorProfile.interestedDomains || [], (currentUser.role === Role.Investor ? user : currentUser).interests || []);
                score += Math.min(domainOverlap * 3, 6);
                // Budget presence adds small confidence
                if (typeof investor.investorProfile.budget?.min === 'number' && typeof investor.investorProfile.budget?.max === 'number') {
                    score += 2;
                }
            }
        }

        // 7) Age proximity (0-5)
        const ageA = yearsFromDob(currentUser.dateOfBirth);
        const ageB = yearsFromDob(user.dateOfBirth);
        if (ageA !== null && ageB !== null) {
            const diff = Math.abs(ageA - ageB);
            if (diff <= 5) score += 5;
            else if (diff <= 10) score += 3;
        }

        // 8) Activity via ideas uploaded (0-10)
        const count = ideaCounts[user.id] || 0;
        score += Math.round(normalize(count, Math.max(3, maxIdeaCount)) * 10);

        // Base floor to avoid very low scores for decent matches
        score = Math.min(100, Math.max(0, score));

        return {
            user,
            score,
            justification: generateFallbackJustification(currentUser, user, score)
        };
    });
    
    // Sort by score and take top 5
    let filtered = scoredUsers
        .sort((a, b) => b.score - a.score);

    // Apply relaxation filters
    if (relax) {
        const { locationMode, minScore, topK } = relax;
        const passed: typeof filtered = [];
        const near: NearMatch[] = [];
        filtered.forEach(({ user, score }) => {
            // If score is below threshold, consider as near match with reason
            if (score < minScore) {
                const missing: string[] = [];
                near.push({
                    userId: user.id,
                    proximityScore: score,
                    missingSignals: missing,
                    justification: generateFallbackJustification(currentUser, user, score)
                });
                return;
            }
            const locA = currentUser.location?.toLowerCase();
            const locB = user.location?.toLowerCase();
            const sameExact = !!(locA && locB && locA === locB);
            const sameCountry = !!(locA && locB && locA.split(',').pop()?.trim() === locB.split(',').pop()?.trim());

            const passesLoc = locationMode === 'any' ? true : (locationMode === 'exact' ? sameExact : sameCountry);
            if (passesLoc) {
                passed.push({ user, score, justification: generateFallbackJustification(currentUser, user, score) });
            } else {
                // Build missing reasons
                const missing: string[] = [];
                if (locationMode === 'exact' && !sameExact) missing.push('different location');
                if (locationMode === 'country' && !sameCountry) missing.push('different country');
                near.push({
                    userId: user.id,
                    proximityScore: score,
                    missingSignals: missing,
                    justification: generateFallbackJustification(currentUser, user, score)
                });
            }
        });
        filtered = passed.slice(0, topK);
        return {
            matches: filtered.map(match => ({
                userId: match.user.id,
                compatibilityScore: match.score,
                justification: match.justification
            })),
            near: near.sort((a, b) => b.proximityScore - a.proximityScore).slice(0, topK)
        };
    } else {
        const sliced = filtered.slice(0, 5);
        return {
            matches: sliced.map(match => ({
                userId: match.user.id,
                compatibilityScore: match.score,
                justification: match.justification
            })),
            near: []
        };
    }
};

const generateFallbackJustification = (currentUser: User, matchedUser: User, score: number): string => {
    const reasons: string[] = [];
    
    if (rolesComplementary(currentUser.role, matchedUser.role)) reasons.push("complementary roles");
    
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
    
    const ageA = yearsFromDob(currentUser.dateOfBirth);
    const ageB = yearsFromDob(matchedUser.dateOfBirth);
    if (ageA !== null && ageB !== null && Math.abs(ageA - ageB) <= 5) reasons.push("similar age");

    if (reasons.length === 0) return "Good potential match based on multiple profile signals.";
    return `Strong match due to ${reasons.slice(0,3).join(", ")}.`;
};
