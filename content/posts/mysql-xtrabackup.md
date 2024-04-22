---
title: "Mysql Xtrabackup 极简教程"
date: 2024-04-18T16:25:36+08:00
lastmod: 2024-04-18T16:25:36+08:00
draft: true
tags: ["mysql", "极简教程"]
categories: ["mysql"]
author: "百里"
comment: false
toc: true
reward: true
---

## Xtrabackup 介绍

- 官网: <https://docs.percona.com/>

## 版本说明

- Percona XtraBackup 2.4.29 只支持操作:MySQL 5.1、5.5、5.6 和 5.7 服务器上的 InnoDB、XtraDB 和 MyISAM 表，以及带有 XtraDB 的 Percona Server
- Percona XtraBackup 2.4 不支持备份在 MySQL 8.0、Percona Server for MySQL 8.0 或 Percona XtraDB Cluster 8.0 中创建的数据库。将 Percona XtraBackup 8.0 用于 8.0 版数据库

## 关于Percona XtraBackup

Percona XtraBackup是世界上唯一的开源免费MySQL热备份 对 InnoDB 和 XtraDB 执行非阻塞备份的软件 数据库。使用 Percona XtraBackup，您可以获得以下好处：

- 快速可靠地完成备份
- 备份期间不间断的事务处理
- 节省磁盘空间和网络带宽
- 自动备份验证
- 恢复时间更快，正常运行时间更长

## Percona XtraBackup有哪些功能？

1. 在不暂停数据库的情况下创建热InnoDB备份
2. 对 MySQL 进行增量备份
3. 将压缩的MySQL备份流式传输到另一台服务器
4. 在线在MySQL服务器之间移动表
5. 轻松创建新的 MySQL 复制副本
6. 在不增加服务器负载的情况下备份MySQL
7. 备份锁是 Percona Server 5.6+ 中提供的轻量级替代方案。Percona XtraBackup会自动使用它们来复制非InnoDB数据，以避免阻止修改InnoDB表的DML查询。FLUSH TABLES WITH READ LOCK
8. Percona XtraBackup 根据每秒 IO 操作数执行限制。
9. Percona XtraBackup会跳过二级索引页，并在准备紧凑备份时重新创建它们。
10. Percona XtraBackup甚至可以从完整备份中导出单个表，无论InnoDB版本如何。
11. 使用 Percona XtraBackup 导出的表可以导入到 Percona Server 5.1、5.5 或 5.6+ 或 MySQL 5.6+ 中。

