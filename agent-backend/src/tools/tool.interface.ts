export interface Tool {
  name: string;
  description: string;
  execute(args: Record<string, any>): Promise<string>;
}
