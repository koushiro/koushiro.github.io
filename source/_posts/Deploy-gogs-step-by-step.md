---
title: Deploy gogs step by step
date: 2018-01-01 22:08:27
tags: [gogs]
categories: [Config]
---

{% asset_img gogs-large-resize.png %}

<!-- more -->

## Gogs

就像 Gogs 项目的[README](https://github.com/gogits/gogs/blob/master/README_ZH.md)里所说，Gogs是一个简单的私人自助Git服务，由Golang编写，理论上来说支持所有Golang所支持的平台。

你可能要问不是有 Github 可以用么？Github 好是好，但毕竟私人仓库是要收费的，而且有些垃圾代码实在不适合放到 Github 上污染民那桑的眼睛，所以就用自己的服务器搭建一个私人 Git 托管服务。

## Step1. Download Gogs from Github

根据[官方文档](https://gogs.io/docs/installation/install_from_binary)，下载分为二进制/源码/包管理，服务器我这里使用的是 Vultr 的 Cloud Instance，系统是 Ubuntu16.04。由于包管理只支持 Ubuntu12.04/14.04，而且包管理均为第三方提供，所以我就跳过源码编译直接用二进制安装（当然用 Archlinux 的也可以直接用 AUR 源进行安装），总之分系统类型进行，我个人比较推荐新手直接用部署更为方便的二进制，若之后想更新Gogs二进制，官方文档也提供了如何升级二进制的教程：

1. 下载最新版的压缩包
2. 删除当前的 templates 目录。
3. 解压压缩包并将所有内容复制粘贴到相应（当前）的位置。

废话不多说，直接 wget 下载链接， 然后解压：

```shell
wget https://dl.gogs.io/0.11.34/linux_amd64.zip
unzip linux_amd64.zip
```

目录如下：

```shell
root@Ubuntu16:~/gogs# ls -l
total 31384
drwxr-xr-x  3 root root     4096 Dec 23 15:30 custom
drwx------  4 root root     4096 Dec 23 15:59 data
-rwxr-xr-x  1 root root 32091291 Nov 22 20:01 gogs
-rw-r--r--  1 root root     1054 Feb 11  2017 LICENSE
drwxr-xr-x  2 root root     4096 Jan  1 00:07 log
drwxr-xr-x  8 root root     4096 Nov 22 20:01 public
-rw-r--r--  1 root root     8032 Nov 22 20:01 README.md
-rw-r--r--  1 root root     5329 Nov 19 18:54 README_ZH.md
drwxr-xr-x  7 root root     4096 Nov 22 20:01 scripts
drwxr-xr-x 11 root root     4096 Nov 22 20:01 templates
```

## Step2. Deploy Gogs

直接后台运行gogs二进制：

```shell
./gogs web &&
```

运行成功后，浏览器首次进入 `localhost:3000/` 会跳转到 `/install`，进行首次部署基本配置，比如数据库的选择，账号注册等等，由于我是一个人用，数据库使用 sqlite 绰绰有余。


## Step3. Configuration

默认配置文件从v0.6.0开始就被嵌入了二进制中，若要进行自定义配置，只需要修改 `custom/conf/app.ini`，比如 Git仓库根目录、数据库配置或者是否支持注册等。

像我，则是在安装部署和注册账号完成后，禁止了其他人的注册，因为毕竟这只是我个人的 Git 托管服务。若是一个团队协同使用，就不需要关闭注册功能。

```shell
root@Ubuntu16:~/gogs/custom/conf# cat app.ini
APP_NAME = Gogs
RUN_USER = root
RUN_MODE = prod

[database]
DB_TYPE  = sqlite3
#...

[repository]
ROOT = /root/gogs-repositories

[server]
DOMAIN           = localhost
HTTP_PORT        = 3000
ROOT_URL         = http://localhost:3000/
DISABLE_SSH      = false
SSH_PORT         = 22
START_SSH_SERVER = false
OFFLINE_MODE     = false

[mailer]
ENABLED = false

[service]
REGISTER_EMAIL_CONFIRM = false
ENABLE_NOTIFY_MAIL     = false
DISABLE_REGISTRATION   = true
ENABLE_CAPTCHA         = true
REQUIRE_SIGNIN_VIEW    = false

[picture]
DISABLE_GRAVATAR        = false
ENABLE_FEDERATED_AVATAR = true

[session]
PROVIDER = file

[log]
MODE      = file
LEVEL     = Info
ROOT_PATH = /root/gogs/log
```

## Step4. Forward port

在部署和配置完成后，其实就已经可以很好的使用Gogs的自助Git服务了，但是在浏览器敲ip地址和端口号太麻烦了，所以我就利用我现有的域名，在DNSPOD上再加了一条二级域名解析，直接取个好记的域名 [git.koushiro.me](http://git.koushiro.me)。当然如果你是在狗爹上买的域名并且用得狗爹自己的域名解析，那添加二级域名就更简单了，而且也不需要自己配置端口转发，狗爹的域名解析和跳转支持二级域名直接转发到某个ip地址的端口，但如果你也是和我一样使用DNSPOD来进行域名解析的，那还得多做一步，就是用 nginx 进行 3000 端口的转发。

这一步实际也很简单：

通过包管理安装 Nginx：

```shell
apt install nginx  # Debian / Ubuntu
pacman -S nginx    # Archlinux
```

安装完成后，nginx 的默认配置在 `/etc/nginx/nginx.conf` 里

```shell
http {
        ##
        # Basic Settings
        ##

        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;
        keepalive_timeout 65;
        types_hash_max_size 2048;
        # server_tokens off;

        # server_names_hash_bucket_size 64;
        # server_name_in_redirect off;

        include /etc/nginx/mime.types;
        default_type application/octet-stream;

        ##
        # SSL Settings
        ##

        ssl_protocols TLSv1 TLSv1.1 TLSv1.2; # Dropping SSLv3, ref: POODLE
        ssl_prefer_server_ciphers on;

        ##
        # Logging Settings
        ##

        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log;

        ##
        # Gzip Settings
        ##

        gzip on;
        gzip_disable "msie6";

        # gzip_vary on;
        # gzip_proxied any;
        # gzip_comp_level 6;
        # gzip_buffers 16 8k;
        # gzip_http_version 1.1;
        # gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        ##
        # Virtual Host Configs
        ##

        include /etc/nginx/conf.d/*.conf;
        include /etc/nginx/sites-enabled/*;
}
```

可以看到最后的 `Virtual Host Configs` 里的 include， 显而易见，我们只需要在 `/etc/nginx/conf.d` 新建一个配置文件，然后 reload nginx 服务，就能完成端口转发。 这里我根据我的域名新建一个配置文件 `git.koushiro.me.conf`，内容如下：

```shell
server {
    server_name git.koushiro.me
    listen 80;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

这里我将 git.koushiro.me 的 80 端口请求转发到服务器本地的 3000 端口，也就是 Gogs 服务的默认端口。

OK~ DONE~

> PS: 快一年多没写博客了，也正好趁 2018 年的到来，重拾博客，记录些学习和生活，本想继续写篇博客记录下自己一些 2018 年的目标，但时间也不早了，明天还得上班糊代码，那2018目标的那篇博客就放到明天写好了，顺便给自己多一天时间仔细想想，也希望新的一年我能好好完成自己将要定下的目标。 