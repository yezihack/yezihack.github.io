---
title: "MySQL 多种部署方式"
date: 2024-04-10T15:44:00+08:00
lastmod: 2024-04-10T15:44:00+08:00
draft: false
tags: ["mysql", "docker", "k8s"]
categories: ["mysql"]
author: "百里"
comment: false
toc: true
reward: true
---

## MySQL 介绍

MySQL是一个快速、可靠、可扩展且易于使用的开源关系数据库系统。专为处理任务关键型重载生产应用而设计。

## 常用 MySQL 命令

```sh
# 查看 MySQL 版本信息
SELECT VERSION();

# 查看当前连接的用户和主机信息
SELECT USER(), CURRENT_USER(), @@hostname;

# 查看 MySQL 服务器启动时间
SHOW GLOBAL STATUS LIKE 'Uptime';

# 查看 MySQL 服务器当前运行的线程数
SHOW GLOBAL STATUS LIKE 'Threads_running';

# 查看 MySQL 数据库中当前可用的存储引擎
SHOW ENGINES;

# 查看 MySQL 数据库中当前正在运行的进程
SHOW PROCESSLIST;

# # 查看帐号列表
SELECT User, Host FROM mysql.user;

#### 方法一: 本地可访问
# 创建一个帐号和密码
CREATE USER 'deployer'@'localhost' IDENTIFIED BY 'new_password';

# 将数据库 Test 权限赋予给 deployer 帐号
GRANT ALL PRIVILEGES ON test.* TO 'deployer'@'localhost';

#### 方法一:任何连接可访问
CREATE USER 'deployer'@'%' IDENTIFIED BY 'new_password'; 
GRANT ALL PRIVILEGES ON test.* TO 'deployer'@'%'; 

# 刷新权限
FLUSH PRIVILEGES;
```

## 环境变量

### 可自定义的环境变量

| Name  | Description    | Default Value |
|---------|---------------|------------|
| `ALLOW_EMPTY_PASSWORD`          | Allow MySQL access without any password.                                                                                  | `no`          |
| `MYSQL_AUTHENTICATION_PLUGIN`   | MySQL authentication plugin to configure during the first initialization.                                                 | `nil`         |
| `MYSQL_ROOT_USER`               | MySQL database root user.                                                                                                 | `root`        |
| `MYSQL_ROOT_PASSWORD`           | MySQL database root user password.                                                                                        | `nil`         |
| `MYSQL_USER`                    | MySQL database user to create during the first initialization.                                                            | `nil`         |
| `MYSQL_PASSWORD`                | Password for the MySQL database user to create during the first initialization.                                           | `nil`         |
| `MYSQL_DATABASE`                | MySQL database to create during the first initialization.                                                                 | `nil`         |
| `MYSQL_MASTER_HOST`             | Address for the MySQL master node.                                                                                        | `nil`         |
| `MYSQL_MASTER_PORT_NUMBER`      | Port number for the MySQL master node.                                                                                    | `3306`        |
| `MYSQL_MASTER_ROOT_USER`        | MySQL database root user of the master host.                                                                              | `root`        |
| `MYSQL_MASTER_ROOT_PASSWORD`    | Password for the MySQL database root user of the the master host.                                                         | `nil`         |
| `MYSQL_MASTER_DELAY`            | MySQL database replication delay.                                                                                         | `0`           |
| `MYSQL_REPLICATION_USER`        | MySQL replication database user.                                                                                          | `nil`         |
| `MYSQL_REPLICATION_PASSWORD`    | Password for the MySQL replication database user.                                                                         | `nil`         |
| `MYSQL_PORT_NUMBER`             | Port number to use for the MySQL Server service.                                                                          | `nil`         |
| `MYSQL_REPLICATION_MODE`        | MySQL replication mode.                                                                                                   | `nil`         |
| `MYSQL_REPLICATION_SLAVE_DUMP`  | Make a dump on master and update slave MySQL database                                                                     | `false`       |
| `MYSQL_EXTRA_FLAGS`             | Extra flags to be passed to start the MySQL Server.                                                                       | `nil`         |
| `MYSQL_INIT_SLEEP_TIME`         | Sleep time when waiting for MySQL init configuration operations to finish.                                                | `nil`         |
| `MYSQL_CHARACTER_SET`           | MySQL collation to use.                                                                                                   | `nil`         |
| `MYSQL_COLLATE`                 | MySQL collation to use.                                                                                                   | `nil`         |
| `MYSQL_BIND_ADDRESS`            | MySQL bind address.                                                                                                       | `nil`         |
| `MYSQL_SQL_MODE`                | MySQL Server SQL modes to enable.                                                                                         | `nil`         |
| `MYSQL_IS_DEDICATED_SERVER`     | Whether the MySQL Server will run on a dedicated node.                                                                    | `nil`         |
| `MYSQL_CLIENT_ENABLE_SSL`       | Whether to force SSL for connections to the MySQL database.                                                               | `no`          |
| `MYSQL_CLIENT_SSL_CA_FILE`      | Path to CA certificate to use for SSL connections to the MySQL database server.                                           | `nil`         |
| `MYSQL_CLIENT_SSL_CERT_FILE`    | Path to client public key certificate to use for SSL connections to the MySQL database server.                            | `nil`         |
| `MYSQL_CLIENT_SSL_KEY_FILE`     | Path to client private key to use for SSL connections to the MySQL database server.                                       | `nil`         |
| `MYSQL_CLIENT_EXTRA_FLAGS`      | Whether to force SSL connections with the "mysql" CLI tool. Useful for applications that rely on the CLI instead of APIs. | `no`          |
| `MYSQL_STARTUP_WAIT_RETRIES`    | Number of retries waiting for the database to be running.                                                                 | `300`         |
| `MYSQL_STARTUP_WAIT_SLEEP_TIME` | Sleep time between retries waiting for the database to be running.                                                        | `2`           |
| `MYSQL_ENABLE_SLOW_QUERY`       | Whether to enable slow query logs.                                                                                        | `0`           |
| `MYSQL_LONG_QUERY_TIME`         | How much time, in seconds, defines a slow query.                                                                          | `10.0`        |

