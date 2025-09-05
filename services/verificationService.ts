import { auth, firebase } from '../firebase';

// Enhanced verification service with visible reCAPTCHA and phone auth
// This is separate from login/signup - only for account verification

export interface PhoneVerificationResult {
    success: boolean;
    verificationId?: string;
    error?: string;
}

// Rate limiting to prevent Firebase blocks
const rateLimiter = {
    lastAttempt: 0,
    attempts: 0,
    maxAttempts: 3,
    cooldownMs: 120000, // 2 minute cooldown
    
    canAttempt(): boolean {
        const now = Date.now();
        if (now - this.lastAttempt > this.cooldownMs) {
            this.attempts = 0; // Reset after cooldown
        }
        return this.attempts < this.maxAttempts;
    },
    
    recordAttempt(): void {
        this.lastAttempt = Date.now();
        this.attempts++;
    },
    
    getTimeUntilNext(): number {
        const timeSinceLast = Date.now() - this.lastAttempt;
        return Math.max(0, this.cooldownMs - timeSinceLast);
    }
};

// Development mode - helps bypass Firebase restrictions during testing
const isDevelopment = import.meta.env?.MODE === 'development' || import.meta.env?.DEV === true;
const useMockMode = import.meta.env?.VITE_USE_MOCK_VERIFICATION === 'true';

// Mock verification for development (avoids Firebase rate limits)
const mockVerification = {
    async sendCode(phoneNumber: string): Promise<PhoneVerificationResult> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock verification ID
        const mockId = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        console.log(`🔧 MOCK MODE: SMS sent to ${phoneNumber}. Code: 123456`);
        
        return {
            success: true,
            verificationId: mockId
        };
    },
    
    async verifyCode(verificationId: string, code: string): Promise<{ success: boolean; error?: string }> {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (code === '123456') {
            console.log('🔧 MOCK MODE: Code verified successfully');
            return { success: true };
        } else {
            return { success: false, error: 'Invalid code. Use 123456 for mock mode.' };
        }
    }
};

// Clean reCAPTCHA management
class RecaptchaManager {
    private verifiers: Map<string, firebase.auth.RecaptchaVerifier> = new Map();
    
    // Clear all reCAPTCHA instances
    clearAll(): void {
        try {
            this.verifiers.forEach(verifier => {
                try { verifier.clear(); } catch {}
            });
            this.verifiers.clear();
        } catch {}
    }
    
    // Clear specific container
    clearContainer(containerId: string): void {
        try {
            // Clear the verifier
            if (this.verifiers.has(containerId)) {
                try { 
                    const verifier = this.verifiers.get(containerId);
                    if (verifier) {
                        verifier.clear();
                        // Disable render method to prevent re-rendering
                        (verifier as any).render = () => Promise.resolve(0);
                    }
                } catch {}
                this.verifiers.delete(containerId);
            }
            
            // Clear the DOM more thoroughly
            const el = document.getElementById(containerId);
            if (el) {
                // Remove all child elements
                while (el.firstChild) {
                    el.removeChild(el.firstChild);
                }
                // Clear any remaining content
                el.innerHTML = '';
                
                // Remove any reCAPTCHA iframes that might be attached
                const iframes = document.querySelectorAll(`iframe[src*="recaptcha"]`);
                iframes.forEach(iframe => {
                    if (iframe.parentNode === el || el.contains(iframe)) {
                        iframe.remove();
                    }
                });
                
                // Also remove any reCAPTCHA divs
                const recaptchaDivs = el.querySelectorAll('.g-recaptcha, [data-sitekey]');
                recaptchaDivs.forEach(div => div.remove());
                
                // Remove any reCAPTCHA scripts that might be injected
                const recaptchaScripts = el.querySelectorAll('script[src*="recaptcha"]');
                recaptchaScripts.forEach(script => script.remove());
            }
            
            // Force garbage collection hint
            if (typeof window !== 'undefined' && (window as any).gc) {
                try { (window as any).gc(); } catch {}
            }
        } catch {}
    }
    
