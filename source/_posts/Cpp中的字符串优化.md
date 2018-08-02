---
title: Cpp中的字符串优化
date: 2018-06-05 15:52:21
categories:
tags: [tech, cpp]
---

字符串是程序代码中使用最频繁的几种数据类型之一，在C++中基本是以std::string出现（当然还有C中的字符数组），尽管它被正确和频繁的使用，但多数coder仍然会忽略可以明显改善性能的地方。

<!--more-->

---

# 字符串的重要特性

## 动态分配

C++中字符串的内容是自动增长的，相比C中固定长度的字符数组（需要手动分配和释放内存），拥有更好的便捷灵活性，但为了实现内容的自动增长，字符串被设计为动态分配，而动态分配内存相比一些操作更耗费资源。

虽然C++中的字符串是动态分配的（字符串增长的情况），但实际上字符串内部的buffer的大小在一段时间内仍然是固定的。详细可以解释为字符串向内存管理器申请的buffer的大小并非与字符串所需存储的字符数完全一致，而是更大的空间（通常是现在所需的两倍大小）。这带来的好处就是随着字符串变得更长，在字符串后面再添加字符或是字符串的开销近似于一个常量（降低向内存管理器动态申请内存的次数），而代价则是字符串携带了一些未使用的内存空间。

## 大量复制

字符串的行为与普通的整型值类似，即修改一个字符串不能改变其他字符串的值，表现得就像拥有自己的私人副本。

实现这种行为的最简单的方式是当创建字符串、赋值或是将其作为参数传递给函数的时候就进行一次复制。如果字符串是以这种方式实现的，那么赋值和参数传递的开销将会变得很大，但是变值函数（mutating function）和非常量引用的开销却很小。

另一种方式就是“写时复制”（copy on write），它可以让对象与值具有同样的表现，尽管写时复制的字符串在赋值和参数传递的开销很小，但是写时复制是不符合 C++11 标准的实现方式，而且写时复制（也就是变值函数（mutating function）和非常量引用）的开销同样大。

针对字符串在程序中存在的大量复制问题，C++11及之后的版本推出了“右值引用”和“移动语义”的概念，可以而且特别是在一些赋值和参数传递情况下减轻复制字符串带来的负担，提高性能，但在这篇博客中并不重点叙述“右值引用”和“移动语义”的概念。

---

# 字符串的常用性能优化方法

在介绍常用优化手段前，引入一个例子（之后的代码片段和性能数据都来自Optimized C++），这个函数的功能是从一个由 ASCII 字符组成的字符串中移除控制字符：

```c++
std::string remove_ctrl(std::string s)
{
    std::string result;
    for (int i = 0; i < s.length(); ++i)
    {
        if(s[i] >= 0x20)
            result = result + s[i];
    }
    return result;
}
```

## 使用复合赋值操作避免临时字符串

字符串连接运算符的开销是很大的。因为它会调用内存管理器去构建一个新的临时字符串对象来保存连接后的字符串。

如果传递给 remove_ctrl() 的参数是一个由可打印的字符组成的字符串，那么 remove_ctrl() 几乎会为 s 中的每个字符都构建一个临时字符串对象，这显然是不可接受的。

而使用复合赋值操作来避免临时字符串，是针对字符串两种最重要特性（动态分配和大量复制）的优化。

小小的改动移除了所有为分配临时字符串对象来保存连接结果而对内存管理器的调用，以及相关的复制和释放临时字符串的操作。
赋值时的分配和复制操作也可以被移除，不过这取决于字符串的实现方式（C++11实现了右值引用和移动语义，连接表达式的结果由于是一个右值，编译器可以调用 result 的移动构造函数，而无需调用复制构造函数，程序将会执行一次高效的指针复制）。

```c++
std::string remove_ctrl_mutating(std::string s)
{
    std::string result;
    for (int i = 0; i < s.length(); ++i)
    {
        if(s[i] >= 0x20)
            result += s[i];
    }
    return result;
}
```

## 通过预留存储空间减少内存的重新分配

针对字符串的动态分配特性，通过使用 std::string() 的 reserve() 成员函数预先分配足够的内存空间来优化 remove_ctrl_mutating()。使用reserve() 不仅移除了字符串缓冲区的重新分配，还改善了函数所读取的数据的缓存局部性（cache locality）。

```c++
std::string remove_ctrl_reserve(std::string s)
{
    std::string result;
    result.reserve(s.length);
    for (int i = 0; i < s.length(); ++i)
    {
        if(s[i] >= 0x20)
            result += s[i];
    }
    return result;
}
```

