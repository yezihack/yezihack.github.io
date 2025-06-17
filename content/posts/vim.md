---
title: "Vim"
date: 2025-02-23T20:10:35+08:00
lastmod: 2025-02-23T20:10:35+08:00
draft: false
tags: ["vim", "linux"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
---

## 查找字符

- `:s/old/new/g` 替换当前行所有 old 为 new
- `:s/old/new/gc` 替换当前行所有 old 为 new，并提示确认
- `:%s/old/new/g` 替换所有行所有 old 为 new
- `:%s/old/new/gc` 替换所有行所有 old 为 new，并提示确认
- `:set ic` 忽略大小写
- `:set noic` 不忽略大小写
- `:set nu` 显示行号
- `:set nonu` 不显示行号
- `:set hlsearch` 高亮搜索结果
- `:set nohlsearch` 不高亮搜索结果
- `:set incsearch` 实时搜索
- `:set noincsearch` 不实时搜索
- `:set wrap` 自动换行
- `:set nowrap` 不自动换行
- `:set showmatch` 显示括号匹配
- `:set noshowmatch` 不显示括号匹配
- `:set ruler` 显示光标位置
- `:set noruler` 不显示光标位置
- `:set cursorline` 高亮当前行
- `:set nocursorline` 不高亮当前行
- `:set cursorcolumn` 高亮当前列
- `:set nocursorcolumn` 不高亮当前列
- `:set foldenable` 启用折叠
- `:set nofoldenable` 禁用折叠
- `:set foldmethod` 设置折叠方式
- `:set foldlevel` 设置折叠级别
- `:set foldlevelstart` 设置折叠起始级别
- `:set foldlevelstop` 设置折叠结束级别

## 查找文件

- `:find file` 查找文件
- `:find /path/to/file` 查找文件
