// ===========================================
// PARALLEL - Story Engine Agent
// Generates dynamic narratives and scenarios
// ===========================================

import type { WorldConfig, PersonaConfig } from '../types';
import * as openai from '../providers/openai';

export interface StoryScenario {
  id: string;
  title: string;
  description: string;
  setting: string;
  mood: string;
  openingLine: string;
  possibleDirections: string[];
  suggestedResponses: string[];
}

export interface StoryEvent {
  id: string;
  type: 'plot_twist' | 'character_entrance' | 'location_change' | 'revelation' | 'challenge';
  description: string;
  impact: string;
  choices: { text: string; outcome: string }[];
}

export class StoryEngineAgent {
  private world: WorldConfig;
  private persona: PersonaConfig;
  private currentScenario?: StoryScenario;
  private storyProgress: string[] = [];

  constructor(world: WorldConfig, persona: PersonaConfig) {
    this.world = world;
    this.persona = persona;
  }

  // Generate a new scenario based on world and persona
  async generateScenario(userPreferences?: {
    mood?: string;
    intensity?: 'low' | 'medium' | 'high';
    themes?: string[];
  }): Promise<StoryScenario> {
    const client = openai.getOpenAIClient();

    const prompt = `Generate an immersive roleplay scenario for:

World: ${this.world.name}
Theme: ${this.world.theme}
Setting: ${this.world.settingDescription}
Atmosphere: ${this.world.atmosphere}
${this.world.timePeriod ? `Time Period: ${this.world.timePeriod}` : ''}
${this.world.location ? `Location: ${this.world.location}` : ''}

Character: ${this.persona.name}
Type: ${this.persona.type}
Personality: ${JSON.stringify(this.persona.personality)}

User Preferences:
- Mood: ${userPreferences?.mood || 'engaging'}
- Intensity: ${userPreferences?.intensity || 'medium'}
- Themes: ${userPreferences?.themes?.join(', ') || 'adventure, connection'}

Generate a scenario with:
1. A compelling title
2. Brief description (2-3 sentences)
3. Specific setting within the world
4. Opening line from the character
5. 3 possible story directions
6. 3 suggested user responses

Return as JSON with keys: title, description, setting, mood, openingLine, possibleDirections (array), suggestedResponses (array)`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const scenario = JSON.parse(content);

    const newScenario: StoryScenario = {
      id: Date.now().toString(),
      ...scenario,
    };

    this.currentScenario = newScenario;

    return newScenario;
  }

  // Generate a story event/twist
  async generateEvent(context: string): Promise<StoryEvent> {
    const client = openai.getOpenAIClient();

    const prompt = `Based on the current story context, generate an unexpected but fitting story event:

World: ${this.world.name}
Current Context: ${context}
Story Progress: ${this.storyProgress.slice(-5).join(' | ')}

Generate an event that:
1. Fits the world's theme and atmosphere
2. Creates interesting choices for the user
3. Advances the story meaningfully

Event types: plot_twist, character_entrance, location_change, revelation, challenge

Return as JSON with keys: type, description, impact, choices (array of {text, outcome})`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.95,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const event = JSON.parse(content);

    return {
      id: Date.now().toString(),
      ...event,
    };
  }

  // Generate story continuation
  async continueStory(
    userInput: string,
    previousExchange: string
  ): Promise<{ narrative: string; suggestions: string[] }> {
    const client = openai.getOpenAIClient();

    // Track progress
    this.storyProgress.push(userInput);

    const prompt = `Continue this interactive story:

World: ${this.world.name} (${this.world.theme})
Setting: ${this.world.settingDescription}
Character: ${this.persona.name} (${this.persona.type})

Previous Exchange:
${previousExchange}

User's Action/Response:
${userInput}

Generate:
1. A narrative continuation (2-3 paragraphs) that responds to the user's input
2. Include sensory details and emotional depth
3. End with something that invites further interaction
4. 3 suggested next actions for the user

Return as JSON with keys: narrative, suggestions (array of strings)`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
  }

  // Generate world-specific locations
  async generateLocations(count: number = 5): Promise<
    {
      name: string;
      description: string;
      mood: string;
      possibleEvents: string[];
    }[]
  > {
    const client = openai.getOpenAIClient();

    const prompt = `Generate ${count} unique locations within this world:

World: ${this.world.name}
Theme: ${this.world.theme}
Setting: ${this.world.settingDescription}
Atmosphere: ${this.world.atmosphere}

Each location should:
1. Fit the world's theme perfectly
2. Have a distinct mood/atmosphere
3. Suggest interesting story possibilities

Return as JSON array with objects containing: name, description, mood, possibleEvents (array)`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    });

    const content = response.choices[0]?.message?.content || '{"locations":[]}';
    const parsed = JSON.parse(content);
    return parsed.locations || [];
  }

  // Get current scenario
  getCurrentScenario(): StoryScenario | undefined {
    return this.currentScenario;
  }

  // Reset story
  reset() {
    this.currentScenario = undefined;
    this.storyProgress = [];
  }
}
