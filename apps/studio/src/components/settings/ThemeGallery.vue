<template>
  <div class="theme-gallery">
    <h4>Theme Gallery</h4>
    <div class="theme-grid">
      <div
        v-for="theme in themes"
        :key="theme.id"
        class="theme-preview-card"
        :class="{ active: selectedThemeId === theme.id }"
        @click="selectTheme(theme.id)"
      >
        <div class="preview-square" :style="getPreviewStyle(theme)">
          <div class="preview-content">
            <div class="preview-line">
              <span :style="{ color: getSyntaxColor(theme, 'keyword') }"
                >SELECT</span
              >
              <span :style="{ color: getSyntaxColor(theme, 'def') }">id</span>,
              <span :style="{ color: getSyntaxColor(theme, 'def') }">name</span>
            </div>
            <div class="preview-line">
              <span :style="{ color: getSyntaxColor(theme, 'keyword') }"
                >FROM</span
              >
              <span :style="{ color: getSyntaxColor(theme, 'variable') }"
                >users</span
              >
            </div>
          </div>
        </div>
        <div class="theme-name">{{ theme.name }}</div>
        <div class="theme-type">{{ theme.type }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Theme } from "../../lib/themes/ThemeParser";

export default Vue.extend({
  name: "ThemeGallery",
  props: {
    themes: {
      type: Array as () => Theme[],
      required: true,
    },
    selectedThemeId: {
      type: String,
      required: true,
    },
  },
  methods: {
    selectTheme(themeId: string) {
      this.$emit("theme-selected", themeId);
    },
    getPreviewStyle(theme: Theme) {
      // Extract background and text colors from theme
      const background =
        theme.colors["editor.background"] ||
        (theme.type === "dark" ? "#181818" : "#f8f8f8");
      const foreground =
        theme.colors["editor.foreground"] ||
        (theme.type === "dark" ? "#ffffff" : "#000000");

      return {
        backgroundColor: background,
        color: foreground,
        borderColor:
          this.selectedThemeId === theme.id
            ? theme.colors["button.background"] || "#0088ff"
            : "transparent",
      };
    },
    getSyntaxColor(theme: Theme, tokenType: string) {
      // Map token types to colors based on theme
      const colorMap: Record<string, string> = {
        keyword:
          theme.colors["editor.selectionHighlightBackground"] || "#569cd6",
        def: theme.colors["editorLink.activeForeground"] || "#9cdcfe",
        variable: theme.colors["terminal.ansiCyan"] || "#4ec9b0",
        string: theme.colors["terminal.ansiGreen"] || "#ce9178",
        comment: theme.colors["terminal.ansiBlue"] || "#6a9955",
      };

      return (
        colorMap[tokenType] || (theme.type === "dark" ? "#ffffff" : "#000000")
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.theme-gallery {
  margin-top: 2rem;

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .theme-preview-card {
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-5px);
    }

    &.active .preview-square {
      border-width: 3px;
    }
  }

  .preview-square {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid transparent;
    transition: border-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-content {
    font-family: "Source Code Pro", monospace;
    font-size: 10px;
    padding: 0.5rem;
    width: 100%;
  }

  .preview-line {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0.25rem;
  }

  .theme-name {
    margin-top: 0.5rem;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .theme-type {
    font-size: 0.8rem;
    opacity: 0.7;
    text-align: center;
    text-transform: capitalize;
  }
}
</style>
