---
title: "Mysql Xtrabackup 极简教程"
date: 2024-04-18T16:25:36+08:00
lastmod: 2024-04-18T16:25:36+08:00
draft: false
tags: ["mysql", "极简教程"]
categories: ["mysql"]
author: "百里"
comment: false
toc: true
reward: true
---

## 什么是 Xtrabackup

- 官网: <https://docs.percona.com/>
  
Xtrabackup 是 Percona 开发的一个开源工具，用于 MySQL 数据库的物理热备份。它可以在不锁表的情况下备份 InnoDB 和 XtraDB 存储引擎。

## 安装

### CentOS/RHEL

```bash
# 安装 Percona 仓库
yum install https://repo.percona.com/yum/percona-release-latest.noarch.rpm
# 安装 xtrabackup
yum install percona-xtrabackup-80
```

### Ubuntu/Debian

```bash
# 添加仓库
wget https://repo.percona.com/apt/percona-release_latest.generic_all.deb
dpkg -i percona-release_latest.generic_all.deb
apt update
# 安装 xtrabackup
apt install percona-xtrabackup-80
```

## 基本使用

### 1. 完整备份

```bash
# 创建备份目录
mkdir -p /backup/mysql

# 执行完整备份(备份所有数据库，包括 mysql, sys 等系统库)
xtrabackup --backup \
  --user=root \
  --password=your_password \
  --target-dir=/backup/mysql/full_backup_$(date +%Y%m%d_%H%M%S)

# 指定数据库
xtrabackup --backup \
  --user=root \
  --password=your_password \
  --databases="db1 db2" \
  --target-dir=/backup/mysql/full_backup_$(date +%Y%m%d_%H%M%S)
```

### 2. 准备备份（必须步骤）

```bash
# 准备备份，使数据一致（恢复准备用的）
xtrabackup --prepare --target-dir=/backup/mysql/full_backup_20240101_120000
```

### 3. 恢复备份

```bash
# 停止 MySQL 服务
systemctl stop mysqld

# 清空数据目录（谨慎操作！）
rm -rf /var/lib/mysql/*

# 恢复数据
xtrabackup --copy-back --target-dir=/backup/mysql/full_backup_20240101_120000

# 修复权限
chown -R mysql:mysql /var/lib/mysql

# 启动 MySQL 服务
systemctl start mysqld
```

## 增量备份

### 1. 创建基础备份

```bash
xtrabackup --backup \
  --user=root \
  --password=your_password \
  --target-dir=/backup/mysql/base
```

### 2. 创建增量备份

```bash
# 第一次增量备份
xtrabackup --backup \
  --user=root \
  --password=your_password \
  --target-dir=/backup/mysql/inc1 \
  --incremental-basedir=/backup/mysql/base

# 第二次增量备份
xtrabackup --backup \
  --user=root \
  --password=your_password \
  --target-dir=/backup/mysql/inc2 \
  --incremental-basedir=/backup/mysql/inc1
```

### 3. 准备增量备份

```bash
# 准备基础备份
xtrabackup --prepare --apply-log-only --target-dir=/backup/mysql/base

# 应用增量备份
xtrabackup --prepare --apply-log-only --target-dir=/backup/mysql/base \
  --incremental-dir=/backup/mysql/inc1

xtrabackup --prepare --target-dir=/backup/mysql/base \
  --incremental-dir=/backup/mysql/inc2
```

## 实用脚本

### 自动化完整备份脚本

```bash
#!/bin/bash
# backup.sh

# 配置变量
BACKUP_DIR="/backup/mysql"
MYSQL_USER="backup_user"
MYSQL_PASSWORD="backup_password"
RETENTION_DAYS=7

# 创建备份目录
BACKUP_PATH="$BACKUP_DIR/full_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_PATH

# 执行备份
xtrabackup --backup \
  --user=$MYSQL_USER \
  --password=$MYSQL_PASSWORD \
  --target-dir=$BACKUP_PATH

# 检查备份是否成功
if [ $? -eq 0 ]; then
    echo "备份成功: $BACKUP_PATH"
    # 准备备份
    xtrabackup --prepare --target-dir=$BACKUP_PATH
    
    # 删除过期备份
    find $BACKUP_DIR -type d -name "full_*" -mtime +$RETENTION_DAYS -exec rm -rf {} \;
else
    echo "备份失败"
    exit 1
fi
```

