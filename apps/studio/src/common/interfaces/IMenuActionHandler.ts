// import { OpenOptions } from "@/background/WindowBuilder"

export interface IMenuActionHandler {
  upgradeModal: () => void;
  quit: () => void;
  undo: () => void;
  redo: () => void;
  cut: () => void;
  copy: () => void;
  paste: () => void;
  selectAll: () => void;
  zoomreset: () => void;
  zoomin: () => void;
  zoomout: () => void;
  fullscreen: () => void;
  about: () => void;
  devtools: () => void;
  checkForUpdates: () => void;
  opendocs: () => void;
  contactSupport: () => void;
  reload: () => void;
  newWindow: () => void;
  addBeekeeper: () => void;
  newQuery: () => void;
  closeTab: () => void;
  importSqlFiles: () => void;
  quickSearch: () => void;
  disconnect: () => void;
  toggleSidebar: () => void;
  openThemeManager: (
    menuItem: Electron.MenuItem,
    win: Electron.BrowserWindow
  ) => void;
  enterLicense: () => void;
  backupDatabase: () => void;
  restoreDatabase: () => void;
  exportTables: () => void;
  toggleMinimalMode: () => void;
  switchLicenseState: (_menuItem: any, _win: any, type: any) => void;
  toggleBeta: (menuItem: any) => void;
  newTab: () => void;
  switchTheme: (menuItem: Electron.MenuItem) => void;
}
