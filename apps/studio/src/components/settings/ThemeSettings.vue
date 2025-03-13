<template>
  <div class="theme-settings">
    <h3>Theme Settings</h3>

    <div class="form-group">
      <label for="theme-select">Application Theme</label>
      <select
        id="theme-select"
        class="form-control custom-select"
        v-model="selectedTheme"
        @change="changeTheme"
      >
        <option v-for="theme in themes" :key="theme.id" :value="theme.id">
          {{ theme.name }}
        </option>
      </select>
    </div>

    <div class="theme-actions">
      <button class="btn btn-flat" @click="importTheme">Import Theme</button>
      <button
        class="btn btn-flat"
        @click="removeTheme"
        :disabled="!canRemoveTheme"
      >
        Remove Theme
      </button>
    </div>

    <!-- Add theme gallery component -->
    <theme-gallery
      :themes="themes"
      :selectedThemeId="selectedTheme"
      @theme-selected="onThemeSelected"
    />
    <div class="theme-preview">
      <h4>Theme Preview</h4>
      <div class="preview-container" :class="previewClass">
        <div class="preview-header">
          <div class="preview-tab active">Query Editor</div>
          <div class="preview-tab">Table Data</div>
        </div>
        <div class="preview-editor">
          <div class="preview-line">
            <span class="cm-keyword">SELECT</span>
            <span class="cm-def">id</span>, <span class="cm-def">name</span>,
            <span class="cm-def">email</span>
          </div>
          <div class="preview-line">
            <span class="cm-keyword">FROM</span>
            <span class="cm-variable-2">users</span>
          </div>
          <div class="preview-line">
            <span class="cm-keyword">WHERE</span>
            <span class="cm-def">active</span> =
            <span class="cm-atom">true</span>
          </div>
          <div class="preview-line">
            <span class="cm-keyword">ORDER BY</span>
            <span class="cm-def">created_at</span>
            <span class="cm-keyword">DESC</span>
          </div>
        </div>
      </div>
    </div>

    <input
      type="file"
      ref="fileInput"
      accept=".json,.tmTheme"
      style="display: none"
      @change="handleFileUpload"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import themeManager from "../../lib/themes/ThemeManager";
import { Theme } from "../../lib/themes/ThemeParser";
import ThemeGallery from "./ThemeGallery.vue";

export default Vue.extend({
  name: "ThemeSettings",
  components: {
    ThemeGallery,
  },

  data() {
    return {
      themes: [] as Theme[],
      selectedTheme: "",
      builtInThemes: ["dark", "light", "solarized-dark", "solarized", "system"],
    };
  },

  computed: {
    canRemoveTheme(): boolean {
      return !this.builtInThemes.includes(this.selectedTheme);
    },

    previewClass(): string {
      const theme = this.themes.find((t) => t.id === this.selectedTheme);
      if (!theme) return "";

      if (this.builtInThemes.includes(theme.id)) {
        return `theme-${theme.id}-preview`;
      } else {
        return `theme-custom-preview theme-${theme.type}-preview`;
      }
    },
  },

  async mounted() {
    await themeManager.initialize();
    this.loadThemes();
  },

  methods: {
    loadThemes() {
      this.themes = themeManager.getThemes();
      const activeTheme = themeManager.getActiveTheme();
      this.selectedTheme = activeTheme?.id || "dark";
    },

    async changeTheme() {
      await themeManager.setActiveTheme(this.selectedTheme);
      this.$emit("theme-changed", this.selectedTheme);
    },

    onThemeSelected(themeId: string) {
      this.selectedTheme = themeId;
      this.changeTheme();
    },

    importTheme() {
      (this.$refs.fileInput as HTMLInputElement).click();
    },

    async handleFileUpload(event: Event) {
      const files = (event.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const theme = await themeManager.importTheme(content, file.name);

        if (theme) {
          this.$noty.success(`Theme "${theme.name}" imported successfully`);
          this.loadThemes();
          this.selectedTheme = theme.id;
          await this.changeTheme();
        } else {
          this.$noty.error("Failed to import theme");
        }

        // Reset file input
        (this.$refs.fileInput as HTMLInputElement).value = "";
      };

      reader.onerror = () => {
        this.$noty.error("Failed to read theme file");
        // Reset file input
        (this.$refs.fileInput as HTMLInputElement).value = "";
      };

      reader.readAsText(file);
    },

    async removeTheme() {
      if (!this.canRemoveTheme) return;

      const theme = this.themes.find((t) => t.id === this.selectedTheme);
      if (!theme) return;

      const confirmed = await this.$bks.confirm({
        title: "Remove Theme",
        message: `Are you sure you want to remove the theme "${theme.name}"?`,
        confirmText: "Remove",
        cancelText: "Cancel",
      });

      if (confirmed) {
        const removed = await themeManager.removeTheme(this.selectedTheme);
        if (removed) {
          this.$noty.success(`Theme "${theme.name}" removed`);
          this.loadThemes();
        } else {
          this.$noty.error("Failed to remove theme");
        }
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.theme-settings {
  padding: 1rem;

  h3 {
    margin-bottom: 1.5rem;
  }

  .theme-actions {
    display: flex;
    margin-bottom: 2rem;

    .btn {
      margin-right: 1rem;
    }
  }

  .theme-preview {
    margin-top: 2rem;

    h4 {
      margin-bottom: 1rem;
    }

    .preview-container {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;

      &.theme-dark-preview {
        background-color: #181818;
        color: rgba(255, 255, 255, 0.87);
      }

      &.theme-light-preview {
        background-color: #f8f8f8;
        color: rgba(0, 0, 0, 0.87);
      }

      &.theme-solarized-dark-preview {
        background-color: #002b36;
        color: #839496;
      }

      &.theme-solarized-preview {
        background-color: #fdf6e3;
        color: #657b83;
      }
    }

    .preview-header {
      display: flex;
      background-color: var(--tabs-bg, transparent);
      border-bottom: 1px solid var(--border-color);
    }

    .preview-tab {
      padding: 0.5rem 1rem;
      cursor: pointer;

      &.active {
        background-color: var(--query-editor-bg);
        border-bottom: 2px solid var(--theme-primary);
      }
    }

    .preview-editor {
      background-color: var(--query-editor-bg);
      padding: 1rem;
      font-family: "Source Code Pro", monospace;
      font-size: 14px;
      min-height: 150px;
    }

    .preview-line {
      margin-bottom: 0.5rem;
      white-space: pre;
    }
  }
}
</style>
