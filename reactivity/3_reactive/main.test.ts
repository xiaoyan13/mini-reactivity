/*
 * 5.1-5.9
 * vue3 中 reactive 的实现原理并不难理解，一句话概括就是使用 Proxy 去拦截所有对目标对象的所有的操作.
 * 这件事描述很简单，但却是一个工程活，需要用大量的 if-else 来保证边界合法.
 * js 的数据类型有原始值、常规对象、异质对象。
 * 简单地来讲, 普通的对象就是常规对象, 其他的内置数据结构(array,map,set)都不是常规对象，属于异质对象。
 * 这里考虑常规对象。
 * reactive/shallowReactive
 */


import { effect } from "./effect";
import { reactive } from "./reactive";
import { shallowReactive } from './reactive'

const obj = {};
const child = reactive(obj);
const proto = { bar: 1 }
const parent = reactive(proto);
Object.setPrototypeOf(child, parent);

effect(() => {
    console.log(child.bar);
})

child.bar = 2

/*
output:
1
2
*/

// --------------
console.log('-------------')

const a = {
    b: {
        c: 1
    }
}
const aProxy = shallowReactive(a)

effect(() => {
    console.log(aProxy.b); // {c: 1}
})

aProxy.b.c = 1; // 无效
aProxy.b = { c: 2 }; // {c : 2}

/*
output:
{c: 1}
{c: 2}
*/
