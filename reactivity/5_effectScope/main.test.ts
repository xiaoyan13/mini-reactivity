/**
 * 参考 vue core 3.4 https://github.com/vuejs/rfcs/blob/master/active-rfcs/0041-reactivity-effect-scope.md
 * effectScope 的使用场景，是我们在编写非页面的环境下使用 vue 的响应式系统。
 * 
 * 我们知道，在 vue 框架中，响应式变量在创建之后，会触发响应式，这种默认行为是很好的；
 * 响应式变量随着创建而诞生，随着用户交互的而实时响应，是我们期待的结果，大部分场景不需要手动关闭响应式。
 * 真的需要关闭的副作用，也是屈指可数的，我们直接调用 effect.stop() 即可。
 * 但是，如果我们想要写一个库，里面用响应式变量，就会发现响应式变量在创建之后，就"停不下来"：
 * 每个回调都会在响应式变量发生变化的时候触发，直到该响应式变量释放。
 * 这有时候不是我们希望的，我们需要频繁手动的调用 .stop()，来停止响应式。
 * 我们希望有一个批量对 scope 内所有声明的副作用进行 .stop() 的快捷方式。
 * 这就是 scope 的定义了: 它能够批量管理在它内部创建的 effect。
 * 
 * 本节代码增强了 effect 的核心功能：
 * effect 返回的副作用，携带一个能够告诉响应式系统以后不再追踪该副作用的函数作为自己的属性。
 * 
 * 一个这样的函数应该满足两个功能：
 * 1. 当前副作用如果不是 activeEffect(没有在执行), 那么 .stop 导致它与响应式系统失联，
 * 并且接下来内部使用到的专属变量被 get/set 的时候已经找不到它(已经 cleanup)，也就无法激活它。
 * 2. 当前副作用仍然是 activeEffect(正在生效)。那么副作用中 .stop() 语句后面的专属变量在被 get 的时候不会再 track 该 activeEffect, set 的时候也不会 trigger 该 activeEffect 了(实际上 trigger 代码不必变化，因为在副作用嵌套处理中已经特判了副作用链成环的情况）。
 * 
 * 主要改动点：
 * ./effect 新增 active 标识
 * ./interceptor track 函数新增特判 active
 * 
 * 删除 ./interceptor, ./computed 共用 ./reactive 的 track 和 trigger 
 * 
 * 在以上基础下，实现了 ./effectScope.
 */


import { effect } from "./effect";
import { reactive } from "./reactive";

const a = reactive({
    b: 1,
    c: 2
})

const effectFn = effect(() => {
    console.log(a.b); // 1
})

effectFn.stop(); // stop 导致 set 不触发打印
a.b = 2;

/*
output:
1
*/

console.log('-------------')

let flag = false
const effectFn2 = effect(() => {
    console.log('a.b', a.b); // 2
    // 首次不会执行
    if (flag) {
        effectFn2.stop() // 即使当前副作用是 activeEffect(正在执行的副作用)，但是 .stop 断掉了该副作用与任何专属变量的联系
        console.log('a.c:', a.c) // a.c 触发 track, 内部想要与 activeEffect 建立联系，但是我们在 track 实现上特判了此 activeEffect 已经被标记为失效，所以他不会建立联系。但是本次打印还是生效的，output 2
    }
    console.log('--')
})

flag = true
a.b = 3; // 3 2
a.c = 4; // effectFn2 此时已经彻底失效，无影响不打印

/*
output:
a.b 2
--
a.b 3
a.c: 2
--
*/

