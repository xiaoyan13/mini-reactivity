import { activeEffect } from "./effect"

function reactive(object) {
    return createReactive(object);
}

function shallowReactive(object) {
    return createReactive(object, true);
}

export { reactive, shallowReactive }

/*
一个对象的所有可能读取操作:
1. obj.foo
2. foo in obj
3. for (const key in obj) {}
*/
const ITERATE_KEY = Symbol()
const proxyMap = new WeakMap<Object, any>();

function createReactive(obj, isShallow = false) {
    const p = new Proxy(obj, {
        get(target, key, receiver) {
            track(target, key);
            const value = Reflect.get(target, key, receiver);

            if (isShallow) return value;
            if (typeof value === 'object' && value !== null) { // Object
                if (!proxyMap.get(value)) {
                    const resProxy = reactive(value);
                    proxyMap.set(value, resProxy);
                }
                return proxyMap.get(value)
            } else {
                return value
            }
        },
        set(target, key, val, receiver) {
            const type = Object.hasOwn(target, key) ? 'SET' : 'ADD'
            const res = Reflect.set(target, key, val, receiver);
            // 优化：原型链上两个 reactive 的话只触发最底下的那个，即当前 p 和下游 reactive 相同
            if (p === receiver) {
                trigger(target, key, type);
            }

            return res;
        },
        ownKeys(target) {
            track(target, ITERATE_KEY);
            return Reflect.ownKeys(target);
        },
        deleteProperty(target, key) {
            const hadKey = Object.hasOwn(target, key);
            let res = false;
            hadKey && (res = Reflect.deleteProperty(target, key));
            res && trigger(target, key, 'DELETE');
            return res;
        }
    })

    Reflect.defineProperty(p, '__v_isReactive', { value: true });

    return p
}





// -------------------


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

function trigger(target, key, type) {
    const depsMap = bucket.get(target);
    if (!depsMap) return;

    // 查找 key 的所有的副作用集合
    const effects = depsMap.get(key);
    // 查找 iterate_key 的副作用集合
    const iterateEffects = depsMap.get(ITERATE_KEY)

    const effectsToRun = new Set();
    effects && effects.forEach(effectFn => {
        if (effectFn !== activeEffect) effectsToRun.add(effectFn)
    })

    if (type === 'ADD' || type === 'DELETE') {
        iterateEffects && iterateEffects.forEach(effectFn => {
            if (effectFn !== activeEffect) effectsToRun.add(effectFn)
        })
    }

    // 执行
    effectsToRun.forEach((effectFn: any) => {
        const scheduler = effectFn.options.scheduler;
        // 如果有 scheduler 则不直接执行副作用，而是把它交给 scheduler 处理
        scheduler ? scheduler(effectFn) : effectFn();
    })
}