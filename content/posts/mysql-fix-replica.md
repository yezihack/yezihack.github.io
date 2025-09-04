---
title: "MySQL主从同步修复教程"
date: 2025-09-04T18:30:05+08:00
lastmod: 2025-09-04T18:30:05+08:00
draft: false
tags: ["mysql"]
categories: ["mysql"]
author: "百里"
comment: false
toc: true
reward: true
---

## 第一步：主库操作 - 备份数据

### 1.1 在主库服务器执行备份

```bash
# SSH 登录主库服务器 10.244.1.10
ssh root@10.244.1.10

# 执行备份命令（这个过程大约需要几分钟，取决于数据库大小）
mysqldump --single-transaction \
          --routines \
          --triggers \
          --master-data=2 \
          --set-gtid-purged=ON \
          --databases mybook \
          -u root -p > /tmp/mybook_backup_$(date +%Y%m%d_%H%M%S).sql

# 输入MySQL root密码
# 等待备份完成...
```

### 1.2 查看备份文件信息

```bash
# 查看备份文件中的GTID信息
head -50 /tmp/mybook_backup_*.sql | grep -A5 -B5 "GTID_PURGED"

# 你会看到类似这样的内容：
# SET @@GLOBAL.GTID_PURGED='3e11fa47-71ca-11e1-9e33-c80aa9429562:1-12345';
```

### 1.3 记录当前主库状态

```sql
# 登录主库MySQL
mysql -u root -p

# 查看当前主库状态
SHOW MASTER STATUS;

# 记录当前GTID
SELECT @@GLOBAL.gtid_executed;

# 退出MySQL
exit;
```

## 第二步：传输备份文件到从库

```bash
# 在主库服务器上，将备份文件传输到从库
scp /tmp/mybook_backup_*.sql root@从库IP:/tmp/

# 或者如果从库可以直接访问主库文件系统，可以直接复制
```

## 第三步：从库操作 - 停止同步并清理

### 3.1 登录从库服务器

```bash
# SSH 登录从库服务器
ssh root@从库IP
```

### 3.2 停止从库同步

```sql
# 登录从库MySQL
mysql -u root -p

# 查看当前同步状态
SHOW SLAVE STATUS\G

# 停止同步
STOP SLAVE;

# 重置从库配置
RESET SLAVE ALL;
```

### 3.3 检查从库当前数据状态

```sql
# 查看mybook数据库大小（可选）
SELECT 
    SCHEMA_NAME as '数据库',
    ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as 'DB大小(MB)'
FROM information_schema.SCHEMATA s
LEFT JOIN information_schema.TABLES t ON s.SCHEMA_NAME = t.TABLE_SCHEMA
WHERE s.SCHEMA_NAME = 'mybook'
GROUP BY SCHEMA_NAME;

# 退出MySQL准备恢复数据
exit;
```

## 第四步：恢复备份数据

### 4.1 恢复mybook数据库

```bash
# 恢复备份（这个过程可能需要一些时间）
mysql -u root -p mybook < /tmp/mybook_backup_*.sql

# 输入MySQL root密码
# 等待恢复完成...
```

### 4.2 验证恢复结果

```sql
# 重新登录MySQL
mysql -u root -p

# 检查恢复的数据
USE mybook;
SHOW TABLES;

# 检查一些关键表的记录数（替换为你的实际表名）
SELECT COUNT(*) FROM your_table_name;

# 查看恢复后的GTID状态
SELECT @@GLOBAL.gtid_executed;
SELECT @@GLOBAL.gtid_purged;
```

## 第五步：重新配置主从同步

### 5.1 设置GTID信息

```sql
# 重置主库信息
RESET MASTER;

# 从备份文件中找到的GTID_PURGED值设置到从库
# 注意：这里的值要从步骤1.2中记录的备份文件里获取
SET GLOBAL gtid_purged='3e11fa47-71ca-11e1-9e33-c80aa9429562:1-12345';
```

### 5.2 重新建立主从连接

```sql
# 配置主从连接
CHANGE MASTER TO 
    MASTER_HOST='10.244.1.10',
    MASTER_PORT=3306,
    MASTER_USER='repl',
    MASTER_PASSWORD='xxx',
    MASTER_AUTO_POSITION=1;

# 启动同步
START SLAVE;
```

### 5.3 检查同步状态

```sql
# 检查同步状态
SHOW SLAVE STATUS\G

# 重点关注这些字段：
# Slave_IO_Running: Yes
# Slave_SQL_Running: Yes
# Last_IO_Errno: 0
# Last_SQL_Errno: 0
# Seconds_Behind_Master: 数字（应该逐渐减小）
```

## 第六步：验证同步是否正常

### 6.1 在主库测试写入

```sql
# 在主库执行
USE mybook;

# 创建测试表或在现有表插入测试数据
CREATE TABLE sync_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    test_data VARCHAR(100)
);

INSERT INTO sync_test (test_data) VALUES ('同步测试数据');
```

### 6.2 在从库验证

```sql
# 在从库执行
USE mybook;

# 等待几秒后查看数据是否同步
SELECT * FROM sync_test;

# 如果能看到刚才插入的数据，说明同步正常
```

## 第七步：预防措施配置

### 7.1 调整日志保留时间

```sql
# 在主库执行，增加二进制日志保留时间
SET GLOBAL expire_logs_days = 30;

# 持久化配置，编辑 /etc/my.cnf
# 添加：expire_logs_days = 30
```

### 7.2 设置监控脚本

```bash
# 创建监控脚本 /usr/local/bin/check_slave.sh
#!/bin/bash
RESULT=$(mysql -e "SHOW SLAVE STATUS\G" | grep -E "(Slave_IO_Running|Slave_SQL_Running|Seconds_Behind_Master)")
echo "$(date): $RESULT"

# 如果延迟超过300秒发送告警
LAG=$(mysql -e "SHOW SLAVE STATUS\G" | grep "Seconds_Behind_Master" | awk '{print $2}')
if [ "$LAG" -gt 300 ] 2>/dev/null; then
    echo "WARNING: MySQL slave lag is $LAG seconds" | logger
fi

# 设置定时任务
# crontab -e
# */5 * * * * /usr/local/bin/check_slave.sh >> /var/log/mysql_slave_check.log
```

## 操作时间估算

- 第1步（主库备份）：5-30分钟（取决于数据库大小）
- 第2步（文件传输）：1-10分钟（取决于网络和文件大小）  
- 第3-4步（从库恢复）：5-30分钟（取决于数据库大小）
- 第5-6步（重建同步）：1-5分钟
- 总计：大约15-75分钟

## 注意事项

1. **备份期间**：主库性能可能略有下降，但不会停止服务
2. **恢复期间**：从库暂时无法提供读服务
3. **数据一致性**：恢复完成后从库会自动追赶主库的最新数据
4. **监控**：整个过程中密切关注主库的CPU和IO使用率