    // Create visible reCAPTCHA
    createVisibleRecaptcha(
        containerId: string,
        onSolved?: () => void,
        onExpired?: () => void
    ): firebase.auth.RecaptchaVerifier {
        // Check if there's already a reCAPTCHA in this container
        const container = document.getElementById(containerId);
        if (container) {
            const hasRecaptcha = container.querySelector('iframe[src*="recaptcha"], .g-recaptcha, [data-sitekey], .rc-anchor');
            if (hasRecaptcha) {
                console.log(`reCAPTCHA already exists in container ${containerId}, clearing first`);
                this.clearContainer(containerId);
                // Wait longer for cleanup to complete
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(this.createVisibleRecaptcha(containerId, onSolved, onExpired));
                    }, 300);
                }) as any;
            }
        }
        
        // Clear any existing instance
        this.clearContainer(containerId);
        
        // Additional wait to ensure DOM is clean
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    const verifier = new firebase.auth.RecaptchaVerifier(containerId, {
                        size: 'normal',
                        callback: () => {
                            console.log('reCAPTCHA solved for:', containerId);
                            onSolved && onSolved();
                        },
                        'expired-callback': () => {
                            console.log('reCAPTCHA expired for:', containerId);
                            onExpired && onExpired();
                        }
                    }, firebase.app());
                    
                    // Render immediately
                    verifier.render();
                    
                    // Store for cleanup
                    this.verifiers.set(containerId, verifier);
                    
                    resolve(verifier);
                } catch (error: any) {
                    console.error('Failed to create visible reCAPTCHA:', error);
                    throw error;
                }
            }, 100);
        }) as any;
    }
    
    // Create invisible reCAPTCHA for phone auth
    createInvisibleRecaptcha(containerId: string): firebase.auth.RecaptchaVerifier {
        // Clear any existing instance
        this.clearContainer(containerId);
        
        try {
            console.log(`Creating invisible reCAPTCHA for container: ${containerId}`);
            
            const verifier = new firebase.auth.RecaptchaVerifier(containerId, {
                size: 'invisible',
                callback: () => {
                    console.log('Invisible reCAPTCHA solved for:', containerId);
                },
                'expired-callback': () => {
                    console.log('Invisible reCAPTCHA expired for:', containerId);
                }
            }, firebase.app());
            
            console.log(`Rendering invisible reCAPTCHA for container: ${containerId}`);
            // Render immediately
            verifier.render();
            
            // Store for cleanup
            this.verifiers.set(containerId, verifier);
            
            console.log(`Invisible reCAPTCHA created and rendered for container: ${containerId}`);
            return verifier;
        } catch (error: any) {
            console.error('Failed to create invisible reCAPTCHA:', error);
            throw error;
        }
    }
    
    // Get existing verifier or create new one
    getOrCreateVisibleRecaptcha(
        containerId: string,
        onSolved?: () => void,
        onExpired?: () => void
    ): firebase.auth.RecaptchaVerifier {
        if (this.verifiers.has(containerId)) {
            return this.verifiers.get(containerId)!;
        }
        return this.createVisibleRecaptcha(containerId, onSolved, onExpired);
    }
    
    // Get existing invisible verifier or create new one
    getOrCreateInvisibleRecaptcha(containerId: string): firebase.auth.RecaptchaVerifier {
        if (this.verifiers.has(containerId)) {
            return this.verifiers.get(containerId)!;
        }
        return this.createInvisibleRecaptcha(containerId);
    }
}

// Global reCAPTCHA manager
const recaptchaManager = new RecaptchaManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        recaptchaManager.clearAll();
    });
}

