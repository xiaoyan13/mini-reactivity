import { effect } from "./effect";
import { track, trigger } from "./interceptor";

/*
 * computed 和 interceptor 得到的虽然都是专属变量，但实现不同。
 * 一个 interceptor 在 set 的时候触发 trigger。
 * 而 computed 则是在 getter 函数被重新执行的时候触发 trigger。
 * 
 * computed 特殊的把 getter 看做一个副作用，这样在该副作用重新执行时，就意味着 getter 内部的用到的专属变量发生了变化，就把 dirty 置为 true。
 * 这里可以发现其实触发 dirty 变为 true 的条件, 并不是副作用的返回值和旧的值不一样。而仅仅是副作用 getter 被触发了。
 * 在 vue3.4 里，为了解决这个问题，加入了判断，只有和旧的值不同才会把 dirty 变为 true。
 * 
 * https://cn.vuejs.org/guide/best-practices/performance.html#computed-stability
 */

// 接收一个函数 fn
function computed(fn) {
    let cacheVal = undefined
    let dirty = true

    // 先用 fn 向响应式系统注册一下副作用
    const effectFn = effect(fn, {
        lazy: true,
        scheduler(effectFn) { // effectFn 虽然会被传进来但是不会被执行~
            dirty = true; // 每次触发副作用都把 dirty 变为 true
            trigger(tmpObj, 'value'); // 并 trigger 依赖 tmpObj 的 effect
        },
    });

    // 再构造出一个能被响应式系统识别的专属变量返回
    // 使用 .value 来触发 track/trigger
    const tmpObj = {
        get dirty() {
            return dirty
        },
        get value() {
            if (dirty) {
                cacheVal = effectFn() // 执行副作用, 重新 track 内部响应式变量与该 effect 的映射
                dirty = false
            }
            track(tmpObj, 'value'); // 重新 track 自己与其他 effect 的映射
            return cacheVal
        }
    }

    return tmpObj
}

// ----- track, trigger 实现与 proxyObj 完全相同 ----

export { computed }