<template>
    <div class="flex gap-2 items-center">
        <input type="text" :value="internalValue.url" @input="changeUrl($event)" class="flex-1" />
        <div v-if="internalValue.url" class="w-8 h-8 bg-gray-200">
            <img :src="internalValue.url" class="w-full h-full object-cover" />
        </div>
        <div  class="flex items-center gap-1 ml-2">
            <ColorPicker v-model="internalValue.fallback" />
            <input type="color" :value="colorHex" @input="changeColor($event)" />
            <input type="range" min="0" max="1" step="0.01" :value="alpha" @input="changeAlpha($event)" class="w-24" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { PropType, ref, watch, computed } from 'vue';
import { TextureEntry } from '../ECS/components/Material';
import { Vec4 } from 'ts-gl-matrix';

const props = defineProps({
    value: { type: Object as PropType<TextureEntry>, required: true },
});

const emit = defineEmits(['update:value']);

// local reactive copy so we can edit fields
const internalValue = ref<TextureEntry>({ url: props.value.url, fallback: Vec4.clone(props.value.fallback) });

// keep local copy in sync if parent updates the prop
watch(() => props.value, (v) => {
    internalValue.value.url = v.url;
    internalValue.value.fallback = Vec4.clone(v.fallback);
}, { deep: true });

// helpers to convert Vec4 (0..1) to hex string and back
function vec4ToHex(v: Vec4) {
    const r = Math.round(v[0] * 255);
    const g = Math.round(v[1] * 255);
    const b = Math.round(v[2] * 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

const colorHex = computed(() => vec4ToHex(internalValue.value.fallback));
const alpha = computed(() => String(internalValue.value.fallback[3] ?? 1));

function emitUpdate() {
    // emit a new object (clone) to avoid parent mutating our internal ref
    emit('update:value', { url: internalValue.value.url, fallback: Vec4.clone(internalValue.value.fallback) });
}

function changeUrl(e: any) {
    internalValue.value.url = e.target.value;
    emitUpdate();
}

function changeColor(e: any) {
    const hex = e.target.value as string;
    const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
    internalValue.value.fallback[0] = r;
    internalValue.value.fallback[1] = g;
    internalValue.value.fallback[2] = b;
    emitUpdate();
}

function changeAlpha(e: any) {
    const a = parseFloat(e.target.value);
    internalValue.value.fallback[3] = isNaN(a) ? 1 : a;
    emitUpdate();
}

</script>