#### 只读环境变量

| Name                          | Description                                                | Value                         |
|-------------------------------|------------------------------------------------------------|-------------------------------|
| `DB_FLAVOR`                   | SQL database flavor. Valid values: `mariadb` or `mysql`.   | `mysql`                       |
| `DB_BASE_DIR`                 | Base path for MySQL files.                                 | `${BITNAMI_ROOT_DIR}/mysql`   |
| `DB_VOLUME_DIR`               | MySQL directory for persisted files.                       | `${BITNAMI_VOLUME_DIR}/mysql` |
| `DB_DATA_DIR`                 | MySQL directory for data files.                            | `${DB_VOLUME_DIR}/data`       |
| `DB_BIN_DIR`                  | MySQL directory where executable binary files are located. | `${DB_BASE_DIR}/bin`          |
| `DB_SBIN_DIR`                 | MySQL directory where service binary files are located.    | `${DB_BASE_DIR}/bin`          |
| `DB_CONF_DIR`                 | MySQL configuration directory.                             | `${DB_BASE_DIR}/conf`         |
| `DB_DEFAULT_CONF_DIR`         | MySQL default configuration directory.                     | `${DB_BASE_DIR}/conf.default` |
| `DB_LOGS_DIR`                 | MySQL logs directory.                                      | `${DB_BASE_DIR}/logs`         |
| `DB_TMP_DIR`                  | MySQL directory for temporary files.                       | `${DB_BASE_DIR}/tmp`          |
| `DB_CONF_FILE`                | Main MySQL configuration file.                             | `${DB_CONF_DIR}/my.cnf`       |
| `DB_PID_FILE`                 | MySQL PID file.                                            | `${DB_TMP_DIR}/mysqld.pid`    |
| `DB_SOCKET_FILE`              | MySQL Server socket file.                                  | `${DB_TMP_DIR}/mysql.sock`    |
| `DB_DAEMON_USER`              | Users that will execute the MySQL Server process.          | `mysql`                       |
| `DB_DAEMON_GROUP`             | Group that will execute the MySQL Server process.          | `mysql`                       |
| `MYSQL_DEFAULT_PORT_NUMBER`   | Default port number to use for the MySQL Server service.   | `3306`                        |
| `MYSQL_DEFAULT_CHARACTER_SET` | Default MySQL character set.                               | `utf8mb4`                     |
| `MYSQL_DEFAULT_BIND_ADDRESS`  | Default MySQL bind address.                                | `0.0.0.0`                     |

## 快速部署单实例

> 查看更多版本的 mysql: <https://hub.docker.com/r/bitnami/mysql/tags>

- 生成强密码 <https://suijimimashengcheng.bmcx.com/>

