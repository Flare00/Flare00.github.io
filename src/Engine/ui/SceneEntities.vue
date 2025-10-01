<template>
    <div>
        <p>Scene</p>
        <div v-if="engine">
            <p v-for="entity in entities" :key="entity" @click="selectEntity(entity)"
                :style="{ fontWeight: entity === selected ? 'bold' : 'normal' }">
                Entity {{ entity }}
            </p>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, PropType, ref, watch } from 'vue';
import { Engine } from '../core/Engine';
import InspectorEntity from './InspectorEntity.vue';
const props = defineProps({
    engine: {
        type: Object as PropType<Engine>,
        required: true,
    },
    selected: { type: Number, default: -1 },
})

const emit = defineEmits(['update:selected']);

const selected = ref<number>(props.selected);

function selectEntity(entity: number) {
    selected.value = entity;
    emit('update:selected', entity);
}

const entities = ref<number[]>([]);

watch(() => props.engine.scene?.ecs.entities.getAll(), () => {
    entities.value = props.engine.scene?.ecs.entities.getAll() ?? [];
});

onMounted(() => {
    entities.value = props.engine.scene?.ecs.entities.getAll() ?? [];
})

</script>
