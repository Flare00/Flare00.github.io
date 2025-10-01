<template>
    <div class="overflow-y-auto max-h-[85vh] w-[500px]" :key="refreshKey">
        <div v-for="(component, name) in component" :key="name"
            class="border border-gray-300 rounded-md m-1 p-2">
            <p class="font-bold pl-0 m-0">{{ name }}</p>
            <hr />
            <div v-for="(value, key) in component" :key="key" v-show="!(meta[name][key].hidden ?? false)" class="ml-0.5">
                <ValueEditor :name="key" :value="value" :meta="meta[name][key] ?? {}" class="w-full" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { PropType, ref, watch } from 'vue';
import { Engine } from '../core/Engine';
import { ComponentList } from '../ECS/Component';
import ValueEditor from './ValueEditor.vue';
import getComponentMeta from './inspectorUtils';

const props = defineProps({
    engine: {
        type: Object as PropType<Engine>,
        required: true,
    },
    entity: {
        type: Number,
        required: true,
    }
});

const refreshKey = ref(0);
const component = ref<ComponentList>({});
const meta = ref<{ [key: string]: any }>({})

watch(() => props.entity, () => {
    refresh();
}, { deep: true });

function refresh() {
    if (props.entity < 0) {
        component.value = {};
        meta.value = {};
        return;
    }
    component.value = props.engine.scene?.ecs.components.getComponentsForEntity(props.entity) ?? {};
    for (const key in component.value) {
        meta.value[key] = getComponentMeta(component.value[key]);
    }

    refreshKey.value = (refreshKey.value + 1) % 10;
}

refresh();


</script>