## 使用 pass by ref 消除对参数字符串的复制

通过值（即所谓的 pass-by-value）将一个字符串参数传递给一个不会修改该字符串的函数对一个严格的C++程序员来说是不可接受的。

如果该字符串实参是由表达式产生的（更准确地说它是右值），C++11编译器将会调用移动构造函数执行一次高效的指针复制，这还算好的情况；但如果实参是一个变量（更准确地说它是左值），那么将会调用字符串的拷贝构造函数，这会导致一次内存分配和复制。不要小看一次的内存分配和复制，随着传入字符串的长度增长，该函数的调用性能会越差。

在此处的例子中移除实参复制，使用 pass by reference 可以省去一次昂贵的内存分配和字符串内容的深拷贝。

```c++
std::string remove_ctrl_ref_args(const std::string& s)
{
    std::string result;
    result.reserve(s.length);
    for (int i = 0; i < s.length(); ++i)
    {
        if(s[i] >= 0x20)
            result += s[i];
    }
    return result;
}
```

将 s 从字符串修改为字符串引用后可能会因为其他因素（比如解引指针，C++中的引用变量实际是作为指针实现的，当程序中每次出现 s 时，都需要解引指针）抵消节省内存分配带来的性能提升，使得整体的性能较 remove_ctrl_reserve 还要差。

## 使用迭代器消除指针解引

字符串迭代器是指向字符缓冲区的简单指针。与不使用迭代器的代码 remove_ctrl_ref_args 相比，可以节省两次解引操作。

```c++
std::string remove_ctrl_ref_args_it(const std::string& s)
{
    std::string result;
    result.reserve(s.length);
    for (auto it = s.begin(); it != s.end(); ++it)
    {
        if(*it >= 0x20)
            result += *it;
    }
    return result;
}
```

为了了解使用 pass by reference 的 remove_ctrl_ref_args 的性能是否有改善，需要控制变量实现 remove_ctrl_reserve 的迭代器版本 remove_ctrl_reserve_it，测试比较 remove_ctrl_reserve_it 和 remove_ctrl_ref_args_it ，结果说明将参数类型修改为字符串引用确实提高了程序性能。

同时编写上述所有代码的迭代器版本与非迭代器版本进行比较，就现有例子的结果，使用迭代器的都比非迭代器的要快，但这个优化手段 **并不总是有效**。

## 消除对返回的字符串的复制

