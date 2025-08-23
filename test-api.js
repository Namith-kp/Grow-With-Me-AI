// Simple test script to verify Gemini API key
const { GoogleGenAI } = require("@google/genai");

// Replace with your actual API key
const API_KEY = "YOUR_API_KEY_HERE"; // Replace this with your actual key

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function testAPI() {
    try {
        console.log("Testing Gemini API...");
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Hello, this is a test message. Please respond with 'API is working!'",
            config: {
                temperature: 0,
            }
        });

        console.log("✅ API Response:", response.text);
        console.log("✅ API Key is working correctly!");
        
    } catch (error) {
        console.error("❌ API Error:", error);
        
        if (error?.error?.code === 429) {
            console.error("❌ Quota exceeded - you need a new API key or upgrade to paid plan");
        } else if (error?.error?.code === 400) {
            console.error("❌ Invalid API key");
        } else {
            console.error("❌ Other error:", error.message);
        }
    }
}

testAPI();
