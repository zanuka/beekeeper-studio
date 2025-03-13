import { Theme } from "./ThemeParser";
import themeParser from "./ThemeParser";
import { SettingsPlugin } from "../../plugins/SettingsPlugin";
import _ from "lodash";
import bundledThemes from "./bundled";

// Add a logger
import rawLog from "@bksLogger";
const log = rawLog.scope("ThemeManager");

// Default theme mappings from VSCode/TextMate to Beekeeper variables
const THEME_MAPPINGS = {
  // Editor colors
  "editor.background": "--theme-bg",
  "editor.foreground": "--theme-base",
  "editorCursor.foreground": "--text-dark",
  "editor.selectionBackground": "--selection",
  "editor.lineHighlightBackground": "--row-handle-selected",

  // UI colors
  "sideBar.background": "--sidebar-bg",
  "tab.activeBackground": "--query-editor-bg",
  "statusBar.background": "--statusbar-bg",
  "statusBar.foreground": "--statusbar-text",

  // Syntax highlighting
  "editor.selectionHighlightBackground": "--theme-secondary",
  "editorLink.activeForeground": "--link-color",

  // Accent colors
  "button.background": "--theme-primary",
  "button.foreground": "--text-dark",
  "button.hoverBackground": "--theme-secondary",

  // Notification colors
  "notificationCenter.border": "--border-color",
  "notifications.background": "--theme-bg",
  "notifications.foreground": "--text",

  // Terminal colors
  "terminal.ansiBlue": "--brand-info",
  "terminal.ansiGreen": "--brand-success",
  "terminal.ansiRed": "--brand-danger",
  "terminal.ansiYellow": "--brand-warning",
  "terminal.ansiMagenta": "--brand-purple",
  "terminal.ansiCyan": "--brand-secondary",
};

export class ThemeManager {
  private themes: Theme[] = [];
  private activeThemeId: string | null = null;

  constructor() {
    log.debug("ThemeManager initialized");
    // Built-in themes
    this.themes = [
      {
        id: "dark",
        name: "Dark",
        type: "dark",
        colors: {},
        tokenColors: [],
        source: "custom",
      },
      {
        id: "light",
        name: "Light",
        type: "light",
        colors: {},
        tokenColors: [],
        source: "custom",
      },
      {
        id: "solarized-dark",
        name: "Solarized Dark",
        type: "dark",
        colors: {},
        tokenColors: [],
        source: "custom",
      },
      {
        id: "solarized",
        name: "Solarized Light",
        type: "light",
        colors: {},
        tokenColors: [],
        source: "custom",
      },
      {
        id: "system",
        name: "System",
        type: "dark", // This will change based on system preference
        colors: {},
        tokenColors: [],
        source: "custom",
      },
    ];

    // Load bundled themes
    this.loadBundledThemes();
  }

  /**
   * Load bundled VSCode themes
   */
  private loadBundledThemes(): void {
    log.debug("Loading bundled themes");
    try {
      bundledThemes.forEach((themeData) => {
        const themeId = `theme-${themeData.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")}`;

        // Create theme object
        const theme: Theme = {
          id: themeId,
          name: themeData.name,
          type: themeData.type || "dark",
          colors: themeData.colors || {},
          tokenColors: themeData.tokenColors || [],
          source: "vscode",
        };

        // Add to themes array
        this.themes.push(theme);
        log.debug(`Added bundled theme: ${theme.name}`);
      });

      log.debug(`Loaded ${bundledThemes.length} bundled themes`);
    } catch (error) {
      log.error("Error loading bundled themes:", error);
    }
  }

  /**
   * Initialize the theme manager
   */
  public async initialize(): Promise<void> {
    log.debug("Initializing theme manager");
    // Load saved themes from settings
    const savedThemes = await SettingsPlugin.get("customThemes", []);
    log.debug("Loaded saved themes:", savedThemes);
    if (savedThemes && Array.isArray(savedThemes)) {
      this.themes = [...this.themes, ...savedThemes];
    }

    // Get the active theme
    const activeTheme = await SettingsPlugin.get("theme", "dark");
    log.debug("Active theme from settings:", activeTheme);
    this.activeThemeId = activeTheme;
  }

