import { XMLParser } from "fast-xml-parser";
import _ from "lodash";

export interface ThemeColor {
  name: string;
  value: string;
}

export interface Theme {
  id: string;
  name: string;
  type: "dark" | "light";
  colors: Record<string, string>;
  tokenColors: any[];
  source: "vscode" | "textmate" | "custom";
  originalPath?: string;
}

/**
 * Parses VSCode and TextMate themes and converts them to a unified format
 */
export class ThemeParser {
  private xmlParser = new XMLParser({ ignoreAttributes: false });

  /**
   * Parse a theme file based on its format
   */
  public parseTheme(content: string, filename: string): Theme | null {
    try {
      if (filename.endsWith(".json")) {
        return this.parseVSCodeTheme(content, filename);
      } else if (filename.endsWith(".tmTheme")) {
        return this.parseTextMateTheme(content, filename);
      }
      return null;
    } catch (error) {
      console.error("Failed to parse theme:", error);
      return null;
    }
  }

  /**
   * Parse a VSCode theme (JSON format)
   */
  private parseVSCodeTheme(content: string, filename: string): Theme {
    const themeData = JSON.parse(content);
    const name = themeData.name || this.getNameFromFilename(filename);
    const id = this.generateThemeId(name);

    // Determine if theme is dark or light based on colors or name
    const isDark = this.isDarkTheme(themeData);

    return {
      id,
      name,
      type: isDark ? "dark" : "light",
      colors: themeData.colors || {},
      tokenColors: themeData.tokenColors || [],
      source: "vscode",
      originalPath: filename,
    };
  }

  /**
   * Parse a TextMate theme (XML/plist format)
   */
  private parseTextMateTheme(content: string, filename: string): Theme {
    const parsed = this.xmlParser.parse(content);
    const plist = parsed.plist;
    const dict = plist.dict;

    // Extract theme data from TextMate format
    const name =
      this.extractTextMateValue(dict, "name") ||
      this.getNameFromFilename(filename);
    const id = this.generateThemeId(name);

    // Extract colors and determine if dark or light
    const settings = this.extractTextMateSettings(dict);
    const colors = this.convertTextMateColorsToVSCode(settings);
    const isDark = this.isDarkThemeFromTextMate(settings);

    return {
      id,
      name,
      type: isDark ? "dark" : "light",
      colors,
      tokenColors: settings,
      source: "textmate",
      originalPath: filename,
    };
  }

  /**
   * Generate a unique ID for a theme based on its name
   */
  private generateThemeId(name: string): string {
    return `theme-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  }

  /**
   * Extract a clean name from a filename
   */
  private getNameFromFilename(filename: string): string {
    const baseName = filename.split("/").pop() || "";
    return baseName
      .replace(/\.(json|tmTheme)$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Determine if a VSCode theme is dark based on its colors
   */
  private isDarkTheme(themeData: any): boolean {
    // Check if theme explicitly defines type
    if (themeData.type === "dark") return true;
    if (themeData.type === "light") return false;

    // Check background color if available
    const bgColor = themeData.colors?.["editor.background"] || "";
    if (bgColor) {
      return this.isColorDark(bgColor);
    }

    // Check theme name for hints
    const name = themeData.name || "";
    return /dark|night|black|monokai/i.test(name);
  }

  /**
   * Determine if a TextMate theme is dark based on its settings
   */
  private isDarkThemeFromTextMate(settings: any[]): boolean {
    // Find the general settings (usually the first item)
    const generalSettings = settings.find((s) => !s.scope) || settings[0];
    if (!generalSettings) return false;

    const background = generalSettings.settings?.background;
    if (background) {
      return this.isColorDark(background);
    }

    return false;
  }

  /**
   * Check if a color is dark based on its luminance
   */
  private isColorDark(hexColor: string): boolean {
    // Remove # if present
    hexColor = hexColor.replace("#", "");

    // Convert shorthand (e.g. #ABC) to full form (e.g. #AABBCC)
    if (hexColor.length === 3) {
      hexColor = hexColor
        .split("")
        .map((c) => c + c)
        .join("");
    }

    // Parse RGB components
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);

    // Calculate luminance (perceived brightness)
    // Using the formula: 0.299*R + 0.587*G + 0.114*B
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Theme is dark if luminance is less than 0.5
    return luminance < 0.5;
  }

  /**
   * Extract TextMate theme settings
   */
  private extractTextMateSettings(dict: any): any[] {
    // Extract settings array from TextMate format
    // Implementation depends on the exact format of parsed XML
    // This is a simplified version
    try {
      const array = dict.array;
      if (Array.isArray(array)) {
        return array.map((item) => this.extractSettingDict(item));
      } else if (array && array.dict) {
        return [this.extractSettingDict(array.dict)];
      }
    } catch (e) {
      console.error("Failed to extract TextMate settings:", e);
    }
    return [];
  }

  /**
   * Extract a specific value from TextMate dict
   */
  private extractTextMateValue(dict: any, key: string): string | null {
    // Implementation depends on the exact format of parsed XML
    // This is a simplified version
    try {
      const keyIndex = dict.key.indexOf(key);
      if (keyIndex >= 0 && dict.string && dict.string[keyIndex]) {
        return dict.string[keyIndex];
      }
    } catch (e) {
      console.error(`Failed to extract TextMate value for ${key}:`, e);
    }
    return null;
  }

  /**
   * Extract settings from a TextMate dict
   */
  private extractSettingDict(dict: any): any {
    // Implementation depends on the exact format of parsed XML
    // This is a simplified version
    const result: any = {};

    try {
      if (dict.key && dict.string) {
        for (let i = 0; i < dict.key.length; i++) {
          result[dict.key[i]] = dict.string[i];
        }
      }
    } catch (e) {
      console.error("Failed to extract setting dict:", e);
    }

    return result;
  }

  /**
   * Convert TextMate colors to VSCode format
   */
  private convertTextMateColorsToVSCode(
    settings: any[]
  ): Record<string, string> {
    const colors: Record<string, string> = {};

    // Find the general settings (usually the first item)
    const generalSettings = settings.find((s) => !s.scope) || settings[0];
    if (!generalSettings || !generalSettings.settings) return colors;

    // Map TextMate colors to VSCode equivalents
    const mapping: Record<string, string> = {
      background: "editor.background",
      foreground: "editor.foreground",
      caret: "editorCursor.foreground",
      lineHighlight: "editor.lineHighlightBackground",
      selection: "editor.selectionBackground",
      invisibles: "editorWhitespace.foreground",
      guide: "editorIndentGuide.background",
    };

    Object.entries(mapping).forEach(([tmKey, vsKey]) => {
      if (generalSettings.settings[tmKey]) {
        colors[vsKey] = generalSettings.settings[tmKey];
      }
    });

    return colors;
  }
}

export default new ThemeParser();
