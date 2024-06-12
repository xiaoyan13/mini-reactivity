import { effect } from "./effect";

function watch(source, cb, options = {} as any) {
    let getter;
    if (typeof source === 'function') { // getter 函数
        getter = source
    } else { // 对象
        getter = () => traverse(source)
    }

    let oldVal = undefined
    const effectFn = effect(getter, {
        lazy: true, // 默认是 lazy, 即不立即执行副作用(scheduler)
        scheduler(effectFn) {
            const job = () => {
                const newVal = effectFn();
                cb(oldVal, newVal)
                oldVal = newVal
            }

            options.flush === 'post' ?
                Promise.resolve().then(job) : job();
        }
    })

    const initial = effectFn() // 这里必须使用 effectFn 而不能使用 getter, 因为要注册副作用
    if (options.immediate) { // 立即执行 cb, 拿到的 oldVal 是空值
        cb(undefined, initial)
    }
    oldVal = initial // 不立即执行 cb, 则第一次 cb 的 oldVal 就是 initialVal
}


// 递归读取 obj 的每个属性, 并返回 obj 的深度拷贝
function traverse(val, seen = new Set()) {
    if (typeof val !== 'object' || val === null) return val;
    // object
    if (seen.has(val)) return // 避免出现环
    const _obj = {}
    for (const key in val) {
        _obj[key] = traverse(val[key], seen);
    }
    return _obj;
}

export { watch }