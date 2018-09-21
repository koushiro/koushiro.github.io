---
title: Customizing new and delete in Cpp
date: 2018-07-18 14:00:07
categories: [C++]
tags: [tech, C++, note]
---

这部分主要涉及 `new` 和 `delete` 这两个 keyword，它们的一些高级用法在课堂上或者一些 C++ 初学者书籍中很难见到，对于编码者也很少用到这部分内容，当然我对此也不是了解得特别透彻，文中如有错误，请在评论指出。

<!-- more -->

既然标题是 `Customizing new and delete`，那么定制 `new` 和 `delete`（或者说重载 `new` 和 `delete`）用在哪些时候呢？
某些应用程序对内存分配有特殊需求，因此无法将标准内存管理机制直接应用于此类程序，它们常常需要自定义内存分配的细节，比如使用关键字 `new` 将对象分配放置在特定的内存空间中。为此，应用程序需要重载 `new` 运算符和 `delete` 运算符以控制内存分配的过程。

实际上重载`new`运算符（`new operator`）和`delete`运算符（`delete operator`）这种说法并不严谨，因为重载这两个运算符与重载其他运算符的过程有着较大的不同。

为了讲清原因，需要在此之前了解 `new operator`/`operator new`和`delete operator` / `operator delete`的概念。这几个概念从名字上可能会有点绕，但是说明白了其实也是挺简单的。（函数 `new-handler` 也会被提到，这是当无法满足用户的内存需求时所调用的函数）

# new operator (new expression)

```c++
string *pStr = new string("Hello");
```

此处使用的 `new` 即是 `new operator`，也就是常用的用法。
这个操作符是由C++语言内建的，就像 `sizeof` 那样，不能被改变意义，总是做相同的工作：

1. 调用名为 `operator new` 的标准库函数，分配一块足够大的、原始的、未命名的内存空间用来放置某类型的对象。

2. 调用一个该对象类型的 `constructor`，为刚才分配的内存中的那个对象设定初始值。

3. 对象被分配了空间并构造完成，返回一个指向该对象的指针，即如上述例子中的 `pStr`。

编译器内部产生的代码可能就像下面这样：

```c++
// 分配原始内存用来放置一个 string 对象
void* rawMemory = operator new(sizeof(string));
// 将内存中的对象初始化
call string::string("Hello") on *rawMemory;
// 让 pStr 指向新完成的对象
string *pStr = static_cast<string*>(rawMemory);
```

## operator new

没错，如上所说，`operator new` 其实指的是一个标准库函数，它的默认版本定义（伪代码）如下：

```c++
void* operator new(std::size_t size) throw(std::bad_alloc)
{
    using namespace std;
    // 处理 0-byte 申请，将它视为 1-byte 申请， 
    // C++规定请求 0-byte operator new也得返回一个合法指针
    if (size == 0)  
        size = 1;
    while (true)
    {
        尝试分配 size bytes;
        if (分配成功)
            return (一个指针，指向分配得来的内存)

        // 分配失败：找出目前的 new-handling 函数
        /**
         * C++11标准以前之所以将 new-handling 函数指针设为 null 后又立刻恢复原样
         * 是因为没有任何办法可以直接获取 new-handling 函数指针，
         * 必须要调用 set_new_handler 找出它，set_new_handler
         * takes a replacement handler as the argument,
         * returns the previous handler.
         *
         * 而 C++11 标准有 get_new_handler(),
         * it returns the currently installed new-handler,
         * which may be a null pointer.
         */
#if __cplusplus >= 201103L
        new_handler globalHandler = get_new_handler();
#else
        new_handler globalHandler = set_new_handler(0);
        set_new_handler(globalHandler);
#endif

        // 调用 new_handler 函数解决内存不足时的情况，
        // 只有当指向 new_handling 函数的指针是 null，operator new 才会抛出异常
        if (globalHandler) (*globalHandler)();
        else throw std::bad_alloc();
    }
}
```

此函数分配内存成功时返回一个 `void` 指针，指向一块原始的、未设定初值的内存，分配内存失败时抛出 `bad_alloc` 异常。函数中的 `size_t` 参数用于指定需要分配多少内存，可以将 `operator new` 函数重载，加上额外的参数，但第一参数的类型必须总是 `size_t`。
总而言之， `operator new` 函数和 `malloc` 函数一样，它的 **唯一任务就是分配内存**。

