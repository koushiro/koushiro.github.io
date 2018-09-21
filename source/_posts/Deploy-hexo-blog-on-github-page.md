---
title: Deploy Hexo blog on Github Page
date: 2017-01-02 22:56:05
categories: [Configuration]
tags: [tech, config, Hexo, Github]
---

<center>This is a simple tutorial to deploy your hexo blog on Github Page. </center>

<!-- more -->

## Deploy Hexo blog on Github Page 

### Install Node.js and Git

 - [Node.js](https://nodejs.org/en/download/)
 - [Git](https://git-scm.com/downloads)

具体情况可见 [hexo official document](https://hexo.io/docs/index.html).

之前我本来想配置在archlinux上的，后来发现直接在windows上配置也是行得通的。

Node.js 就直接用 windows 的 Latest LTS version.

Git 就直接下个 [Git bash](https://git-for-windows.github.io/).

打开 Git bash， 为本地 Git 配置全局 user 和 email 参数，当然你肯定要有 Github 账户.

```bash
git config --global user.name "your github account name"
git config --global user.email "your github account email"
```

然后在本地生成 SSH 私钥，并将公钥保存到你的 GitHub 账户中去。

```bash
ssh-keygen -t rsa -C "your github account email"
```
生成过程会有提示要输入，直接一路enter.

进入Github 的 setting 界面，选择 SSH and GPG keys ，点击 New SSH key ，在展开的窗口中填写公钥信息。

title 可以随意起，key 那一栏则是把刚刚生成的 id_rsa.pub 的内容复制进去。最后点击按钮添加。

### Install Hexo

Node.js 在 windows 上的安装默认会直接安装上 npm.

```bash
npm install -g hexo-cli
```

使用 hexo 生成博客框架

```bash
hexo init Blog
cd Blog
npm install
hexo generate (or hexo g)
hexo server   (or hexo s)
```

> hexo init blog 过程可能比较慢，因为过程中要远程从 github 上下载默认的主题。

通过 hexo server 运行起 hexo 内置的服务器。
这时候就可以开始在本地访问了，默认地址为 localhost:4000 .

### Hexo modules

- `_config.yml` ：站点配置文件，可以修改网站的主题、标题、作者等信息。
- `public` ：由 hexo 根据 source 文件夹中的资源进行渲染生成的文件夹，里边存储着最终的静态网页文件。
- `scaffolds` ：模板文件，当要给博客添加新文章的时候，可以根据对应的模板进行创建。
- `source` ：用于存储用户资源，比如文章与新页面等。其中以 _ 开头的文件夹中除了 _posts 文件夹中的 markdown 或 HTML 文件会在执行 generate 操作的时候被渲染添加到 public 文件夹中之外，其他均被忽略。而且在初始化博客的过程中 _posts 目录底会自带一个 hello-world.md 的文件。
- `themes` ：主题文件，自带默认主题 landscape 。


### Theme

[NexT 主题](https://github.com/iissnan/hexo-theme-next/releases)

下载你喜欢的版本并解压到 themes 目录下，将解压后的文件夹名称改名为 next.

打开 `_config.yml` （即站点配置文件），找到 `theme` 字段，将默认主题 landscape 改为 `next`， 
通过之前的两条命令重新生成网页文件：

```bash
hexo g
hexo s
```

应该就可以在本地浏览器看见新主题了。

主题更具体的配置请见 [NexT 的官方文档](http://theme-next.iissnan.com/getting-started.html)，官方文档写得很有条理，而且里面还有各种第三方服务的配置。

### Deploy to Github Page

首先要创建一个 new repository，注意仓库名格式必须为 your_github_name.github.io ，这个仓库将作为你的静态博客文件的存放仓库。

```bash
cd Hexo/blog
git clone git@github.com:your_github_name/your_github_name.github.io.git
```

部署要做的事就是把 public 文件目录下的博客文件都复制到你的本地仓库中，
并将本地仓库 push 到 github 仓库上。这样当其他人访问你的博客链接的时候 github 将会自动将该仓库中的相应文件展示出来。

你可以把上面的部署方法写成 `shell` 脚本一键部署（个人更推荐脚本的方法）：

```bash
cp -R public/* your_github_name.github.io/
cp -R source/* your_github_name.github.io/source/
cd your_github_name.github.io
git add .
git commit -m 'update blog'
git push origin master
```

或者使用更方便的方法，即安装 `hexo-deployer-git`:

```bash
npm install hexo-deployer-git --save
```

修改站点配置文件 `_config.yml`：
```
# Deployment
## Docs: https://hexo.io/docs/deployment.html
deploy:
  type: git
  repo: git@github.com:your_github_name/your_github_name.github.io.git
  branch: master
```

然后执行

```bash
hexo deploy (or hexo d)
```

### Addtion：为 Github Page 绑定独立域名

首先当然要有自己的域名，接着就是域名解析，这类教程网上一抓一大把，这里就不细讲了。

在本地博客的 `source` 目录下（例如：Hexo/blog/source）
创建文件 `CNAME` （这个文件名一定要大写，并且没有文件后缀名），
编辑内容为你的域名，比如我的域名为 koushiro.me ，那么 `CNAME` 中就填写这个。
然后将这个 `CNAME` 文件放到 source 目录下，执行 `hexo g` 时会自动加入到 public 目录， 最后执行 `hexo d` 将 public 目录里的文件 push 到 github 的主页仓库当中。

ps: 我的域名解析是在 [DNSPOD](https://www.dnspod.cn) 上解析的，
只要在域名解析中加上一条记录类型是 `CNAME`，记录值为 your_github_name.github.io 的记录就可以了。
