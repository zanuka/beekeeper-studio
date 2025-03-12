import { BrowserWindow } from "electron";
import { AppEvent } from "../common/AppEvent";
import rawLog from "@bksLogger";

const log = rawLog.scope("ThemeHandler");

/**
 * Handles theme-related operations in the main process
 */
export class ThemeHandler {
  /**
   * Opens the theme manager modal in the renderer process
   */
  public static openThemeManager(window: BrowserWindow): void {
    log.debug("Opening theme manager from main process");
    if (window && !window.isDestroyed()) {
      log.debug("Sending openThemeManager event to renderer");
      window.webContents.send(AppEvent.openThemeManager);
    } else {
      log.error("Cannot open theme manager: window is invalid or destroyed");
    }
  }
}

export default ThemeHandler;
