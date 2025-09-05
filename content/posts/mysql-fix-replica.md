---
title: "MySQL 主从同步修复完整指南"
date: 2025-09-04T18:30:05+08:00
lastmod: 2025-09-05T10:18:41+08:00
draft: false
tags: ["mysql", "主从同步", "数据库运维", "GTID"]
categories: ["mysql", "数据库"]
author: "百里"
comment: false
toc: true
reward: true
description: "详细介绍 MySQL 主从同步修复的完整流程，包含每个命令的执行位置和参数说明"
---

MySQL 主从同步是保证数据高可用性的重要技术。当主从同步出现问题时，需要通过重新同步来修复。本文将详细介绍修复流程，明确标注每个命令的执行位置。

## 环境说明

- **主库服务器**：10.244.1.10（Master）
- **从库服务器**：从库IP（Slave）
- **数据库**：mybook
- **同步方式**：基于 GTID 的主从同步

## 第一步：主库操作 - 备份数据

### 1.1 登录主库服务器并执行备份

**执行位置：主库服务器（10.244.1.10）**

```bash
# 1. SSH 登录主库服务器
ssh root@10.244.1.10

# 2. 执行 mysqldump 备份命令
mysqldump --single-transaction \
          --routines \
          --triggers \
          --master-data=2 \
          --set-gtid-purged=ON \
          --databases mybook \
          -u root -p > /tmp/mybook_backup_$(date +%Y%m%d_%H%M%S).sql

# 输入 MySQL root 密码后等待备份完成...
```

**参数说明：**

| 参数 | 说明 |
|------|------|
| `--single-transaction` | 保证备份的一致性，适用于 InnoDB 表 |
| `--routines` | 备份存储过程和函数 |
| `--triggers` | 备份触发器 |
| `--master-data=2` | 在备份文件中记录二进制日志位置信息（注释形式） |
| `--set-gtid-purged=ON` | 在备份文件中包含 GTID 信息 |
| `--databases mybook` | 指定要备份的数据库名称 |
| `-u root -p` | 使用 root 用户连接，提示输入密码 |

### 1.2 查看备份文件信息

**执行位置：主库服务器（10.244.1.10）**

```bash
# 查看备份文件中的 GTID 信息
head -50 /tmp/mybook_backup_*.sql | grep -A5 -B5 "GTID_PURGED"

# 输出示例：
# -- GTID state at the beginning of the backup 
# SET @@GLOBAL.GTID_PURGED='3e11fa47-71ca-11e1-9e33-c80aa9429562:1-12345';
```

**参数说明：**

| 参数 | 说明 |
|------|------|
| `head -50` | 显示文件前 50 行 |
| `grep -A5 -B5` | 显示匹配行及前后各 5 行 |
| `"GTID_PURGED"` | 搜索 GTID 相关信息 |

### 1.3 记录当前主库状态

**执行位置：主库服务器（10.244.1.10）**

```sql
-- 登录主库 MySQL
mysql -u root -p

-- 查看当前主库状态
SHOW MASTER STATUS;
-- 输出示例：
-- +------------------+----------+--------------+------------------+-------------------------------------------+
-- | File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set                         |
-- +------------------+----------+--------------+------------------+-------------------------------------------+
-- | mysql-bin.000123 |     1234 |              |                  | 3e11fa47-71ca-11e1-9e33-c80aa9429562:1-12345 |
-- +------------------+----------+--------------+------------------+-------------------------------------------+

-- 记录当前 GTID 执行集合
SELECT @@GLOBAL.gtid_executed;

-- 退出 MySQL
exit;
```

**SQL 命令说明：**

| 命令 | 说明 |
|------|------|
| `SHOW MASTER STATUS` | 显示主库当前二进制日志文件和位置信息 |
| `@@GLOBAL.gtid_executed` | 显示已执行的 GTID 集合 |

## 第二步：传输备份文件到从库

**执行位置：主库服务器（10.244.1.10）**

```bash
# 方法1：使用 scp 传输备份文件到从库
scp /tmp/mybook_backup_*.sql root@从库IP:/tmp/

# 方法2：如果从库可以直接访问主库文件系统，可以直接复制
# cp /tmp/mybook_backup_*.sql /共享存储路径/
```

**参数说明：**

| 参数 | 说明 |
|------|------|
| `scp` | 安全复制协议，用于在服务器间传输文件 |
| `/tmp/mybook_backup_*.sql` | 源文件路径，* 为通配符 |
| `root@从库IP:/tmp/` | 目标服务器用户@IP:目标路径 |

