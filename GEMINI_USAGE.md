# Gemini API Usage Documentation

This document details how EGYPTOUR uses Google Gemini API across different features.

## Overview

EGYPTOUR leverages **5 different Gemini capabilities**:
1. **Trip Planning** - Text generation with structured output
2. **Photo Verification** - Vision analysis
3. **Bonus Recognition** - Multimodal understanding
4. **Story Generation** - Creative writing
5. **Live Guide** - Real-time vision + voice interaction

## Models Used

- **gemini-2.0-flash**: Primary model for vision, trip planning, and general tasks
- **gemini-3-flash-preview**: Advanced model for story generation and chat

## 1. Trip Planning (Onboarding)

**Location**: `pages/Onboarding.tsx`

**Purpose**: Generate personalized trip itinerary based on user preferences

**Model**: `gemini-2.0-flash`

**Prompt Structure**:
```javascript
const prompt = `أنت مخطط رحلات خبير في مصر. بناءً على التفضيلات التالية، أنشئ خطة رحلة مفصلة:

التفضيلات:
- مدة الرحلة: ${days} أيام
- الاهتمامات: ${interests.join(', ')}
- الميزانية: ${budget}
- وتيرة الرحلة: ${pace}

أنشئ خطة رحلة بصيغة JSON التالية:
{
  "id": "trip_1",
  "title": "عنوان الرحلة بالعربية",
  "days": عدد الأيام,
  "missions": [...]
}

اجعل المهمة الأولى فقط "active" والباقي "locked".
رد بـ JSON فقط بدون أي نص إضافي.`;
```

**Response Handling**:
```javascript
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: prompt
});

const text = response.text || '';
const jsonMatch = text.match(/\{[\s\S]*\}/);
const trip = JSON.parse(jsonMatch[0]) as Trip;
```

**Error Handling**:
- JSON extraction with regex fallback
- Default trip structure if parsing fails
- User-friendly error messages

---

## 2. Photo Verification (CameraCapture)

**Location**: `lib/gemini.ts` → `verifyPhotoMission()`

**Purpose**: Verify if captured photo matches mission requirements

**Model**: `gemini-2.0-flash`

**Input**:
- Base64 image data
- Mission title
- Optional requirements

**Prompt Structure**:
```javascript
const prompt = `Analyze this photo to verify if it matches the mission requirements.

Mission: ${missionTitle}
Requirements: ${requirements}

Determine if the photo:
1. Shows the correct location/landmark
2. Meets the specified requirements
3. Is clear and identifiable

Respond in JSON format:
{
  "verified": boolean,
  "feedback": "Brief feedback in Arabic"
}`;
```

**Response Handling**:
```javascript
const result = await ai.models.generateContent({
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
```

**Example Response**:
```json
{
  "verified": true,
  "feedback": "✓ تم التحقق من الصورة بنجاح! الأهرامات الثلاثة ظاهرة بوضوح."
}
```

---

## 3. Compare Your Shot (CameraCapture)

**Location**: `lib/gemini.ts` → `analyzePhotoComparison()`

**Purpose**: Analyze photo quality and rank against other tourist photos

**Model**: `gemini-2.0-flash`

**Prompt Structure**:
```javascript
const prompt = `Analyze this tourist photo${missionTitle ? ` taken at ${missionTitle}` : ''}.

Evaluate the following aspects:
1. Composition quality (0-100)
2. Lighting quality (0-100)
3. Angle and perspective (0-100)
4. Overall appeal (0-100)

Compare this photo with typical tourist photos of this location.
Estimate what percentile this photo falls into (0-100).

Provide feedback in JSON format:
{
  "composition": number (0-100),
  "lighting": number (0-100),
  "angle": number (0-100),
  "overall": number (0-100),
  "percentile": number (0-100),
  "rating": "excellent" | "good" | "average" | "needs-improvement",
  "feedback": "Brief feedback in Arabic",
  "suggestions": ["Suggestion 1 in Arabic", "Suggestion 2"]
}`;
```

