
import { GoogleGenAI, Type } from "@google/genai";

// Initialize inside functions as per guidelines to ensure the latest API key is used
// and avoid issues with key selection race conditions if applicable.

export const getAIProductEnrichment = async (input: string) => {
  // Use gemini-3-pro-preview for complex creative tasks like product enrichment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
    // Use response.text property directly as per guidelines
    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};

export const analyzeRoomForDecor = async (base64Image: string) => {
  // Use gemini-3-pro-preview for complex multimodal tasks like room analysis
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          },
          {
            text: "Analyze this room. Suggest what kind of handmade decor, textiles, or pottery would complement this specific space. Identify the style (e.g., 'Modern', 'Boho') and suggest 5 tags that I can use to filter a marketplace for products that would look great here."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            style: { type: Type.STRING },
            recommendationReason: { type: Type.STRING },
            suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedCategories: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["style", "suggestedTags", "suggestedCategories"]
        }
      }
    });
    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error) {
    console.error("Vision AI Error:", error);
    return null;
  }
};

export const enhanceProductImage = async (base64Image: string, category: string, productName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          },
          {
            text: `You are a professional product photographer. Enhance this image by replacing the background with a clean, high-end studio setting that fits a ${category} product named "${productName}". Keep the product in the foreground exactly as it is, maintaining its size, shape, and colors perfectly. Use soft professional studio lighting and a complementary minimalist aesthetic background. Only return the modified image.`
          }
        ]
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Enhancement Error:", error);
    return null;
  }
};

export const translateContent = async (text: string, targetLanguage: string) => {
  if (targetLanguage === 'English') return text;
  // Use gemini-3-flash-preview for basic text tasks like translation
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following text to ${targetLanguage}. Ensure the tone remains respectful and artisanal: "${text}"`,
    });
    return response.text || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
};

export const getSalesInsights = async (history: string) => {
  // Use gemini-3-flash-preview for basic data summarization and tips
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these recent sales: ${history}. Provide 3 short actionable business tips for the artisan in 1 sentence each.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["tips"]
        }
      }
    });
    const text = response.text || '{"tips": []}';
    return JSON.parse(text);
  } catch (error) {
    return { tips: ["Keep creating unique pieces!", "Try offering seasonal discounts.", "Share your creation story on social media."] };
  }
};

/**
 * Generates an image using Nano Banana Pro (gemini-3-pro-image-preview)
 */
export const generateProductImage = async (prompt: string, imageSize: "1K" | "2K" | "4K" = "1K") => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `A high-quality, artisanal product photography shot of: ${prompt}. Studio lighting, clean background, 8k resolution style.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: imageSize
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};
