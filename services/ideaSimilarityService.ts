import { Idea } from '../types';
import { firestoreService } from './firestoreService';

export interface SimilarityResult {
    isSimilar: boolean;
    similarIdeas: SimilarIdea[];
    suggestions: string[];
    confidence: number;
}

export interface SimilarIdea {
    idea: Idea;
    similarityScore: number;
    similarityReasons: string[];
}

export interface IdeaValidationResult {
    isValid: boolean;
    warnings: string[];
    duplicates: SimilarIdea[];
    suggestions: string[];
}

class IdeaSimilarityService {
    private readonly SIMILARITY_THRESHOLD = 0.7; // 70% similarity threshold
    private readonly HIGH_SIMILARITY_THRESHOLD = 0.85; // 85% for blocking

    /**
     * Check if an idea is similar to existing ideas using text-based similarity
     */
    async checkSimilarity(newIdea: { title: string; description: string; requiredSkills: string[] }, userId: string): Promise<SimilarityResult> {
        try {
            // Get all public ideas and user's private ideas
            const allIdeas = await this.getAllRelevantIdeas(userId);
            
            if (allIdeas.length === 0) {
                return {
                    isSimilar: false,
                    similarIdeas: [],
                    suggestions: [],
                    confidence: 1.0
                };
            }

            // Use text-based similarity checking
            return this.textBasedSimilarityCheck(newIdea, allIdeas);
        } catch (error) {
            console.error('Error in similarity check:', error);
            return {
                isSimilar: false,
                similarIdeas: [],
                suggestions: [],
                confidence: 0.0
            };
        }
    }

    /**
     * Validate an idea before posting
     */
    async validateIdea(newIdea: { title: string; description: string; requiredSkills: string[] }, userId: string): Promise<IdeaValidationResult> {
        try {
            const similarityResult = await this.checkSimilarity(newIdea, userId);
            
            const warnings: string[] = [];
            const duplicates: SimilarIdea[] = [];
            
            // Check for high similarity (potential duplicates)
            similarityResult.similarIdeas.forEach(similar => {
                if (similar.similarityScore >= this.HIGH_SIMILARITY_THRESHOLD) {
                    duplicates.push(similar);
                    warnings.push(`Very similar to existing idea: "${similar.idea.title}"`);
                } else if (similar.similarityScore >= this.SIMILARITY_THRESHOLD) {
                    warnings.push(`Similar to existing idea: "${similar.idea.title}"`);
                }
            });
            
            return {
                isValid: duplicates.length === 0, // Block if high similarity found
                warnings,
                duplicates,
                suggestions: similarityResult.suggestions
            };
        } catch (error) {
            console.error('Error validating idea:', error);
            return {
                isValid: true, // Allow posting if validation fails
                warnings: ['Unable to check for similar ideas'],
                duplicates: [],
                suggestions: []
            };
        }
    }

    /**
     * Get all relevant ideas for similarity comparison
     */
    private async getAllRelevantIdeas(userId: string): Promise<Idea[]> {
        try {
            // Get public ideas
            const publicIdeas = await firestoreService.getPublicIdeas();
            
            // Get user's ideas (both public and private)
            const userIdeas = await firestoreService.getIdeas(userId);
            
            // Combine and deduplicate
            const allIdeas = [...publicIdeas];
            userIdeas.forEach(userIdea => {
                if (!allIdeas.find(idea => idea.id === userIdea.id)) {
                    allIdeas.push(userIdea);
                }
            });
            
            return allIdeas;
        } catch (error) {
            console.error('Error fetching ideas for similarity check:', error);
            return [];
        }
    }

    /**
     * Text-based similarity check using basic text analysis
     */
    private textBasedSimilarityCheck(newIdea: { title: string; description: string; requiredSkills: string[] }, existingIdeas: Idea[]): SimilarityResult {
        const similarIdeas: SimilarIdea[] = [];

        existingIdeas.forEach(existingIdea => {
            const titleSimilarity = this.calculateTextSimilarity(newIdea.title, existingIdea.title);
            const descriptionSimilarity = this.calculateTextSimilarity(newIdea.description, existingIdea.description);
            const skillsSimilarity = this.calculateArraySimilarity(newIdea.requiredSkills, existingIdea.requiredSkills);
            
            const overallSimilarity = (titleSimilarity * 0.4 + descriptionSimilarity * 0.4 + skillsSimilarity * 0.2);
            
            if (overallSimilarity >= this.SIMILARITY_THRESHOLD) {
                similarIdeas.push({
                    idea: existingIdea,
                    similarityScore: overallSimilarity,
                    similarityReasons: [
                        titleSimilarity > 0.7 ? 'Similar title' : '',
                        descriptionSimilarity > 0.7 ? 'Similar description' : '',
                        skillsSimilarity > 0.7 ? 'Similar required skills' : ''
                    ].filter(Boolean)
                });
            }
        });

        return {
            isSimilar: similarIdeas.length > 0,
            similarIdeas,
            suggestions: this.generateGenericSuggestions(newIdea),
            confidence: 0.6 // Lower confidence for text-based method
        };
    }

    /**
     * Calculate text similarity using basic string comparison
     */
    private calculateTextSimilarity(text1: string, text2: string): number {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        
        return intersection.length / union.length;
    }

    /**
     * Calculate array similarity (for skills)
     */
    private calculateArraySimilarity(arr1: string[], arr2: string[]): number {
        const set1 = new Set(arr1.map(item => item.toLowerCase()));
        const set2 = new Set(arr2.map(item => item.toLowerCase()));
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }

    /**
     * Generate generic suggestions for improving idea uniqueness
     */
    private generateGenericSuggestions(idea: { title: string; description: string; requiredSkills: string[] }): string[] {
        return [
            'Consider targeting a more specific niche or market segment',
            'Add unique features or capabilities that differentiate your solution',
            'Focus on a different user demographic or use case',
            'Incorporate emerging technologies or innovative approaches',
            'Consider a different business model or monetization strategy'
        ];
    }
}

export const ideaSimilarityService = new IdeaSimilarityService();
