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
- 暂存去 (Staging Area)
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
git merge upstream master

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

`git commit` 后发现之前 `git add` 的文件少了

```bash
# 直接添加上次 `git commit` 缺少的文件到暂存区
git add <file-name>

# 此命令会将暂存区中的文件提交，
# 如果自上次提交以来你还未做任何修改（例如，在上次提交后马上执行了此命令），
# 那么快照会保持不变，而你所修改的只是提交信息
# 最终你只会有一个提交 - 第二次提交将代替第一次提交的结果。
git commit --amend
```

刚刚 `git commit` 的信息写错了

```bash
# 修改commit信息，最终你只会有一个提交 - 第二次提交将代替第一次提交的结果。
git commit --amend
```

---

## 分支的管理

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

## git log

My custom log format:

```bash
git config --global alias.lg log --all --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --date=relative
```

Other helpful options:

```bash
git lg -2     # shows only the last two entries.
git lg -p     # shows the difference (the patch output) introduced in each commit.
git lg --stat # shows some abbreviated stats for each commit.
```