## 第三步：从库操作 - 停止同步并清理

### 3.1 登录从库服务器

**执行位置：从库服务器**

```bash
# SSH 登录从库服务器
ssh root@从库IP
```

### 3.2 停止从库同步

**执行位置：从库服务器**

```sql
-- 登录从库 MySQL
mysql -u root -p

-- 查看当前同步状态
SHOW SLAVE STATUS\G

-- 停止同步进程
STOP SLAVE;

-- 重置从库配置（清除主库连接信息）
RESET SLAVE ALL;
```

**SQL 命令说明：**

| 命令 | 说明 |
|------|------|
| `SHOW SLAVE STATUS\G` | 显示从库同步状态详细信息，\G 表示垂直显示 |
| `STOP SLAVE` | 停止 IO 线程和 SQL 线程 |
| `RESET SLAVE ALL` | 重置所有从库配置，包括连接信息和中继日志 |

### 3.3 检查从库当前数据状态

**执行位置：从库服务器**

```sql
-- 查看 mybook 数据库大小（可选）
SELECT 
    SCHEMA_NAME as '数据库',
    ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as 'DB大小(MB)'
FROM information_schema.SCHEMATA s
LEFT JOIN information_schema.TABLES t ON s.SCHEMA_NAME = t.TABLE_SCHEMA
WHERE s.SCHEMA_NAME = 'mybook'
GROUP BY SCHEMA_NAME;

-- 查看当前 GTID 状态
SELECT @@GLOBAL.gtid_executed;
SELECT @@GLOBAL.gtid_purged;

-- 退出 MySQL 准备恢复数据
exit;
```

## 第四步：恢复备份数据

### 4.1 恢复 mybook 数据库

**执行位置：从库服务器**

```bash
# 恢复备份数据到 mybook 数据库
mysql -u root -p mybook < /tmp/mybook_backup_*.sql

# 输入 MySQL root 密码后等待恢复完成...
```

**参数说明：**

| 参数 | 说明 |
|------|------|
| `mysql -u root -p` | 使用 root 用户连接 MySQL |
| `mybook` | 目标数据库名称 |
| `< /tmp/mybook_backup_*.sql` | 从备份文件导入数据 |

### 4.2 验证恢复结果

**执行位置：从库服务器**

```sql
-- 重新登录 MySQL
mysql -u root -p

-- 检查恢复的数据
USE mybook;
SHOW TABLES;

-- 检查关键表的记录数（替换为实际表名）
SELECT COUNT(*) FROM your_table_name;

-- 查看恢复后的 GTID 状态
SELECT @@GLOBAL.gtid_executed;
SELECT @@GLOBAL.gtid_purged;

-- 查看数据库大小确认恢复完整性
SELECT 
    SCHEMA_NAME as '数据库',
    ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as 'DB大小(MB)'
FROM information_schema.SCHEMATA s
LEFT JOIN information_schema.TABLES t ON s.SCHEMA_NAME = t.TABLE_SCHEMA
WHERE s.SCHEMA_NAME = 'mybook'
GROUP BY SCHEMA_NAME;
```

## 第五步：重新配置主从同步

### 5.1 设置 GTID 信息

**执行位置：从库服务器**

```sql
-- 重置主库信息（清除之前的二进制日志位置信息）
RESET MASTER;

-- 设置 GTID_PURGED 值（使用步骤 1.2 中记录的值）
-- 注意：这里的值必须从备份文件中获取
SET GLOBAL gtid_purged='3e11fa47-71ca-11e1-9e33-c80aa9429562:1-12345';
```

**SQL 命令说明：**

| 命令 | 说明 |
|------|------|
| `RESET MASTER` | 清除从库的二进制日志，重置日志索引 |
| `SET GLOBAL gtid_purged` | 设置已清除的 GTID 集合，告诉从库哪些事务已经执行过 |

### 5.2 重新建立主从连接

**执行位置：从库服务器**

```sql
-- 配置主从连接参数
CHANGE MASTER TO 
    MASTER_HOST='10.244.1.10',
    MASTER_PORT=3306,
    MASTER_USER='repl',
    MASTER_PASSWORD='xxx',
    MASTER_AUTO_POSITION=1;

-- 启动主从同步
START SLAVE;
```

**参数说明：**

