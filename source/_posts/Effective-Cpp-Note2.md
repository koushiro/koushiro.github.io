---
title: The Note2 of Effective C++
date: 2017-02-03 12:40:57
categories: [C++]
tags: [tech, C++, note]
---

过年好像并没有想象的这么闲，无聊又麻烦的事情比较多【这也是我过年期间中的daikirai】，所以第二部分的整理来的有些迟，这一部分的 Items 相比第一部分要短小简洁，而且这部分 Items 中对我来说绝大多数都是较熟悉的【毕竟构造和析构这种东西写的太多了】，除了 Item 8 ，可能是实际中异常我用的比较少。总之，Let's do it !

<!-- more -->

> Tips : 我会在 C++11/14 标准的基础上作笔记 (Effective C++, 3rd Edition 中的内容并不是按照 C++11/14 标准）

# Constructor, Destructor, and Assignment Operator

## Item 5 : 了解C++默默编写并调用哪些函数 
> Know what functions C++ silently writes and calls

在一个空类中，若没有自定义 **类内特殊成员函数（ `default constructor`、`copy constructor`、`copy assignment operator`、`destructor`）** 的声明，则编译器就会为其对应地声明（编译器版本）一个，所有这些编译器自动生成的函数都是 `public` 且 `inline`。
例如：
```c++
class Empty {  };
```
就像写下了这样的代码：
```c++
class Empty
{
public:
    Empty()  {...}                              // default constructor 
    Empty(const Empty& rhs) { ... }             // copy constructor
    Empty& operator=(const Empty& rhs) { ... }  // copy assignment operator
    ~Empty() { ... }                            // destructor
};
// ==============================================
int main()
{
    Empty e1;       // call default constructor
    Empty e2(e1);   // call copy constructor
    e2 = e1;        // call copy assignment operator
    return 0;       // call destructor
}
```

**注意**

1. 只有当这些函数被需要（即被调用）时，才会被编译器创建出来。
2. 编译器产出的 `destructor` 是个 `non-virtual`，除非该 `class` 的 `base class` 自身声明有 `virtual destructor`。
3. 至于编译器创建的 `copy constructor` 和 `copy assignment operator` 只是单纯地将来源对象的每一个 `non-static` 成员变量拷贝到目标对象。
4. 编译器拒绝为 class 生出 `operator=` 的情况：
    - 打算在一个 “内含 `reference` 成员” 的 class 内支持赋值操作（assignment），必须自定义 `copy assignment operator`
    - 面对 “内含 `const` 成员” 的 class，编译器反应一样
    - 若某个 `base class` 将 `copy assignment operator` 声明为 `private`，则编译器拒绝为其 `derived class` 生成一个 `copy assignment operator`

在此，我给出自己的建议，那就是：**不论是要使用编译器默认生成的,还是自定义的，一律都显式地写出**。一致的规则难道不是更好记么？【当然非必要的情况不要提供 `default constructor`（具体见 *More Effective C++,Item 4*），具体来说 凡是可以“从无到有生成对象”的 `classes` 都应该内含 `default constructor`，而“必须有某些外来信息才能生成对象”的 `classes` 则不必拥有 `default constructor`，因为这类 `classes` 没有获得外来信息产生的对象显然毫无意义】

此外，C++11 标准还引进了 **`defaulted function`** ，`defaulted function` 特性 **仅适用于类的特殊成员函数**，即 **可以显式地写出编译器自动生成的版本**，而且 `defaulted function` 既可以在类体内定义，也可以在类体外定义。
比如上述代码可改为：
```c++
class Empty
{
public:
    Empty() = default;                       
    Empty(const Empty& rhs) = default;
    Empty& operator=(const Empty& rhs) = default;
    ~Empty() = default;
};
```

**请记住**
> - **编译器可以自己为 `class` 创建 `default constructor`、`copy constructor`、`copy assignment operator`，以及 `destructor`**。

---

## Item 6 : 若不想使用编译器自动生成的函数，就该明确拒绝 
> Explicitly disallow the use of compiler-generated functions you do not want

有些东西是先天独一无二的，而能对这些对象进行拷贝显然是我们不乐意看到的。

通常不希望 class 支持某一特定功能，只要不声明对应函数就行。但这个策略对 `copy constructor` 和 `copy assignment operator` 却不起作用，因为尽管不声明它们，编译器也会暗自为我们声明。

那怎么办呢，在 C++11 标准以前，阻止拷贝较受欢迎的做法便是：**将这类独一无二的对象的 `copy constructor` 和 `copy assignment operator` 声明为 `private` 但不定义它们** 。
```c++
class UniqueObject
{
public:
    ...
private:
    ...
    UniqueObject(const UniqueObject&);      // 只有声明
    UniqueObject& operator=(const UniqueObject&);
}
```

因为通过明确声明成员函数可以阻止编译器暗自创建其专属版本，而令这些函数为 `private` 可以阻止开发人员调用它，但只做到此显然并不绝对安全，因为 成员函数 和 友元函数 还能调用同一个类中的 `private` 函数。在此之上，还必须要不定义它们，以便有人不慎调用任何一个，链接器能返回一个链接错误（linkage error）。

而在 C++11 标准引入了 `deleted function` 之后，解决方法就显得简单多了：
```c++
class UniqueObject
{
public:
    ...
    UniqueObject(const UniqueObject&) = delete;
    UniqueObject& operator=(const UniqueObject&) = delete;
}
```

### `deleted function` 的注意事项
1. `=delete` 和 `=default` 不同，必须出现在函数第一次声明时。
2. 可以对任何函数指定 `=delete`，但主要用途还是禁止拷贝控制成员。
3. 不能将 `destructor` 指定为 `=delete`。 
4. 编译器合成的拷贝控制成员也可能是 `deleted`。


**请记住**
> - C++11标准前：为驳回编译器自动提供的功能（更具体说是为了阻止拷贝），可将相应的成员函数（即 `copy constructor` 和 `copy assignment operator`）声明为 `private` 并且不予实现。
> - C++11标准后：通过将 `copy constructor` 和 `copy assignment operator` 指定 `=delete` 即可禁止拷贝。 

---

## Item 7 : 为多态基类声明virtual析构函数 
> Declare destructors virtual in polymorphic base classes

C++ 明白指出：当 `derived class` 对象经由一个 `base class` 指针被删除，而该 `base class` 带着一个 `non-virtual` 析构函数，其结果是**未定义的**——实际执行时通常发生的是 **对象的 `base class` 成分被销毁**，然而其 **`derived` 成分没被销毁**，造成一个 “局部销毁” 对象。

举个例子【我知道这例子很做作，也请先不要理会手工delete这件事，看看就好→_→】：
```c++
class Animal
{
public:
    Animal();
    ~Animal();      // 解决办法：virtual ~Animal();
    ...
};
class Cat : public Animal { ... };
class Rat : public Animal { ... };
// ================================
Cat tom;
Animal* pA = &tom;
...
delete pA;
```

解决办法很简单：给 `base class` 一个 `virtual` 析构函数，**因为 `virtual` 函数的目的就是允许 `derived class` 的实现得以客制化**。

**注意**：

“给 `base class` 一个 `virtual` 析构函数” 这个规则 只适用于 `polymorphic`（带多态性质的）`base class` 身上，目的是为了用来 “通过 `base class` 接口处理 `derived class` 对象”，而并非所有 `base class` 的设计目的都是为了多态用途。

例如标准string 和 STL容器，如果你企图继承一个STL容器 或 任何其他“带有 `non-virtual` 析构函数”的 class，就可能会导致刚开始就讲到的未定义错误【很可惜C++中没有提供类似 C#中的 sealed class 那样的“禁止派生”机制】。

这里要提及一下 `pure virtual` 函数，它也涉及到 `virtual destructor`【可能会带来些许便利】。
`pure virtual` 函数导致 `abstract class`——即不能被实例化的 `class`，也就是不能创建这类型的对象。

有时候会希望拥有一个 `abstract class`，该怎么做呢？
由于 `abstract class` 总是被当做一个 `base class` 来用，而又由于 `base class` 应该有一个 `virtual` 析构函数，因此做法很简单：**为期望成为抽象的 `class` 声明一个 `pure virtual destructor`**。
```c++
class AbstractClass
{
public:
    virtual ~AbstractClass() = 0;       // 声明 pure virtual 析构函数
};
```
还有个小窍门：**必须为 `pure virtual destructor` 提供一份定义**。
```c++
AbstractClass::~AbstractClass() {  }    // pure virtual 析构函数的定义
```
这样做的原因是：对象的析构是会调用 `derived class` 的析构函数，然后接着调用 `base class` 的析构函数。也就是说编译器会在 `AbstractClass` 的 `derived class` 的析构函数中创建一个对 `~AbstractClass` 的调用动作，所以必须提供定义，不然链接器会拿小拳拳捶你胸口的→_→


### 扩展（关于`vptr`和`vtbl`）

关于 virtual 关键字，我想稍微有点C++编码经验的应该大致了解其语法，这里并不想多说，而是把**重点放在 “不论class是否为base class，都令其析构函数为virtual” 这种做法不好在哪里**。

要实现人们期望的 `virtual` 函数的功能，对象必须携带某些信息——主要用于在运行期决定哪一个 `virtual` 函数该被调用。这份信息通常由一个所谓 `虚表指针（vptr）`指出，`虚表指针（vptr）`指向一个**由函数指针构成的数组**——称为`虚表（vtbl）`。每一个带有 `virtual` 函数的 `class` 都有一个相应的 `vtbl`，当对象调用某一 `virtual` 函数，实际调用的函数取决于该对象的 `vptr` 所指的那个 `vtbl` ——编译器在其中寻找适当的函数指针。

讲了这么多，其实重点是想说明**某个内含 `virtual` 函数的 `class`，其对象的体积会增加一个 `vptr` 指针的大小**【具体大小要看计算机体系结构】。还有像书中所说，更有甚者将这样一个对象传给其他语言【比如C】编写的函数，这也将不再可能（因为其他语言的对应物并没有 `virtual`），除非你自己明确地补偿 `vptr`，这不是给自己找罪受吗(⊙_⊙)？


**请记住**
> - **`polymorphic`（带有多态性质的）`base classes` 应该声明一个 `virtual` 析构函数**。
**如果 `class` 带有任何 `virtual` 函数，它也就应该拥有一个 `virtual` 析构函数**。
> - 某 `class` 的设计目的若**不是作为 `base class`** 使用，或**不是为了具备多态性（`polymorphically`）**，就**不该声明 `virtual` 析构函数**。

---

## Item 8 : 别让异常逃离析构函数 
> Prevent exceptions from leaving destructors

C++ 并不禁止析构函数抛出异常，但不鼓励这么做。比如下面的代码：
```c++
class Object
{
public:
    ...
    ~Object() { ... }       // 假设抛出一个异常
};
void doSomething()
{
    std::vector<Object> v;
    ...
}           // 此处 v 被销毁
```
假设【就是有这么多假设】v 中含有10个 `Object`，析构第一个时抛出一个异常，但其他9个还是应该被销毁，此时若有第二个 `Object` 抛出异常，那么**在两个异常同时存在的情况下，C++程序不是过早结束执行就是导致不明确行为**【本例会导致不明确行为】。说实话，其实我之前根本不知道这个，谁让我异常写得少【逃。

### 特殊情况
若析构函数必须要执行某个动作，但该动作可能会在失败时抛出异常，你就说这尴不尴尬...

说实话，我觉得书中负责数据库连接的例子并不是非常简单明了【这估计也是因为我很少写异常→_→

所以...
我就不打算放上来了，感觉自己一时半会也想不出来一个好例子，先不写实例代码了【如果有人能给出的话，不甚感激

避免问题的两个办法：
- **抛出异常就结束程序**，通常通过调用 `std::abort()` 完成。

- **吞下抛出的异常**，一般而言，这是个坏主意，它压制了某些动作失败的重要信息，但有时候吞下异常也比负担 “草率结束程序”或“发生不明确行为”的风险要好。
    
这两个办法都没有什么吸引力，都无法对“导致抛出异常”的情况作出反应。

那要怎么做呢？一个**较佳策略**是：重新设计可能会抛出异常的接口，使客户（即使用者）有机会对可能出现的问题作出反应。有人可能会觉得把析构函数的部分工作转移给客户对客户是一种负担，其实不然，这只是给他们一个处理错误的机会，否则他们没机会响应，如果他们认为这个机会没用，ok，直接可以忽略它。如果之后他们再抱怨异常的发生，让他们滚蛋，已经给过他们机会了。【没毛病，很有道理...

回到特殊情况上来，**如果某个操作可能在失败时抛出异常，但又因为某种需要必须处理该异常，那么这个异常必须来自析构函数以外的某个函数**。因为析构函数抛出异常就是危险，总会带来“过早结束程序”或“发生不明确行为”的风险。


**请记住**
> - **析构函数绝对不要抛出异常**。如果某个被析构函数调用的函数可能会抛出异常，析构函数应该能catch所有异常，并将它们吞下（不传播）或结束程序。 
> - **若需要对某个操作函数运行期间抛出的异常做出反应**，`class` 应该**提供一个普通函数（而非析构函数）执行该操作**。

---

## Item 9 : 绝不在构造和析构过程中调用virtual函数 
> Never call virtual function during construction or destruction

既然标题已经这么明显了，那么肯定会有人问为什么这么做【至少我会想一想

套用书中一个明显看出违反本条款的例子【懒得自己想了
```c++
class Transaction
{
public:
    Transaction();
    // 记录交易日志
    virtual void logTransaction() const = 0;    // pure virtual function
    ...
};
Transaction::Transaction()
{
    ...
    logTransaction();
}

class BuyTransaction : public Transaction
{
public:
    virtual void logTransaction() const;
    ...
};
class SellTransaction : public Transaction
{
public:
    virtual void logTransaction() const;
    ...
};
```

若执行 `BuyTransaction b`，显然会调用 `BuyTransaction` 构造函数，而调用 `BuyTransaction` 构造函数之前一定要调用基类 `Transaction` 的构造函数——使得 `derived class` 对象内的 `base class` 成分先构造完。

问题在于：例子中的 `Transaction` 构造函数却在最后调用了 `virtual` 函数 `logTransaction`。

**注意**：

这时候被调用的 `logTransaction` 是 `Transaction` 内的版本，不是 `BuyTransaction` 内的版本——即使当前要建立的对象类型是 `BuyTransaction`，也就是说 `base class` 构造期间，`virtual` 函数绝不会下降到 `derived class` 层面。或者换一种更哲♂学的说法：**在 `derived class` 对象的 `base class` 构造期间，对象类型是 `base class` 而不是 `derived class`**。

想想看，当 `base class` 构造函数在执行时，`derived class` 的成员变量**尚未初始化**，若此时 `virtual` 函数下降到 `derived class` 层面，`derived class` 中的函数一般会取用 `local` 成员变量，而这些变量又没初始化，那肯定会导致未定义行为。

相同道理也适用于 析构函数。一旦 `derived class` 析构函数开始执行，目标对象内的 `derived class` 成员变量所占的资源即将归还系统，此时这些成员变量便呈现未定义值【这么说不知道恰不恰当】，C++ 也仿佛视它们不存在，进入 `base class` 析构函数后，对象就成为了一个 `base class` 对象，C++ 的任何部分包括 `virtual` 函数等也都这么看待它。

### 不易察觉的情况及避免方法
上述示例中，应该很容易就能看出不符合标题，但很多情况并不会被轻易察觉。

比如，`Transaction` 有多个构造函数，而且都要执行某些相同工作，显然代码复用是个很好的主意。
```c++
class Transaction
{
public:
    Transaction(.) { init(); ... }
    Transaction(..) { init(); ... }
    ...
    virtual void logTransaction() const = 0;
    ...
private:
    void init()         // 复用的代码
    {
        ...
        logTransaction();
    }
};
```
此时由于 `logTransaction` 是个 `pure virtual` 函数【调用`pure virtual`函数，一般程序会被系统直接中止】，若 `logTransaction` 是个 `impure virtual` 函数，那么这样的代码通常不会引发编译器和链接器的组合小拳拳，但显然也会发生上面提及的问题。因此，唯一能够避免此问题的做法就是：**确定构造函数和析构函数都没有（在对象被创建和被销毁期间）调用 `virtual` 函数，而它们调用的所有函数也都服从同一约束**。

可能有人发现了，讲了一大堆，若真的想 在对象被创建时 调用适当的 `logTransaction`，那该怎么办？
书中给出了一种做法：将 `logTransaction` 改为 `non-virtual`，然后**要求 `derived class`构造函数传递必要信息给 `Transaction` 构造函数**，而后便可安全调用 `non-virtual ` 的 ` logTransaction`。 

```c++
class Transaction
{
public:
    explicit Transaction(const std::string& logInfo);
    void logTransaction(const std::string& logInfo) const;
    ...
};
Transaction::Transaction(const std::string& logInfo)
{
    ...
    logTransaction(logInfo);
}

class BuyTransaction : public Transaction
{
public:
    BuyTransaction( parameters )
        : Transaction(createLogString( parameters ))
    { ... }
    ...
private:
    // 此函数为 static，也就不可能意外指向 BuyTransaction 对象内初期尚未初始化的变量
    static std::string createLogString( parameters );
};
```

怎么感觉这个 `Item` 这么长啊... 果然我好垃圾啊... 但是垃圾的我还是要牢牢记住这个 `Item` 的标题和下面的"请记住"条目...

**请记住**
> - **在构造和析构期间不要调用 `virtual` 函数，而它们调用的所有函数也都服从同一约束**，因为这类调用从不下降到 `derived class` （比起当前执行构造函数和析构函数的那层）。 

---

## Item 10 : 令 operator= 返回一个 reference to *this 
> Have assignment operators return a reference to *this

赋值采用右结合律，连锁赋值形式 `x = y = z = 1` 被解析为 `x = (y = (z = 1))`。

为了实现自定义 `class` 的 “连锁赋值” 操作， `class` 应该遵循协议：**赋值操作符必须返回一个 `reference` 指向操作符的左侧实参**。

该协议不仅适用于标准赋值形式，也适用于所有赋值相关运算，如：

```c++
class Object
{
public:
    ...
    // 返回类型为 reference，指向当前对象
    Object& operator = (const Object& rhs)
    {
        ...
        return *this;
    }
    // 也适用于 +=，-=，*= 等运算操作
    Object& operator += (const Object& rhs)
    {
        ...
        return *this;
    }
    // 此函数也适用，即使此操作符的参数类型不符协定
    Object& operator = (int rhs)
    {
        ...
        return *this;
    }
    ...
};
```

**注意**：这只是个协议，并无强制性，若不遵守该协议，代码仍然能编译通过。但是 **这份协议被所有内置类型和标准程序库提供的类型共同遵守**，所以没有什么特别的理由，还是遵守它比较好。

**请记住**
> - 令赋值（assignment）操作符返回一个 `reference to *this`。

---

## Item 11 : 在 operator= 中处理“自我赋值” 
> Handle assignment to self in Operator =

自我赋值，顾名思义，发生在对象被赋值给自己时，有些自我赋值一眼就能看出，而另一些则很难看出来，这类很难看出来的自我赋值可能会导致一些意料之外的错误，这里套用书中的例子，**建立一个 `class` 用来保存一个指针指向一块动态分配的位图（bitmap）**：

```c++
class Bitmap { ... };
class Object
{
...
private:
    Bitmap* pb;        // 指向一个从 heap 分配得到的对象
};
// 一份不安全的 operator = 实现版本
Object& Object::operator = (const Object& rhs)
{
    delete pb;
    pb = new Bitmap(*rhs.pb);
    return *this;
}
```

此处可能存在的自我赋值问题是：`operator =` 函数内的 `*this` 和 `rhs` 有可能是同个对象。
若是同个对象的话，当前对象 `delete pb` 的时候顺便也销毁了 `rhs` 的 `bitmap`，最后函数返回的是一个指针指向一个已被删除的对象，这显然不行。

传统的解决办法：通过 **“证同测试（identity test）” 检验自我赋值**。
```c++
Object& Object::operator = (const Object& rhs)
{
    // 若是自我赋值，不做任何事
    if (this == rhs) return *this;

    delete pb;
    pb = new Bitmap(*rhs.pb);
    return *this;
}
```

但该版本仍然会导致异常，比如 "new Bitmap" 时抛出异常。由于 让 `operator =` 具备“异常安全性”往往自动获得“自我赋值安全”的回报，因此许多人把重心放在实现“异常安全性”上。比如：
```c++
Object& Object::operator = (const Object& rhs)
{
    Bitmap* pOrigin = pb;       // 存储原先的 pb
    pb = new Bitmap(*rhs.pb);
    delete pOrigin;             // 删除原先的 pb
    return *this;
}
```
此处函数内对原 `bitmap` 做了一个复件、删除原 `bitmap`、然后指向新创建的那个复件，即使 `new Bitmap` 抛出异常，`pb` 仍保持原状。虽说这种做法不高效，但行得通。

另一种替换方案，即 `copy and swap`技术 可以确保代码不但“异常安全”，而且“自我赋值安全”，并且比起上面在 `operator=` 函数内手工排列语句显得更简洁【说实话这个部分的 `swap` 我都还没弄清楚，所以先将就看看，之后弄懂了再来补充，希望想的起来→_→】。
```c++
class Object
{
...
void swap(Object& rhs);     // 交换 *this 和 rhs 的数据，具体实现【未完】
...    
};
Object& Object::operator = (const Object& rhs)
{
    Object temp(rhs);
    swap(temp);         // 将 *this 数据 和 复件数据 交换
    return *this;
}
/*
// 这种做法尽管聪明，但感觉会让代码不够清晰
Object& Object::operator = (Object rhs)
{
    swap(rhs);
    return *this;
}
*/
```


**请记住**
> - 确保当前对象自我赋值时，`operator =` 有着良好的行为，其中涉及的技术包括：**比较“来源对象”和“目标对象”的地址**、**精心周到的语句顺序**、以及 **`copy-and-swap` 技术**。

---

## Item 12 : 复制对象时勿忘其每一个成分 
> Copy all parts of an object

`copying` 函数 包括 `copy constructor` 和 `copy assignment operator`，这两个函数负责对象拷贝。

我在最开始部分（即 `Item 5`）说过，就我个人而言，我更推荐声明自己的 `default constructor`、`destructor`、`copying` 函数（`copy constructor`、`copy assignment operator`），此时编译器就仿佛自己的权威受到了挑战，在代码显然出错的地方也不会告诉你。
套用书中的例子：
```c++
void logCall(const std::string& funcName);
class Customer
{
public:
    Customer() = default;
    ~Customer() = default;
    Customer(const Customer& rhs);
    Customer& operator = (const Customer& rhs);
private:
    std::string name;
};

Customer::Customer(const Customer& rhs)
    : name(rhs.name)
{
    logCall("Customer copy constructor");
}
Customer& Customer::operator = (const Customer& rhs)
{
    logCall("Customer copy assignment operator");
    name = rhs.name;
    return *this;
}
```
若此时再加入另一个成员变量--顾客的最近交易日期【如下】，问题就出现了，当前既有的 `copying` 函数执行的是 **局部拷贝（partial copy）**：的确复制了顾客的 `name`，但没有复制新添加的 `lastTransaction`。大多数编译器【包括VC++】对此不出任何怨言--即使在最高警告级别中，但是这也不能说是编译器的责任，谁让你不把新加入的变量写进 `copying` 函数里【说到底还是编码者的责任→_→
```c++
class Date { ... };     // 具体内容随便写
class Customer
{
public:
    ...
private:
    std::string name;
    Date lastTransaction;
};
```

还有**注意在继承中，`derived class` 容易在 `copying` 函数中遗漏 `base class` 的成分**，忘记的话就是你自己的锅了→_→，比如正确的情况如下：
```c++
class PriorityCustomer : public Customer
{
public:
    ...
    PriorityCustomer(const PriorityCustomer& rhs);
    PriorityCustomer& operator = (const PriorityCustomer& rhs);
    ...
private:
    int priority;
};

PriorityCustomer::PriorityCustomer(const PriorityCustomer& rhs)
    : Customer(rhs),                // 调用 base class 的 copy constructor
     priority(rhs.priority)
{
    logCall("PriorityCustomer copy constructor");
}
PriorityCustomer& PriorityCustomer::operator = (const PriorityCustomer& rhs)
{
    logCall("PriorityCustomer copy assignment operator");
    Customer::operator=(rhs);       // 对 base class 成分进行赋值动作
    priority = rhs.priority;
    reference *this;
}
```

可能有人觉得两个 `copying` 函数有相似的实现内容，可以像之前说过的在 `const` 和 `non-const` 成员函数中避免代码重复一样，用某个调用另一个。但其实只要认真思考一下：`copy constructor` 用来初始化新对象，而 `copy assignment operator` 只能作用在已初始化的对象身上，不管是构造一个已经存在的对象，还是对一个尚未构造好的对象赋值 显然都是荒谬的，无意义的。


**请记住**
> - **`copying` 函数应确保复制 “对象内的所有成员变量” 以及 “所有 `base class` 成分”**。
> - **不要尝试以某个 `copying` 函数实现另一个 `copying` 函数**，应将共同功能放进另一个函数，供这两个 `copying` 函数调用。

---