**Response Example**:
```json
{
  "composition": 85,
  "lighting": 78,
  "angle": 82,
  "overall": 82,
  "percentile": 85,
  "rating": "excellent",
  "feedback": "صورة رائعة! التكوين ممتاز والإضاءة مناسبة.",
  "suggestions": [
    "جرب التقاط الصورة عند غروب الشمس للحصول على إضاءة أفضل",
    "احرص على إظهار الأهرامات الثلاثة في الإطار"
  ]
}
```

**Display to User**:
- "Top 15% for composition"
- Rating badge (excellent/good/average)
- Improvement suggestions

---

## 4. Bonus Photo Recognition (CameraCapture)

**Location**: `lib/gemini.ts` → `analyzeBonusPhoto()`

**Purpose**: Detect special moments (camel rides, food, locals, sunset)

**Model**: `gemini-2.0-flash`

**Prompt Structure**:
```javascript
const prompt = `Analyze this photo${missionLocation ? ` taken at ${missionLocation}` : ''} and identify if it contains any special moments:
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
  "reward": number (0-50)
}`;
```

**Response Example**:
```json
{
  "type": "sunset",
  "description": "غروب شمس رائع على الأهرامات! لحظة سحرية.",
  "reward": 35
}
```

**Integration**:
- Automatically detects bonus photos
- Awards bonus XP and gold
- Shows special notification

---

## 5. Story Generation (JourneyStory)

**Location**: `pages/JourneyStory.tsx`

**Purpose**: Generate creative travel narrative from trip data

**Model**: `gemini-3-flash-preview`

**Prompt Structure**:
```javascript
const prompt = `Write a creative travel narrative about a trip to Egypt called "${trip?.title}". 
The trip lasted ${trip?.days} days and included missions like ${trip?.missions.map(m => m.title).join(', ')}. 
Make it emotional and engaging, suitable for a social media post. Use Arabic.`;

const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: prompt,
  config: {
    systemInstruction: "You are a travel storyteller. Your tone is adventurous, respectful of culture, and highly engaging."
  }
});
```

**Response Handling**:
- Full text response
- No JSON parsing needed
- Direct display to user

---

## 6. Live Guide (LiveGuide)

**Location**: `pages/LiveGuide.tsx`

**Purpose**: Real-time camera analysis with voice guidance

**Model**: `gemini-2.0-flash`

**Features**:
- Real-time image analysis from camera feed
- Context-aware responses based on mission location
- Personality-based prompts
- Voice synthesis for responses

**Prompt Structure** (Personality-based):
```javascript
const getPersonalityPrompt = (personality: AIPersonality): string => {
  const locationContext = mission ? `User is currently at: ${mission.title}` : '';
  const languageContext = `User Language: ${isArabic ? 'Arabic' : 'English'}`;
  
  switch (personality) {
    case AIPersonality.CLEOPATRA:
      return `You are "Cleopatra", a passionate historical storyteller...
      ${locationContext}
      ${languageContext}
      Your personality:
      - Elegant, dramatic, and enchanting
      - Use poetic language and historical references
      ...`;
    // Other personalities...
  }
};

const prompt = `
${personalityPrompt}
Analyze the attached image carefully.
User Question: ${userPrompt}

If the image shows a monument, respond according to your personality.
If unclear, ask for clarification.`;
```

**Image Capture**:
- Throttled frame capture (500ms minimum)
- Image compression (0.7 quality)
- Base64 encoding

**Response Flow**:
1. Capture frame from video stream
2. Send to Gemini with prompt
3. Receive text response
4. Display in chat
5. Speak using Web Speech API

---

## Error Handling

### Retry Logic

**Location**: `lib/gemini.ts` → `retryWithBackoff()`

```javascript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('429') || error.message?.includes('503'))) {
      // Rate limit or service unavailable - retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
}
```

### Fallback Mechanisms

