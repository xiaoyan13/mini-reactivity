/*
首先需要明确，"只读"和"响应式"本是两个冲突的概念。
一个变量是只读的, 那么就意味着它的值不会再发生改变, 也就意味着他不会再触发任何响应式的 trigger 了。
反过来，一个变量是响应式的，就意味着它会在值改变的时候 trigger；在值被获取的时候触发 track.

readonly() 返回的是一个只读的响应式变量，指的是它不会再触发 trigger 了（因为值不会再变）, 但仍然会触发 track.

最直观的实现思路是，套一层只读代理(只实现 get())。
需要注意，转发到原 proxy 的每次 get(), 仍然会触发 track.
vue 就是这样实现的。

在 vue 的 reactive proxy baseHandler 对象上，有两个属性，第一个是 _readonly，另一个是 _shallow。他们一个代表只读、另一个表示深浅响应式。
*/
function readonly(obj) {
    if (isPrimitive(obj) || obj.__v_isReadonly) return obj

    // 什么都不需要做: 仅仅实现一个 get 操作即可
    const proxy = new Proxy(obj, {
        get(target, key, receiver) {
            const res = Reflect.get(target, key, receiver);
            return readonly(res); // 只读是深层的. 即使访问到内部的值, 返回仍然是它的只读代理
        },
        set() {
            return false
        }
    })

    Reflect.defineProperty(obj, '__v_isReadonly', {
        value: true
    });

    return proxy
}

function isPrimitive(value) {
    return (
        value === null ||
        typeof value === 'boolean' ||
        typeof value === 'number' ||
        typeof value === 'string' ||
        typeof value === 'symbol' ||
        typeof value === 'bigint' ||
        typeof value === 'undefined'
    );
}


export { readonly }