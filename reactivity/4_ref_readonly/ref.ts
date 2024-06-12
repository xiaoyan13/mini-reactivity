import { reactive, shallowReactive } from "./reactive";

/*
ref 是为了解决 val 为原始值的问题的。
它为原始值包裹一层 .value 实现拦截。返回类型为 Ref.
由于 vue 中 ref 和响应式系统深度集成，所以它默认会变成响应式变量。

注：此处实现和 vue 实际实现存在差异。
refImpl 的具体实现, 是类似于计算属性 computed, 自己手写了 value 的 get/set 函数。
在 get 中进行 track, 在 set 中进行 trigger; 标记也是打在了 ref 自己身上, 而不是 wrapper 身上。
*/
function ref(val) {
    const wrapper = {
        // 直接获取原始值的一份拷贝（对于对象是引用）
        value: val
    }
    const myProxy = reactive(wrapper) // 默认行为：变成响应式变量
    Reflect.defineProperty(myProxy, '__v_isRef', {
        value: true // 把标记通过 Reflect 打到了 wrapper 身上
    })
    return myProxy
}

function shallowRef(val) {
    const myProxy = shallowReactive({
        value: val
    })
    Reflect.defineProperty(myProxy, '__v_isRef', {
        value: true
    })
    return myProxy
}

/*
toRef 也是为了解决 val 为原始值的问题的。它也返回 Ref 类型。
它是为了代理一个对象中的原始值，通过包裹一层 .value, get value() 指向目标原始值实现。

原理上使用 访问器属性 来达到始终指向目标原始值的目的。
https://zh.javascript.info/property-accessors

注： toRef 本身只做到 .value 始终指向目标原始值这件事。它和响应式系统没有任何关系。
所以，在持有类型为 Ref 的变量时，需要注意，这个 ref 是不是响应式的？
*/
function toRef(target, key) {
    const wrapper = {
        // 使用 js 访问器属性来达到始终指向目标原始值的目的
        get value() {
            return target[key]
        },
        set value(newVal) {
            target[key] = newVal
        }
    }
    return wrapper
}

/*
注2：从 vue 3.3+ 开始，toRef 的语义变化了，具体来说是增加了一些功能：

  if (isRef(source)) { // toRef 会先判断是否已经是 Ref, 是的话直接返回
    return source
  } else if (isFunction(source)) { // toRef 可以接收单个 getter, 用它构造一个只读的 Ref
    return {
      get value() { 
        return source()
      }
    }
  } else if (isObject(source) && arguments.length > 1) { // 这才是本来的语义
    return propertyToRef(source, key!, defaultValue)
  } else { 
   // 剩下的是最大众的情况, source 可以是单个原始值、对象，无论什么，都会被 ref 处理返回，变成响应式变量。
   // 这同样意味着，ref (响应式变量)和 Ref (访问器代理) 对于使用者更加不容易区分了. 这样做真的好吗.
    return ref(source)
  }
*/

/*
toRefs 是一个语法糖，用于构造一个对象，这个对象的每一个属性都是原对象的相应的属性的访问器属性代理。
这在展开 reactive 对象而不想丢失响应式代理的时候有用。
*/
function toRefs(object) {
    const ret = {}
    for (const key in object) {
        ret[key] = toRef(object, key)
    }
    return ret
}

/*
Ref 类型的变量会被打上 __v_isRef 标记。
这里的实现, 直接把这个标记, 通过反射打到了 value 属性所在的对象身上。

其实阅读 vue 源码可以知道, vue 的实现其实并不是这样的。标记都被打到了实际的代理身上：
reactive 对象自身也有标记 __v_isReactive. isReactive() 使用它。
readonly 对象自身也有标记 __v_isReadonly. isReadonly() 使用它。
无法被代理的对象会被标记 __v_skip. 通过 markRaw(obj) 得到；
任何对象代理的 __v_raw 即为源对象自己。

同样的，这里再次强调，不要把响应式变量和指向变量 Ref 混淆。
toRef 虽然返回的是 Ref 类型，但它并不是响应式变量。
*/
function isRef(val) {
    return val.__v_isRef
}


/*
关于这个函数，可以说是无恶不赦.
没错, 它就是那个自动解构 ref.value 的函数.
这样一个小小的语法糖, 增加了多少开发者的心智负担啊...
*/
function unref(obj) {
    return isRef(obj) ? obj.value : obj;
}

// unref 的增强版本。。
// 判断一下是不是 getter 函数, 是 getter 就返回其值; 不是就返回 unref。。
function toValue<T>(source): T {
    return (typeof source === 'function') ? source() : unref(source)
}


export { ref, shallowRef, toRef, toRefs, isRef, unref, toValue }