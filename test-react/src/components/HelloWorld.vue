<script setup lang="ts">
import { ref, reactive, computed,onMounted, watch, watchEffect, isReactive, isRef, readonly, onRenderTracked } from 'vue'
import { toRef } from 'vue';
// const vpEnable = ref(false);

// setTimeout(() => vpEnable.value = true, 1000);

// const target = computed(() => {
//     const ans = [];
//     if (vpEnable.value) ans.push(1);
//     return ans
// })

// watch(target, () => {
//     console.log('target changed')
// })

// console.log(isReactive(vpEnable), isRef(vpEnable))

// const myReactiveObj = reactive({a: 1})

const myObj = ref({
    b: 1
})

const a = toRef(() => myObj.value.b);

watchEffect(() => {
    console.log(a.value, '!')
})

setTimeout(() => {
    myObj.value.b = 2;
}, 1000)

</script>

<template>
    <div>
    </div>
</template>