所以开头之所以说重载 `new operator` 并不严谨，是因为真正能重载的其实是 `operator new` 函数。也就是说可以修改定制 `new operator` 完成任务的方式（即 `opearotr new` 函数），但它的任务流程已经被语言固定死了，无法控制。

## placement new (placement operator new)

`placement new` 是特殊版本的 `operator new` 函数，如果 `operator new` 函数接受的参数除了一定得有的 `size_t` 外还有其他参数，这便是所谓的 `placement` 版本。
众多 `placement new` 版本中特别有用的一个是 “被用于在分配好的内存上构建对象”。具体代码定义如下：

```c++
void* operator new(size_t, void *ptr) noexcept { return ptr; }
// GNU 版本源码：
// inline void* operator new(std::size_t, void* __p)_GLIBCXX_USE_NOEXCEPT { return __p; }
```

这个版本可能比你预想的要简单，因为毕竟 `operator new` 函数的目的就是为对象找到一块内存，然后返回一个指针指向这块内存。而这一版本 `placement new` 的调用者显然知道指向内存的指针，因此这一版本 `placement new` 唯一需要做得就是将它获得的指针再返回。

这个常用的版本已经被纳入C++标准库中（只需要 `#include<new>`)，它同时也是最早的 `placement new` 版本。

大多数时候人们谈到的 `placement new` 就是特指这一版本——即唯一额外参数是个 `void*`。但一般性术语 `placement new` 意味着带任意额外参数的 `operator new` 函数，而且它有相对应的另一个术语 `placement delete`（下面会提到）。

常用 `placement new` 版本示例如下：

```c++
class Object
{
public:
    Object(int args) { ... }
    ...
};
Object* constructObject(void *buffer, int args)
{
    return new (buffer) Object(args);
}

// constructObject 函数在编译器内部产生的代码可能就像下面这样
// 调用 default placement version of operator new, rawMemory 的地址实际就是 buffer 的地址。
void* rawMemory = operator new(sizeof(Object), buffer);
// 将内存中的对象初始化
call Object::Object(args) on *rawMemory;
// 让 pObj 指向新完成的对象
Object *pObj = static_cast<Object*>(rawMemory);
// pObj 作为函数结果返回
return pObj;
```

## Summary

1. 最常用的，即希望将对象产生于 `heap`，那么就使用 `new opeartor (new expression)` ，它不但分配内存而且为该对象调用一个 `constructor` 设定初值。

2. 只是希望分配内存，则使用 `operator new` 函数，它不会调用任何 `constructor`。

3. 若希望在 `heap objects` 产生时自己决定内存分配方式，则自己写一个 `operator new` 函数的重载版本，并使用 `new operator(new expression)`，它就会自动调用你所写的 `operator new` 函数。

4. 若已经有分配的内存（并拥有指向该内存地址的指针），则直接使用 C++ 标准库中的默认 `placement new` 版本（即上述的最常用 `placement new` 版本）在该内存上构造对象。

---

# delete operator (delete expression)

```c++
string *pStr = new string("Hello");
//...
delete pStr;
```

`delete operator` 的实际工作如下：

1. 调用 `pStr` 所指对象类型的 `destructor`。

2. 调用名为 `operator delete` 的标准库函数释放被 `pStr` 所指对象占用的内存空间。

编译器内部产生的代码可能就像下面这样：

```c++
// 调用对象类型的 `destructor`
pStr->~string();
// 释放对象所占的内存
operator delete(pStr);
```

## operator delete

同理，`operator delete` 之于 `delete operator` 就相当于 `operator new` 之于 `new operator`。

`operator delete` 函数其实相比之下更简单，伪代码如下：

```c++
void operator delete(void *rawMemory)
{
    if (rawMemory == 0) return; // 删除的是 null 指针，什么都不做
    现在归还 rawMemory 所指向的内存
    return;
}
```

与 `operator new` 函数功能相反，该函数的 **唯一任务就是释放内存**，但注意需要记住 C++ 的保证 —— "删除 null 指针永远安全"。

## placement delete (placement operator delete)

类似于 `operator new` 函数的 `placement` 版本，`operator delete` 函数如果接受除 `void*` 参数之外的额外参数，便称为 `placement delete`。

如果在 `new operator` 的流程中，`operator new` 函数分配内存成功，但在该块内存上构造对象时抛出异常，则运行期系统有责任取消 `operator new` 函数的内存分配并恢复原样。**运行期系统会寻找 “参数个数和类型都与 `operator new` 相同”的某个 `operator delete`**，如果找到那就是它的的调用对象。