## 常用参数说明

| 参数 | 说明 |
|------|------|
| `--backup` | 创建备份 |
| `--prepare` | 准备备份文件 |
| `--copy-back` | 恢复备份 |
| `--user` | MySQL 用户名 |
| `--password` | MySQL 密码 |
| `--host` | MySQL 主机地址 |
| `--port` | MySQL 端口 |
| `--target-dir` | 备份目标目录 |
| `--incremental-basedir` | 增量备份的基础目录 |
| `--incremental-dir` | 增量备份目录 |
| `--apply-log-only` | 仅应用日志，用于增量备份 |
| `--compress` | 压缩备份 |
| `--parallel` | 并行线程数 |

## 注意事项

1. **权限要求**: 备份用户需要 `RELOAD`, `LOCK TABLES`, `PROCESS`, `REPLICATION CLIENT` 权限
2. **存储空间**: 确保备份目录有足够的空间
3. **网络备份**: 可以通过 SSH 进行远程备份
4. **压缩备份**: 使用 `--compress` 参数可以节省存储空间
5. **并行备份**: 使用 `--parallel` 参数可以提高备份速度

## 监控备份

```bash
# 检查备份状态
tail -f /var/log/mysqld.log

# 验证备份完整性
xtrabackup --prepare --target-dir=/backup/mysql/your_backup_dir
```

## 🆘 故障排除

### 锁表相关问题

```bash
# 问题：备份时间过长导致锁表时间长
# 解决：使用并行和压缩
xtrabackup --backup --parallel=4 --compress

# 问题：MyISAM表导致业务中断
# 解决：使用--no-lock（但MyISAM数据可能不一致）
xtrabackup --backup --no-lock  # 风险：MyISAM表数据可能不一致

# 问题：锁等待超时
# 解决：设置合理的超时时间
xtrabackup --backup --lock-wait-timeout=60 --kill-long-queries-timeout=10
```

### 常见错误

- `Access denied`: 检查用户权限
- `No space left`: 检查磁盘空间
- `Cannot create file`: 检查目录权限
- `Version mismatch`: 确保 xtrabackup 版本与 MySQL 版本兼容
- `Lock wait timeout`: 有长查询阻塞，使用 `--kill-long-queries-timeout`

### 生产环境检查清单

```bash
# ✅ 备份前检查
1. 确认存储引擎类型（InnoDB vs MyISAM）
2. 检查磁盘空间是否充足
3. 确认备份用户权限正确
4. 选择合适的备份时间窗口
5. 确认是否可以在从库执行备份

# ✅ 备份中监控
1. 监控锁表时间（如有）
2. 观察系统I/O压力
3. 检查备份进度日志
4. 监控业务响应时间

# ✅ 备份后验证
1. 检查备份完整性
2. 验证备份文件大小合理
3. 测试恢复流程
4. 记录备份耗时和影响
```

## 🎯 总结：生产环境最佳实践

### 版本选择策略

- **MySQL 5.7**: 使用 `percona-xtrabackup-24`
- **MySQL 8.0**: 使用 `percona-xtrabackup-80`
- **混合环境**: 每个MySQL实例使用对应版本的Xtrabackup

### 热备份方案优先级

1. **🏆 首选方案**: 纯InnoDB + `--no-lock` = 真正的热备份
2. **🎯 推荐方案**: 从库备份，主库业务零影响  
3. **⚠️ 谨慎方案**: 主库混合引擎，选择低峰期备份
4. **❌ 避免方案**: 高峰期备份包含大量MyISAM表的数据库

### 版本兼容性核心要点

- **严格版本匹配**: MySQL 5.7只能使用Xtrabackup 2.4，MySQL 8.0只能使用Xtrabackup 8.0
- **不能跨版本**: MySQL 5.7的备份不能直接在MySQL 8.0上恢复
- **定期检查**: 升级MySQL时必须同时升级对应的Xtrabackup版本

通过正确的版本匹配和配置，Xtrabackup可以实现真正的热备份，让你的生产环境备份无忧！
