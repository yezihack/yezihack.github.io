---
title: "Mysql 异常处理"
date: 2024-04-23T15:19:49+08:00
lastmod: 2024-04-23T15:19:49+08:00
draft: true
tags: ["mysql"]
categories: ["mysql"]
author: "百里"
comment: false
toc: true
reward: true
---

## 语法错误

### ERROR 1064 (42000)

```sh
CHANGE MASTER TO
  MASTER_HOST="localhost",
  MASTER_PORT=3306
  MASTER_USER="repl",
  MASTER_PASSWORD="your_repl_password",
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=1,
  MASTER_CONNECT_RETRY=30;
ERROR 1064 (42000):
```
