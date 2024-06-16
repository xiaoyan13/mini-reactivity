# mini-reactivity

手写一个 mini 版的 [@vue/reactivity](https://github.com/vuejs/core/tree/main/packages/reactivity)。

- 本实现完成了 `vue3.4` 版本常见的响应式 api。一些具体实现细节与原实现存在偏差，只提供了最基础的重现。

- 实现主要参照源码版本是 [v3.4](https://github.com/vuejs/core/tree/v3.4.29/packages/reactivity/src) 、[v3.3](https://github.com/vuejs/core/tree/v3.3.13/packages/reactivity/src)，参考书籍 《vue 设计与实现》(2023)。
