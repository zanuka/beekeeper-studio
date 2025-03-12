<template>
  <portal to="modals">
    <modal class="vue-dialog beekeeper-modal" name="theme-manager-modal">
      <div class="dialog-content">
        <div class="dialog-c-title">Theme Manager</div>
        <theme-settings @theme-changed="handleThemeChanged" />
      </div>
      <div class="vue-dialog-buttons">
        <button class="btn btn-flat" type="button" @click.prevent="close">
          Close
        </button>
      </div>
    </modal>
  </portal>
</template>

<script lang="ts">
import Vue from "vue";
import ThemeSettings from "./ThemeSettings.vue";
import rawLog from "@bksLogger";
import { AppEvent } from "../../common/AppEvent";

const log = rawLog.scope("ThemeManagerModal");

export default Vue.extend({
  name: "ThemeManagerModal",
  components: {
    ThemeSettings,
  },
  mounted() {
    console.log("ThemeManagerModal mounted"); // Console log for debugging
    log.debug("ThemeManagerModal mounted");
    // Register direct event listener for the modal
    window.main.on(AppEvent.openThemeManager, this.show);
    this.$root.$on(AppEvent.openThemeManager, this.show);
  },
  beforeDestroy() {
    // Clean up event listeners
    window.main.removeListener(AppEvent.openThemeManager, this.show);
    this.$root.$off(AppEvent.openThemeManager, this.show);
  },
  methods: {
    close() {
      log.debug("Closing theme manager modal");
      this.$modal.hide("theme-manager-modal");
    },
    handleThemeChanged(themeId: string) {
      log.debug("Theme changed to:", themeId);
      // Update the store with the new theme
      this.$store.dispatch("settings/save", { key: "theme", value: themeId });
    },
    show() {
      console.log("Showing theme manager modal"); // Console log for debugging
      log.debug("Showing theme manager modal");
      try {
        this.$modal.show("theme-manager-modal");
        console.log("Modal show method called"); // Console log for debugging
        log.debug("Modal show method called");
      } catch (error) {
        console.error("Error showing modal:", error); // Console log for debugging
        log.error("Error showing modal:", error);
      }
    },
  },
});
</script>
