
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAIProductEnrichment = async (input: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Help an artisan create a professional product listing from this rough description: "${input}". 
      Return a catchy product name, a beautiful marketing description (approx 100 words), a suggested price in Indian Rupees (INR) based on artisanal value, and relevant tags.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            price: { type: Type.NUMBER },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            category: { type: Type.STRING },
            imageTips: { type: Type.STRING }
          },
          required: ["name", "description", "price", "tags", "category"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};

export const translateContent = async (text: string, targetLanguage: string) => {
  if (targetLanguage === 'English') return text;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to ${targetLanguage}. Ensure the tone remains respectful and artisanal: "${text}"`,
    });
    return response.text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
};

export const getSalesInsights = async (history: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these recent sales: ${history}. Provide 3 short actionable business tips for the artisan in 1 sentence each.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { tips: ["Keep creating unique pieces!", "Try offering seasonal discounts.", "Share your creation story on social media."] };
  }
};