即 `placement delete` 函数只有在 `placement new` 函数调用而触发的构造函数出现异常时才会被运行期系统调用，而对着一个指针施行 `delete` 绝不会调用 `placement delete`。

所以规则很简单：如果一个带额外参数的 `operator new` 函数没有带相同额外参数的对应版 `operator delete` 函数，那么当 `new operator` 的内存分配动作需要取消并恢复原样时就没有任何 `operator delete` 函数会被调用，这会造成内存泄漏，显然是不对的。

这也意味着如果要对所有与 `placement new` 相关的内存泄漏问题宣战，**必须同时提供一个正常版本的 `operator delete` （用于构造期间无任何异常被抛出）和一个 `placement` 版本（用于构造期间有异常被抛出），后者的额外参数必须和 `operator new` 的 `placement` 版本一样**。

示例（来自 `Effective C++ Item 52`）：

```c++
class Widget {
public:
    ...
    // placement operator new，即带有额外参数 std::ostream& 的 operator new
    static void* operator new(std::size_t size, std::ostream &logStream);

    // 正常形式的 operator delete (class 专属)
    static void operator delete(void *pMemory) noexcept;
    // placement operator delete，即带有额外参数 std::ostream& 的 operator delete
    static void operator delete(void *pMemory, std::ostream &logStream) noexcept;
    ...
};

// new operator 调用 placement new 函数，现在构造时抛出异常不再泄漏
Widget *pw = new (std::cerr) Widget;
// delete operator 调用正常的 operator delete 函数
delete pw;
```

## Note

1. 当写一个 `placement operator new`，请确定也写出了对应的 `placement operator delete`。如果不这样做，程序可能会发生隐微而时断时续的内存泄漏。

2. 当声明 `placement operator new` 和 `placement operator delete` 时，请确定不要无意识地遮掩它们的正常版本。

---

# Array version

```c++
string *pStr = new string[10];
...
delete[] pStr;
```

上述使用的 `new` 仍然是那个 `new operator`，但由于诞生的是数组，所以 `new operator` 的行为与之前产生单一对象的版本不同，内存分配将是由 `operator new` 函数的兄弟版本 `operator new[]` 函数负责。和 `operator new` 函数一样，`operator new[]` 也可以被重载。

`operator delete[]` 函数和 `operator delete` 函数同理。

要说 “数组版” 和 “单一对象版” 的 `new operator` 最大的不同是它所调用的 `constructor` 数量。数组版本 `new operator` 先调用 `operator new[]` 分配足够内存，再然后必须针对数组中的每一个对象调用一个 `constructor`。

同理，当 `delete operator` 被用于数组时，它会针对数组中的每一个元素调用其 `destructor`，然后再调用 `operator delete[]` 释放内存。

---

好了，现在可以知道：如果希望自己控制应用程序中内存分配的过程，即需要定义自己的 `operator new` 函数和 `operator delete` 函数。它们 **既可以定义在全局作用域，也可以定义为成员函数**（定义为成员函数时，它们是隐式静态的，但我建议还是显式声明为 `static`，因为 `operator new` 函数用在对象构造之前而 `operator delete` 函数用在对象销毁之后）。
当编译器发现 `new` 或 `delete` 后，将在程序中查找可供调用的 `operator` 函数，其 **匹配查找顺序为：类及其基类的作用域 -> 全局作用域 -> 标准库定义的版本**。