  /**
   * Get all available themes
   */
  public getThemes(): Theme[] {
    log.debug("Getting all themes, count:", this.themes.length);
    return this.themes;
  }

  /**
   * Get a theme by ID
   */
  public getThemeById(id: string): Theme | undefined {
    log.debug("Getting theme by ID:", id);
    return this.themes.find((theme) => theme.id === id);
  }

  /**
   * Get the active theme
   */
  public getActiveTheme(): Theme | undefined {
    log.debug("Getting active theme:", this.activeThemeId);
    return this.getThemeById(this.activeThemeId || "dark");
  }

  /**
   * Set the active theme
   */
  public async setActiveTheme(themeId: string): Promise<void> {
    log.debug("Setting active theme:", themeId);
    const theme = this.getThemeById(themeId);
    if (!theme) {
      log.error("Theme not found:", themeId);
      return;
    }

    this.activeThemeId = themeId;
    await SettingsPlugin.set("theme", themeId);

    // Apply the theme
    this.applyTheme(theme);
  }

  /**
   * Import a theme from a file
   */
  public async importTheme(
    content: string,
    filename: string
  ): Promise<Theme | null> {
    log.debug("Importing theme from file:", filename);
    const theme = themeParser.parseTheme(content, filename);
    if (!theme) {
      log.error("Failed to parse theme from file:", filename);
      return null;
    }

    // Check if theme with same ID already exists
    const existingIndex = this.themes.findIndex((t) => t.id === theme.id);
    if (existingIndex >= 0) {
      // Replace existing theme
      log.debug("Replacing existing theme with ID:", theme.id);
      this.themes[existingIndex] = theme;
    } else {
      // Add new theme
      log.debug("Adding new theme with ID:", theme.id);
      this.themes.push(theme);
    }

    // Save themes to settings
    await this.saveThemes();

    return theme;
  }

  /**
   * Remove a theme
   */
  public async removeTheme(themeId: string): Promise<boolean> {
    log.debug("Removing theme:", themeId);
    // Cannot remove built-in themes
    const theme = this.getThemeById(themeId);
    if (
      !theme ||
      ["dark", "light", "solarized-dark", "solarized", "system"].includes(
        themeId
      )
    ) {
      log.error("Cannot remove built-in theme:", themeId);
      return false;
    }

    // Remove theme
    this.themes = this.themes.filter((t) => t.id !== themeId);

    // If active theme was removed, switch to dark
    if (this.activeThemeId === themeId) {
      log.debug("Active theme was removed, switching to dark");
      await this.setActiveTheme("dark");
    }

    // Save themes to settings
    await this.saveThemes();

    return true;
  }

  /**
   * Save themes to settings
   */
  private async saveThemes(): Promise<void> {
    log.debug("Saving themes to settings");
    // Only save custom themes (not built-in or bundled)
    const customThemes = this.themes.filter(
      (t) =>
        !["dark", "light", "solarized-dark", "solarized", "system"].includes(
          t.id
        ) && t.source === "custom"
    );
    await SettingsPlugin.set("customThemes", customThemes);
  }

  /**
   * Apply a theme to the application
   */
  private applyTheme(theme: Theme): void {
    log.debug("Applying theme:", theme.id);
    // Set body class for built-in themes
    if (
      ["dark", "light", "solarized-dark", "solarized", "system"].includes(
        theme.id
      )
    ) {
      log.debug(
        "Applying built-in theme, setting body class:",
        `theme-${theme.id}`
      );
      document.body.className = `theme-${theme.id}`;
      return;
    }

    // For custom themes, apply CSS variables
    log.debug("Applying custom theme");
    document.body.className = `theme-custom`;

    // Create CSS variables
    const cssVars = this.generateCssVariables(theme);

    // Apply CSS variables to document root
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    // Apply CodeMirror theme
    this.applyCodeMirrorTheme(theme);
  }

