import { Tool } from './tool.interface.js';

const knowledgeBase: Record<string, string> = {
  ai: 'Artificial Intelligence (AI) is the simulation of human intelligence by machines, encompassing learning, reasoning, and perception.',
  transformers: 'Transformers are a deep learning architecture introduced in "Attention Is All You Need" (2017). They rely on self-attention and power models like BERT and GPT.',
  nlp: 'Natural Language Processing (NLP) is a branch of AI focused on the interaction between computers and human language.',
  angular: 'Angular is a TypeScript-based web application framework led by the Angular Team at Google.',
  typescript: 'TypeScript is a strongly typed superset of JavaScript developed by Microsoft that compiles to plain JavaScript.',
  react: 'React is a JavaScript library for building user interfaces, maintained by Meta and a community of developers.',
  nodejs: 'Node.js is a JavaScript runtime built on Chrome\'s V8 engine, enabling server-side JavaScript execution.',
  docker: 'Docker is a platform for developing, shipping, and running applications in lightweight containers.'
};

function findBestMatch(query: string): string {
  const normalized = query.toLowerCase();
  for (const [key, value] of Object.entries(knowledgeBase)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return `No direct result found for "${query}". Try searching for AI, transformers, NLP, Angular, TypeScript, React, Node.js, or Docker.`;
}

export const searchTool: Tool = {
  name: 'search',
  description: 'Returns simulated technical search results (args: {query: string})',

  async execute(args: Record<string, any>): Promise<string> {
    const query = String(args.query ?? '').trim();
    if (!query) {
      return 'Error: no search query provided';
    }
    return findBestMatch(query);
  }
};
