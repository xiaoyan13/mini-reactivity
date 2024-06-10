/*
 * 对应 4.5 节(含)之前的 vue 实现
 * 
 * @effect(fn): 包裹 fn 为一个副作用函数并记录。
 * 被 effect 处理的函数都将被包裹为一个副作用，存储在响应式系统中。
 * 它是响应式系统的核心。
 * 
 * @interceptor(data): 包裹 data 为一个专属变量，并返回。
 * 只有被 interceptor 返回的专属变量，才能用于 effect 处理的函数中并其作用。
 * 它是 ref/reactive 的核心。
 */

import { effect } from "./effect";
import { interceptor } from "./interceptor";

const a = {
    b: 1
}

const aProxy = interceptor(a)

effect(() => {
    console.log(aProxy.b) // 被立即打印 1
})

aProxy.b = 2 // triggered: 打印 2

/*
output:
1
2
*/