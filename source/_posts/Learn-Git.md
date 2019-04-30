---
title: Learn Git
date: 2018-03-15 19:24:36
categories: [Git] 
tags: [tech, Git, Github, note]
---

<center>This blog records how Git is used and some of the problems I encountered while using Git.</center>

<!-- more -->

# Learn Git

See the link below for the full usage of Git.

[Pro Git, English version](https://git-scm.com/book/en/v2)

[Pro Git, Chinese version](https://git-scm.com/book/zh/v2)

## Git流程

流程分为4个区域：

- 工作区 (Workspace)
- 暂存区 (Staging Area)
- 本地仓库 (Local Repository)
- 远程仓库 (Remote Repository)

4个区域划分了5种状态：

- 初始 (Origin)
- 已修改/未跟踪 (Modified & Untracked)
- 已暂存 (Staged)
- 已提交 (Committed)
- 已推送 (Pushed)

```bash
# How to get a git repository?
cd /path/to/your_project
git init
# or
git clone <git-repo-url>

# Used to see current status of workspace and stage area.
git status

# Origin ==> Modified & Untracked
# Workspace
Some coding work.

# Modified & Untracked ==> Staged
# Workspace ==> Stage Area
git add --all

# Staged ==> Committed
# Stage Area ==> Local Repository
git commit -m "some comment"

# Committed ==> Pushed
# Local Repository ==> Remote Repository
git push remote_name remote_branch_name
```

---

## 常用的Git命令列表

```bash
add                -- add file contents to index
blame              -- show what revision and author last modified each line
branch             -- list, create, or delete branches
checkout           -- checkout branch or paths to working tree
cherry             -- find commits not merged upstream
clean              -- remove untracked files from working tree
clone              -- clone repository into new directory
commit             -- record changes to repository
config             -- get and set repository or global options
diff               -- show changes between commits, commit and working tree, etc.
fetch              -- download objects and refs from another repository
grep               -- print lines matching a pattern
gui                -- run portable graphical interface to git
help               -- display help information about git
init               -- create empty git repository or re-initialize an existing one
log                -- show commit logs
merge              -- join two or more development histories together
mv                 -- move or rename file, directory, or symlink
pull               -- fetch from and merge with another repository or local branch
push               -- update remote refs along with associated objects
rebase             -- forward-port local commits to the updated upstream head
remote             -- manage set of tracked repositories
reset              -- reset current HEAD to specified state
revert             -- revert existing commits
rm                 -- remove files from the working tree and from the index
show               -- show various types of objects
stash              -- stash away changes to dirty working directory
status             -- show working-tree status
submodule          -- initialize, update, or inspect submodules
tag                -- create, list, delete or verify tag object signed with GPG
```

---

## 远程仓库的关联和管理

`git remote` 命令被用于关联和管理远程仓库，常用选项的名字一眼就能看出作用。

```bash
add               -- add a new remote
remove     rm     -- remove a remote and all associated tracking branches
rename            -- rename a remote and update all associated tracking branches
show              -- show information about a given remote
--verbose  -v     -- show remote url after name
```

举个栗子，给github上不属于自己的项目贡献代码时，需要先把该项目fork到自己账户中，然后将fork的仓库`clone`到本地，但可能在贡献过程中原有（上游）仓库有新的提交，你最好使自己的fork仓库与原有（上游）仓库保持一致。

```bash
git clone https://github.com/your_name/project.git
cd project
git remote rename origin myfork
git remote add upstream https://github.com/project_owner/project.git
git remote -v
# myfork	https://github.com/your_name/project.git (fetch)
# myfork        https://github.com/your_name/project.git (push)
# upstream	https://github.com/project_owner/project.git (fetch)
# upstream	https://github.com/project_owner/project.git (push)

git checkout master

# 或者直接 git pull upstream master 一条命令，但我推荐分开命令执行
git fetch upstream master
git merge upstream/master
# 将更新的本地 fork 仓库推送到远程 fork 仓库
git push myfork master
```

---

## 撤销更改

已修改，未暂存 (即 `git add` 命令之前)，所有的修改文件都还在工作区，并没进入暂存区，此时撤销工作区修改:

```bash
# 检查工作区和暂存区之间的差异，列出所有差异
git diff

# 恢复暂存区文件到工作区
git checkout <file-name> / git checkout .
# 撤销工作区修改的同时也撤销暂存区修改，都恢复到上一次commit的状态
git reset --hard <file-name> / git reset --hard
```

已暂存，未提交（即 `git add` 命令之后，`git commit` 命令之前），被 `add` 的文件都进入了暂存区，但并没进入本地仓库，此时撤销暂存区修改（可选择是否同时撤销工作区修改）:

```bash
# 检查暂存区和本地仓库之间的差异，列出所有差异
git diff --cached

# 恢复暂存区的文件，退回到 git add 之前，即 '已修改未暂存' 状态
git reset <file-name> / git reset
# 若还想恢复工作区修改，退回到 '未修改' 状态，还需
git checkout <file-name> / git checkout .

# 或者想同时一口气撤销暂存区和工作区修改
git reset --hard <file-name> / git reset --hard
```

已提交，未推送（即 `git commit` 命令之后，`git push` 命令之前），所有暂存区的文件都进入了本地仓库，但还没被推送到远程仓库，此时撤销本地仓库修改:

```bash
# 检查本地仓库与远程仓库之间的差异，列出所有差异
# master为本地分支，origin/master为远程仓库分支
git diff master origin/master

# 本地仓库退回到某一个commit
git reset --hard <commit-hash>
# 本地仓库快速退回到上个commit
git reset --hard HEAD^
# 本地仓库快速退回到上上个commit
git reset --hard HEAD^^

# 或者本地仓库直接去掉某个commit，
# 实质是新建了一个与原来完全相反的commit，抵消了原来commit的效果
git revert <commit-hash>
```

已推送（即 `git push` 命令之后），本地仓库文件已同步到远程仓库，你说你手速咋这么快？

```bash
# 本地仓库退回到某一个commit
git reset --hard <commit-hash>
# 用本地仓库强制覆盖远程仓库，origin为远程仓库，master为远程仓库分支
git push --force origin master
```

一些常见情况可以不用撤销更改就能解决:

1. `git commit` 后发现之前 `git add` 的文件少了:

	```bash
	# 直接添加上次 `git commit` 缺少的文件到暂存区
	git add <file-name>

	# 此命令会将暂存区中的文件提交，
	# 如果自上次提交以来你还未做任何修改（例如，在上次提交后马上执行了此命令），
	# 那么快照会保持不变，而你所修改的只是提交信息
	# 最终你只会有一个提交 - 第二次提交将代替第一次提交的结果。
	git commit --amend
	```

2. 刚刚 `git commit` 的信息写错了:

	```bash
	# 修改commit信息，最终你只会有一个提交 - 第二次提交将代替第一次提交的结果。
	git commit --amend
	```

---

## 分支的管理

使用 `Git` 管理的项目通常都使用分支开发工作流。

新建仓库后，`Git` 默认生成的 `master` 分支常常被作为长期分支，只在 `master` 分支上保留完全稳定的代码，也有可能仅仅是已经发布或即将发布的代码。

除了 `master` 这样的长期分支外还有一些名为 `develop` 或者 `next` 的长期分支，被用来做后续开发或者测试稳定性，这些分支不必保持绝对稳定，但是一旦达到稳定状态，它们就可以被合并入 master 分支。

还有一类特性分支，只是短期存在，被用来实现单一特性或者解决某一问题。在完成特定任务后合并入主干分支就可以删除掉它们了。

新建分支并切换:

```bash
# 最初始的时候工作区处在 master 分支
# 新建分支
git branch <branch_name>
# 工作区切换到新分支
git checkout <branch_name>

# 或者可以合并上述两条命令
git checkout -b <branch_name>
# Switched to a new branch "branch_name"
```

完成分支上的工作，测试通过并提交了，接下来打算将该分支合并到主干分支，但在这之前还有件事要考虑。

由于项目参与的人数过多，每个人都自己新建分支工作，那么分支数目也就多，可能完成自己分支的工作后，其他项目参与者已经往远程仓库的 `master` 提交了很多代码，这时需要先拉取最新的代码才能做之后的分支合并的工作:

```bash
git checkout master

# 抓取远程仓库 master 分支的改变
git fetch <remote-name> master
# 合并远程仓库的 master 到本地仓库的 master
git merge <remote-name>/master master

# 合并 feature_test 分支的工作到本地仓库的 master 主分支中
git merge feature_test master
```

由于拉取的最新代码中可能有多人修改了自己分支中涉及到的文件，这可能会产生合并冲突，此时就需要人工干预修复冲突内容再合并。

最终完成工作的分支合并回本地的 `master` 分支后，就可以删除该新建分支，并推送本地仓库的 `master` 分支到远程仓库的 `master` 分支了:

```bash
git checkout master

# 在删除分支前，我建议先看下当前已合并和未合并合并的分支
# 查看当前已经合并的分支，被合并的分支通常就可以直接删除了
git branch --merged
# 删除分支
git branch -d <branch-name>

# 查看当前还未合并的分支，这类因为还未被合并，删除时需要考虑再三
git branch --no-merged
# 未被合并的分支只能使用强制删除
git branch -D <branch-name>

# 推送本地仓库 master 分支到远程仓库 master 分支
git push <remote-name> master
```

上面提及到的新建分支都是在本地仓库中操作的，但实际开发过程常常也需要将新建分支推送到远程仓库。

还是以上面 `远程仓库的关联和管理` 部分提到的给 `Github` 开源项目贡献代码的栗子来讨论。

咱个人通常都是新建分支，在该分支上完成编码任务，推送到 `fork` 仓库，然后提出 `PR` 的。

```bash
git remote -v
# myfork	https://github.com/your_name/project.git (fetch)
# myfork        https://github.com/your_name/project.git (push)
# upstream	https://github.com/project_owner/project.git (fetch)
# upstream	https://github.com/project_owner/project.git (push)

git branch fix_bugs
git checkout fix_bugs
# Some commits...

# 推送 fix_bugs 分支到 fork 仓库
git push myfork fix_bugs
# 然后在 fork 仓库页面点击 Pull Request，
# 通常还需要根据 CONTRIBUTE 文档编写相关说明，
# 等待开源项目的负责人 review 代码并合并到上游仓库的主分支中。
```

在提出 `PR` 和合并 `PR` 之间可能上游仓库有新代码的提交，你可以按照 `远程仓库的关联和管理` 部分提到的，将上游仓库的最新提交更新到 `fork` 仓库，或者直接在 `Github` 的该 `PR` 页面一键解决（个人推荐）。

**注意的坑**: `PR` 的提出一般都会有 `CI/CD` 工具的帮助，若贡献的开源项目中使用到 `Jenkins` 时，新建分支的名字不要有 `#` 之类的特殊字符，这会导致 `Jenkins` 无法成功通过。

---

## git config

当配置Git时，加上`--global`选项是作用于当前用户，如果不加，那只针对当前的仓库起作用。

当前用户的Git配置文件位于 `/home/user/.gitconfig`.

当前仓库的Git配置文件位于 `/path/to/git-repo/.git/config`.

My `.gitconfig`:

```bash
[user]
	name = koushiro
	email = koushiro.cqx@gmail.com
[alias]
	lg = log --all --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --date=relative
```

---

## git log

My custom log format:

```bash
git config --global alias.lg log --all --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --date=relative
```

Other helpful options:

```bash
git lg -2        # shows only the last two entries.
git lg -p        # shows the difference (the patch output) introduced in each commit.
git lg --stat    # shows some abbreviated stats for each commit.
git lg --oneline # shorthand for --pretty=oneline --abbrev-commit.
```

---

## git tag

标签一般用来标记发布节点（v1.0 等等）。

列出标签:

```bash
git tag

# v1.0.0
# v1.0.1
# v1.0.2
# v1.1.0
# v1.2.0
# v1.3.0
```

`Git` 使用两种主要类型的标签：轻量标签（lightweight）与附注标签（annotated）。

- 附注标签（annotated）

	```bash
	# 使用 -a 选项创建 附注标签
	git tag -a v1.4.0 -m 'my version 1.4.0'

	git tag
	# v1.0.0
	# v1.0.1
	# v1.0.2
	# v1.1.0
	# v1.2.0
	# v1.3.0
	# v1.4.0

	# 可以看到标签信息与对应的提交信息
	git show v1.4.0
	# tag v1.4.0
	# Tagger: koushiro <koushiro.cqx@gmail.com>
	# Date:   Sun Sep 23 01:16:39 2018 +0800

	# my version 1.4.0

	# commit 34115da0eb65d4e267c59b1a783c09e2e621db93...
	```

- 轻量标签（lightweight）

	```bash
	# 轻量标签本质上是将提交校验和存储到一个文件中 - 没有保存任何其他信息。 
	# 创建轻量标签，不需要使用 -a、-s 或 -m 选项，只需要提供标签名字
	git tag v1.4.0-lw
	
	git tag
	# v1.0.0
	# v1.0.1
	# v1.0.2
	# v1.1.0
	# v1.2.0
	# v1.3.0
	# v1.4.0
	# v1.4.0-lw

	# 不会看到额外的标签信息，只会显示出提交信息
	git show v1.4.0-lw
	# commit 34115da0eb65d4e267c59b1a783c09e2e621db93...
	```

除了对当前最新的提交打上标签，也可以对过去的提交打标签。

```bash
git tag -a v1.2.1 -m "my version 1.2.1" <hash-code>
```

默认情况下，`git push` 命令并不会推送标签到远程仓库中， 因此在创建完标签后必须显式地推送标签到远程仓库中。

```bash
git push <remote-name> <tag-name>

# 一次性推送很多标签，可以使用带有 --tags 选项，
# 这会把所有不在远程仓库里的标签全部传送到那里。
git push <remote-name> --tags
```

标签的检出和删除类似于分支:

```bash
# 检出 v1.3.0 标签指定的版本节点到工作区
git checkout v1.3.0

# 在特定的标签上创建一个新分支，
# 如果在这之后又进行了提交，新分支会因为改动向前移动，
# 那么新分支就会和 v1.3.0 标签稍微有些不同，这时就应该当心
git checkout -b <branch-name> v1.3.0

# 删除特定标签
git tag -d v1.4.0-lw
```

---

## 合并多个commit

在实际开发中，一般有 `master` (功能稳定的分支) 和 `develop` (正在开发的分支， 或者属于自己的fork仓库)。

在 `develop` 分支(或者fork仓库)中常常会有对某几个特定文件琐碎的 `commit` 记录，为了 `commit` 记录的整洁，往往需要将这些琐碎记录整合为一个 `commit`。

假设有 3 个 `commit` 记录:

![](git-log-origin.png)

需要将 `913d903` 和 `eca4dfe` 记录合并为一个 `commit`:

```bash
# -i 参数是不需要合并的 commit 的 hash 值，这里指的是 `Add README` 那条 commit
# 然后进入编辑模式
git rebase -i 07f4138
```

![](rebase-i-origin.png)

很明显，上方未注释的是要执行的命令，下方是命令的说明，要是看不懂这种程度的英文那我也没办法。

直接修改 `eca4dfe` 前的命令为 `squash`, 使其被合并到前一个 `commit`，然后输入`:wq` 保存并退出:

![](rebase-i-modified.png)

进入 `commit message` 的编辑界面:

![](commit-message-origin.png)

将这两次 `commit message` 修改为新的 `commit message`，然后输入 `:wq` 保存并退出:

![](commit-message-modified.png)

再次输入 `git log` 查看，发现这两个 `commit` 记录已经合并未一个了:

![](git-log-modified.png)

然后可以将其强制推送到远程仓库 `develop` 分支或者远程 `fork` 仓库的特定分支中:

```bash
git push origin develop -f
```

如果本次修改的代码达到稳定，就可以将 `develop` 分支的 `commit` 合并入 `master` 分支或者通过 `PR` 合并入 `fork` 仓库的上游仓库。

# Updating...
