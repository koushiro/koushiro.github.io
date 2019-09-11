---
title: 'Rust: Atomic memory ordering'
categories: [Rust]
tags: [tech, rust]
---

<center>The usage of atomic types in Rust and What's memory ordering.</center>

<!-- more -->

---

# Rust: Atomic memory ordering

[rustc 1.34.0 稳定了 `integer_atomics_stable` 的 feature](https://github.com/rust-lang/rust/pull/57425)，以此为契机，打算深入了解下 Rust 中的 atomic types 和 memory ordering。

## The usage of atomic types

说实话，在我看来，Rust 中的 atomic types 在使用上基本与 C11/C++11 的差不多(主要原因还是 Rust 继承了 C11 中 atomic 的 memory model)。

> Rust pretty blatantly just inherits C11's memory model for atomics. This is not due to this model being particularly excellent or easy to understand. Indeed, this model is quite complex and known to have [several flaws](http://plv.mpi-sws.org/c11comp/popl15.pdf). Rather, it is a pragmatic concession to the fact that *everyone* is pretty bad at modeling atomics. At very least, we can benefit from existing tooling and research around C. -- From Rust nomicon book.

以 `AtomicUsize` 举例，常用的方法如下，略微有点不同的是，在 C++11 中有默认的 Ordering 参数 (memory_order::seq_cst)，而 Rust 的函数不支持默认参数，所以都需要显示指定 Ordering，此外 Rust 中多了个 safe 的 `get_mut` 方法，这是因为 Rust 在语言层面上就保证了没有其他线程可以通过 mutable reference 同时访问 atomic data:

```rust
pub const fn new(v: usize) -> AtomicUsize
pub fn get_mut(&mut self) -> &mut usize

pub fn load(&self, order: Ordering) -> usize
pub fn store(&self, val: usize, order: Ordering)
pub fn swap(&self, val: usize, order: Ordering) -> usize
pub fn fetch_xxx(&self, val: usize, order: Ordering) -> usize
...
```

Ordering 的定义如下：

```rust
pub enum Ordering {
    Relaxed,
    Release,
    Acquire,
    AcqRel,
    SeqCst,
}
```

## What's memory ordering

> Memory orderings specify the way atomic operations synchronize memory. 
> Rust's memory orderings are [the same as LLVM's](https://llvm.org/docs/LangRef.html#memory-model-for-concurrent-operations).  -- From Rust document.

了解 Memory ordering 前需要了解两个 keywords:  [happens-before](https://preshing.com/20130702/the-happens-before-relation/) [5] & [synchronizes-with](https://preshing.com/20130823/the-synchronizes-with-relation/) [6]。



- Relaxed
- Release
- Acquire
- AcqRel
- SeqCst

## Reference

[1] [Rust doc](https://doc.rust-lang.org/std/sync/atomic/index.html)
[2] [Rust nomicon book](https://doc.rust-lang.org/nomicon/atomics.html)
[3] [LLVM doc](https://llvm.org/docs/LangRef.html#memory-model-for-concurrent-operations)
[4] [Rust 并发编程 - Memory Ordering](https://www.jianshu.com/p/511cde6b62a6)
[5] [The Happens-Before Relation](https://preshing.com/20130702/the-happens-before-relation/)
[6] [The Synchronizes-With Relation](https://preshing.com/20130823/the-synchronizes-with-relation/)