最新的标准库定义了 [`operator new` 函数](http://en.cppreference.com/w/cpp/memory/new/operator_new) 和 [`operator delete` 函数](http://en.cppreference.com/w/cpp/memory/new/operator_delete) 的各种版本，以下给出 GNU 中的 `<new>` 头文件的部分源码：

```c++
namespace std
{
  /**
   *  @brief  Exception possibly thrown by @c new.
   *  @ingroup exceptions
   *
   *  @c bad_alloc (or classes derived from it) is used to report allocation
   *  errors from the throwing forms of @c new.  
   **/
  class bad_alloc : public exception
  {
  public:
    bad_alloc() throw() { }

    // This declaration is not useless:
    // http://gcc.gnu.org/onlinedocs/gcc-3.0.2/gcc_6.html#SEC118
    virtual ~bad_alloc() throw();

    // See comment in eh_exception.cc.
    virtual const char* what() const throw();
  };

#if __cplusplus >= 201103L
  class bad_array_new_length : public bad_alloc
  {
  public:
    bad_array_new_length() throw() { };

    // This declaration is not useless:
    // http://gcc.gnu.org/onlinedocs/gcc-3.0.2/gcc_6.html#SEC118
    virtual ~bad_array_new_length() throw();

    // See comment in eh_exception.cc.
    virtual const char* what() const throw();
  };
#endif

#if __cpp_aligned_new
  enum class align_val_t: size_t {};
#endif

  struct nothrow_t
  {
#if __cplusplus >= 201103L
    explicit nothrow_t() = default;
#endif
  };

  extern const nothrow_t nothrow;

  /** If you write your own error handler to be called by @c new, it must
   *  be of this type.  */
  typedef void (*new_handler)();

  /// Takes a replacement handler as the argument, returns the
  /// previous handler.
  new_handler set_new_handler(new_handler) throw();

#if __cplusplus >= 201103L
  /// Return the current new handler.
  new_handler get_new_handler() noexcept;
#endif
} // namespace std

// =================================================================

/** These are replaceable signatures:
 *  - normal single new and delete (no arguments, throw @c bad_alloc on error)
 *  - normal array new and delete (same)
 *  - @c nothrow single new and delete (take a @c nothrow argument, return
 *    @c NULL on error)
 *  - @c nothrow array new and delete (same)
 *
 *  Placement new and delete signatures (take a memory address argument,
 *  does nothing) may not be replaced by a user's program.
*/
void* operator new(std::size_t) throw(std::bad_alloc)
  __attribute__((__externally_visible__));
void* operator new[](std::size_t) throw(std::bad_alloc)
  __attribute__((__externally_visible__));
void operator delete(void*) noexcept
  __attribute__((__externally_visible__));
void operator delete[](void*) noexcept
  __attribute__((__externally_visible__));

#if __cpp_sized_deallocation
void operator delete(void*, std::size_t) noexcept
  __attribute__((__externally_visible__));
void operator delete[](void*, std::size_t) noexcept
  __attribute__((__externally_visible__));
#endif

void* operator new(std::size_t, const std::nothrow_t&) noexcept
  __attribute__((__externally_visible__));
void* operator new[](std::size_t, const std::nothrow_t&) noexcept
  __attribute__((__externally_visible__));
void operator delete(void*, const std::nothrow_t&) noexcept
  __attribute__((__externally_visible__));
void operator delete[](void*, const std::nothrow_t&) noexcept
  __attribute__((__externally_visible__));

#if __cpp_aligned_new
void* operator new(std::size_t, std::align_val_t)
  __attribute__((__externally_visible__));
void* operator new(std::size_t, std::align_val_t, const std::nothrow_t&) noexcept
__attribute__((__externally_visible__));
void operator delete(void*, std::align_val_t) noexcept
   __attribute__((__externally_visible__));
void operator delete(void*, std::align_val_t, const std::nothrow_t&) noexcept
__attribute__((__externally_visible__));
void* operator new[](std::size_t, std::align_val_t)
  __attribute__((__externally_visible__));
void* operator new[](std::size_t, std::align_val_t, const std::nothrow_t&) noexcept
__attribute__((__externally_visible__));
void operator delete[](void*, std::align_val_t) noexcept
__attribute__((__externally_visible__));
void operator delete[](void*, std::align_val_t, const std::nothrow_t&) noexcept
__attribute__((__externally_visible__));

#if __cpp_sized_deallocation
void operator delete(void*, std::size_t, std::align_val_t) noexcept
__attribute__((__externally_visible__));
void operator delete[](void*, std::size_t, std::align_val_t) noexcept
__attribute__((__externally_visible__));
#endif // __cpp_sized_deallocation

#endif // __cpp_aligned_new

// Default placement versions of operator new.
inline void* operator new(std::size_t, void* __p) noexcept
{ return __p; }
inline void* operator new[](std::size_t, void* __p) noexcept
{ return __p; }

// Default placement versions of operator delete.
inline void operator delete  (void*, void*) noexcept { }
inline void operator delete[](void*, void*) noexcept { }
```

与析构函数类似，`operator delete` 函数也不允许抛出异常（[Item8](http://koushiro.me/2017/02/03/Effective-Cpp-Note2/#more)），**重载 `operator delete` 函数时必须使用 `noexcept` 异常说明符指定其不抛出异常**。

[`nothrow_t`](http://en.cppreference.com/w/cpp/memory/new/nothrow_t) 是定义在 `<new>` 头文件中的一个 `struct`，`nothrow` 是一个类型为 `nothrow_t` 的 `const` 对象，用户可通过这个对象获取 `operator new` 函数的不抛出异常版本。
