#!/bin/sh

# Must run this script in Blog directory, yourname.github.io/ must in the hexo directory, like:
# Blog
# ├── yourname.github.io
# ├── node_modules
# ├── public
# ├── scaffolds
# ├── source
# └── themes

# clean 2017/ 2018/ 2019/ archives/ categories/ tags/ source/ directory
rm -rf 2017/*
rm -rf 2018/*
rm -rf 2019/*
rm -rf archives/*
rm -rf categories/*
rm -rf tags/*
rm -rf source/*

# change directory to repo's parent directory
cd ..

hexo g

# You could change the script to suit your needs.
cp -R public/* koushiro.github.io/
cp -R source/* koushiro.github.io/source/
cp _config.yml koushiro.github.io/site_config.yml
cp themes/hexo-theme-next/_config.yml koushiro.github.io/theme_next_config.yml
cd koushiro.github.io
git add .
#git commit -m "update blog"
#git push origin master
