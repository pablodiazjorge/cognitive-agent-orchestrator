import { Tool } from './tool.interface.js';

/**
 * Safe arithmetic calculator.
 * Only digits, operators, parentheses, and whitespace are allowed.
 */
export const calculatorTool: Tool = {
  name: 'calculator',
  description: 'Performs arithmetic calculations (args: {expression: string})',

  async execute(args: Record<string, any>): Promise<string> {
    const expression = String(args.expression ?? '').trim();

    if (!expression) {
      return 'Error: no expression provided';
    }

    const allowed = /^[0-9+\-*/().\s]+$/;
    if (!allowed.test(expression)) {
      return `Error: expression "${expression}" contains disallowed characters`;
    }

    try {
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${expression})`)();
      return String(result);
    } catch (err) {
      return `Error: invalid expression "${expression}"`;
    }
  }
};
