<template>
  <div class="w-fit flex flex-col gap-2 p-2 items-end">
    <p>Inspector {{ entity < 0 ? "" : entity }}</p>
        <InspectorEntity v-if="entity > -1" :engine="engine" :entity="entity" />
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue';
import InspectorEntity from './InspectorEntity.vue';
import { Engine } from '../core/Engine';
const props = defineProps({
  engine: {
    type: Object as PropType<Engine>,
    required: true,
  },
  entity: {
    type: Number,
    default: -1
  }
})

</script>
