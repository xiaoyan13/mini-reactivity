import { activeEffect } from "./effect"

function interceptor(data) {
    const proxyHandler = {
        get(target, key) {
            track(target, key) // 检测当前是否位于副作用执行中，位于则被 track
            return target[key]
        },
        set(target, key, val) {
            target[key] = val;
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

    // 执行所有的旧副作用
    const effectsToRun = new Set(effects);
    effectsToRun.forEach((fn: any) => fn())
}

export { interceptor }