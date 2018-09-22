---
title: The Note1 of Effective C++
date: 2017-01-26 15:24:56
categories: [Cpp]
tags: [tech, Cpp, note]
---

之前买了这本书后只是草草翻过，这半个多月以来，断断续续把这本书从头到尾看了一遍，虽然其中的一些条款内容早就熟记于心，但难免还有晦涩之处，所以打算在过年空闲期间把整本书的每个条款的重点进行系统的整理。
不得不说 C++ 是门不好学的语言，自认为也没那么聪明，整理总结对我来说不失为一个深入学习的好方法。

<!-- more -->

> Tips : 我会在 C++11/14 标准的基础上作笔记 (Effective C++, 3rd Edition 中的内容并不是按照 C++11/14 标准）

# Accustoming Yourself to C++ 

## Item 1 : 视C++为一个语言联邦
> View C++ as a federation of languages

C++ 是个多重范式编程语言，同时支持：
- 过程形式（procedural）
- 面向对象形式（objecr-oriented）
- 函数形式（functional）
- 泛型形式（generic）
- 元编程形式（metaprogramming）

将 C++ 视为一个语言联邦而非单一语言，可以更易理解。在其某个次语言中（sublanguage）中，各守则与通例都倾向简单、直观易懂，并且容易记住。

C++ 主要的次语言，有四个：
- **C**：C++ 以 C 为基础，这没什么好说的。

- **Object-Oriented C++**：无非就是 classes（包括构造函数和析构函数）、封装（encapsulation）、
继承（inheritance）、多态（polymorphic）、virtual函数（动态绑定）... 这一部分应该是所有面向对象语言的基础。

- **Template C++**：C++ 的泛型编程部分，template 威力强大，
也带来了崭新的编程范式，也就是所谓的 template metaprogramming （TMP，模板元编程），TMP相关规则很少与 C++ 主流编程互相影响。
最基本的 TMP 应该就是求阶乘，这会在后面的专题中讲到。

- **STL**：顾名思义，C++ 的标准模板库，对 容器（container）、迭代器（iterator）、算法（algorithm）以及函数对象（function object）
的规约有极佳的紧密配合与协调。

**请记住**
> - **C++ 高效编程守则视状况而变换，取决于使用 C++ 的哪一部分。**

---

## Item 2 : 尽量以 const, enum, inline 替换 #define
> Prefer const, enum, and inline to #define

### 以 const 替换 #define

`#define` 不被视为需要编译语言的一部分，它是被交给预处理器处理的。如果某个宏比如 `#define MAGIC_NUM 123` 被定义在非自己所写的头文件中，那么很可能在编译出错获得编译错误信息时，对出现的 `123` 而不是 `MAGIC_NUM` 这么一个数据的出现感到莫名其妙。

但如果将其声明为一个 `const` 常量 `const int magic_num = 123` 或者 此处也可声明为一个常量表达式 `constexpr int magic_num  = 123` （注：`constexpr` 是 C++11 标准中引入的，指值不会改变并且在编译过程就能得到计算结果的表达式，显然字面值属于常量表达式），作为一个语言常量，就肯定会被编译器看到。

~~至于对浮点常量而言，使用常量可能比使用 `#define` 导致较小量的码 这种情况我觉得作用不大，就不用记住了。（所谓的较小量的码指的是预处理器盲目地将宏名称 `MAGIC_NUM` 替换为 `123` 可能导致目标码出现多份 `123`，而改用常量则不会出现这种情况）~~

这里还要说下以常量 `const` 替换 `#define` 的两种特殊情况：
- 定义常量指针（constant pointers），由于常量定义式通常被放在头文件内，因此有必要将指针声明为 `const`。

- 定义 class 专属常量，为将常量作用域限制在 class 内，必须让其成为 class 的一个成员（member），而为确保此常量至多只有一份实体，必须让其成为一个 `static` 成员， 例如 `static  const int value  = 1;`。
此处是 `value` 的声明式而非定义式，通常 C++ 要求对使用的任何东西提供一个定义式，但如果它是个 class 专属常量（`const`）又是 `static` 且为整数类型（例如 `int`， `char`，`bool`），则需**特别处理：只要不取其地址，可以只声明并使用它而无需提供定义式**。
> 而 `#define` 并不重视作用域，也就无法创建一个 class 专属常量，也不能提供任何封装性，而 `const` 成员变量可以被封装。

### 以 enum 替换 #define

这一部分是接着上面的 **class 专属常量** 展开叙述的。

所谓的 **`in-class` 初值设定只允许对整数常量（例如int、char、bool）进行**。即下面的代码是**无法通过编译**的

```c++
class Test
{
private:
    static const double value = 0.5;    // 无法通过编译
};
```

不过有些旧式编译器（我电脑上的都能编译通过）（错误地）不允许 “`static` 整数型 class 常量” 完成 “`in-class` 初值设定”，可改用所谓的 “**`the enum hack`**” 补偿做法。原因是：**一个属于枚举类型（enumerated type）的数值可权充 `int` 被使用**，即如下
    
```c++
class Test
{
private:
    // 可权充 static const int value = 1;
    enum { value =  1};
};
```

除了编译器层面上的理由外，认识 `enum hack` 还有两个理由：

1. 这个理由看看就行，平常也用不太到。`enum hack` 的行为某方面说比较像 `#define` 而不像 `const`，但有时这也是我们想要的。例如不想让别人获得一个 pointer 或 reference 指向某个整数常量，`enum` 可以帮助实现这个约束，因为取一个 `enum` 的地址是不合法的，而取一个 `#define` 的地址通常也不合法，但取一个 `const` 的地址是合法的。此外，不够优秀的编译器可能会为 “整数型 `const` 对象” 设定另外的存储空间，但 `enum` 和 `#define` 一样绝不会导致非必要的内存分配。
 
2. 纯粹是为了实用主义，因为许多代码中用到了它，所以也就必须要了解其含义。事实上，`enum hack` 是 `TMP`（模板元编程）的基础技术，但我自己本身更喜欢直接用 `static const int ` 之类的 `in-class` 初值设定（谁会用连这个都编译不通过的编译器啊）。
    
例如，下面的代码是最简单的 `TMP` 代码之一（实现阶乘），不理解 `TMP` 的看看就好
    
```c++
template<unsigned n>
struct Factorial
{
    enum { value = n * Factorial<n-1>::value };
    // static const int value = n * Factorial<n-1>::value;
};

template<>
struct Factorial<0>
{
    enum { value = 1 };
    // static const int value = 1;
};
```

### 以 inline 替换 #define

用 `#define` 实现宏（macros）是一种常见的做法，宏看起来像函数，但不会有函数调用（function call）带来的额外开销。
例如 
```c++
// 以 a 和 b 的较大值调用 f
#define CALL_WITH_MAX(a,b) f( (a) > (b) ? (a) : (b) )
```

书中说以 `#define` 实现宏是误用情况，我不这么认为，至少现在绝大多数的单元测试代码中都包含大量 `#define` 实现的宏，前提是正确的使用。
如上述 `CALL_WITH_MAX` 这般长相的宏的确存在的太多缺点：

- 写出这种宏时记住必须要为 宏中所有实参 加上小括号，否则在某些表达式调用这个宏时会得不到想要的结果。（这部分学过C++的应该都知道，就不细说了）
- 但纵使为所有实参加上小括号，也会出现意料之外的事，比如
    ```c++
    int a = 5, b = 0;
    // (++a) > (b) ? (++a) : (b) 
    CALL_WITH_MAX(++a, b);      // a 被累加二次
    // (++a) > (b+10) ? (++a) : (b+10)
    CALL_WITH_MAX(++a, b+10);   // a 被累加一次
    ```
    此处调用 `f` 之前，`a` 的递增次数竟然取决于 “它被拿来和谁比较”，你说这种情况还不令人恶心么？

因此 C++ 引入了 `inline` ，不仅获得了宏带来的效率，还有一般函数的所有可预料行为和类型安全性（type safety）。
    
上面的宏就可改写为一个 `template inline ` 函数：
```c++
template<typename T>
inline void call_with_max(const T& a, const T& b)
{
    f(a > b ? a : b);
}
```
此外，由于 `call_with_max` 是个真正的函数，它遵守作用域和访问规则。


**请记住**
> - **对于单纯常量，最好以 const 对象或 enum 替换 #define**
> - **对于形似函数的宏（macros），最好改用 inline 函数替换 #define**
> - 有了 const、enum、inline，对预编译器（特别是#define）的需求降低了，但并非完全消除。

---

## Item 3 : 尽可能使用 const
> Use const whenever possible

### C++ 对常量性的定义

只要某个值不变，就该明确定义为 `const`，因为说出来可以获得编译器的帮助，确保约束不被违反。

可以用它在 `classes` 外部修饰 `global` 或 `namespace` 作用域的常量，或修饰文件、函数、或区块作用域中被声明为 `static` 的对象。
也可以用它修饰 `classes` 内部的 `static` 和 `non-static` 成员变量。
面对指针时，也可以指出指针本身、指针所有物、或两者都（或都不）是 `const`，如下：
```c++
char array[] = "Hello World";
char* p = array;                // non-const pointer, non-const data
const char* p = array;          // non-const pointer, const data
char* const p = array;          // const pointer, non-const data
const char* const p = array;    // const pointer, const data
```
虽说绝大部分 C++ 开发者肯定都应该知道这一点， 但我还是决定在此写一遍：`const` 出现在 `*` 号左边，表示被指物是常量；出现在 `*` 号右边，表示指针本身是常量；出现在 `*` 号两边，表示被指物和指针都是常量。

此外，还要提及两种 被指物是常量的 编写习惯：
```c++
// 我相信大多数人都应该会跟我一样，更习惯第一种的编写
void f1(const T* p);
void f2(T const * p);
```
`STL` 迭代器类似于指针，因为其本身就是为了模仿指针的作用，但要注意的一点是：若希望迭代器所指的东西不可改动，应该需要的是 `const_iterator` （即模仿一个 `const T*` 指针）。

### const 成员函数

成员函数是 `const` 意味着什么（怎么听起来这么哲♂学呢）？

`const` 实施于成员函数是为了确认该成员函数可作用于 `const` 对象，使得“操作 `const` 对象”成为可能。 

书中提及的两个概念 `bitwise constness` 和 `logical constness`（这两个名词是我之前没有听说过的，不知道其他人的情况，但有关内容我是了解的，姑且在此整理一番）
- **`bitwise constness`**

    此阵营认为：成员函数只有在不更改对象的任何成员变量（`static` 除外）时才可说是 `const`。这正是 C++ 对常量性（constness）的定义，因此 `const` 成员函数不可以更改对象内任何 `non-static` 成员变量。
    
    不幸的是许多成员函数虽不完全具备 `const` 性质却能通过 `bitwise` 测试，更具体地说，一个更改了 “指针所有物” 的成员函数虽然不能算是 `const`，但如果只有指针（而非其所指物）隶属于对象，那么称此函数为 `bitwise constness` 不会引发编译器异议。套用书中例子：

    ```c++
    class CTextBlock
    {
    public:
        ...
        // bitwise const 声明，但不恰当
        char& operator [] (std::size_t pos) const
        { return pText[pos]; }
    private:
        char* pText;
    };

    // ===================================
    const CTextBlock cctb("Hello");     // 声明常量对象
    char* pc = &cctb[0];                // 调用 const operator[] 取得一个指针
    *pc = 'J';
    ```
    上述代码尽管创建了一个常量对象并设以某值，而且只对它调用 `const` 成员函数，但终究还是改变了它的值。

- **`logical constness`**
    
    此阵营认为：一个 `const` 成员函数可以修改其所处理对象内的某些 `bit` ，但只有在客户端侦测不出的情况下才得如此。

    若数据被修改对 `const` 对象而言虽可接受，而编译器不同意，但却想要坚持 `bitwise constness`，可以通过关键字 `mutable` 释放掉 `non-static` 成员变量的 `bitwise constness` 约束。更通俗点说，在一个成员函数内不能改变 `non-static` 数据成员的值，而将数据成员加上 `mutable`，就能做到改变。


### 在 const 和 non-const 成员函数中避免重复

套用书中的 重载下标运算符 `[]` 的例子。

若一个类包含下标运算符，通常会定义两个版本：一个返回普通引用，另一个是类的常量成员并返回常量引用。当该下标运算符作用于常量对象时，会对应调用返回常量引用的那个重载运算符函数以确保不会给返回的对象赋值。

但一般来说重载下标运算符函数内的代码不多，我平常也就直接 `Ctrl-C` 和 `Ctrl-V` 一下，但如果像书中的例子，重载运算符 `[]` 的函数内还存在许多其他操作，那么适量地复用代码就显然可以缩短编译时间，减少代码膨胀等带来的维护难问题。

复用代码前：
```c++
// 此处为了代码紧凑，直接将函数内容写在了类内，请忽略此处可能形成的 超长隐式的 `inline` 函数问题
// 虽说好的编译器会帮助你优化这点（逃
class TextBlock
{
public:
    ...
    const char& operator [] (std::size_t pos) const
    {
        ...                 // 边界检查（bound checking）
        ...                 // 记录数据访问（log access data）
        ...                 // 检验数据完整性（verify data integrity）
        return text[pos];
    }
    char& operator [] (std::size_t pos)
    {
        ...                 // 边界检查（bound checking）
        ...                 // 记录数据访问（log access data）
        ...                 // 检验数据完整性（verify data integrity）
        return text[pos];
    }
private:
    std::string text;
};
```

复用代码后：
```c++
class TextBlock
{
public:
    ...
    const char& operator [] (std::size_t pos) const
    {
        ...                 // 边界检查（bound checking）
        ...                 // 记录数据访问（log access data）
        ...                 // 检验数据完整性（verify data integrity）
        return text[pos];
    }
    char& operator [] (std::size_t pos)
    {
        return const_cast<char&>(                   // 将operator[]返回值的const转除
            static_cast<const TextBlock&>(*this)    // 为 *this 加上 const
                [pos]                               // 调用 const operator[]
        );
    }
...
};
```

一般而言，转型（casting）的确不是个好选择，但显然代码重复也不是什么好鸟【那些为了可读性的代码重复除外】。

上述例子中，`const` 版本已经完全做掉了 `non-const` 版本的任务，唯一不同是其返回类型多了 `const` 修饰，在这种情况下将返回值的 `const` 转除并以此实现 `non-const` 版本是安全的，因为不论谁调用 `non-const operator []` 都一定要先有个 `non-const` 对象，否则显然不能调用 `non-const` 函数。【可以反过来思考下令 `const` 版本调用 `non-const` 版本的可能性，下面会进行解释说明】

`non-const operator []` 内部若直接单纯调用 `operator []`，会递归调用自己，所以显然必须明确指出调用的是 `const operator []`。

这里用了两次转型：
- 第一次：用来为 `*this` 添加 `const` （使接下来调用 `operator []` 时得以调用 `const`），将 `*this` 从其原始类型 `TextBlock&` 强制转型为 `const TextBlock&`，将 `non-const` 对象强制转型为 `const` 对象，使用 `static_cast`。
- 第二次：是从 `const operator []` 的返回值中移除 `const`，移除 `const` 的转型动作在 C++ 中只能通过 `const_cast` 完成。

虽然这样的语法形式会比较难看，但是这种技术还是值得了解的。而更应该值得了解的是 **不应该去做其反向做法（令 `const` 版本调用 `non-const` 版本）**，因为 `const` 成员函数承诺绝不改变其对象的逻辑状态（改成 `non-const` 属于改变逻辑状态），而 `non-const` 成员函数则没有这般承诺，它本来就可以对其对象做任何动作，所以在其中调用一个 `const` 成员函数并不会带来风险。

**请记住**
> - 将某些东西声明为 `const` 可帮助编译器侦测出错误用法。`const` 可被施加于任何作用域内的对象、函数参数、函数返回类型、成员函数本体。
> - 【这条感觉特别玄学...】编译器强制实施 bitwise constness，但**编写程序时应该使用 “概念上的常量性” （conceptual constness）**。
> - 当 `const` 和 `non-const` 成员函数有着实质等价的实现时，**令 `non-const` 版本调用 `const` 版本可避免代码重复**。

---

## Item 4 : 确定对象被使用前已先初始化 
> Make sure that objects are initialized before they're used

显然读取未初始化的值会导致不明确的行为，而 C++ 中关于对象初始化何时发生的规则很复杂，所以最佳的处理办法便是：**永远在使用对象之前先将它初始化**。

### 初始化的常见部分

- 对于**无任何成员的内置类型**，必须手工完成此事。例如 `int x = 0;`
- 对于**内置类型外**的任何其他东西，初始化的责任在于构造函数，即确保每一个构造函数都将对象的每一个成员初始化。
    > `注意：` 不要混淆赋值（assignment）和初始化（initialization），C++ 规定对象的成员变量的初始化动作发生在进入构造函数本体之前，较佳做法便是 **使用成员初始化列表（member initialization list）**，其实成员初始化列表的本质是做 `copy` 构造。
    对大多数类型而言，比起先调用 `default` 构造函数再调用 `copy assignment` 操作符，单只调用一次 `copy` 构造函数显然是更高效的。而对于内置型对象来说，其初始化和赋值成本相同，但为了强迫症的一致性（还有一些内置型对象必须被初始化的缘故，例如对象是 `const` 或 `reference`），所以最好也是最简单的做法就是：**总是使用成员初始化列表来初始化**。

相比 C++ 对象初始化何时发生的情况，C++ 的**成员初始化次序**就显得十分固定而简单了：**`base classes` 更早于其 `derived classes` 被初始化，而 `class` 的成员变量总是以其声明的次序被初始化**，所以**当在成员初始化列表中列出各个成员时，最好总是以其在 `class` 中的声明次序为次序**。【虽说不按次序也是合法的，但有可能会发生一些稀奇古怪的错误，你自己决定吧→_→】

### 初始化的特殊部分

好，现在初始化部分就只剩最后一件事需要关心了，这样看条理是不是比较清晰...【也可能不清晰？

不同编译单元内定义的 `non-local static` 对象的初始化，说实话，我之前根本没有想过这部分与一般初始化的区别，所以整理的不好别见怪。【还好这里书中用到的解决办法是大多数人熟悉的一种设计模式--单例模式（`Singleton` 模式）

函数内的 `static` 对象称为 `local static` 对象，其他 `static` 对象称为 `non-local static` 对象，而编译单元（translation unit）是指产出单一目标文件的那些源码。

这里的问题是涉及至少两个源码文件，每一个内含至少一个 `non-local static` 对象。因为 C++ 对 **“定义在不同编译单元内的 `non-local static` 对象” 的初始化次序并无明确定义**， 所以可能出现一种情况：**某个编译单元内的某个 `non-local static` 对象的初始化使用了另一个编译单元内的某个 `non-local static` 对象，而被使用到的这个对象可能尚未被初始化**。
> 可能你会要问 C++ 对此没有明确定义的原因，书中给出了：那就是决定其初始化次序相当困难，甚至根本无解。最常见的形式：多个编译单元的 `non-local static` 对象经由“模板隐式实例化（implicit template instantiation）” 形成，而后者自己可能也是经由“模板隐式实例化”形成的，不但不可能决定正确的初始化次序，甚至往往不值得去做。

套用书中的实例
```c++
class FileSystem    // 你的程序库
{
public:
    ...
    std::size_t numDisks() const;
    ...
};
extern FileSystem tfs;

class Directory     // 由程序库客户建立
{
public:
    Directory( params );
    ...
};
Directory::Directory( params )
{
    ...
    std::size_t disks = tfs.numDisks();  // 用到了tfs对象
    ...
}
```
假设客户决定创建一个 `Directory` 目录对象用来放置临时文件，即
```c++
Directory tempDir( params );
```
显然，除非 `tfs` 在 `tempDir` 之前被初始化，否则 `tempDir` 的构造函数会用到尚未初始化的 `tfs`，而 `tfs` 和 `tempDir` 是不同人建立在不同的源码文件上的，即定义于不同编译单元内的 `non-local static` 对象。

**解决办法**就像先前提到的，即实现 `Singleton` 模式：将每个 `non-local static` 对象搬到自己的专属函数内（该对象在此函数内被声明为 `static`），这些函数返回一个 `reference` 指向它所含的对象。也就是使用函数返回的 “指向 `static` 对象” 的 `reference`，而不再使用 `static` 对象本身。
```c++
class FileSystem { ... };
FileSystem& tfs()       // 这个函数用来替换 tfs 对象
{
    static FileSystem fs;
    return fs;
}

class Directory { ... };
Directory::Directory( params )
{
    ...
    std::size_t disks = tfs().numDisks();
    ...
}
Directory& tempDir()    // 这个函数用来替换 tempDir 对象
{
    static Directory td;
    return td;
}
```
因为 **C++ 保证函数内的 `local static` 对象会在“该函数被调用期间”“首次遇上该对象的定义式”时被初始化**，所以如果用函数调用（返回一个 `reference` 指向 `local static` 对象）替换“直接访问 `non-local static` 对象”，就能保证获得的那个 `reference` 将指向一个历经初始化的对象。
更棒的是，如果未调用 `non-local static` 对象的“仿真函数”，就绝不会引发构造和析构的成本。

> 【这部分仅作了解，毕竟此处重点并不是多线程问题】但从另一个角度说，内含 `static` 对象的函数在多线程系统中带有不确定性，更具体地说，任何一种 `non-const static` 对象，不论是 `local` 或 `non-local`，在多线程环境下都会有麻烦。解决此麻烦的一种做法是：在程序的单线程启动阶段手工调用所有 `reference-returning` 函数，消除与初始化有关的“竞速形势（race conditions）”。


**请记住**
> - **为内置型对象进行手工初始化，因为C++不保证初始化它们。**
> - **构造函数最好使用成员初始化列表（member initialization list）**，而不要在构造函数本体内使用赋值操作（assignment）。**初始化列表的成员变量，其排列次序应该和它们在 class 中的声明次序相同。**
> - 为免除**“跨编译单元之初始化次序”**问题，请**以 local static 对象替换 non-local static 对象**。

---

<!-- 
# Resourse Management

## Item 13 : 以对象管理资源
> Use objects to manage resourses

## Item 14 : 在资源管理类中小心 copying 行为
> Think carefully about copying behavior in resourse-managing classes

## Item 15 : 在资源管理类中提供对原始资源的访问
> Provide access to raw resourse in resourse-managing classes

## Item 16 : 成对使用 new 和 delete 时要采取相同形式
> Use the same form in corresponding uses of new and delete

## Item 17 : 以独立语句将 newed 对象置入智能指针
> Store newed objects in smart pointers in standalone statements


---


# Designs and Declarations

## Item 18 : 让接口容易被正确使用，不易被误用
> Make interfaces easy to use correctly and hard to use incorrectly

## Item 19 : 设计 class 犹如设计 type
> Treat class design as type design 

## Item 20 : 宁以 pass-by-reference-to-const 替换 pass-by-value
> Prefer pass-by-reference-to-const to pass-by-value

## Item 21 : 必须返回对象时，别妄想返回其 reference
> Don't try to return a reference when you must return an object

## Item 22 : 将成员变量声明为 private
> Declare data members private

## Item 23 : 宁以 non-member、non-friend 替换 member 函数
> Prefer non-member non-friend functions to member functions 

## Item 24 : 若所有参数皆需类型转换，请为此采用 non-member 函数
> Declare non-member functions when type conversions should apply to all parameter

## Item 25 : 考虑写一个不抛出异常的 swap 函数
> Consider support for a non-throwing swap

---

# Implementations

## Item 26 : 尽可能延后变量定义式的出现时间
> Postpone variable definitions as long as possible

## Item 27 : 尽量少做转型动作
> Minimize casting 

## Item 28 : 避免返回 handler 指向对象内部成分
> Avoid returning "handles" to object internals

## Item 29 : 为“异常安全”而努力是值得的
> Strive for exception-safe code

## Item 30 : 透彻了解 inlining 的里里外外
> Understand the ins and outs of inlining

## Item 31 : 将文件间的编译依存关系降至最低
> Minimize compilation dependencies between files


---

# Inheritance and Object-Oriented Designs

## Item 32 : 确定 public 继承构造出 **is-a** 关系
> Make sure public inheritance models "is-a"

## Item 33 : 避免遮掩继承而来的名称
> Avoid hiding inherited names

## Item 34 : 区分接口继承和实现继承
> Differentiate between inheritance of interface and inheritance of Implementation

## Item 35 : 考虑 virtual 函数以外的其他选择
> Consider alternatives to virtual function

## Item 36 : 绝不重新定义继承而来的 non-virtual 函数
> Never redefine an inherited non-virtual function

## Item 37 : 绝不重新定义继承而来的缺省参数值
> Never redefine a function's inherited default parameter value

## Item 38 : 通过复合构造出 **has-a** 或 “根据某物实现出”
> Model "has-a" or "is-implemented-in-terms-of" through composition

## Item 39 : 明智而审慎地使用 private 继承
> Use private inheritance judiciously

## Item 40 : 明智而审慎地使用多重继承
> Use multiple inheritance judiciously

---

# Templates and Generic Progamming 

## Item 41 : 了解隐式接口和编译期多态
> Understand implicit interfaces and compile-time polymorphism

## Item 42 : 了解 typename 的双重意义
> Understand the two meanings of typename

## Item 43 : 学习处理模板化基类内的名称
> Know how to access names in templatized base classes

## Item 44 : 将与参数无关的代码抽离 templates
> Factor parameter-indenpendent code out of templates

## Item 45 : 运用成员函数模板接受所有兼容类型
> Use member function templates to accept "all compatible types"

## Item 46 : 需要类型转化时请为模板定义非成员函数
> Define non-member functions inside templates when type conversions are desired

## Item 47 : 请使用 traits classes 表现类型信息
> Use traits classes for information about types

## Item 48 : 认识 template 元编程
> Be aware of "template metaprogramming (TMP)"

---

-->
