#!/bin/sh

# Must run this script in Blog/backup, yourname.github.io/ must in the hexo directory, like:
# Blog
# ├── yourname.github.io
# |   └── backup
# ├── node_modules
# ├── public
# ├── scaffolds
# ├── source
# └── themes

# Change directory to yourname.github.io directory.
cd ..

# Clean all in yourname.github.io except backup directory, and backup source.
mv backup ..
rm -rf ./*
mv ../backup .
mkdir source

# Copy README/CNAME of backup to yourname.github.io
cp backup/README.mdown .
cp backup/CNAME .

# Change directory to hexo directory.
cd ..

# Clean and re-generate new site.
hexo clean && hexo g

# Update blog and backup site and theme config, you could change the script to suit your needs.
cp -R public/* koushiro.github.io/
cp -R source/* koushiro.github.io/source/
cp _config.yml koushiro.github.io/backup/site_config.yml
cp themes/hexo-theme-next/_config.yml koushiro.github.io/backup/theme_next_config.yml

# Change directory to yourname.github.io and add changes to git.
cd koushiro.github.io
git add .

