<template>
  <portal to="global-status-bar">
    <footer :class="classes" v-if="active">
      <slot />
    </footer>
  </portal>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  props: ['mode', 'active'],
  computed: {
    ...mapGetters(['connectionColor']),
    classes() {
        const result = {
          'statusbar': true
        }
        if (this.mode) {
          result[this.mode] = true
          result[this.connectionColor] = true
        } else {
          result[this.connectionColor] = true
        }
        return result
    }
  }

}
</script>
