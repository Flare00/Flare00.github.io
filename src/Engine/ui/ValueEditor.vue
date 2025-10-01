<template>
    <div class="flex gap-2 mt-2 overflow-x-auto">
        <!-- <div v-if="meta?.comment" class="comment">{{ meta.comment }}</div> -->
        <p class="flex-1">{{ name }}</p>
        <!-- float / int -->
        <div v-if="meta.readonly" class="flex justify-end flex-1">
            <p>{{ internalValue }}</p>
        </div>
        <div v-else-if="meta.type === 'number'" class="w-full">
            <div v-if="meta?.widget === 'slider'" class="flex gap-2">
                <input type="range" :min="meta?.min ?? 0" :max="meta?.max ?? 100" :step="meta?.step ?? defaultStep"
                    :value="internalValue" @input="change($event)" class="flex-1" />
                <p>{{ internalValue }}</p>
            </div>
            <div v-else class="w-full">
                <input type="number" :step="meta?.step ?? defaultStep" :min="meta?.min" :max="meta?.max"
                    :value="internalValue" class="w-full text-right" />
            </div>
        </div>
        <div v-else-if="meta.type === 'boolean'" class="w-full justify-end">
            <input type="checkbox" :checked="internalValue" @change="change($event)" class="mx-auto" />
        </div>
        <div v-else-if="meta.type.startsWith('vec') || meta.type === 'quat'" class="w-full justify-end flex">
            <input v-if="internalValue.x != undefined" type="number" :step="meta?.step ?? defaultStep" :min="meta?.min"
                :max="meta?.max" :value="internalValue.x" class="w-full text-right" />
            <input v-if="internalValue.y != undefined" type="number" :step="meta?.step ?? defaultStep" :min="meta?.min"
                :max="meta?.max" :value="internalValue.y" class="w-full text-right" />
            <input v-if="internalValue.z != undefined" type="number" :step="meta?.step ?? defaultStep" :min="meta?.min"
                :max="meta?.max" :value="internalValue.z" class="w-full text-right" />
            <input v-if="internalValue.w != undefined" type="number" :step="meta?.step ?? defaultStep" :min="meta?.min"
                :max="meta?.max" :value="internalValue.w" class="w-full text-right" />
        </div>
        <div v-else-if="meta.type === 'textures'" class="w-full justify-end">
            <TextureEditor v-for="(tex, key) in internalValue" :key="key" :value="tex"
                @update:value="(v) => { internalValue[key] = v; emit('update:value', internalValue); }" />
        </div>
        <div v-else class="w-full justify-end">
            <pre>{{ internalValue }}</pre>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import TextureEditor from './TextureEditor.vue';


const props = defineProps({
    name: { type: String, required: true },
    value: { type: [Object, Number, String, Boolean], required: true },
    // optional meta object to describe how to edit the value
    meta: { type: Object, required: true }
});

const emit = defineEmits(['update:value']);

const internalValue = ref<any>(props.value);
const defaultStep = 1;


function change(e: any) {
    internalValue.value = e.target.value;
    emit('update:value', internalValue.value);
}

</script>