export const verificationService = {
    // Clear all reCAPTCHA instances
    clearAllRecaptcha: (): void => {
        recaptchaManager.clearAll();
    },
    
    // Clear specific container
    clearRecaptcha: (containerId: string): void => {
        recaptchaManager.clearContainer(containerId);
    },
    
    // Visible reCAPTCHA for human verification
    ensureVisibleRecaptcha: (
        containerId: string,
        onSolved?: () => void,
        onExpired?: () => void
    ): firebase.auth.RecaptchaVerifier => {
        return recaptchaManager.getOrCreateVisibleRecaptcha(containerId, onSolved, onExpired);
    },
    
    // Run visible reCAPTCHA challenge
    runVisibleRecaptcha: async (containerId: string): Promise<string> => {
        const verifier = recaptchaManager.getOrCreateVisibleRecaptcha(containerId);
        const token = await verifier.verify();
        return token as unknown as string;
    },
    
    // Send phone verification code
    sendPhoneVerification: async (phoneNumber: string, containerId: string): Promise<PhoneVerificationResult> => {
        // Use mock mode in development if enabled
        if (useMockMode && isDevelopment) {
            console.log('🔧 Using mock verification mode');
            return await mockVerification.sendCode(phoneNumber);
        }
        
        // Check rate limiting
        if (!rateLimiter.canAttempt()) {
            const timeUntilNext = rateLimiter.getTimeUntilNext();
            const minutes = Math.ceil(timeUntilNext / 60000);
            return {
                success: false,
                error: `Too many attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`
            };
        }
        
        try {
            rateLimiter.recordAttempt();
            console.log(`Starting phone verification for: ${phoneNumber}`);
            
            // Get the existing visible reCAPTCHA verifier and get a fresh token
            console.log('Getting fresh reCAPTCHA token for phone verification');
            const visibleVerifier = recaptchaManager.getOrCreateVisibleRecaptcha('sms-debug-human');
            
            // Get a fresh reCAPTCHA token
            console.log('Waiting for reCAPTCHA to be solved...');
            const recaptchaToken = await visibleVerifier.verify();
            console.log('reCAPTCHA solved successfully, token received');
            
            // Create a new invisible reCAPTCHA verifier specifically for phone auth
            // This ensures we use the correct Firebase configuration
            console.log('Creating phone-specific reCAPTCHA verifier');
            const phoneVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
                size: 'invisible',
                callback: () => {
                    console.log('Phone reCAPTCHA solved');
                },
                'expired-callback': () => {
                    console.log('Phone reCAPTCHA expired');
                }
            }, firebase.app());
            
            // Render the phone verifier
            await phoneVerifier.render();
            console.log('Phone reCAPTCHA verifier rendered');
            
            console.log('Sending SMS to:', phoneNumber);
            const confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, phoneVerifier);
            console.log('SMS sent successfully, confirmation result received');
            
            // Clean up the phone verifier
            try { phoneVerifier.clear(); } catch {}
            
            return {
                success: true,
                verificationId: confirmationResult.verificationId
            };
        } catch (error: any) {
            console.error('Phone verification error:', error);
            
            // Handle specific Firebase errors
            if (error.code === 'auth/too-many-requests') {
                return {
                    success: false,
                    error: 'Too many verification attempts. Please wait a few minutes before trying again.'
                };
            } else if (error.code === 'auth/invalid-phone-number') {
                return {
                    success: false,
                    error: 'Invalid phone number format. Please use international format (e.g., +1234567890).'
                };
            } else if (error.code === 'auth/quota-exceeded') {
                return {
                    success: false,
                    error: 'SMS quota exceeded. Please try again later or contact support.'
                };
            } else if (error.code === 'auth/operation-not-allowed') {
                return {
                    success: false,
                    error: 'Phone authentication is not enabled. Please contact support.'
                };
            } else if (error.code === 'auth/invalid-app-credential') {
                return {
                    success: false,
                    error: 'reCAPTCHA verification failed. Please refresh and try again.'
                };
            } else if (error.code === 'auth/network-request-failed') {
                return {
                    success: false,
                    error: 'Network error. Please check your internet connection and try again.'
                };
            }
            
            return {
                success: false,
                error: error.message || 'Failed to send verification code'
            };
        }
    },
    
    // Verify phone code
    verifyPhoneCode: async (verificationId: string, code: string): Promise<{ success: boolean; error?: string }> => {
        // Use mock mode in development if enabled
        if (useMockMode && isDevelopment) {
            console.log('🔧 Using mock verification mode');
            return await mockVerification.verifyCode(verificationId, code);
        }
        
        try {
            const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, code);
            await auth.signInWithCredential(credential);
            // Sign out immediately since this is just for verification
            await auth.signOut();
            return { success: true };
        } catch (error: any) {
            console.error('Code verification error:', error);
            
            // Handle specific Firebase errors
            if (error.code === 'auth/invalid-verification-code') {
                return {
                    success: false,
                    error: 'Invalid verification code. Please check the code and try again.'
                };
            } else if (error.code === 'auth/code-expired') {
                return {
                    success: false,
                    error: 'Verification code has expired. Please request a new code.'
                };
            }
            
            return {
                success: false,
                error: error.message || 'Invalid verification code'
            };
        }
    },
    
    // Format phone number for display
    formatPhoneNumber: (phoneNumber: string): string => {
        // Remove all non-digits
        const cleaned = phoneNumber.replace(/\D/g, '');
        
        // Format based on length
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
        }
        
        return phoneNumber;
    },
    
    // Check if we can attempt verification
    canAttemptVerification: (): boolean => {
        return rateLimiter.canAttempt();
    },
    
    // Get time until next attempt
    getTimeUntilNextAttempt: (): number => {
        return rateLimiter.getTimeUntilNext();
    },
    
    // Reset rate limiter (for testing)
    resetRateLimiter: (): void => {
        rateLimiter.attempts = 0;
        rateLimiter.lastAttempt = 0;
    }
};

export default verificationService;