| 参数 | 说明 |
|------|------|
| `MASTER_HOST` | 主库服务器 IP 地址 |
| `MASTER_PORT` | 主库 MySQL 端口号（默认 3306） |
| `MASTER_USER` | 用于复制的用户名 |
| `MASTER_PASSWORD` | 复制用户的密码 |
| `MASTER_AUTO_POSITION=1` | 启用基于 GTID 的自动定位 |

### 5.3 检查同步状态

**执行位置：从库服务器**

```sql
-- 检查同步状态详细信息
SHOW SLAVE STATUS\G

-- 重点关注以下字段：
-- Slave_IO_Running: Yes        (IO 线程运行状态)
-- Slave_SQL_Running: Yes       (SQL 线程运行状态)
-- Last_IO_Errno: 0             (IO 错误号，0 表示无错误)
-- Last_SQL_Errno: 0            (SQL 错误号，0 表示无错误)
-- Seconds_Behind_Master: 数字   (延迟秒数，应该逐渐减小)
-- Retrieved_Gtid_Set: GTID集合  (已接收的 GTID)
-- Executed_Gtid_Set: GTID集合   (已执行的 GTID)
```

## 第六步：验证同步是否正常

### 6.1 在主库测试写入

**执行位置：主库服务器（10.244.1.10）**

```sql
-- 登录主库 MySQL
mysql -u root -p

-- 使用 mybook 数据库
USE mybook;

-- 创建测试表
CREATE TABLE sync_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    test_data VARCHAR(100)
);

-- 插入测试数据
INSERT INTO sync_test (test_data) VALUES ('同步测试数据');

-- 查看插入的数据
SELECT * FROM sync_test;
```

### 6.2 在从库验证同步

**执行位置：从库服务器**

```sql
-- 登录从库 MySQL
mysql -u root -p

-- 使用 mybook 数据库
USE mybook;

-- 等待几秒后查看数据是否同步
SELECT * FROM sync_test;

-- 如果能看到刚才插入的数据，说明同步正常
-- 可以继续插入更多测试数据验证实时同步
```

## 第七步：预防措施和监控配置

### 7.1 调整主库日志保留时间

**执行位置：主库服务器（10.244.1.10）**

```sql
-- 登录主库 MySQL
mysql -u root -p

-- 增加二进制日志保留时间（设置为30天）
SET GLOBAL expire_logs_days = 30;

-- 查看当前设置
SHOW VARIABLES LIKE 'expire_logs_days';

-- 退出 MySQL
exit;
```

**持久化配置：**

```bash
# 编辑 MySQL 配置文件
vim /etc/my.cnf

# 在 [mysqld] 段添加：
# expire_logs_days = 30

# 重启 MySQL 服务使配置生效
systemctl restart mysql
```

### 7.2 设置从库监控脚本

**执行位置：从库服务器**

```bash
# 创建监控脚本目录
mkdir -p /usr/local/bin

# 创建监控脚本
cat > /usr/local/bin/check_slave.sh << 'EOF'
#!/bin/bash

# MySQL 连接参数
MYSQL_USER="root"
MYSQL_PASS="your_password"

# 获取同步状态
RESULT=$(mysql -u${MYSQL_USER} -p${MYSQL_PASS} -e "SHOW SLAVE STATUS\G" 2>/dev/null | grep -E "(Slave_IO_Running|Slave_SQL_Running|Seconds_Behind_Master)")

# 记录日志
echo "$(date '+%Y-%m-%d %H:%M:%S'): $RESULT"

# 检查延迟
LAG=$(mysql -u${MYSQL_USER} -p${MYSQL_PASS} -e "SHOW SLAVE STATUS\G" 2>/dev/null | grep "Seconds_Behind_Master" | awk '{print $2}')

# 如果延迟超过300秒发送告警
if [ "$LAG" != "NULL" ] && [ "$LAG" -gt 300 ] 2>/dev/null; then
    echo "$(date '+%Y-%m-%d %H:%M:%S'): WARNING - MySQL slave lag is $LAG seconds" | logger -t mysql_slave
    # 可以在这里添加邮件或短信告警
fi

# 检查同步线程状态
IO_RUNNING=$(mysql -u${MYSQL_USER} -p${MYSQL_PASS} -e "SHOW SLAVE STATUS\G" 2>/dev/null | grep "Slave_IO_Running" | awk '{print $2}')
SQL_RUNNING=$(mysql -u${MYSQL_USER} -p${MYSQL_PASS} -e "SHOW SLAVE STATUS\G" 2>/dev/null | grep "Slave_SQL_Running" | awk '{print $2}')

if [ "$IO_RUNNING" != "Yes" ] || [ "$SQL_RUNNING" != "Yes" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S'): ERROR - Slave threads not running: IO=$IO_RUNNING, SQL=$SQL_RUNNING" | logger -t mysql_slave
fi
EOF

# 设置脚本执行权限
chmod +x /usr/local/bin/check_slave.sh

# 创建日志目录
mkdir -p /var/log/mysql

# 设置定时任务（每5分钟检查一次）
crontab -e
# 添加以下行：
# */5 * * * * /usr/local/bin/check_slave.sh >> /var/log/mysql/slave_check.log 2>&1
```

