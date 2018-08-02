---
title: The Note3 of Effective C++
date: 2017-02-11 14:27:39
tags: [cpp, tech]
categories: [Note]
---

书中第三部分是讲资源管理（Resource Management），只有不足20页，尽管不是专门讲动态内存（dynamical memory）和智能指针（smart pointer），但还是占较大篇幅的，我会结合 C++11 新标准对其进行一些扩充。今日も顽张りましょう。

<!-- more -->

> Tips : 我会在 C++11/14 标准的基础上作笔记 (Effective C++, 3rd Edition 中的内容并不是按照 C++11/14 标准）

# Resourse Management

## Item 13 : 以对象管理资源
> Use objects to manage resourses

```c++
Object* factory(T arg)      // factory 返回指针，指向动态分配的对象
{
    ...
    return new Object(arg); // 调用者负责释放此内存
}
void use_factory(T arg)
{
    // 由内置指针（非智能指针）管理的动态内存在被显式释放前一直都会存在
    Object* p = factory(arg);
    ...
    delete p;
}
```
在某些情况下，`use_factory` 可能无法删除从 `factory` 得到的资源对象【这是在实际中很容易放的错】——或许因为 "..." 区域内过早的一个 `return`；有或者 "..." 区域内的语句抛出异常。无论 `delete` 如何被忽略过去，泄露的不仅仅是内含 `Object` 对象的那块内存，还包括对象所保存的任何资源。

使用 `new` 和 `delete` 管理动态内存资源的三个常见问题：
1. 忘记 `delete` 内存。（例子中可能存在的问题）
2. 使用已经释放掉的对象。
3. 同一块内存释放两次。

因此**为确保内存等资源总是被释放，需要将资源放进对象**。实际上这正是本条款背后的半边想法：把资源放进对象内，依赖 C++ 的 “析构函数自动调用机制” 确保资源被释放。（另半边想法之后讨论）

许多资源被动态分配于 `heap` 内而后被使用于某个作用域（除了静态内存和栈内存，每个程序还有一个内存池，被称为 `free store` 或 `heap`，程序用其来存储动态分配的对象，即运行时分配的对象），它们应该在离开该作用域时被释放。C++ 标准库提供了一类智能指针 `unique_ptr`，智能指针是个“类指针（pointer-like）”对象，其析构函数自动对其所指对象调用 `delete`。

```c++
void function()
{
    std::unique_ptr<Object> pObject(factory());     // 为简洁，factory 中不加实参
    ...
}   // 经由 unique_ptr 的析构函数自动删除 pObject
```
这个例子展示了 “以对象管理资源” 的两个关键想法：
- **获得资源后立即放进管理对象（managing object）内**。实际上 “以对象管理资源” 的观念常被称为 **“资源取得时便是初始化时机（Resource Acquisition Is Initialization，RAII）”**，因为实际中几乎总是在获得一笔资源后于同一语句内以该资源初始化某个管理对象。

- **管理对象（managing object）运用析构函数确保资源被释放**。一旦对象被销毁（例如对象离开当前作用域），其析构函数会被自动调用以释放资源。如果使用内置指针管理内存，资源释放前（`delete`前）抛出异常且未被 `catch`，这种情况可能会有点麻烦，直接管理的内存是不会自动释放的，但使用智能指针就不存在这样的问题。

### unique_ptr 类 

**注意事项**：
1. 一个 `unique_ptr` “拥有” 它所指的对象，也就是说，**某个时刻只能有一个 `unique_ptr` 指向一个给定对象**【不然怎么叫 `unique` →_→. 
2. **定义一个 `unique_ptr` 时，需要将其绑定到一个 `new` 返回的指针上**【不像 `shared_ptr`，它没有类似 `make_shared` 的标准库函数返回一个 `unique_ptr`，后面会提】；而**初始化 `unique_ptr` 必须采用直接初始化形式**。
3. 由于 `unique_ptr` 拥有它所指对象，因此 **`unique_ptr` 不支持普通拷贝和赋值操作**。**但可通过调用 `release` 或 `reset` 将指针的所有权从一个（非`const`）`unique_ptr` 转移给另一个 `unique`**。
    ```c++
    unique_ptr<string> p1(new string("Hello"));     // 正确
    unique_ptr<string> p2(p1);                      // 错误：unique_ptr 不支持 拷贝
    unique_ptr<string> p3;
    p3 = p2;                                        // 错误：unique_ptr 不支持 赋值
    
    // ==========================================================================
    
    // 将所有权从 p1 转移到 p2
    unique_ptr<string> p1(new string("Hello"));
    unique_ptr<string> p2(p1.release());            // release 将 p1 置为空
    // 将所有权从 p3 转移到 p2
    unique_ptr<string> p3(new string("World"));
    p2.reset(p3.release());                         // reset 释放了 p2 原来指向的内存
    ```

由于 `unique_ptr` 不支持普通的拷贝和赋值操作，也就意味着 `unique_ptr` 并非动态分配资源的利器。举个例子，STL 容器要求其元素发挥“正常的” 拷贝行为，因此这些容器不能使用 `unique_ptr`。

### shared_ptr 类

`unique_ptr` 的替换方案是 **“引用计数型智能指针” （reference-counting smart pointer，RCSP）**。`RCSP` 提供的行为类似 垃圾回收（garbage collection），它持续追踪记录指向某笔资源的对象个数，并在无人指向它时自动删除该资源，不同的是 `RCSP` 无法打破 “环状引用”（cycles of reference，例如两个其实已经没被使用的对象彼此互指，因此好像还处在“被使用”的状态）。

标准库中的 `shared_ptr` 就是个 `RCSP`，由于其拷贝行为相比 `unique_ptr` 显得更"正常"，可被用于 STL 容器以及其他 `unique_ptr` 不适用的地方。

**注意事项**：
1. **最安全的分配和使用动态内存的方法是调用名为 `make_shared` 的标准库函数**。此函数在动态内存中分配一个对象并初始化它，返回指向此对象的 `shared_ptr`。之所以推荐 `make_shared` 而不是 `new` 是因为能在分配对象的同时就将 `shared_ptr` 与之绑定，从而避免无意中将同一块内存绑定到多个独立创建的 `shared_ptr` 上。【该函数也被定义在头文件 `memory` 中】
    ```c++
    // 指向值为 666 的 int 的 shared_ptr
    shared_ptr<int> pInt = make_shared<int>(666);
    // 指向值为 “666” 的 string
    shared_ptr<string> pString = make_shared<string>(3, '6'); 
    ```

2. `shared_ptr` 通过析构函数完成对象销毁和和内存释放的自动化，**其析构函数会递减它所指的对象的引用计数，如果引用计数变为 0，`shared_ptr` 的析构函数就会销毁对象，并释放它所占的内存**。
    ```c++
    shared_ptr<int> p = make_shared<int>(123); // p 指向的对象只有 p 一个引用者
    shared_ptr<int> q(p);                      // p 和 q 指向相同对象，此对象有两个引用者
    
    shared_ptr<int> r = make_shared<int>(666); // r 指向的 int 只有一个引用者
    r = q;                                    // 给 r 赋值，令它指向另一个地址
                                              // 递增 q 指向对象的引用计数，递减 r 原来指向对象的引用计数
                                              // r 原来指向的对象已没有引用者，会自动释放
    ```

虽说写了这么多关于 `unique_ptr` 和 `shared_ptr` 的东西，但本条款真正强调的是 “以对象管理资源” 的重要性，`unique_ptr` 和 `shared_ptr` 只是实际例子。

### 扩展（智能指针支持的操作）

| `shared_ptr` 和 `unique_ptr` 都支持的操作|  |
| :------| :------ |
| shared_ptr`<T>` sp | 空智能指针，可以指向类型为 T 的对象 |
| unique_ptr`<T>` up |  |
| p | 将 p 用作一个条件判断，若 p 指向一个对象，则为 true |
| *p | 解引用 p，获得它指向的对象 |
| p->mem | 等价于 (*p).mem |
| p.get() | 返回 p 中保存的指针。若智能指针释放了其对象，`get()` 返回的指针所指向的对象也就消失，因此不要 `delete get()` 返回的指针，这会导致同个资源被多次释放  |
| swap(p,q) | 交换 p 和 q 中的指针 |
| p.swap(q) |  |


| `shared_ptr` 独有的操作 |  |
| :------| :------ |
| make_shared`<T>`(args) | 返回一个 shared_ptr，指向一个动态分配的类型为 T 的对象，使用 args 初始化此对象 |
| shared_ptr`<T>` p(q) | p 是 shared_ptr q 的拷贝；此操作会递增 q 中的计数器，q 中的指针必须能转换为 T* |
| p = q | p 和 q 都是 shared_ptr，所保存的指针必须能相互转换；此操作会递减 p 的引用计数，递增 q 的引用计数，若 p 的引用计数为 0，则将其管理的原内存释放 |
| p.unique() | 若 p.use_count() 为 1，返回 true；否则返回 false |
| p.use_count() | 返回与 p 共享对象的智能指针数量；可能很慢，主要用于调试 |


| `unique_ptr` 独有的操作 |  |
| :------| :------ |
| unique_ptr`<T>` u1 | 空 unique_ptr，可以指向类型为 T 的对象，u1 会用 delete 来释放它的指针； |
| unique_ptr`<T, U>` u2 | u2 会使用一个类型为 D 的可调用对象（即删除器）来释放它的指针 |
| unique_ptr`<T, U>` u(d) | 空 unique_ptr，指向类型为 T 的对象，用类型为 D 的对象 d 代替 delete |
| u = nullptr | 释放 u 指向的对象，将 u 置为空 |
| u.release() | u 放弃对指针的控制权，返回指针，并将 u 置为空 |
| u.reset() | 释放 u 指向的对象 |
| u.reset(q) | 如果提供了内置指针 q，令 u 指向这个对象；否则将 u 置为空 |
| u.reset(nullptr) |  |
    

| 定义和改变 `shared_ptr` 的其他方法 |  |
| :--- | :--- |
| shared_ptr`<T>` p(q) | p 管理内置指针 q 所指向的对象；q 必须指向 new 分配的内存，且能转换为 T* 类型 |
| shared_ptr`<T>` p(u) | p 从 unique_ptr u 那里接管了对象的所有权；将 u 置为空 |
| shared_ptr`<T>` p(q, d) | p 接管了内置指针 q 所指对象的所有权。q 必须能转换为 T* 类型。p 将使用可调用对象 d 来代替 delete |
| shared_ptr`<T>` p(p2, d) | p 是 shared_ptr p2 的拷贝；唯一的区别是 p 将用可调用对象 d 来代替 delete |
| p.reset() | 若 p 是唯一指向其对象的 shared_ptr，reset 会释放此对象。 |
| p.reset(q) | 若传递了可选参数内置指针 q ，会令 p 指向 q，否则会将 p 置为空 |
| p.reset(q, d) | 若还传递了参数 d，将会调用 d 而不是 delete 来释放 q |


**请记住**
> - **为防止资源泄露，请使用 `RAII（Resource Acquisition Is Initialization）` 对象，这些对象在构造函数获得资源并在析构函数释放资源**。
> - **常被使用的 `RAII class` 分别是 `shared_ptr` 和 `unique_ptr`** （标准库较早版本包含`auto_ptr`，它有 `unique_ptr` 的部分特性，虽然它还是标准库的一部分，但不建议使用，编写程序时应该使用 `unique_ptr`）。此外，标准库还定义了 `weak_ptr` 的伴随类，它是种弱引用，指向 `shared_ptr` 管理的对象。这三种类型都定义在 `memory` 头文件中。

---

## Item 14 : 在资源管理类中小心 copying 行为
> Think carefully about copying behavior in resourse-managing classes

之前谈论到了 `RAII` 的概念，也描述了 `unique_ptr` 和 `shared_ptr` 如何将这个观念表现在 `heap-based` 资源上。然而并非所有资源都是 `heap-based`，对此类资源，像 `unique_ptr` 和 `shared_ptr` 这样的智能指针往往不适合作为资源掌控者（resource handler），可能**需要建立自己的资源管理类**。

既然要建立自己的资源管理类，那肯定要考虑到当一个 **`RAII` 对象被复制时会发生些什么**？这是需要面对的问题，大多数时候会有以下两种选择：

- **禁止复制**。如果复制动作对 `RAII` 对象并不合理，便应该禁止之。在 `Item 6` 中我已经提及过了：可以将 `copying` 操作声明为 `private` 但不定义它；或者使用 C++11 引入的 `deleted function`。 

- **对底层资源用出 “引用计数法（reference-count）”**。有时希望保有资源，直到它最后一个使用者被销毁。这种情况下复制 `RAII` 对象时，应该将资源的 “被引用数” 递增，`shared_ptr` 便是如此。但 `shared_ptr` 的缺省行为是 “当引用次数为0时删除其所指物”，这很有可能不是我们所要的行为，例如使用智能指针管理的资源不是 `new` 分配的内存。还好 **`shared_ptr` 允许指定 “删除器（deleter）” ——一个函数或函数对象，当引用次数为0时便被调用**。【`unique_ptr` 也允许指定 “删除器”，但管理 “删除器” 的方式与 `shared_ptr` 不同】
    - **复制底部资源**。 需要 “资源管理类” 的唯一理由是：当不再需要某个复件时确保它被释放。在此情况下复制资源管理对象，应该同时也复制其所包含的资源。也就是说，复制资源管理对象时，进行的是 “深度拷贝”。
    - **转移底部资源的所有权**。某些场合可能会希望永远只有一个 `RAII` 对象指向一个未加工资源（raw resource），即使 `RAII` 对象被复制也如此。此时，资源的拥有权会从被复制物转移到目标物。例如 `unique_ptr` 中的 `release` 和 `reset` 操作。

### 扩展（`shared_ptr` 和 `unique_ptr` 的删除器）

`shared_ptr` 和 `unique_ptr` 之间明显的不同已经在 `Item13` 中谈到过了，是它们**管理所保存的指针的策略** —— 前者给予共享指针所有权的能力，后者则独占指针。
另一个差异是它们**允许指定用户重载默认删除器的方式**。

- 重载 `shared_ptr` 的删除器很容易，**只要创建或 `reset` 指针时传递给它一个可调用对象即可**。
```c++
void end_connection(connection *p) { disconnect(*p); }
void f(destination &d /* 其他参数 */)
{
    connection c = connect(&d); // 打开连接
    shared_ptr<connection> p(&c, end_connection);
    // 使用连接
    // 当 f 退出时（即使由于异常而退出），connection 会被正确关闭
}
```

- 与之相反，删除器的类型是一个 `unique_ptr` 对象类型的一部分，**用户必须在定义 `unique_ptr` 时以显式模板实参的形式提供删除器的类型**。
```c++
void f(destination &d /* 其他参数 */)
{
    connection c = connect(&d); // 打开连接
    unique_ptr<connection, decltype(end_connection)*> p(&c, end_connection);
    // 使用连接
    // 当 f 退出时（即使由于异常而退出），connection 会被正确关闭
}
// decltype(end_connection) 返回函数类型，
// 必须添加一个 * 来指出我们正在使用该类型的一个指针
```

尽管不知道标准库类型是如何实现的，但可以推断出 `shared_ptr` 必须能直接访问其删除器，即删除器必须保存为一个指针或一个封装了指针的类。

可以确定 `shared_ptr` 不是将删除器直接保存为一个成员的原因，是因为 `shared_ptr` 重载的删除器类型是直到运行时才会知道的【实际上，在一个 `shared_ptr` 的生存期内，可以随时改变其删除器的类型】，而通常类成员在运行时是不能改变的，因此，不能将删除器直接保存为一个成员。

而在 `unique_ptr` 类中，由于删除器的类型是 `unique_ptr` 类型的一部分，因此删除器成员的类型在编译时是知道的，从而删除器可以直接保存在 `unique_ptr` 对象中。

通过在**编译时绑定删除器**，**`unique_ptr` 避免了间接调用删除器的运行时开销**；通过在**运行时绑定删除器**，**`shared_ptr` 使用户重载删除器更为方便**。

**请记住**
> - **复制 `RAII` 对象必须一并复制它所管理的资源，所以资源的 `copying` 行为决定 `RAII` 对象的 `copying` 行为**。
> - 普遍而常见的 `RAII class copying` 行为是：**抑制 `copying` 行为**、**施行引用计数法（reference counting）**。 

---

## Item 15 : 在资源管理类中提供对原始资源的访问
> Provide access to raw resourse in resourse-managing classes

实际中许多 API 直接涉及资源，所以除非承诺永不使用这样的 API，否则只得绕过资源管理对象（resource-managing object）直接访问原始资源（raw resource）。

举个例子，再次使用 `Item 13` 中的代码：
```c++
Object* factory(T arg)      // factory 返回指针，指向动态分配的对象
{
    ...
    return new Object(arg); // 调用者负责释放此内存
}
// =====================================================
std::unique_ptr<Object> pObject(factory());
// 假如有某个 function 希望处理 Object 对象，如下
int function(const Object* o);
```
若想要像下面这么调用 `function`，是通不过编译的。因为 `function` 需要的是 `Object*` 指针，而不是你传给它的类型为 `unique_ptr<Object>` 的对象。 
```c++
int ret = function(pObject);            // 错误
```

这时候你需要一个函数**可将 `RAII class` 对象转换为其所内含的原始资源**（本例为 `Object*`），有两种做法可以做到：

- **显式转换**：`unique_ptr` 和 `shared_ptr` 都提供了一个 **`get` 成员函数**，用来执行显式转换，也就是它会**返回智能指针内部的原始指针（的复件）**：  
    ```c++
    int ret = function(pObject.get());
    ```

- **隐式转换**：**`unique_ptr` 和 `shared_ptr` 重载了指针取值（pointer dereference）操作符（`operator->` 和 `operator*`）**，它们允许隐式转换至底部原始指针：
    ```c++
    class Object
    {
    public:
        bool IsReal() const;
        ...
    };
    Object* factory();              // 为代码简洁，此处省略实参
    shared_ptr<Object> p1(factory());
    bool ret1 = p1->IsReal();       // 经由 operator-> 访问资源
    ...
    unique_ptr<Object> p2(factory());
    bool ret2 = (*p2).IsReal();     // 经由 operator * 访问资源
    ...
    ```

### 扩展（智能指针的一些使用注意事项）

**接受指针参数的智能指针的构造函数是 `explicit` 的**，因此必须使用直接初始化形式来初始化一个智能指针【当然更推荐使用 `make_shared` 来初始化 `shared_ptr`，前面有提及过原因】：
```c++
shared_ptr<int> p1 = new int(1024); // 错误，必须使用直接初始化形式
shared_ptr<int> p2(new int(1024));  // 正确 
// shared_ptr 更推荐用 make_shared 初始化
shared_ptr<int> p3 = make_shared<int>(1024);  
```

出于相同的原因，一个返回 `shared_ptr` 的函数不能在其返回语句中隐式转换一个普通指针：
```c++
shared_ptr<int> clone(int p)
{
    // 错误，不能隐式转换
    return new int(p);  
}
shared_ptr<int> clone(int p)
{
    // 正确，显式地用 int* 创建 shared_ptr<int>
    return shared_ptr<int>(new int(p));
}
```

**不要混合使用普通指针和智能指针**，因为当一个 `shared_ptr` 绑定到一个普通指针时，内存的管理责任就交给了这个 `shared_ptr`。而继续使用该普通指针很可能会指向（已经释放的）内存【毕竟复杂情况下很难知道对象何时会被销毁】，导致该指针的值是未定义的，这是很危险的。
```c++
void process(shared_ptr<int> ptr); // pass-by-value

shared_ptr<int> p(new int(1024)); // 引用计数为 1
process(p); // 拷贝 p 会递增它的引用计数，引用计数为 2
int i = *p; // 正确，引用计数为 1

int *x(new int(1024));  // 危险：x 是普通指针
// process(x); // 错误，不能将int* 转换为shared_ptr<int>
/*  下面是合法的，但内存会被释放!
**  因为是一个临时 shared_ptr传递给 process，当调用表达式结束时，该临时对象就会被销毁。
**  销毁这个临时变量会递减引用计数，此时引用计数就变为0，该临时变量所指向的内存会被释放。
*/
process(shared_ptr<int>(x)); 
int j = *x;                  // 未定义的：x 是个空悬指针
```

**也不要使用 `get` 初始化另一个智能指针 或 为智能指针赋值**，因为设计 `get` 函数的目的是 “为了向不能使用智能指针的代码传递一个内置指针（或者说是如下一部分内容中 必须要取得`RAII class`对象内原始资源的情况）”。

**【注意：只有在代码不会 `delete` 指针的情况下才能使用 `get`，特别是，永远不要用 `get` 初始化另一个智能指针 或 为另一个智能指针赋值，尽管编译器不会给出错误信息】**
```c++
shared_ptr<int> p(new int(1024));  // 引用计数为 1
int *q = p.get();   // 正确：但使用 q 时要注意，不要让它管理的指针被释放
{// 新程序块
    shared_ptr<int> (q); // q 和 p 指向相同的内存，q 的引用计数为 1
}// 程序块结束，q 被销毁，并且 q 所指向的内存被释放
int foo = *p;   // 未定义：p 指向的内存已经被释放了
```

### 必须要取得 `RAII class` 对象内原始资源的情况

套用书中的例子：

```c++
FontHandle getFont();           // 这是个 C API，为简化暂略参数
void releaseFont(FontHandle fh);// 来自同一组 C API
```
```c++
class Font
{
public:
    // 采用 pass-by-value，因为 C API 这么做
    explicit Font(FontHandle fh) : f(fh) {  }
    ~Font() { releaseFont(f); } // 释放资源
private:
    FontHandle f;               // 原始字体资源
};
```

如果有大量的 C API，它们处理的是 `FontHandle`，那么 “将 `Font` 对象转换为 `FontHandle`” 会是一种频繁的需求。`Font class` 可为此**提供一个如下的显式转换函数**，但这使得用户每当要使用 API 时就必须调用 `get`，这不免会让某些人觉得厌烦。

```c++
// 显式转换函数
class Font
{
public:
    ...
    FontHandle get() const { return f; }
    ...
};
```

另一个办法是令 `Font` **提供如下的隐式转换函数**，转型为 `FontHandle`，这会使得用户调用 C API 时更为轻松自然。但这份隐式转换会增加错误发生机会。例如用户可能会在需要 `Font` 时意外创建一个 `FontHandle`。

```c++
// 隐式转换函数
class Font
{
public:
    ...
    operator FontHandle() const { return f; }
    ...
};
```
```c++
// 需要 Font 时意外创建一个 FontHandle
Font f1(getFont());
...
FontHandle f2 = f1;
// 原意是要拷贝一个 Font 对象，
// 却反而将 f1 隐式转换为其底部的 FontHandle，然后才复制它。
// 当 f1 被销毁时，字体被释放，而 f2 会因此成为 “虚吊的（dangle）”。
```

是否该提供一个显式转换函数（例如 `get` 成员函数）将 `RAII class` 转换为其底部资源，或是应该提供隐式转换，答案主要**取决于 `RAII class` 被设计者执行的特点工作，以及它被使用的情况**。通常显式转换函数如 `get` 是比较受欢迎的，因为它将“非故意之类型转换” 的可能性最小化，然而有时候隐式转换所带来的“自然用法”的好处更大。

**请记住**
> - API 往往要求访问原始资源（raw resource），所以**每一个 `RAII class` 应该提供一个 “取得其所管理资源” 的办法**。
> - 对原始资源的访问可能经由显式转换或隐式转换。一般而言，**显式转换比较安全，但隐式转换对客户比较自然**。

---

## Item 16 : 成对使用 new 和 delete 时要采取相同形式
> Use the same form in corresponding uses of new and delete

该条款，我想稍微会使用动态内存分配的C++编码者应该都了解，所以此处写的比较随便，看看就好。

当你使用 `new`（也就是通过 `new` 动态生成一个对象），有两件事发生：
- 第一，内存被分配出来（通过名为 `operator new` 的函数，之后会讲）
- 第二，针对此内存会有一个（或更多）构造函数被调用

当你使用 `delete` 也有两件事发生：
- 第一，针对此内存会有一个（或更多）析构函数被调用
- 第二，然后内存才被释放（通过名为 `operator delete` 的函数）

`delete` 最大的问题在于：即将被删除的内存内究竟有多少对象，这也意味着究竟有多少个析构函数必须被调用。或者更通俗点来说，即将被删除的指针，其所指的是单一对象还是对象数组。

数组所用的内存通常还包括“数组大小”的记录，以便 `delete` 知道需要调用多少次析构函数，而单一对象的内存则没有这个记录。

唯一能够让 `delete` 知道内存中是否存在一个 “数组大小记录” 的办法就是：由编码者告诉编译器，**如果使用 `delete[]`，`delete` 便认定指针指向一个数组，否则便认定指针指向单一对象**。
```c++
std::string* pStr1 = new std::string;
std::string* pStr2 = new std::string[100];
...
delete pStr1;           // 删除单一对象
delete[] pStr2;         // 删除一个对象数组
// =======================================
delete[] pStr1;         // 结果未定义
delete pStr2;           // 结果未定义
```

上述的规则对喜欢使用 `typedef` 的编码者也很重要，因为它意味着 `typedef` 的作者必须说清楚，当以 `new` 创建该种 `typedef` 类型对象时，该以哪一种 `delete` 形式删除它。比如下面这种问题：
```c++
typedef std::string AddressLines[4];
// 注意，"new AddressLines" 返回一个 string*，就像"new string[4]" 一样
std::string* pAL = new AddressLines;

// 必须匹配 “数组形式” 的 delete 
delete pAL;         // 行为未定义
delete[] pAL;       // 正确
```

为了避免这样的问题，**最好尽量不要对数组形式做 `typedef` 动作，而且C++标准库中有许多容器（如`vector`,`string`等 `templates`）可以实现类似数组的需求。


**请记住**
> - **如果在 `new` 表达式中使用 `[]`，必须在相应的 `delete` 表达式中也使用 `[]`**；如果一个不用，另一个也一定不要使用。

---

## Item 17 : 以独立语句将 newed 对象置入智能指针
> Store newed objects in smart pointers in standalone statements

假设有一个函数用来揭示处理程序的优先权，另一个函数用来在某动态分配所得的 `Object` 上进行某些带有优先权的处理：
```c++
int priority();
void processObject(std::shared_ptr<Object> pObj, int priority);
```
```c++
// processObject(new Object, priority());  // 错误，编译不通过
// 由于 shared_ptr 的构造函数是个 explicit 构造函数，无法进行隐式转换
// 只有写成下面这样才能通过编译
processObject(std::shared_ptr<Object>(new Object), priority());
```
尽管在此使用了 “对象管理式资源”（object-managing resources），但上述调用却仍可能泄露资源。

究其原因，要从 **C++ 完成函数参数的核算次序**说起。不像 Java 和 C# 语言一样以特定次序完成函数参数的核算，C++编译器对以什么次序来完成这些事情**弹性很大**。

拿上面的代码举例，C++ 编译器**产出一个 `processObject` 调用码之前，必须首先核算即将被传递的各个实参**。此处第二个实参只是单纯地对 `priority` 函数的调用，但第一个实参 `std::shared_ptr<Object>(new Object)` 由两部分组成：
- 执行 `"new Object"` 表达式
- 调用 `std::shared_ptr` 的构造函数

于是在调用 `processObject` 之前，编译器必须创建代码做以下三件事：
- 调用 `priority()` 
- 执行 `"new Object"`
- 调用 `std::shared_ptr` 的构造函数

由于 **C++ 核算函数参数的次序不确定**，对 `priority()` 的调用可以排在第一或第二或第三行。【可以确定的是 `"new Object"` 一定执行于 `std::shared_ptr` 构造函数被调用之前】

因此如果编译器选择以第二顺位执行 `priority` 函数【说不定编译器可以生成更高效的代码，谁知道呢!】，最终获得这样的操作序列：
- 执行 `"new Object"`
- 调用 `priority()`
- 调用 `std::shared_ptr` 的构造函数

此时，万一对 `priority()` 的调用抛出异常，`"new Object"` 返回的指针将会遗失，因为它尚未被置入我们期盼用来防止资源泄露的 `std::shared_ptr` 内。

避免这类问题的办法很简单：**使用分离语句**，分别写出
1. 创建 `Object` ，将它置入一个智能指针内
2. 然后再把那个智能指针传给 `processObject`
```c++
std::shared_ptr<Object> pObj(new Object);

processObject(pObj, priority());
```
上面的代码之所以能行得通，是因为**编译器对于 “跨越语句的各项操作” 没有重新排列的自由（只有在语句内它才拥有那个自由度）**。

**请记住**
> - **以独立语句将 `newd` 对象存储于智能指针内**。如果不这么做，一旦异常被抛出，有可能导致难以察觉的资源泄露。

---

【备注】：还有一类智能指针 `weak_ptr` 在此并没有被讲到，但值得了解。