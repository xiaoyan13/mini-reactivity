/**
 * 1. 未考虑 detached 功能。
 * 2. 由于类型检查被我全关了，所以 EffectScope | undefined 此处就是 EffectScope 类型。
 */
// 当前的 scope. 全局唯一，也就是说全局有且只有一个 scope 对象是 activeEffectScope.
let activeEffectScope: EffectScope | undefined = undefined

class EffectScope {
    // 收集的副作用
    effects = []
    // 当前 scope 被销毁的回调
    cleanups: (() => void)[] = []
    // 当前 scope 是否是有效的 (不要和 activeEffectScope 搞混。所有 scope 默认都是有效的，但 activeEffectScope 全局只有一个。)。
    // 调用 stop 后失效。
    active = true

    // 父节点
    parent: EffectScope | undefined
    // 子节点. 这里使用 Set 而不是 WeakSet 是因为需要遍历它
    scopes = new Set<EffectScope>()

    constructor() {
        // 父节点就是当前的 activeEffectScope
        this.parent = activeEffectScope
        activeEffectScope && activeEffectScope.scopes.add(this)
    }

    run<T>(fn: () => T): T | undefined {
        if (!this.active) {
            console.log('该 scope 已经失效.')
            return undefined
        }
        activeEffectScope = this
        return fn()
    }
    stop() {
        if (!this.active) return;
        // stop effects
        for (let i = 0; i < this.effects.length; i++) {
            this.effects[i].stop();
        }
        // callbacks 
        for (let i = 0; i < this.cleanups.length; i++) {
            this.cleanups[i]();
        }
        // stop childs
        for (let scope of this.scopes) {
            scope.stop();
        }

        // 断掉集合中和 father scope 的相互引用，以便未来本 scope 对象被自动释放
        this.parent && this.parent.scopes.delete(this);
        this.parent = undefined

        // 标记为失效
        this.active = false
    }

}

// 创建一个激活的 effectScope
function effectScope() {
    return new EffectScope();
}
// 返回当前的 scope 
function getCurrentScope() {
    return activeEffectScope
}

// 记录 effect 到 scope 中
function recordEffectScope(effect) {
    // 存在 active scope 
    if (activeEffectScope) {
        activeEffectScope.effects.push(effect) // 添加
    }
}

// 类似于 unmounted, 压入一个回调, 在 scope 被销毁之后调用
function onScopeDispose(fn: () => void) {
    if (activeEffectScope) {
        activeEffectScope.cleanups.push(fn)
    }
}



export { effectScope, recordEffectScope, getCurrentScope, onScopeDispose }