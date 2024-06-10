let activeEffect

const effectStack = []

// 接收一个函数，包裹成一个副作用函数返回。并立即执行一次
function effect(fn) {
    // 构造副作用函数
    const effectFn = () => {
        cleanup(effectFn)  // 副作用每次执行都要找到所有拥有它的集合，并把自己删掉

        // 更新副作用标识
        activeEffect = effectFn;
        effectStack.push(effectFn);

        fn(); // 执行内部函数

        // 更新副作用标识
        effectStack.pop();;
        activeEffect = effectStack[effectStack.length - 1];
    };
    effectFn.deps = [];

    effectFn();  // 立即执行一次
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