import { activeEffect } from "./effect"

function interceptor(data) {
    const proxyHandler = {
        get(target, key) {
            track(target, key) // 检测当前是否位于副作用执行中，位于则被 track
            return target[key]
        },
        set(target, key, val) {
            target[key] = val;  // 注意应该放在 trigger 之前。trigger 的副作用应该是最后做的。

            trigger(target, key) // 触发相关的副作用们依次执行
            return true
        }
    }
    return new Proxy(data, proxyHandler)
}

// WeakMap<Object, Map<key, Set<effect> > >
const bucket = new WeakMap();

function track(target, key) {
    // 如果没有任何副作用函数在执行，说明该响应式变量在正常代码中，直接 return
    if (!activeEffect) return

    // 进行副作用的查找
    let depsMap = bucket.get(target)
    if (!depsMap) {
        depsMap = new Map();
        bucket.set(target, depsMap);
    }

    let deps = depsMap.get(key);
    if (!deps) { // 没有找到
        deps = new Set();
        depsMap.set(key, deps);
    }
    // 建立双向映射
    deps.add(activeEffect) // track effect
    activeEffect.deps.push(deps); // 更新该 effect 的 deps
}

function trigger(target, key) {
    // 查找 key 的所有的副作用集合 Set
    const depsMap = bucket.get(target);
    if (!depsMap) return;
    const effects = depsMap.get(key);
    if (!effects) return;

    const effectsToRun = new Set();
    // 执行所有的旧副作用, 并且剩下的副作用中不能包含本身：
    // 副作用的关联是一个“树”的图景。如果一个操作引起了一系列副作用，
    // 那么一定是一个副作用里触发了另一些副作用
    // vue 中，副作用的树形成环被禁止，因为这会造成无尽的递归，所以不允许副作用自己触发自己。
    // 当然，在其他响应式系统中未必如此。
    effects.forEach(effectFn => {
        if (effectFn !== activeEffect) effectsToRun.add(effectFn)
    })

    // 执行
    effectsToRun.forEach((effectFn: any) => {
        const scheduler = effectFn.options.scheduler;
        // 如果有 scheduler 则不直接执行副作用，而是把它交给 scheduler 处理
        scheduler ? scheduler(effectFn) : effectFn();
    })
}

export { interceptor, track, trigger }