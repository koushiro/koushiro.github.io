#!/bin/sh

# Must run this script in Blog directory, yourname.github.io/ must in the hexo directory, like:
# Blog
# ├── yourname.github.io
# ├── node_modules
# ├── public
# ├── scaffolds
# ├── source
# └── themes

# change directory to repo's parent directory
cd ..

# You could change the script to suit your needs.
cp -R public/* koushiro.github.io/
cp -R source/* koushiro.github.io/source/
cd koushiro.github.io
git add .
git commit -m "update blog"
git push origin master
