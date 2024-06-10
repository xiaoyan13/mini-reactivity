/**
 * 4.6 - 4.8 节(含)
 * computed 计算属性
 * computed 和普通的 ref/reactive 是两套实现，是 vue 提供的两种不同的专属变量。
 * 它也能在值变化的时候响应式的触发 track、trigger, 只不过触发的时机和 reactive 不同。
 */

import { effect } from "./effect";
import { interceptor } from "./interceptor";
import { computed } from "./computed";

const a = {
    b: 1
}

const aProxy = interceptor(a)

// effect1
effect(() => {
    aProxy.b = aProxy.b + 1; // 测试副作用链上包含自己
    console.log('here!')
})

aProxy.b = 2

/*
here!
here!
*/

// ----------------------------------
console.log('---------------')

// effect2
const computedTest = computed(() => {
    console.log('recaculate') // test lazy: 不会立即打印
    return aProxy.b + 1;
})

// effect3
effect(() => {
    computedTest.value; // recaculate
})
console.log(computedTest.dirty) // false

console.log('---------------')

// effect4
effect(() => {
    computedTest.value;
})

aProxy.b = 3
/*
依次处理：
effect1 和 effect2, effect1 中 aProxy.b 自赋值, trigger 引起 effect1(无效) 和 effect2  结果队列: [[effect2(aProxy.b = 4)], effect2(aProxy.b = 3)] // 这里的后面那个 effect2 留到了最后执行，其实是没有意义的
effect2, 它执行 scheduler 让 dirty 变为 true,触发 trigger 引起 effect3 和 effect4 结果队列: [ [effect3, effect4], effect2]
effect3 执行, 引发 effect2 (非trigger), dirty 变为 false, 打印 recaculate 一次。结果队列： [effect4, effect2]
effect4 执行，dirty = false, 故直接获取缓存值 结果队列： [effect2]
effect2 执行（它是 trigger 引起），故它执行 scheduler 让 dirty 变为 true, 触发 trigger 引起 effect3 和 effect4 结果队列: [[effect3, effect4]]
effect3 执行, 引发 effect2 (非trigger), dirty 变为 false, 打印 recaculate 一次。结果队列： [effect4, effect2]
effect4 执行，dirty = false, 故直接获取缓存值 结果队列： []

可以看到，如果队列中出现了两个相同的副作用，那么后者应当被忽略，因为重新执行一遍这个副作用毫无意义...
*/

console.log(aProxy.b)

/*
computed recaculate
here!
computed recaculate
*/