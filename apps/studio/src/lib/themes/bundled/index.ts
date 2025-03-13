// This file exports all bundled VSCode themes
import rawLog from "@bksLogger";
const log = rawLog.scope("BundledThemes");

// Import theme data
import oneDark from "./one-dark.json";
// Add more theme imports as needed

// Define the theme type to match imported JSON structure
interface BundledTheme {
  name: string;
  type?: "dark" | "light";
  colors: Record<string, string>;
  tokenColors: any[];
}

// Export all bundled themes
export const bundledThemes: BundledTheme[] = [
  oneDark,
  // Add more themes here
];

export default bundledThemes;
