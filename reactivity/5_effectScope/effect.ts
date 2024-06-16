import { recordEffectScope } from "./effectScope";

let activeEffect = undefined // 当前正在处理的副作用

const effectStack = [] // 由于副作用可以嵌套，所以用一个副作用栈维护

// 接收一个函数，包裹成一个副作用函数返回。并立即执行一次
function effect(fn, options = {} as any) {
    //  active 标识当前副作用是否仍然有效。
    let active = true
    // 构造副作用函数
    const effectFn = () => {
        if (!active) return fn()

        cleanup(effectFn)  // 副作用每次执行都要找到所有拥有它的集合，并把自己删掉

        // 更新副作用标识
        activeEffect = effectFn;
        effectStack.push(effectFn);

        const res = fn(); // 执行内部函数, 重新进行 track 建立双向映射

        // 更新副作用标识
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];

        return res
    };
    effectFn.deps = [];
    effectFn.options = options /* options.scheduler 影响 trigger 时是否调用 effectFn */
    effectFn.fn = fn

    effectFn.active = { get value() { return active } }
    effectFn.stop = () => {
        cleanup(effectFn) // 断掉双向映射
        active = false
    }

    // 记录当前 effect 所处的 scope (如果有)
    recordEffectScope(effectFn)

    if (!options.lazy) {
        effectFn();  // 立即执行一次
    }
    return effectFn;
}

// 断掉双向映射
function cleanup(effectFn) {
    // deps: set[]
    const deps = effectFn.deps
    for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effectFn);
    }
    // 所有的自己都被删掉了，那么自己的 deps 也要清理掉
    deps.length = 0;
}

export { activeEffect, effect }