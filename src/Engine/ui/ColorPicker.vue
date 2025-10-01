<template>
    <div class="relative inline-block">
        <button type="button" @click="togglePanel" class="w-8 h-8 rounded border"
            :style="{ backgroundColor: colorHex }"></button>

        <div v-if="panelOpen" class="absolute right-0 mt-2 bg-white border rounded shadow-lg p-3 z-50 w-64">
            <div class="flex items-center gap-2 mb-2">
                <div class="w-10 h-10 rounded border" :style="{ backgroundColor: colorHex }"></div>
                <input type="text" v-model="colorHex" class="flex-1 px-2 py-1 border rounded text-sm" />
            </div>

            <div class="grid grid-cols-3 gap-2 mb-2">
                <label class="text-xs">R<input type="number" min="0" max="255" :value="rgb.r" @change="onRgbChange"
                        class="w-full px-1 border rounded text-sm" /></label>
                <label class="text-xs">G<input type="number" min="0" max="255" :value="rgb.g" @change="onRgbChange"
                        class="w-full px-1 border rounded text-sm" /></label>
                <label class="text-xs">B<input type="number" min="0" max="255" :value="rgb.b" @change="onRgbChange"
                        class="w-full px-1 border rounded text-sm" /></label>
            </div>

            <div class="mb-2">
                <label class="text-xs">H</label>
                <input type="range" min="0" max="360" step="1" :value="hsl.h" @input="onHslChange" class="w-full" />
                <div class="flex gap-2 mt-1 text-xs">
                    <div class="flex-1">S<input type="range" min="0" max="100" :value="hsl.s" @input="onHslChange" />
                    </div>
                    <div class="flex-1">L<input type="range" min="0" max="100" :value="hsl.l" @input="onHslChange" />
                    </div>
                </div>
            </div>

            <div v-if="alpha != undefined" class="mb-2">
                <label class="text-xs">Alpha</label>
                <input type="range" min="0" max="1" step="0.01" :value="alpha" @input="onAlphaChange" class="w-full" />
            </div>

            <!-- <div class="flex gap-2">
                <button v-for="p in presets" :key="p" @click="applyPreset(p)" class="px-2 py-1 text-sm border rounded"
                    :style="{ backgroundColor: p }">{{ p }}</button>
            </div> -->
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onMounted, onBeforeUnmount, PropType, onBeforeMount } from 'vue';
import { Quat, Vec3, Vec4 } from 'ts-gl-matrix';
import { hslToRgb, rgbToHex, rgbToHsl } from './inspectorUtils';

const props = defineProps({
    modelValue: { type: Object as PropType<Vec3 | Vec4 | Quat>, required: true },
});

const emit = defineEmits(['update:modelValue']);

const colorHex = ref<string>('#FFFFFFFF');

const alpha = ref<number | undefined>(undefined);
const rgb = ref({ r: 255, g: 255, b: 255 });
const hsl = ref({ h: 0, s: 1, l: 1 });

const panelOpen = ref(false);



onBeforeMount(() => {
    rgb.value = { r: props.modelValue.x, g: props.modelValue.y, b: props.modelValue.z };
    if (!(props.modelValue instanceof Vec3)) {
        alpha.value = props.modelValue.w;
    } else {
        alpha.value = undefined;
    }
})

function togglePanel() {
    panelOpen.value = !panelOpen.value;
}

function onRgbChange() {
    hsl.value = rgbToHsl(rgb.value);
    colorHex.value = rgbToHex(rgb.value, alpha.value);
    updateValue();
}

function onHslChange() {
    rgb.value = hslToRgb(hsl.value);
    colorHex.value = rgbToHex(rgb.value, alpha.value);
    updateValue();
}

function onAlphaChange() {
    if (alpha.value == undefined) return;
    colorHex.value = rgbToHex(rgb.value, alpha.value);
    updateValue();
}

function updateValue(){
    props.modelValue.x = rgb.value.r;
    props.modelValue.y = rgb.value.g;
    props.modelValue.z = rgb.value.b;
    if(alpha.value !== undefined && !(props.modelValue instanceof Vec3)) props.modelValue.w = alpha.value;
    emit('update:modelValue', props.modelValue);
}

</script>
