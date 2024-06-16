import { ref } from "./ref";
import { computed } from "./computed";
import { watch } from "./watch";
import { effectScope } from "./effectScope";
import { effect } from "./effect";

const scope = effectScope()

const effectScopeFunc = () => {
    let myRef = ref(1);
    // effect1
    let myComputed = computed(() => {
        console.log('effect1')
        return myRef.value;
    })
    // effect2
    effect(() => {
        myComputed.value;
        console.log('effect2')
    })
    // effect3
    watch(() => { myComputed.value }, () => {
        console.log('effect3')
    })
    return { myRef }
}

const { myRef } = scope.run(effectScopeFunc)

myRef.value = 2;

scope.stop(); // 注销 scope 中的所有副作用

myRef.value = 3;

/*
output:
effect1 // .run 导致
effect2
effect1 // myRef.value = 2; 导致
effect2
effect3
*/

console.log('-------------')

// 测试嵌套

const fatherScope = effectScope();
const { myRef: refFromChild } = fatherScope.run(() => {
    const childScope = effectScope();

    const { myRef } = childScope.run(effectScopeFunc)

    return { myRef }

})

refFromChild.value = 4; // 有效
fatherScope.stop(); // 关闭父级
refFromChild.value = 5; // 失效
/*
output:
effect1 // .run 导致
effect2
effect1 // myRef.value = 4; 导致
effect2
effect3
*/