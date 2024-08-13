---
title: "Ansible 极简教程"  
date: 2024-03-16T17:40:13+08:00
lastmod: 2024-03-16T17:40:13+08:00
draft: true
tags: ["linux", "工具", "ansible", "devops"]
categories: ["devops"]
author: "百里"
comment: false
toc: false
reward: false
# 音乐开关，true/false
music: false
# 只支持163的音乐，在生成外链播放器获取ID
music_id: "22748787"
# 是否自动播放 1是，0否
music_auto: 1
# weight: 1
# description: ""
---

## 安装

```sh
# ubuntu
sudo apt-get install -y ansible

# centos
sudo yum -y install ansible
```

## 配置 cfg

- ansible的默认配置文件路径为 /etc/ansible

更改 hosts 位置

```sh
vim /etc/ansible/ansible.cfg
# 去掉 # 号，更改 hosts 文件路径
inventory      = /etc/ansible/hosts
```

## 配置 hosts

- 有多种方式配置 hosts

```sh
[first]
192.168.1.100 ansible_ssh_pass=your_password

[second]
hostname ansible_ssh_host=ip ansible_ssh_user=root ansible_ssh_pass=your_password

[main]
192.168.1.2
192.168.1.3
192.168.1.4

[main:vars]
ansible_ssh_user=your_user_name
ansible_ssh_pass=your_password
```

## 模块使用

```sh
# ping 
ansible first -m ping
```

## ansible-playbook

shell & command 的区别

在Ansible playbook中，有两个常用的模块可以用于在远程主机上执行命令：`shell`模块和`command`模块。这两个模块之间的区别如下：

1. `shell`模块：
   - `shell`模块在远程主机上执行命令，并使用类似于shell的方式进行解释和处理。
   - 可以使用通配符、管道和变量替换等shell特性。
   - 适用于需要在远程主机上执行复杂的命令或脚本的情况。
   - shell模块会启动一个新的shell进程执行命令，这可能会导致一些性能开销。
2. `command`模块：
   - `command`模块在远程主机上执行命令，但不使用shell解释命令。
   - 不支持shell特性，例如通配符、管道和变量替换等。
   - 适用于简单的命令，不需要shell的功能。
   - command模块直接执行指定的命令，因此性能上相对较高。

总结起来，`shell`模块适用于需要在远程主机上执行复杂的shell命令和脚本，而`command`模块适用于简单的命令。根据您的需求，选择适合的模块来执行命令。

### 配置YAML

- 新建：`ansible-run.yaml` 文件

```yaml
- name: ansible-run # playbook的名称
  hosts: "{{ target_hosts }}" # 主机名称，设置变量，方便传递数据
  gather_facts: false # 禁用获取系统信息
  tasks:
    - name: ping
      become: true # 提权执行后面的任务，通常是指以root权限执行
      ping:
      register: result_output # 将任务的输出结果注册到变量
      tags:
        - ping # 设置  tag
    - name: check 检查 passwd
      become: true 
      shell: cat /etc/passwd |grep bash
      register: result_output
      tags:
        - check_passwd # 设置  tag
    - name: 输出结果
      debug:
        var: result_output.stdout_lines
      tags:
        - print
```

### 运行 playbook

```sh
ansible-playbook ansible-run.yaml  --extra-vars "target_hosts=x86" --tags "check_passwd,print"
```
