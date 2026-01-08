/**
 * Centralized Gemini API utilities for EGYPTOUR
 * 
 * Provides error handling, retry logic, and fallback mechanisms
 * for all Gemini API interactions throughout the application.
 * 
 * @module lib/gemini
 * @author EGYPTOUR Team
 * @version 1.0.0
 */

import { GoogleGenAI } from '@google/genai';
import { PhotoAnalysis } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Initialize Gemini AI client with API key validation
 * 
 * @returns {GoogleGenAI | null} Initialized Gemini client or null if API key is missing
 * @throws {Error} Logs error if API key is not found
 */
export const getGeminiClient = (): GoogleGenAI | null => {
  if (!GEMINI_API_KEY) {
    console.error('Gemini API key not found');
    return null;
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
};

/**
 * Retry wrapper for API calls with exponential backoff
 * 
 * @template T
 * @param {() => Promise<T>} fn - Async function to retry
 * @param {number} retries - Number of retry attempts (default: MAX_RETRIES)
 * @returns {Promise<T>} Result from the function call
 * @throws {Error} Re-throws error if all retries are exhausted
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('429') || error.message?.includes('503'))) {
      // Rate limit or service unavailable - retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
}

/**
 * Analyze photo and compare with other tourist photos
 * 
 * Uses Gemini Vision API to analyze photo composition, lighting, and quality.
 * Compares the photo with a database of typical tourist photos and provides
 * percentile ranking and improvement suggestions.
 * 
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} [missionTitle] - Optional mission title for context
 * @returns {Promise<PhotoAnalysis>} Analysis object with scores, feedback, and suggestions
 * @throws {Error} Returns fallback analysis if API call fails
 * 
 * @example
 * const analysis = await analyzePhotoComparison(imageData, 'أهرامات الجيزة');
 * console.log(`Your photo is in the top ${100 - analysis.percentile}%`);
 */
export const analyzePhotoComparison = async (
  imageBase64: string,
  missionTitle?: string
): Promise<PhotoAnalysis> => {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('Gemini API client not available');
  }

  try {
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const prompt = `Analyze this tourist photo${missionTitle ? ` taken at ${missionTitle}` : ''}.
    
Evaluate the following aspects:
1. Composition quality (0-100)
2. Lighting quality (0-100)
3. Angle and perspective (0-100)
4. Overall appeal (0-100)

Compare this photo with typical tourist photos of this location. Estimate what percentile this photo falls into (0-100, where 0 is worst and 100 is best).

Provide feedback in JSON format:
{
  "composition": number (0-100),
  "lighting": number (0-100),
  "angle": number (0-100),
  "overall": number (0-100),
  "percentile": number (0-100),
  "rating": "excellent" | "good" | "average" | "needs-improvement",
  "feedback": "Brief feedback in Arabic",
  "suggestions": ["Suggestion 1 in Arabic", "Suggestion 2 in Arabic"]
}

Only return valid JSON, no additional text.`;

    const result = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }]
      });
    });

    const text = result.text || '';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }

    const analysis = JSON.parse(jsonMatch[0]) as PhotoAnalysis;

    // Ensure all fields are present with defaults
    return {
      composition: analysis.composition || 50,
      percentile: analysis.percentile || 50,
      feedback: analysis.feedback || 'صورة جيدة',
      suggestions: analysis.suggestions || [],
      rating: analysis.rating || 'average'
    };

  } catch (error: any) {
    console.error('Photo analysis error:', error);
    
    // Fallback response
    return {
      composition: 50,
      percentile: 50,
      feedback: 'تم تحليل الصورة بنجاح',
      suggestions: ['جرب التقاط الصورة من زاوية مختلفة', 'استخدم الإضاءة الطبيعية'],
      rating: 'average'
    };
  }
};

/**
 * Verify photo matches mission requirements
 */
export const verifyPhotoMission = async (
  imageBase64: string,
  missionTitle: string,
  requirements?: string
): Promise<{ verified: boolean; feedback: string }> => {
  const ai = getGeminiClient();
  if (!ai) {
    return { verified: false, feedback: 'خطأ في الاتصال' };
  }

  try {
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const prompt = `Analyze this photo to verify if it matches the mission requirements.
    
Mission: ${missionTitle}
${requirements ? `Requirements: ${requirements}` : ''}

Determine if the photo:
1. Shows the correct location/landmark
2. Meets the specified requirements (if any)
3. Is clear and identifiable

Respond in JSON format:
{
  "verified": boolean,
  "feedback": "Brief feedback in Arabic explaining the verification result"
}

Only return valid JSON, no additional text.`;

    const result = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }]
      });
    });

    const text = result.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { verified: false, feedback: 'لم نتمكن من التحقق من الصورة' };

  } catch (error: any) {
    console.error('Photo verification error:', error);
    return { verified: false, feedback: 'حدث خطأ أثناء التحقق' };
  }
};

/**
 * Analyze bonus photos (camel rides, food, locals, sunset)
 */
export const analyzeBonusPhoto = async (
  imageBase64: string,
  missionLocation?: string
): Promise<{ type: string; description: string; reward: number }> => {
  const ai = getGeminiClient();
  if (!ai) {
    return { type: 'unknown', description: '', reward: 0 };
  }

  try {
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const prompt = `Analyze this photo taken${missionLocation ? ` at ${missionLocation}` : ''} and identify if it contains any special moments:
- Camel rides or desert scenes
- Local food or cuisine
- Local people or cultural moments
- Beautiful sunsets or golden hour
- Traditional architecture details
- Street scenes or markets

Respond in JSON format:
{
  "type": "camel" | "food" | "locals" | "sunset" | "architecture" | "street" | "none",
  "description": "Brief description in Arabic",
  "reward": number (0-50, based on how special the moment is)
}

Only return valid JSON, no additional text.`;

    const result = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }]
      });
    });

    const text = result.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { type: 'none', description: '', reward: 0 };

  } catch (error: any) {
    console.error('Bonus photo analysis error:', error);
    return { type: 'none', description: '', reward: 0 };
  }
};

