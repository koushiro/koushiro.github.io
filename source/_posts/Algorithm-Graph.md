---
title: Algorithm-Graph
date: 2018-10-17 20:54:04
categories: [Algorithm]
tags: [tech, algorithm]
---

<center> Implementation of common graph algorithm. </center>

<!--more-->

# Algorithm-Graph

图结构的常用表示无非**邻接矩阵**（用于稠密图，更直观易懂）和**邻接表**（用于稀疏图，更为常用）。
这篇博客里将会使用邻接表结构。

## BFS

广度优先搜索通过给定图和一个源点 s 可以生成一棵广度优先搜索树，s 为该树根结点。
在该树中从结点 s 到结点 v 的简单路径所对应的就是图中两结点的最短路径。

实现方式很简单，只需要通过一个先进先出的队列来管理搜索过程中发现的结点（即代码中 `status` 为 `DISCOVERED` 的结点）。

```c++
#include <iostream>
#include <vector>
#include <queue>

using namespace std;
using Graph = vector<vector<size_t>>;

enum VertexStatus { UNDISCOVERED, DISCOVERED, VISITED };

struct Vertex {
    VertexStatus status;
    pair<size_t, size_t> time;
    size_t parent;
};

void BFS(const Graph& G, vector<Vertex>& A, size_t s) {
    if (s > G.size()) return;

    for (size_t i = 0; i < A.size(); ++i) {
        A[i] = { UNDISCOVERED, {}, i };
    }

    A[s].status = DISCOVERED;
    queue<size_t> Q;
    Q.push(s);

    while (!Q.empty()) {
        size_t u = Q.front();
        for (const auto& v : G[u]) { // 处理 u 的邻接表
            if (A[v].status == UNDISCOVERED) {
                A[v] = { UNDISCOVERED, {}, u };
                Q.push(v);
            }
        }
        Q.pop();
        A[u].status = VISITED;
    }
}

int main() {
    cout << "BFS:" << endl;
    Graph G1 = {{}, {0, 2}, {0, 4}, {2}, {2, 3}};
    vector<Vertex> A1(G1.size());
    BFS(G1, A1, 1);

    for (size_t i = 0; i < A1.size(); ++i) {
        cout << i << "->" << A1[i].parent << endl;
    }

    return 0;
}
```

## DFS

不像广度优先搜索，深度优先搜索会形成一个由多棵深度优先树组成的深度优先森林。
此外，深度优先搜索在每个结点上记录两个时间戳，即 `Vertex` 结构体中的 `time.first` 和 `time.second`。
`time.first` 用于记录该结点被发现的时间，`time.second` 用于记录该结点搜索完其邻接表的时间。
此处具体实现使用了递归。

```c++
//...

void depth_first_search(const Graph& G, vector<Vertex>& A, size_t u, size_t& counter) {
    A[u].time.first = counter++;
    A[u].status = DISCOVERED;
    for (auto& v : G[u]) {  // 处理 u 的邻接表
        if (A[v].status == UNDISCOVERED) {
            A[v].parent = u;
            depth_first_search(G, A, v, counter);
        }
    }
    A[u].time.second = counter++;
    A[u].status = VISITED;
}

void DFS(const Graph& G, vector<Vertex>& A) {
    size_t counter = 0;
    for (size_t i = 0; i < A.size(); ++i) {
        A[i] = { UNDISCOVERED, {}, i };
    }
    for (size_t u = 0; u < G.size(); ++u) {
        if (A[u].status == UNDISCOVERED) {
            depth_first_search(G, A, u, counter);
        }
    }
}


int main() {
    cout << "DFS:" << endl;
    Graph G2 = {{1, 3}, {2}, {3}, {1}, {2, 5}, {5}};
    vector<Vertex> A2(G2.size());
    DFS(G2, A2);

    for (size_t i = 0; i < A2.size(); ++i) {
        cout << "(" << A2[i].time.first << "/" << A2[2].time.second << ")"
            <<  i << "->" << A2[i].parent << endl;
    }

    return 0;
}
```


