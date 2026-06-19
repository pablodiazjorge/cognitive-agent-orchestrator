import { Tool } from './tool.interface.js';

const weatherDb: Record<string, { city: string; temperature: number; condition: string; unit: string }> = {
  london: { city: 'London', temperature: 14, condition: 'Rainy', unit: 'C' },
  'new york': { city: 'New York', temperature: 22, condition: 'Sunny', unit: 'C' },
  tokyo: { city: 'Tokyo', temperature: 19, condition: 'Cloudy', unit: 'C' },
  madrid: { city: 'Madrid', temperature: 26, condition: 'Sunny', unit: 'C' },
  paris: { city: 'Paris', temperature: 17, condition: 'Partly cloudy', unit: 'C' },
  berlin: { city: 'Berlin', temperature: 15, condition: 'Overcast', unit: 'C' },
  sydney: { city: 'Sydney', temperature: 24, condition: 'Windy', unit: 'C' }
};

export const weatherTool: Tool = {
  name: 'weather',
  description: 'Returns simulated weather for supported cities (args: {city: string})',

  async execute(args: Record<string, any>): Promise<string> {
    const rawCity = String(args.city ?? '').trim().toLowerCase();
    const city = rawCity.replace(/[?.,!]$/, '');

    const data = weatherDb[city];
    if (!data) {
      return `No weather data available for "${args.city}". Supported cities: ${Object.keys(weatherDb).join(', ')}.`;
    }

    return JSON.stringify(data);
  }
};
