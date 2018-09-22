---
title: Algorithm-Sort 
date: 2018-01-11 19:27:13
categories: [Algorithm]
tags: [tech, algorithm]
---

<center> Implementation of common sorting algorithms. </center>

<!--more-->

# Algorithm-Sort

## Insertion Sort

```c++

```

## Selection Sort

```c++

```

---

## Bubble Sort

- Time complexity:
    - Worst-case:   O(n^2) comparions, O(n^2) swaps.
    - Best-case:    O(n)   comparions, O(1)   swaps.
    - Average-case: O(n^2) comparions, O(n^2) swaps.
- Space complexity:
    - Worst-case: O(1) auxiliary.

### Version1

最原始的版本应该是个学CS都应该会写，这里就稍微优化一部分算法，
根据某轮排序过程中是否存在元素交换来判断数列是否有序，减少无谓的比较。

```c++
template<typename T>
void BubbleSort(std::vector<T> array, int len) {
    assert(array.size() >= len);

    for (bool sorted = false; sorted = !sorted; --len) {
        for (size_t i = 0; i < len - 1; ++i) {
            if (array[i] > array[i+1]) {
                std::swap(array[i], array[i+1]);
                sorted = false;
            }
        }
    }
}
```

### Version2

按照之前代码逻辑，冒泡排序中数列有序区长度与排序轮数是相等的（即都为 i）。
但实际上，数列真正有序区长度可能会大于排序轮数，所以可以通过在每轮排序的最后记录下最后一个元素交换的位置（即无序数列的边界，该位置之后就都是有序区），从而再减少无谓的比较。

```c++
template<typename T>
void BubbleSort(std::vector<T> array， int len) {
    assert(array.size() >= len);

    int lastExchangeIndex = 0;
    int border = len - 1;

    for (bool sorted = false; sorted = !sorted; --len) {
        for (size_t i = 0; i < border; ++i) {
            if (array[i] > array[i+1]) {
                std::swap(array[i], array[i+1]);
                sorted = false;
                lastExchangeIndex = i;
            }
        }
        border = lastExchangeIndex;
    }
}
```

### Variants - CockTail Sort

`BubbleSort` 在每次循环中都是从左到右比较元素，并进行单向的位置交换；

其变种 `CockTailSort` 则是在**每次循环中双向**地比较和交换元素, 提高每次循环的价值。

```c++
template<typename T>
void CockTailSort(std::vector<T> array, int len) {
    assert(array.size() >= len);

    int lastRightExchangeIndex = 0;
    int rightBorder = len - 1;
    int lastLeftExchangeIndex = 0;
    int leftBorder = 0;

    for（size_t i = 0; i < len / 2; ++i) {
        bool isSorted = true;
        for (size_t j = leftBorder; j < rightBorder; ++j) {
            if (array[j] > array[j+1]) {
                std::swap(array[j], array[j+1]);
                isSorted = false;
                lastRightExchangeIndex = j;
            }
        }
        rightBorder = lastRightExchangeIndex;
        if (isSorted) break;

        isSorted = true;
        for (size_t j = rightBorder; j > leftBorder; --j) {
            if (array[j] < array[j-1]) {
                std::swap(array[j], array[j-1]);
                isSorted = false;
                lastLeftExchangeIndex = j;
            }
        }
        leftBorder = lastLeftExchangeIndex;
        if (isSorted) break;
    }
}
```

---

## Quick Sort

- Time complexity:
    - Worst-case:   O(n^2)
    - Best-case:    O(n logn)
    - Average-case: O(n logn)
- Space complexity:
    - Worst-case: O(n) auxiliary (naive)
    - Worse-case: O(logn) auxiliary (Sedgewick 1978)

### Recursive version



```c++
template<typename T>
void QuickSort(std::vector<T> array, size_t start, size_t end) {
    assert(start <= end);
    size_t pivotIndex = Partition(array, start, end);
    QuickSort(array, start, pivotIndex - 1);
    QuickSort(array, pivotIndex + 1, end);
}

template<typename T>
void Partition(std::vector<T> array, size_t start, size_t end) {
    T pivot = array[start];
    size_t left = start;
    size_t right = end;
    
    while (left < right) {
        while (left < right && array[right] > pivot) {
            --right;
        }
        while (left < right && array[left] <= pivot) {
            ++left;
        }
        if (left < right) {
            std::swap(array[left], array[right]);
        }
    }
    std::swap(pivot, array[left]);
    
    return left;
}
```

### Iterative version

```c++

```

---

## Heap Sort

```c++

```

## Merge Sort

```c++

```
