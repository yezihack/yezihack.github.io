---
title: "MySQL InnoDB 紧急修复指南"
date: 2025-12-04T17:41:06+08:00
lastmod: 2025-12-04T17:41:06+08:00
draft: false
tags: ["mysql", "innodb", "错误"]
categories: ["mysql"]
author: "百里"
comment: false
toc: true
reward: true
---

## 一、什么是 innodb_force_recovery？

当 InnoDB 引擎因为损坏、undo/redo 异常、元数据不一致而无法启动时，你可以使用：

```
innodb_force_recovery = <0~6>
```

让 MySQL “带病启动”，然后尽快把数据导出来。

它不是修复器，它是：

> **给你一次只启动、不执行危险操作的机会，让你把数据抢救出来。**

---

## 二、六个等级：从温柔到残酷

`innodb_force_recovery` 有 0–6 共七个值（0 为正常模式），
越高越危险，越可能导致数据丢失。

下面我做一份你可以直接贴到办公桌前的表：

| 等级    | 含义                    | 风险  | 常见场景             |
| ----- | --------------------- | --- | ---------------- |
| **0** | 正常                    | 无风险 | MySQL 正常恢复或不需要强制 |
| **1** | 跳过后台清理（最安全）           | 极低  | 崩溃恢复失败、InnoDB 卡住 |
| **2** | 禁止主线程运行，跳过一些后台任务      | 低   | undo 回滚卡死        |
| **3** | 关闭 redo 日志应用（危险）      | 中高  | redo 损坏，无法启动     |
| **4** | 忽略 undo 日志（很危险）       | 高   | undo 损坏、无法回滚事务   |
| **5** | 禁止检查线程、跳过大部分恢复        | 很高  | 数据字典存在问题         |
| **6** | 跳过绝大多数 InnoDB 处理（灾难级） | 极高  | 最后孤注一掷的方式        |

**请记住：3 以上就是“带血的刀”，必须谨慎。**
**6 是“最后的绝唱”。启动起来但不要对其做任何写入。**

---

## 三、什么时候该用？判断标准很简单

如果你看到：

### **MySQL 启动失败，错误日志出现：**

* `InnoDB: corruption`
* `InnoDB: redo log is corrupted`
* `InnoDB: unable to find tablespace`
* `InnoDB: invalid undo`
* `Got signal 6/11`
* `Data Dictionary corruption`

那么，你需要它。

但记住：

> **目标不是“修”，而是“能启动，然后导出数据”。**

---

## 四、常见故障 → 应该用哪个等级？

下面是实战经验总结，非常好用。

---

### **① 场景：InnoDB 崩溃恢复卡住（常见）**

错误示例：

```txt
InnoDB: Starting crash recovery...
InnoDB: Stuck in apply redo log
```

✔ **建议使用：1 或 2**

它会跳过一些后台清理，让你顺利启动。

---

### **② 场景：redo log 损坏**

错误示例：

```txt
InnoDB: redo log corrupted
```

✔ **建议使用：3**

因为 3 会绕过 redo 应用。

⚠ 注意：
启动后数据可能不一致，但你能 dump。

---

### **③ 场景：undo log 损坏**

错误示例：

```txt
InnoDB: Invalid undo log
```

✔ **建议使用：4**

它会跳过 undo 回滚。

---

### **④ 场景：数据字典（Data Dictionary）坏了**

错误示例：

```txt
InnoDB: Data Dictionary corruption
```

✔ 使用：**5 或 6**

这是最糟糕的情况，可能需要导出残余表结构并重建实例。

---

## 五、操作流程（最关键部分）

### 第一步：修改 MySQL 配置文件

在 my.cnf 中加入：

```ini
[mysqld]
innodb_force_recovery = 1
```

根据实际情况换 1-6。

---

### **第二步：启动 MySQL**

```bash
systemctl start mysqld
```

或

```bash
service mysql start
```

---

### 第三步：立刻导出数据库（最重要的动作）

**导出全库**

```bash
mysqldump -u root -p --all-databases > full_dump.sql
```

**导出指定数据库**

```bash
# 单个数据库
mysqldump -u root -p dbname > db_$(date +%T).sql

# 多个数据库
mysqldump -u root -p --databases db1 db2 db3 > dbs_$(date +%T).sql
```

**导出单表**

```bash
mysqldump dbname table_name > table.sql
```

这是你“救命”的关键步骤。

---

### 第四步：尝试修复 MySQL

```bash
# 查看所有表状态
CHECK TABLE db.table;

# 查看 InnoDB 状态（非常重要）
SHOW ENGINE INNODB STATUS\G

# * 哪个表空间损坏
# * 哪个 index 出问题
# * 哪个事务卡住

# 检查所有数据库的表
mysqlcheck -uroot -p --all-databases --check

# 如果发现问题，尝试修复
mysqlcheck -uroot -p --all-databases --repair

# 或者针对特定数据库
mysqlcheck -uroot -p --repair <database_name>

# 恢复单表 .ibd 文件（file_per_table = ON）

ALTER TABLE table_name DISCARD TABLESPACE;
ALTER TABLE table_name IMPORT TABLESPACE;


```

### 第五步：重建数据实例

- 如果修复失败，你需要重建数据实例。

```bash
# 创建新实例
mysqld --initialize-insecure --user=mysql

# 启动新实例
systemctl start mysqld

# 导入全库
mysql < full_dump.sql
```