  /**
   * Generate CSS variables from a theme
   */
  private generateCssVariables(theme: Theme): Record<string, string> {
    log.debug("Generating CSS variables for theme:", theme.id);
    const cssVars: Record<string, string> = {};

    // Map theme colors to CSS variables
    Object.entries(THEME_MAPPINGS).forEach(([themeKey, cssVar]) => {
      if (theme.colors[themeKey]) {
        cssVars[cssVar] = theme.colors[themeKey];
      }
    });

    // Set default values for missing variables
    if (!cssVars["--theme-bg"]) {
      cssVars["--theme-bg"] = theme.type === "dark" ? "#181818" : "#f8f8f8";
    }

    if (!cssVars["--theme-base"]) {
      cssVars["--theme-base"] = theme.type === "dark" ? "#ffffff" : "#000000";
    }

    // Derive other variables if not set
    if (!cssVars["--text-dark"]) {
      cssVars["--text-dark"] =
        theme.type === "dark"
          ? "rgba(255, 255, 255, 0.87)"
          : "rgba(0, 0, 0, 0.87)";
    }

    if (!cssVars["--text"]) {
      cssVars["--text"] =
        theme.type === "dark"
          ? "rgba(255, 255, 255, 0.67)"
          : "rgba(0, 0, 0, 0.67)";
    }

    if (!cssVars["--text-light"]) {
      cssVars["--text-light"] =
        theme.type === "dark"
          ? "rgba(255, 255, 255, 0.57)"
          : "rgba(0, 0, 0, 0.57)";
    }

    if (!cssVars["--text-lighter"]) {
      cssVars["--text-lighter"] =
        theme.type === "dark"
          ? "rgba(255, 255, 255, 0.37)"
          : "rgba(0, 0, 0, 0.37)";
    }

    return cssVars;
  }

  /**
   * Apply theme to CodeMirror
   */
  private applyCodeMirrorTheme(theme: Theme): void {
    log.debug("Applying CodeMirror theme for:", theme.id);
    // Create a style element for CodeMirror theme
    let styleEl = document.getElementById("beekeeper-codemirror-theme");
    if (!styleEl) {
      log.debug("Creating CodeMirror style element");
      styleEl = document.createElement("style");
      styleEl.id = "beekeeper-codemirror-theme";
      document.head.appendChild(styleEl);
    }

    // Generate CodeMirror CSS from token colors
    const cmCss = this.generateCodeMirrorCss(theme);
    styleEl.textContent = cmCss;
  }

  /**
   * Generate CodeMirror CSS from theme token colors
   */
  private generateCodeMirrorCss(theme: Theme): string {
    // Basic CodeMirror theme
    let css = `.CodeMirror { background: ${
      theme.colors["editor.background"] || "var(--theme-bg)"
    }; color: ${theme.colors["editor.foreground"] || "var(--theme-base)"}; }\n`;

    // Add token color rules
    if (theme.tokenColors && theme.tokenColors.length) {
      theme.tokenColors.forEach((token) => {
        if (!token.settings || !token.settings.foreground) return;

        // Map TextMate/VSCode scopes to CodeMirror classes
        const cmClasses = this.mapScopesToCodeMirrorClasses(
          token.scope || token.scopes
        );
        if (cmClasses.length) {
          const color = token.settings.foreground;
          cmClasses.forEach((cls) => {
            css += `.CodeMirror ${cls} { color: ${color}; }\n`;
          });
        }
      });
    }

    return css;
  }

  /**
   * Map TextMate/VSCode scopes to CodeMirror classes
   */
  private mapScopesToCodeMirrorClasses(scopes: string | string[]): string[] {
    if (!scopes) return [];

    const scopeList = Array.isArray(scopes) ? scopes : [scopes];
    const cmClasses: string[] = [];

    // Map common scopes to CodeMirror classes
    const scopeMap: Record<string, string> = {
      keyword: ".cm-keyword",
      storage: ".cm-keyword",
      constant: ".cm-atom",
      string: ".cm-string",
      comment: ".cm-comment",
      variable: ".cm-variable",
      parameter: ".cm-def",
      function: ".cm-def",
      "entity.name.function": ".cm-def",
      "entity.name.type": ".cm-variable-2",
      "support.function": ".cm-builtin",
      "support.constant": ".cm-atom",
      "support.type": ".cm-variable-2",
      "support.class": ".cm-variable-2",
      punctuation: ".cm-punctuation",
      "meta.brace": ".cm-punctuation",
    };

    scopeList.forEach((scope) => {
      Object.entries(scopeMap).forEach(([key, value]) => {
        if (scope.includes(key)) {
          cmClasses.push(value);
        }
      });
    });

    return _.uniq(cmClasses);
  }
}

export default new ThemeManager();
