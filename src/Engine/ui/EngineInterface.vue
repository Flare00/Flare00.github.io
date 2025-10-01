<template>
    <SceneEntities v-if="engine" class="floating floating-left" :engine="engine" v-model:selected="selectedEntity" />
    <Inspector v-if="engine" class="floating floating-right w-fit" :engine="engine" :key="selectedEntity"
        :entity="selectedEntity" />
</template>

<script lang="ts" setup>
import { PropType, ref } from 'vue';
import SceneEntities from './SceneEntities.vue';
import { Engine } from '../core/Engine';
import Inspector from './Inspector.vue';

const props = defineProps({
    engine: {
        type: Object as PropType<Engine>,
        required: true,
    }
})

const selectedEntity = ref<number>(-1);

</script>