**脚本参数说明：**

| 参数 | 说明 |
|------|------|
| `MYSQL_USER` | MySQL 连接用户名 |
| `MYSQL_PASS` | MySQL 连接密码 |
| `LAG` | 从库延迟秒数 |
| `logger -t mysql_slave` | 将消息写入系统日志，标签为 mysql_slave |

### 7.3 设置告警通知

**执行位置：从库服务器**

```bash
# 创建邮件告警脚本（可选）
cat > /usr/local/bin/mysql_alert.sh << 'EOF'
#!/bin/bash

ALERT_EMAIL="admin@example.com"
SUBJECT="MySQL Slave Alert"
MESSAGE="$1"

# 发送邮件告警
echo "$MESSAGE" | mail -s "$SUBJECT" "$ALERT_EMAIL"

# 或者使用企业微信、钉钉等 API 发送告警
# curl -X POST "your_webhook_url" -d "{'text':'$MESSAGE'}"
EOF

chmod +x /usr/local/bin/mysql_alert.sh
```

## 常见问题排查

### 问题1：GTID_PURGED 设置失败

**错误信息：** `ERROR 1840 (HY000): @@GLOBAL.GTID_PURGED can only be set when @@GLOBAL.GTID_EXECUTED is empty`

**解决方法：**

```sql
-- 执行位置：从库服务器
RESET MASTER;
SET GLOBAL gtid_purged='your_gtid_set';
```

### 问题2：同步用户权限不足

**错误信息：** `Access denied for user 'repl'@'%'`

**解决方法：**

```sql
-- 执行位置：主库服务器
CREATE USER 'repl'@'%' IDENTIFIED BY 'password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;
```

### 问题3：网络连接问题

**错误信息：** `Can't connect to MySQL server on '10.244.1.10'`

**排查步骤：**

```bash
# 执行位置：从库服务器
# 1. 测试网络连通性
ping 10.244.1.10

# 2. 测试端口连通性
telnet 10.244.1.10 3306

# 3. 检查防火墙设置
iptables -L | grep 3306
```

## 操作时间估算

| 步骤 | 预估时间 | 影响 |
|------|----------|------|
| 第1步（主库备份） | 5-30分钟 | 主库性能略有下降 |
| 第2步（文件传输） | 1-10分钟 | 网络带宽占用 |
| 第3-4步（从库恢复） | 5-30分钟 | 从库暂停服务 |
| 第5-6步（重建同步） | 1-5分钟 | 从库追赶数据 |
| **总计** | **15-75分钟** | **从库停服时间** |

## 重要注意事项

### 操作前准备

1. **通知相关人员**：提前通知应用团队从库维护时间
2. **备份验证**：确保主库备份文件完整性
3. **网络检查**：确保主从服务器网络连通正常
4. **权限确认**：验证复制用户权限正确

### 操作中监控

1. **主库性能**：监控 CPU、内存、IO 使用率
2. **网络状况**：关注带宽使用情况
3. **磁盘空间**：确保备份文件存储空间充足
4. **错误日志**：实时查看 MySQL 错误日志

### 操作后验证

1. **数据一致性**：对比主从库关键表数据
2. **同步延迟**：监控 `Seconds_Behind_Master` 指标
3. **应用测试**：验证读写分离功能正常
4. **监控告警**：确认监控脚本正常工作

## 总结

MySQL 主从同步修复是一个需要谨慎操作的过程。通过本指南的详细步骤，可以安全有效地修复主从同步问题。关键要点：

1. **明确执行位置**：每个命令都标注了在主库还是从库执行
2. **理解参数含义**：详细说明了每个参数的作用
3. **做好监控预防**：设置完善的监控和告警机制
4. **处理常见问题**：提供了常见错误的解决方案

定期检查主从同步状态，及时处理异常情况，能够有效保证数据库的高可用性。