一 、docker 命令部署

```sh
# 不推荐空密码
docker run --name mysql -e ALLOW_EMPTY_PASSWORD=yes bitnami/mysql:8.0.36

# 推荐使用强密码
docker run -d --name mysql -e MYSQL_ROOT_PASSWORD="强密码" bitnami/mysql:8.0.36
docker run -d --name mysql -e MYSQL_ROOT_PASSWORD="BbtpmPOYQN52lp72" bitnami/mysql:8.0.36
```

二 、docker 命令持久化数据部署

```sh
mkdir -p /tmp/mysql-persistence

# 授权
chown -R 1001:root /tmp/mysql-persistence

# 查看权限
ls -ld /tmp/mysql-persistence

# 创建网络名称
docker network create app-tier --driver bridge

# 查看网络
docker network ls app-tier

# 运行容器
docker run -d \
    --name mysql-storage \
    --network app-tier \
    -e MYSQL_ROOT_PASSWORD="BbtpmPOYQN52lp72" \
    -v /tmp/mysql-persistence:/bitnami/mysql/data \
    bitnami/mysql:8.0.36

# 查看
docker logs mysql-storage

# 创建一个客户端连接
docker run -it --rm \
    --network app-tier \
    bitnami/mysql:8.0.36 mysql -h mysql-storage -u root -p

# 删除
rm -rf  /tmp/mysql-persistence/*
docker rm -f mysql-storage
```

三、docker-compose 部署

```yaml
version: '2'

networks:
  app-tier:
    driver: bridge

services:
  mysql:
    image: 'bitnami/mysql:8.0.36'
    environment:
      - MYSQL_ROOT_PASSWORD="BbtpmPOYQN52lp72"
    networks:
      - app-tier
  myapp:
    image: 'YOUR_APPLICATION_IMAGE'
    networks:
      - app-tier
```

运行: `docker-compose up -d`

## 主从群集

使用以下环境变量，可以使用 Bitnami MySQL Docker 映像轻松设置零停机 MySQL 主从复制集群：

- MYSQL_REPLICATION_MODE：复制模式。可能的值 /。无默认值。masterslave
- MYSQL_REPLICATION_USER：首次运行时在主服务器上创建的复制用户。无默认值。
- MYSQL_REPLICATION_PASSWORD：复制用户密码。无默认值。
- MYSQL_MASTER_HOST：复制主站的主机名/IP（从站参数）。无默认值。
- MYSQL_MASTER_PORT_NUMBER：复制主服务器的服务器端口（slave 参数）。默认值为 。3306
- MYSQL_MASTER_ROOT_USER：复制主服务器上有权访问（从属参数）的用户。默认值为- MYSQL_DATABASEroot
- MYSQL_MASTER_ROOT_PASSWORD：具有访问权限的复制主服务器上的用户密码（从参数）。无默认值。- MYSQL_DATABASE
- MYSQL_MASTER_DELAY：数据库复制延迟（从参数）。默认值为 。0

在复制集群中，可以有一个主节点和零个或多个从节点。启用复制后，主节点处于读写模式，而从节点处于只读模式。为了获得最佳性能，建议将读取限制为从站。

### 步骤 1：创建复制主服务器

第一步是启动MySQL master

```sh
docker run -d --name mysql-master \
  -e MYSQL_ROOT_PASSWORD=sxFCQH63JfF18xnw \
  -e MYSQL_REPLICATION_MODE=master \
  -e MYSQL_REPLICATION_USER=my_repl_user \
  -e MYSQL_REPLICATION_PASSWORD=lMklMMV448U8Y365 \
  -e MYSQL_USER=my_user \
  -e MYSQL_PASSWORD=RRSRhe32uucc00RV \
  -e MYSQL_DATABASE=my_poor \
  bitnami/mysql:8.0.36
```

步骤 2：创建复制从属

```sh
docker run -d --name mysql-slave --link mysql-master:master \
  -e MYSQL_REPLICATION_MODE=slave \
  -e MYSQL_REPLICATION_USER=my_repl_user \
  -e MYSQL_REPLICATION_PASSWORD=lMklMMV448U8Y365 \
  -e MYSQL_MASTER_HOST=mysql-master \
  -e MYSQL_MASTER_ROOT_PASSWORD=sxFCQH63JfF18xnw \
  bitnami/mysql:8.0.36
```



## 参考文档

- <https://github.com/bitnami/containers/tree/main/bitnami/mysql>

