/*
 * 6.1-6.4
 * 解释见 ./ref.ts、./readonly.ts
 * 
 */

import { effect } from "./effect";
import { ref, shallowRef } from "./ref";
import { readonly } from "./readonly";
import { reactive } from "./reactive";

const a = ref(1);
const b = ref({
    c: 1
})

effect(() => {
    console.log(a.value); // 1
    console.log(b.value.c); // 1
})

a.value = 2 // 打印 2 1
b.value.c = 2 // 打印 2 2

/*
output:
1
1
2
1
2
2
*/

// --------------
console.log('----------------')

const d = shallowRef(1);
const f = shallowRef({
    g: 1
})

effect(() => {
    console.log(d.value); // 1
    console.log(f.value.g); // 1
})

d.value = 2 // 打印 2 1
f.value.c = 2 // 不触发副作用

/*
output:
1
1
2
1
*/

// --------------
console.log('----------------')

let h = readonly(1);
console.log(h); // 1: 原始类型, 返回原值
let i = readonly({
    j: {
        k: 1
    }
})

let l = i.j; // readonly 保证通过内部任意元素 get 返回仍是 readonly 代理对象(原始类型除外)
i.j = {}; // set 一个 obj 无效.
console.log(i)
i.j.k = 2; // 缺陷：set 一个原始值有效，因为原始值不能被代理...
console.log(i)

// --------------
console.log('----------------')

// test effect
let m = ref(1);
let n = readonly(m);

effect(() => {
    console.log(n.value); // 1
})

m.value = 2; // 2: readonly type still be tracked under the hood
