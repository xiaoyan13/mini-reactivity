/*
 * 4.9 - 4.11(含)
 * watch 原理上和 computed 一样，都是接收一个包含(或者自身就是)专属变量的 getter, 在
 * 专属变量们发生改变的时候做一些事情。(computed做的事情是，1.dirty = true 2.trigger)
 * 而 watch 做的事就是调用 cb：
 * watch: (source, cb, options) => void
 */

import { interceptor } from "./interceptor";
import { watch } from "./watch";

const a = {
    b: 1
}

const aProxy = interceptor(a)

watch(aProxy, (newVal, oldVal) => {
    console.log('默认同步执行')
    console.log(oldVal, newVal)
})


watch(aProxy, (newVal, oldVal) => {
    console.log(oldVal, newVal)
}, {
    immediate: true // oldVal = undefined, newVal = aProxy 被 watch 时的初值
})

watch(aProxy, () => {
    console.log('异步执行~')
}, {
    flush: 'post'
})

aProxy.b = 2

console.log('---code running ends.---')
/*
output:
undefined { b: 1 }
默认同步执行
{ b: 1 } { b: 2 }
{ b: 1 } { b: 2 }
---code running ends.---
异步执行~
*/