remove_ctrl() 是通过值返回处理结果的。C++编译器会调用复制构造函数将结果设置到调用上下文中。实际上编译器自身有可能进行C++返回值优化，即RVO，省去拷贝构造，尽管在大多数情况下能提高性能，但是却难以受程序员控制。
（此处不具体讨论RVO，详情参考[此链接](http://en.cppreference.com/w/cpp/language/copy_elision)）

想要确保不会发生复制，有一种比较简单的方式是将字符串作为输出参数返回，这种方法适用于所有的 C++ 版本以及字符串的所有实现方式。虽然性能有些许提升，但是该函数的接口并不直观，很容易导致调用方误用这个函数。

```c++
void remove_ctrl_ref_result_it(
    std::string& result,
    const std::string& s)
{
    result.clear();
    result.reserve(s.length);
    for (auto it = s.begin(); it != s.end(); ++it)
    {
        if(*it >= 0x20)
            result += *it;
    }
    return result;
}
```

## 舍弃 C++ 特性，使用 C 风格字符数组

remove_ctrl_cstrings() 这种转换为C风格字符数组的优化方式成本较高（常用于一些高性能服务和严格的嵌入式环境），而且很不C++。但尽管如此，remove_ctrl_cstrings() 仍然说明：只要开发人员愿意用C风格字符数组完全重写关于字符串的函数和接口，就可以获得很大的性能提升。

```c++
void remove_ctrl_cstrings(char* dst, const char* src, size_t size)
{
    for (size_t i = 0; i < size; ++i)
    {
        if (src[i] >= 0x20)
            *dst++ = src[i];
    }
    *dst = 0;
}
```

---

# 字符串的其他性能优化方法

## 使用更好的算法

算法优化是各种优化手段中的第一选择。

在没有选择较优算法的情形下过早优化其实是吃力不讨好的。好的算法可能在第一次编写代码时就获得远比坏算法优化迭代多次的结果还要好的性能，而且上述的常用优化手段也能应用到好的新算法中，进一步提升性能。

```c++
std::string remove_ctrl_block_append(std::string s)
{
    std::string result;
    result.reserve(s.length());
    for (size_t b = 0, i = b; b < s.length(); b = i+1)
    {
        for (i = b; i < s.length(); ++i)
        {
            if (s[i] < 0x20) break;
        }
        // substr() 仍然生成临时字符串。
        // 由于这个函数将字符添加到了 result 的末尾，
        // 开发人员可以通过重载 std::string 的 append() 成员函数
        // 来复制子字符串，且无需创建临时字符串。
        // result = result + s.substr(b, i-b);
        result.append(s, b, i-b);
    }
    return result;
}
```

## 使用更好的编译器和字符串库

C++只规定了标准，各个编译器内部的具体实现各式各样。因此一个好的编译器能做到更多的自我优化。

std::string 的定义曾经非常模糊，这让开发人员在实现字符串时有更广泛的选择。后来，对性能和可预测性的需求最终迫使 C++ 标准明确了它的定义，导致很多新奇的实现方式不再适用。比如 C++ 标准要求迭代器能够随机访问，而且禁止写时复制语义，这样更容易定义 std::string，而且更容易推论出哪些操作会使 std::string 中正在使用的迭代器无效，这也推动 std::string 的实现趋于简单。

就我个人而言，标准 C++ 字符串库已经够用了（尽管缺少了一些字符集的转换函数）。标准 C++ 中共有几种字符串实现方式：

- 模板化的、支持迭代器访问的、可变长度的std::string 字符串
- 简单的、基于迭代器的 std::vector<char>
- 老式的、C 风格的以空字符结尾的、固定长度的字符数组
- std::stringstream 。std::stringstream 类以一种不同的方式封装了一块动态大小的缓冲区（通常就是一个 std::string），数据可以被添加至这个实体中。由于被修改为了一个实体，很长的插入表达式不会创建任何临时字符串，因此不会发生内存分配和复制操作。如果 std::stringstream 是用 std::string 实现的，那么它在性能上永远不能胜过 std::string，但好在可以防止某些降低程序性能的编程实践。
- 通过移除一个或多个限制（迭代器、索引、C 风格访问、简单性），自定义的字符串类可以优化那些因使用了 std::string 而无法优化的代码。（尽量在设计初期就确定）
- string_view 可以解决 std::string 的某些问题。它包含一个指向字符串数据的无主指针和一个表示字符串长度的值，所以它可以表示为 std::string 或字面字符串的子字符串。与 std::string 相比，它的 substring 和 trim 等操作更高效，但问题在于无主指针，程序员必须确保每个 string_view 的生命周期都不会比它所指向的 std::string 的生命周期长。

## 使用更好的内存分配器

每个 std::string 的内部都是一个动态分配的字符数组。std::string 可以看成是如下通用模板的一种特化：

```c++
namespace std {
template <class charT,
          class traits = char_traits<charT>,
          class Alloc = allocator<charT>>
class basic_string;

typedef basic_string<char> string;
...
};
```

第三个模板参数 Alloc 定义了一个分配器——一个访问 C++ 内存管理器的专用接口。默认情况下，Alloc 是 std::allocator，它会调用 operator new() 和operator delete()——两个全局的 C++ 内存分配器函数。

operator new() 和 operator delete() 实际很复杂，为了实现各种情形下良好的通用性，它们在设计上做出了一些妥协。因此在一些特定场景中自定义一种更加特化的分配器可能会更好地提升性能。但就我这个C++菜鸡而言，我肯定是使用默认的allocator，不会去编写自己的内存分配器。

## 消除字符串无谓转换和不同字符集间的转换

一些场景下 char* 转换为 std::string 是无谓的。std::string 有一个参数为 char* 的构造函数，因此当返回值被赋值给一个字符串或是作为参数传递给另外一个函数时，会自动进行转换。也就是说将返回值的转换推迟至它真正被使用的时候。如下：

```c++
char const* MyClass::Name() const
{
    return "MyClass";
}
char const* p = myInstance->Name(); // 没有转换
std::string s = myInstance->Name(); // 转换为'std::string'
std::cout << myInstance->Name();    // 没有转换
```

在多字符集的场景下，不同字符集间的频繁转换也是性能优化的一个热点，移除不同字符集间转换的最佳方法是为所有的字符串选择一种固定的格式，并将所有字符串都存储为这种格式。个人而言首推 UTF-8格式（windows万恶的GBK），因为它能够表示所有的 Unicode 码点，并可以直接与 C 风格的字符串进行比较（是否相同）。

> PS: 下一篇C++优化的主题内容应该是关于标准库算法的，特别是查找和排序的优化。