**Photo Analysis Fallback**:
```javascript
catch (error) {
  console.error('Photo analysis error:', error);
  return {
    composition: 50,
    percentile: 50,
    feedback: 'تم تحليل الصورة بنجاح',
    suggestions: ['جرب التقاط الصورة من زاوية مختلفة'],
    rating: 'average'
  };
}
```

**Trip Generation Fallback**:
- Default trip structure
- Pre-defined missions
- User can still proceed

---

## Performance Optimizations

### Throttling

**Frame Capture**: Maximum once per 500ms
```javascript
let lastCaptureTime = 0;
const CAPTURE_THROTTLE_MS = 500;

if (Date.now() - lastCaptureTime < CAPTURE_THROTTLE_MS) {
  return null; // Skip this frame
}
```

**Image Compression**:
- Quality: 0.7 (70%)
- Format: JPEG
- Reduces payload size by ~30%

### Caching

- Trip data cached locally
- User profile cached in memory
- Gallery thumbnails cached

---

## Rate Limits & Best Practices

### API Rate Limits

- **Free Tier**: 60 requests/minute
- **Paid Tier**: Higher limits available

### Best Practices

1. **Batch Requests**: Group related operations
2. **Throttle Heavy Operations**: Frame capture, photo analysis
3. **Cache Results**: Store analysis results locally
4. **Handle Errors Gracefully**: Always provide fallbacks
5. **Monitor Usage**: Track API calls and costs

---

## Cost Estimation

### Average Usage per User

- **Trip Generation**: 1 call per trip creation
- **Photo Verification**: ~3-5 calls per mission
- **Photo Comparison**: 1 call per photo
- **Story Generation**: 1 call per story
- **Live Guide**: ~10-20 calls per session (5-10 minutes)

### Monthly Estimate (1000 active users)

- Trip Generation: 1,000 calls
- Photo Analysis: 15,000 calls
- Live Guide: 20,000 calls
- Story Generation: 500 calls

**Total**: ~36,500 calls/month

**Cost**: Varies by pricing tier (check Google AI Studio)

---

## Example Prompts Library

### Trip Planning

```
أنت مخطط رحلات خبير في مصر...
[User preferences]
أنشئ خطة رحلة مفصلة...
```

### Photo Verification

```
Analyze this photo to verify if it matches mission requirements...
Mission: [Mission Name]
Requirements: [Specific requirements]
```

### Photo Comparison

```
Analyze this tourist photo taken at [Location]...
Compare with typical tourist photos...
Estimate percentile ranking...
```

### Story Generation

```
Write a creative travel narrative about [Trip Title]...
Make it emotional and engaging...
Suitable for social media...
```

---

## Testing

### Manual Testing

1. Test each API call individually
2. Verify error handling
3. Check response parsing
4. Test with different image qualities
5. Test with various prompts

### Unit Tests (Future)

```javascript
describe('analyzePhotoComparison', () => {
  it('should return valid analysis object', async () => {
    const analysis = await analyzePhotoComparison(imageData);
    expect(analysis).toHaveProperty('composition');
    expect(analysis).toHaveProperty('percentile');
    expect(analysis.percentile).toBeGreaterThanOrEqual(0);
    expect(analysis.percentile).toBeLessThanOrEqual(100);
  });
});
```

---

## Troubleshooting

### Common Issues

**1. API Key Not Found**
- Check `.env.local` file
- Verify `VITE_` prefix for Vite
- Restart dev server after adding key

**2. Rate Limit Exceeded**
- Implement retry logic
- Add delays between requests
- Consider upgrading API tier

**3. JSON Parsing Errors**
- Use regex to extract JSON
- Add fallback parsing
- Validate response structure

**4. Image Upload Failures**
- Check image size (< 4MB recommended)
- Verify base64 encoding
- Compress images before sending

---

## References

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Model Cards](https://ai.google.dev/models/gemini)
- [API Rate Limits](https://ai.google.dev/pricing)

