---
title: "Jenkins Pipeline 完全入门指南：从零到精通"
date: 2025-12-24T19:29:35+08:00
lastmod: 2025-12-24T19:29:35+08:00
draft: false
tags: ["k8s", "jenkins", "cicd", "devops", "gitops"]
categories: ["k8s"]
author: "百里"
comment: false
toc: true
reward: true
---

> 用声明式和脚本式 Pipeline 打造强大的 CI/CD 流水线

## 目录
- [Pipeline 基础概念](#pipeline-基础概念)
- [两种语法对比](#两种语法对比)
- [声明式 Pipeline 详解](#声明式-pipeline-详解)
- [脚本式 Pipeline 详解](#脚本式-pipeline-详解)
- [实战案例集合](#实战案例集合)
- [常用语法速查](#常用语法速查)
- [最佳实践](#最佳实践)

---

## Pipeline 基础概念

### 什么是 Jenkins Pipeline？

Pipeline 是 Jenkins 2.0 引入的一套插件，将 CI/CD 流程定义为代码（Pipeline as Code），存储在 `Jenkinsfile` 中。

**核心优势**:
- ✅ **版本控制**: Jenkinsfile 随代码一起管理
- ✅ **可复用**: 共享库机制
- ✅ **可视化**: Blue Ocean 界面
- ✅ **容错性**: 自动重试和错误处理
- ✅ **并行执行**: 加速构建过程

### Pipeline 的核心组件

```
Pipeline (流水线)
    │
    ├── Stage (阶段): 逻辑分组，如 "构建"、"测试"、"部署"
    │       │
    │       └── Step (步骤): 具体的执行命令
    │
    ├── Agent (执行器): 定义在哪里运行
    │
    └── Post (后置操作): 构建后的清理、通知等
```

---

## 两种语法对比

### 1. 声明式 Pipeline (Declarative)

**特点**: 结构化、易读、适合 90% 场景

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                echo 'Building...'
            }
        }
    }
}
```

### 2. 脚本式 Pipeline (Scripted)

**特点**: 灵活、编程化、适合复杂逻辑

```groovy
node {
    stage('Build') {
        echo 'Building...'
    }
}
```

### 如何选择？

| 场景 | 推荐语法 | 原因 |
|------|---------|------|
| 标准 CI/CD 流程 | 声明式 | 结构清晰，易维护 |
| 复杂条件判断 | 脚本式 | 完整的 Groovy 语法 |
| 团队协作 | 声明式 | 统一规范 |
| 快速原型 | 脚本式 | 灵活快速 |
| **初学者** | **声明式** | **学习曲线平缓** |

---

## 声明式 Pipeline 详解

### 基础结构

```groovy
pipeline {
    // 1. 指定执行节点
    agent any
    
    // 2. 环境变量
    environment {
        APP_NAME = 'my-app'
        VERSION = '1.0.0'
    }
    
    // 3. 参数化构建
    parameters {
        string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch to build')
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'prod'], description: 'Deployment environment')
    }
    
    // 4. 构建触发器
    triggers {
        cron('H 2 * * *')  // 每天凌晨 2 点
        pollSCM('H/5 * * * *')  // 每 5 分钟检查一次代码变更
    }
    
    // 5. 构建选项
    options {
        timeout(time: 1, unit: 'HOURS')  // 超时设置
        buildDiscarder(logRotator(numToKeepStr: '10'))  // 保留最近 10 次构建
        disableConcurrentBuilds()  // 禁止并发构建
        timestamps()  // 显示时间戳
    }
    
    // 6. 定义阶段
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/yourorg/repo.git'
            }
        }
        
        stage('Build') {
            steps {
                sh 'mvn clean package'
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
            }
        }
        
        stage('Deploy') {
            steps {
                sh './deploy.sh'
            }
        }
    }
    
    // 7. 后置操作
    post {
        always {
            echo 'Pipeline finished'
        }
        success {
            echo 'Build succeeded!'
        }
        failure {
            echo 'Build failed!'
        }
    }
}
```

---

### Agent 详解

#### 1. 在任意可用节点运行
```groovy
pipeline {
    agent any
    // ...
}
```

#### 2. 使用特定标签的节点
```groovy
pipeline {
    agent {
        label 'linux && docker'
    }
    // ...
}
```

#### 3. 在 Docker 容器中运行
```groovy
pipeline {
    agent {
        docker {
            image 'maven:3.8.6-openjdk-11'
            args '-v /tmp:/tmp'
        }
    }
    stages {
        stage('Build') {
            steps {
                sh 'mvn --version'
            }
        }
    }
}
```

#### 4. 使用 Dockerfile 构建镜像
```groovy
pipeline {
    agent {
        dockerfile {
            filename 'Dockerfile.build'
            dir 'docker'
            additionalBuildArgs '--build-arg VERSION=1.0'
        }
    }
    // ...
}
```

#### 5. 不同 Stage 使用不同 Agent
```groovy
pipeline {
    agent none  // 全局不指定
    
    stages {
        stage('Build') {
            agent {
                docker 'maven:3.8.6'
            }
            steps {
                sh 'mvn clean package'
            }
        }
        
        stage('Test') {
            agent {
                docker 'node:18'
            }
            steps {
                sh 'npm test'
            }
        }
    }
}
```

---

### Environment 环境变量

```groovy
pipeline {
    agent any
    
    environment {
        // 1. 全局环境变量
        APP_NAME = 'my-application'
        BUILD_VERSION = "${env.BUILD_NUMBER}"
        
        // 2. 使用凭据
        DOCKER_CREDENTIALS = credentials('docker-hub-credentials')
        // 自动生成: DOCKER_CREDENTIALS_USR 和 DOCKER_CREDENTIALS_PSW
        
        // 3. 使用 SSH 密钥
        SSH_KEY = credentials('ssh-private-key')
        
        // 4. 动态变量
        GIT_COMMIT_SHORT = sh(
            script: "git rev-parse --short HEAD",
            returnStdout: true
        ).trim()
    }
    
    stages {
        stage('Print Env') {
            steps {
                echo "App: ${APP_NAME}"
                echo "Version: ${BUILD_VERSION}"
                echo "Commit: ${GIT_COMMIT_SHORT}"
                
                // 打印所有环境变量
                sh 'env | sort'
            }
        }
        
        stage('Docker Login') {
            steps {
                sh '''
                    echo $DOCKER_CREDENTIALS_PSW | docker login -u $DOCKER_CREDENTIALS_USR --password-stdin
                '''
            }
        }
    }
    
    // 也可以在 stage 级别定义
    stage('Deploy') {
        environment {
            DEPLOY_ENV = 'production'
        }
        steps {
            echo "Deploying to ${DEPLOY_ENV}"
        }
    }
}
```

**常用内置环境变量**:
```groovy
BUILD_NUMBER       // 构建号: 123
BUILD_ID           // 构建 ID: 2024-01-01_12-30-45
BUILD_URL          // 构建 URL: http://jenkins/job/myjob/123/
JOB_NAME           // 任务名称: my-project
WORKSPACE          // 工作空间路径: /var/jenkins/workspace/my-project
GIT_COMMIT         // Git commit hash
GIT_BRANCH         // Git 分支: origin/main
NODE_NAME          // 节点名称: agent-01
```

---

### Parameters 参数化构建

```groovy
pipeline {
    agent any
    
    parameters {
        // 1. 字符串参数
        string(
            name: 'VERSION',
            defaultValue: '1.0.0',
            description: 'Version to deploy'
        )
        
        // 2. 文本域（多行）
        text(
            name: 'DEPLOY_NOTES',
            defaultValue: 'Release notes here...',
            description: 'Deployment notes'
        )
        
        // 3. 布尔值
        booleanParam(
            name: 'RUN_TESTS',
            defaultValue: true,
            description: 'Run tests before deploy'
        )
        
        // 4. 选择框
        choice(
            name: 'ENVIRONMENT',
            choices: ['dev', 'staging', 'production'],
            description: 'Target environment'
        )
        
        // 5. 密码（隐藏显示）
        password(
            name: 'API_KEY',
            defaultValue: '',
            description: 'API Key for deployment'
        )
    }
    
    stages {
        stage('Display Parameters') {
            steps {
                echo "Version: ${params.VERSION}"
                echo "Environment: ${params.ENVIRONMENT}"
                echo "Run Tests: ${params.RUN_TESTS}"
            }
        }
        
        stage('Conditional Test') {
            when {
                expression { params.RUN_TESTS == true }
            }
            steps {
                echo 'Running tests...'
                sh 'npm test'
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                    if (params.ENVIRONMENT == 'production') {
                        input message: 'Deploy to Production?', ok: 'Deploy'
                    }
                }
                sh "./deploy.sh ${params.ENVIRONMENT} ${params.VERSION}"
            }
        }
    }
}
```

---

### When 条件执行

```groovy
pipeline {
    agent any
    
    stages {
        // 1. 基于分支
        stage('Deploy to Prod') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying to production'
            }
        }
        
        // 2. 基于环境变量
        stage('Nightly Build') {
            when {
                environment name: 'BUILD_TYPE', value: 'nightly'
            }
            steps {
                echo 'Running nightly build'
            }
        }
        
        // 3. 基于表达式
        stage('Performance Test') {
            when {
                expression { params.RUN_PERF_TEST == true }
            }
            steps {
                sh 'run-perf-tests.sh'
            }
        }
        
        // 4. 基于变更的文件
        stage('Frontend Build') {
            when {
                changeset "frontend/**"
            }
            steps {
                sh 'cd frontend && npm run build'
            }
        }
        
        // 5. 组合条件
        stage('Deploy to Staging') {
            when {
                allOf {
                    branch 'develop'
                    environment name: 'DEPLOY_STAGING', value: 'true'
                }
            }
            steps {
                echo 'Deploying to staging'
            }
        }
        
        // 6. 或条件
        stage('Notify') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                echo 'Sending notification'
            }
        }
        
        // 7. 非条件
        stage('Skip on PR') {
            when {
                not {
                    changeRequest()
                }
            }
            steps {
                echo 'Not a pull request'
            }
        }
    }
}
```

---

### Parallel 并行执行

```groovy
pipeline {
    agent any
    
    stages {
        stage('Parallel Tests') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm run test:unit'
                    }
                }
                
                stage('Integration Tests') {
                    steps {
                        sh 'npm run test:integration'
                    }
                }
                
                stage('E2E Tests') {
                    steps {
                        sh 'npm run test:e2e'
                    }
                }
            }
        }
        
        // 带 agent 的并行
        stage('Multi-platform Build') {
            parallel {
                stage('Linux Build') {
                    agent {
                        label 'linux'
                    }
                    steps {
                        sh './build-linux.sh'
                    }
                }
                
                stage('Windows Build') {
                    agent {
                        label 'windows'
                    }
                    steps {
                        bat 'build-windows.bat'
                    }
                }
                
                stage('macOS Build') {
                    agent {
                        label 'macos'
                    }
                    steps {
                        sh './build-macos.sh'
                    }
                }
            }
        }
    }
}
```

---

### Post 后置操作

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'make build'
            }
        }
    }
    
    post {
        // 总是执行
        always {
            echo 'Cleaning up workspace'
            deleteDir()
        }
        
        // 构建成功时
        success {
            echo 'Build succeeded!'
            
            // 发送邮件通知
            emailext (
                subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "Check console output at ${env.BUILD_URL}",
                to: 'team@example.com'
            )
            
            // 发送 Slack 通知
            slackSend (
                color: 'good',
                message: "Build succeeded: ${env.JOB_NAME} ${env.BUILD_NUMBER}"
            )
        }
        
        // 构建失败时
        failure {
            echo 'Build failed!'
            
            emailext (
                subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "Check console output at ${env.BUILD_URL}",
                to: 'team@example.com'
            )
        }
        
        // 构建不稳定时（测试失败但编译成功）
        unstable {
            echo 'Build is unstable'
        }
        
        // 构建状态改变时
        changed {
            echo 'Build status changed'
        }
        
        // 构建被中止时
        aborted {
            echo 'Build was aborted'
        }
        
        // 清理操作
        cleanup {
            echo 'Final cleanup'
            sh 'docker system prune -f'
        }
    }
}
```

---

## 脚本式 Pipeline 详解

### 基础结构

```groovy
node('linux') {  // 指定节点
    
    // 定义变量
    def appName = 'my-app'
    def version = '1.0.0'
    
    try {
        stage('Checkout') {
            checkout scm
        }
        
        stage('Build') {
            sh "echo Building ${appName} version ${version}"
            sh 'mvn clean package'
        }
        
        stage('Test') {
            sh 'mvn test'
        }
        
        stage('Deploy') {
            input message: 'Deploy to production?', ok: 'Deploy'
            sh './deploy.sh'
        }
        
        // 成功通知
        currentBuild.result = 'SUCCESS'
        
    } catch (Exception e) {
        currentBuild.result = 'FAILURE'
        throw e
    } finally {
        // 清理操作
        deleteDir()
    }
}
```

### 高级流程控制

```groovy
node {
    stage('Complex Logic') {
        
        // 1. 条件判断
        def branch = env.BRANCH_NAME
        if (branch == 'main') {
            echo 'Building main branch'
        } else if (branch.startsWith('feature/')) {
            echo 'Building feature branch'
        } else {
            echo 'Building other branch'
        }
        
        // 2. 循环
        def environments = ['dev', 'staging', 'prod']
        for (env in environments) {
            echo "Deploying to ${env}"
            sh "./deploy.sh ${env}"
        }
        
        // 3. Switch 语句
        def action = params.ACTION
        switch(action) {
            case 'build':
                sh 'make build'
                break
            case 'test':
                sh 'make test'
                break
            case 'deploy':
                sh 'make deploy'
                break
            default:
                error "Unknown action: ${action}"
        }
        
        // 4. 异常处理
        try {
            sh 'risky-command'
        } catch (Exception e) {
            echo "Command failed: ${e.message}"
            // 继续执行不中断
        }
        
        // 5. 重试机制
        retry(3) {
            sh 'flaky-test.sh'
        }
        
        // 6. 超时控制
        timeout(time: 5, unit: 'MINUTES') {
            sh 'long-running-task.sh'
        }
    }
}
```

---

## 实战案例集合

### 案例 1: Java Maven 项目 CI/CD

```groovy
pipeline {
    agent {
        docker {
            image 'maven:3.8.6-openjdk-11'
            args '-v $HOME/.m2:/root/.m2'  // 挂载 Maven 本地仓库
        }
    }
    
    environment {
        MAVEN_OPTS = '-Xmx1024m'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }
        
        stage('Unit Test') {
            steps {
                sh 'mvn test'
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml'
                }
            }
        }
        
        stage('Code Coverage') {
            steps {
                sh 'mvn jacoco:report'
            }
            post {
                always {
                    jacoco(
                        execPattern: '**/target/jacoco.exec',
                        classPattern: '**/target/classes',
                        sourcePattern: '**/src/main/java'
                    )
                }
            }
        }
        
        stage('Package') {
            steps {
                sh 'mvn package -DskipTests'
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'mvn sonar:sonar'
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    def image = docker.build("myregistry/myapp:${env.BUILD_NUMBER}")
                    docker.withRegistry('https://myregistry.com', 'docker-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Dev') {
            steps {
                sh '''
                    kubectl set image deployment/myapp \
                        myapp=myregistry/myapp:${BUILD_NUMBER} \
                        -n development
                '''
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                sh '''
                    kubectl set image deployment/myapp \
                        myapp=myregistry/myapp:${BUILD_NUMBER} \
                        -n production
                '''
            }
        }
    }
    
    post {
        success {
            emailext (
                subject: "✅ Build Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <p>Build <a href="${env.BUILD_URL}">#${env.BUILD_NUMBER}</a> succeeded!</p>
                    <p>Branch: ${env.GIT_BRANCH}</p>
                    <p>Commit: ${env.GIT_COMMIT}</p>
                """,
                to: 'dev-team@example.com',
                mimeType: 'text/html'
            )
        }
        failure {
            emailext (
                subject: "❌ Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Build failed. Check ${env.BUILD_URL}",
                to: 'dev-team@example.com'
            )
        }
    }
}
```

---

### 案例 2: Node.js 前端项目

```groovy
pipeline {
    agent {
        docker {
            image 'node:18-alpine'
        }
    }
    
    environment {
        CI = 'true'
        npm_config_cache = 'npm-cache'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm run test:unit -- --coverage'
                    }
                }
                
                stage('E2E Tests') {
                    steps {
                        sh 'npm run test:e2e'
                    }
                }
            }
            post {
                always {
                    publishHTML([
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Deploy to S3') {
            when {
                branch 'main'
            }
            steps {
                withAWS(credentials: 'aws-credentials', region: 'us-east-1') {
                    s3Upload(
                        bucket: 'my-static-website',
                        path: '',
                        includePathPattern: '**/*',
                        workingDir: 'dist'
                    )
                }
            }
        }
        
        stage('Invalidate CloudFront') {
            when {
                branch 'main'
            }
            steps {
                withAWS(credentials: 'aws-credentials', region: 'us-east-1') {
                    cfInvalidate(
                        distribution: 'E1234567890ABC',
                        paths: ['/*']
                    )
                }
            }
        }
    }
}
```

---

### 案例 3: Docker 多阶段构建

```groovy
pipeline {
    agent any
    
    environment {
        REGISTRY = 'myregistry.com'
        IMAGE_NAME = 'my-app'
        DOCKER_BUILDKIT = '1'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Image') {
            steps {
                script {
                    def gitCommit = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    
                    def imageTags = [
                        "${env.BUILD_NUMBER}",
                        gitCommit,
                        'latest'
                    ]
                    
                    // 构建镜像
                    def image = docker.build(
                        "${REGISTRY}/${IMAGE_NAME}:${env.BUILD_NUMBER}",
                        "--build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') " +
                        "--build-arg VCS_REF=${gitCommit} " +
                        "--build-arg VERSION=${env.BUILD_NUMBER} " +
                        "."
                    )
                    
                    // 推送多个标签
                    docker.withRegistry("https://${REGISTRY}", 'docker-credentials') {
                        imageTags.each { tag ->
                            image.push(tag)
                        }
                    }
                    
                    // 保存镜像名用于后续阶段
                    env.DOCKER_IMAGE = "${REGISTRY}/${IMAGE_NAME}:${env.BUILD_NUMBER}"
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh """
                    trivy image --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        ${env.DOCKER_IMAGE}
                """
            }
        }
        
        stage('Deploy to K8s') {
            steps {
                withKubeConfig([credentialsId: 'kubeconfig']) {
                    sh """
                        kubectl set image deployment/myapp \
                            myapp=${env.DOCKER_IMAGE} \
                            -n production
                        
                        kubectl rollout status deployment/myapp -n production
                    """
                }
            }
        }
    }
    
    post {
        always {
            sh 'docker system prune -f'
        }
    }
}
```

---

### 案例 4: 多分支流水线

```groovy
pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'make build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'make test'
            }
        }
        
        // Feature 分支：只构建和测试
        stage('Feature Branch Tasks') {
            when {
                branch 'feature/*'
            }
            steps {
                echo 'Running feature branch tasks'
                sh 'make integration-test'
            }
        }
        
        // Develop 分支：部署到开发环境
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                sh './deploy.sh dev'
            }
        }
        
        // Main 分支：部署到生产环境
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy', submitter: 'admin'
                
                sh './deploy.sh production'
                
                // 创建 Git Tag
                sh """
                    git tag -a v${env.BUILD_NUMBER} -m "Release ${env.BUILD_NUMBER}"
                    git push origin v${env.BUILD_NUMBER}
                """
            }
        }
        
        // Pull Request：额外的检查
        stage('PR Checks') {
            when {
                changeRequest()
            }
            steps {
                echo "Checking PR #${env.CHANGE_ID}"
                sh 'make lint'
                sh 'make security-scan'
                
                // 发布 PR 评论
                publishChecks name: 'Jenkins', title: 'Build Status', summary: 'Build completed successfully'
            }
        }
    }
}
```

---

### 案例 5: 使用共享库（Shared Library）

```groovy
// Jenkinsfile
@Library('my-shared-library@main') _

pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                script {
                    // 调用共享库中的函数
                    buildApp(
                        buildTool: 'maven',
                        javaVersion: '11'
                    )
                }
            }
        }
        
        stage('Test') {
            steps {
                script {
                    runTests(
                        testType: 'unit',
                        coverageThreshold: 80
                    )
                }
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                    deployToK8s(
                        environment: params.ENVIRONMENT,
                        namespace: 'production',
                        image: "myapp:${env.BUILD_NUMBER}"
                    )
                }
            }
        }
    }
    
    post {
        always {
            script {
                sendNotification(
                    status: currentBuild.result,
                    channel: '#ci-cd'
                )
            }
        }
    }
}
```

```groovy
// 共享库定义: vars/buildApp.groovy
def call(Map config) {
    echo "Building with ${config.buildTool}"
    
    if (config.buildTool == 'maven') {
        docker.image("maven:3.8-openjdk-${config.javaVersion}").inside {
            sh 'mvn clean package'
        }
    } else if (config.buildTool == 'gradle') {
        docker.image("gradle:7-jdk${config.javaVersion}").inside {
            sh 'gradle build'
        }
    }
}

// vars/deployToK8s.groovy
def call(Map config) {
    withKubeConfig([credentialsId: 'kubeconfig']) {
        sh """
            kubectl set image deployment/myapp \
                myapp=${config.image} \
                -n ${config.namespace}
            kubectl rollout status deployment/myapp -n ${config.namespace}
        """
    }
}
```

---

### 案例 6: 定时构建与清理

```groovy
pipeline {
    agent any
    
    // 定时触发：每天凌晨 2 点构建
    triggers {
        cron('0 2 * * *')
    }
    
    // 保留最近 30 天的构建记录
    options {
        buildDiscarder(logRotator(
            numToKeepStr: '30',
            daysToKeepStr: '30'
        ))
    }
    
    stages {
        stage('Nightly Build') {
            steps {
                echo 'Running nightly build'
                sh 'make clean all'
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh 'make integration-test'
            }
        }
        
        stage('Performance Tests') {
            steps {
                sh 'make performance-test'
            }
        }
        
        stage('Generate Reports') {
            steps {
                sh 'make reports'
                
                publishHTML([
                    reportDir: 'reports',
                    reportFiles: 'index.html',
                    reportName: 'Nightly Build Report'
                ])
            }
        }
        
        stage('Cleanup Old Builds') {
            steps {
                script {
                    // 清理超过 7 天的 Docker 镜像
                    sh '''
                        docker images --filter "dangling=true" -q | xargs -r docker rmi
                        docker images --filter "before=7d" -q | xargs -r docker rmi
                    '''
                    
                    // 清理旧的构建产物
                    sh 'find /var/jenkins/builds -mtime +7 -delete'
                }
            }
        }
    }
    
    post {
        always {
            // 发送每日构建报告
            emailext (
                subject: "Nightly Build Report - ${new Date().format('yyyy-MM-dd')}",
                body: '''${SCRIPT, template="groovy-html.template"}''',
                to: 'team@example.com',
                attachLog: true
            )
        }
    }
}
```

---

## 常用语法速查

### 1. Git 操作

```groovy
// 基础 checkout
checkout scm

// 指定分支
checkout([
    $class: 'GitSCM',
    branches: [[name: '*/main']],
    userRemoteConfigs: [[url: 'https://github.com/user/repo.git']]
])

// 使用凭据
checkout([
    $class: 'GitSCM',
    branches: [[name: '*/main']],
    userRemoteConfigs: [[
        url: 'https://github.com/user/repo.git',
        credentialsId: 'github-credentials'
    ]]
])

// 浅克隆（节省时间）
checkout([
    $class: 'GitSCM',
    branches: [[name: '*/main']],
    extensions: [[$class: 'CloneOption', depth: 1, shallow: true]],
    userRemoteConfigs: [[url: 'https://github.com/user/repo.git']]
])

// 获取 Git 信息
script {
    env.GIT_COMMIT_SHORT = sh(
        script: "git rev-parse --short HEAD",
        returnStdout: true
    ).trim()
    
    env.GIT_AUTHOR = sh(
        script: "git log -1 --pretty=format:'%an'",
        returnStdout: true
    ).trim()
}
```

---

### 2. 文件操作

```groovy
// 读取文件
def content = readFile 'config.json'
def json = readJSON text: content

// 写入文件
writeFile file: 'output.txt', text: 'Hello World'

// JSON 操作
def jsonData = readJSON text: '{"name": "value"}'
writeJSON file: 'data.json', json: jsonData

// YAML 操作
def yamlData = readYaml file: 'config.yaml'
writeYaml file: 'output.yaml', data: yamlData

// 文件存在检查
if (fileExists('Dockerfile')) {
    echo 'Dockerfile found'
}

// 目录操作
dir('subdir') {
    sh 'pwd'  // 在 subdir 中执行
}

// 删除文件/目录
sh 'rm -rf build/'
deleteDir()  // 删除当前工作目录所有内容
```

---

### 3. 凭据管理

```groovy
// 用户名密码
withCredentials([usernamePassword(
    credentialsId: 'docker-hub',
    usernameVariable: 'USERNAME',
    passwordVariable: 'PASSWORD'
)]) {
    sh 'docker login -u $USERNAME -p $PASSWORD'
}

// SSH 密钥
withCredentials([sshUserPrivateKey(
    credentialsId: 'ssh-key',
    keyFileVariable: 'SSH_KEY'
)]) {
    sh 'ssh -i $SSH_KEY user@server "deploy.sh"'
}

// Secret 文本
withCredentials([string(
    credentialsId: 'api-token',
    variable: 'API_TOKEN'
)]) {
    sh 'curl -H "Authorization: Bearer $API_TOKEN" api.example.com'
}

// Secret 文件
withCredentials([file(
    credentialsId: 'kubeconfig',
    variable: 'KUBECONFIG'
)]) {
    sh 'kubectl --kubeconfig=$KUBECONFIG get pods'
}

// 多个凭据
withCredentials([
    usernamePassword(credentialsId: 'db-creds', usernameVariable: 'DB_USER', passwordVariable: 'DB_PASS'),
    string(credentialsId: 'api-key', variable: 'API_KEY')
]) {
    sh './deploy.sh'
}
```

---

### 4. 错误处理

```groovy
// Try-Catch
try {
    sh 'risky-command'
} catch (Exception e) {
    echo "Error: ${e.message}"
    currentBuild.result = 'FAILURE'
} finally {
    echo 'Cleanup'
}

// 错误时继续
catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
    sh 'flaky-test.sh'
}

// 重试机制
retry(3) {
    sh 'curl https://api.example.com'
}

// 超时控制
timeout(time: 10, unit: 'MINUTES') {
    sh 'long-running-task.sh'
}

// 组合使用
timeout(time: 5, unit: 'MINUTES') {
    retry(3) {
        sh 'flaky-api-call.sh'
    }
}

// 自定义错误
if (condition) {
    error "Build failed: reason"
}

// 不稳定状态（黄色）
unstable "Tests failed but build continues"
```

---

### 5. 输入与审批

```groovy
// 简单输入
input message: 'Deploy to production?', ok: 'Deploy'

// 带参数的输入
def userInput = input(
    message: 'Select deployment target',
    parameters: [
        choice(name: 'ENV', choices: ['dev', 'staging', 'prod'], description: 'Environment'),
        string(name: 'VERSION', defaultValue: '1.0.0', description: 'Version')
    ]
)

echo "Deploying ${userInput.VERSION} to ${userInput.ENV}"

// 指定审批人
input(
    message: 'Approve production deployment?',
    ok: 'Deploy',
    submitter: 'admin,devops-team',
    submitterParameter: 'APPROVER'
)

// 超时的输入
timeout(time: 1, unit: 'HOURS') {
    input message: 'Proceed?'
}
```

---

### 6. 构建其他任务

```groovy
// 触发其他任务
build job: 'downstream-job'

// 带参数触发
build job: 'deploy-job', parameters: [
    string(name: 'ENV', value: 'production'),
    string(name: 'VERSION', value: env.BUILD_NUMBER)
]

// 等待完成
def result = build job: 'test-job', wait: true
echo "Downstream result: ${result.result}"

// 不等待完成
build job: 'async-job', wait: false

// 传播失败状态
build job: 'critical-job', propagate: true
```

---

### 7. Artifact 归档

```groovy
// 归档文件
archiveArtifacts artifacts: 'target/*.jar', fingerprint: true

// 归档多个文件
archiveArtifacts artifacts: '**/*.jar, **/*.war, reports/**/*'

// 只在成功时归档
archiveArtifacts artifacts: 'dist/**/*', allowEmptyArchive: true, onlyIfSuccessful: true

// 发布测试报告
junit 'target/surefire-reports/**/*.xml'
junit testResults: '**/test-results/*.xml', allowEmptyResults: true

// 发布 HTML 报告
publishHTML([
    reportDir: 'coverage',
    reportFiles: 'index.html',
    reportName: 'Coverage Report',
    keepAll: true,
    alwaysLinkToLastBuild: true
])

// 指纹识别（追踪文件）
fingerprint 'target/*.jar'
```

---

### 8. 通知

```groovy
// 邮件通知
emailext (
    subject: "Build ${currentBuild.result}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
    body: """
        <h2>Build ${currentBuild.result}</h2>
        <p>Job: ${env.JOB_NAME}</p>
        <p>Build: ${env.BUILD_NUMBER}</p>
        <p>URL: ${env.BUILD_URL}</p>
    """,
    to: 'team@example.com',
    mimeType: 'text/html',
    attachLog: true
)

// Slack 通知
slackSend (
    color: currentBuild.result == 'SUCCESS' ? 'good' : 'danger',
    message: "Build ${currentBuild.result}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
    channel: '#ci-cd',
    tokenCredentialId: 'slack-token'
)

// 企业微信通知
def webhookUrl = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx'
sh """
    curl -X POST ${webhookUrl} \
    -H 'Content-Type: application/json' \
    -d '{
        "msgtype": "text",
        "text": {
            "content": "构建状态: ${currentBuild.result}\\n任务: ${env.JOB_NAME}\\n链接: ${env.BUILD_URL}"
        }
    }'
"""
```

---

### 9. 动态 Stage

```groovy
pipeline {
    agent any
    stages {
        stage('Dynamic Stages') {
            steps {
                script {
                    def environments = ['dev', 'staging', 'prod']
                    
                    for (env in environments) {
                        stage("Deploy to ${env}") {
                            echo "Deploying to ${env}"
                            sh "./deploy.sh ${env}"
                        }
                    }
                }
            }
        }
    }
}

// 或者使用 parallel
script {
    def stages = [:]
    ['dev', 'staging', 'prod'].each { env ->
        stages["Deploy to ${env}"] = {
            node {
                sh "./deploy.sh ${env}"
            }
        }
    }
    parallel stages
}
```

---

### 10. Kubernetes 部署

```groovy
// 使用 kubectl
withKubeConfig([credentialsId: 'kubeconfig']) {
    sh '''
        kubectl apply -f k8s/deployment.yaml
        kubectl rollout status deployment/myapp
        kubectl get pods
    '''
}

// 使用 Helm
withKubeConfig([credentialsId: 'kubeconfig']) {
    sh """
        helm upgrade --install myapp ./chart \
            --set image.tag=${env.BUILD_NUMBER} \
            --namespace production \
            --wait --timeout 5m
    """
}

// 在 Pod 中运行
podTemplate(
    label: 'jenkins-slave',
    containers: [
        containerTemplate(name: 'maven', image: 'maven:3.8-jdk-11', ttyEnabled: true, command: 'cat'),
        containerTemplate(name: 'docker', image: 'docker:20-dind', privileged: true)
    ]
) {
    node('jenkins-slave') {
        container('maven') {
            sh 'mvn clean package'
        }
        container('docker') {
            sh 'docker build -t myapp .'
        }
    }
}
```

---

## 最佳实践

### 1. Jenkinsfile 组织结构

```
repo/
├── Jenkinsfile                 # 主流水线
├── jenkins/
│   ├── Jenkinsfile.dev        # 开发环境
│   ├── Jenkinsfile.prod       # 生产环境
│   └── shared/
│       ├── build.groovy       # 构建逻辑
│       ├── test.groovy        # 测试逻辑
│       └── deploy.groovy      # 部署逻辑
└── .jenkins/
    └── config.yaml            # 配置文件
```

---

### 2. 使用 @Library 共享代码

```groovy
// 项目 Jenkinsfile
@Library('company-pipeline-library@v1.0') _

standardPipeline {
    buildTool = 'maven'
    deployEnvironments = ['dev', 'staging', 'prod']
    notifications = ['slack': '#ci-cd', 'email': 'team@example.com']
}
```

```groovy
// 共享库: vars/standardPipeline.groovy
def call(body) {
    def config = [:]
    body.resolveStrategy = Closure.DELEGATE_FIRST
    body.delegate = config
    body()
    
    pipeline {
        agent any
        stages {
            stage('Build') {
                steps {
                    script {
                        buildWithTool(config.buildTool)
                    }
                }
            }
            // ... 其他标准化的 stage
        }
        post {
            always {
                script {
                    sendNotifications(config.notifications)
                }
            }
        }
    }
}
```

---

### 3. 参数化最佳实践

```groovy
properties([
    parameters([
        choice(
            name: 'DEPLOYMENT_TYPE',
            choices: ['rolling', 'blue-green', 'canary'],
            description: 'Deployment strategy'
        ),
        string(
            name: 'IMAGE_TAG',
            defaultValue: 'latest',
            description: 'Docker image tag',
            trim: true
        ),
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Skip testing phase'
        ),
        text(
            name: 'RELEASE_NOTES',
            defaultValue: '',
            description: 'Release notes for this deployment'
        )
    ]),
    
    // 定期清理旧构建
    buildDiscarder(logRotator(numToKeepStr: '10')),
    
    // 禁止并发构建
    disableConcurrentBuilds()
])

pipeline {
    agent any
    stages {
        stage('Validate Parameters') {
            steps {
                script {
                    if (!params.IMAGE_TAG) {
                        error "IMAGE_TAG cannot be empty"
                    }
                    
                    echo """
                        Deployment Configuration:
                        - Type: ${params.DEPLOYMENT_TYPE}
                        - Image: ${params.IMAGE_TAG}
                        - Skip Tests: ${params.SKIP_TESTS}
                    """
                }
            }
        }
        // ... 其他 stages
    }
}
```

---

### 4. 敏感信息处理

```groovy
pipeline {
    agent any
    
    environment {
        // ❌ 错误：明文密码
        // DB_PASSWORD = 'my-secret-password'
        
        // ✅ 正确：使用凭据
        DB_CREDENTIALS = credentials('database-credentials')
    }
    
    stages {
        stage('Deploy') {
            steps {
                script {
                    // 避免在日志中打印密码
                    withCredentials([
                        string(credentialsId: 'api-key', variable: 'API_KEY')
                    ]) {
                        // ❌ 错误：密码可能出现在日志中
                        // sh "echo API_KEY: $API_KEY"
                        
                        // ✅ 正确：隐藏敏感信息
                        sh '''
                            set +x  # 关闭命令回显
                            export API_KEY=$API_KEY
                            ./deploy.sh
                        '''
                    }
                }
            }
        }
    }
}
```

---

### 5. 性能优化技巧

```groovy
pipeline {
    agent {
        // 使用 Docker 缓存加速构建
        docker {
            image 'maven:3.8-jdk-11'
            args '-v $HOME/.m2:/root/.m2 -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    
    options {
        // 跳过默认的 checkout
        skipDefaultCheckout(true)
        
        // 设置超时
        timeout(time: 1, unit: 'HOURS')
        
        // 并发控制
        throttleJobProperty(
            categories: ['deployment'],
            throttleEnabled: true,
            throttleOption: 'category',
            maxConcurrentPerNode: 1,
            maxConcurrentTotal: 2
        )
    }
    
    stages {
        stage('Checkout') {
            steps {
                // 浅克隆节省时间
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    extensions: [
                        [$class: 'CloneOption', depth: 1, shallow: true],
                        [$class: 'CleanBeforeCheckout']
                    ],
                    userRemoteConfigs: [[url: env.GIT_URL]]
                ])
            }
        }
        
        stage('Parallel Build') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci && npm run build'
                        }
                    }
                }
            }
        }
    }
}
```

---

### 6. 日志与调试

```groovy
pipeline {
    agent any
    
    stages {
        stage('Debug Info') {
            steps {
                script {
                    // 打印环境变量
                    echo "=== Environment Variables ==="
                    sh 'env | sort'
                    
                    // 打印构建信息
                    echo """
                        Build Info:
                        - Job Name: ${env.JOB_NAME}
                        - Build Number: ${env.BUILD_NUMBER}
                        - Workspace: ${env.WORKSPACE}
                        - Git Branch: ${env.GIT_BRANCH}
                        - Git Commit: ${env.GIT_COMMIT}
                    """
                    
                    // 打印参数
                    echo "Parameters: ${params}"
                    
                    // 使用 timestamps
                    timestamps {
                        sh 'sleep 5'
                        echo 'This will have a timestamp'
                    }
                    
                    // 彩色输出（需要 AnsiColor 插件）
                    ansiColor('xterm') {
                        sh 'echo -e "\\e[31mRed text\\e[0m"'
                        sh 'echo -e "\\e[32mGreen text\\e[0m"'
                    }
                }
            }
        }
    }
}
```

---

### 7. 错误恢复策略

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build with Retry') {
            steps {
                retry(3) {
                    sh 'npm install'  // 网络问题可能需要重试
                }
            }
        }
        
        stage('Test with Timeout') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    sh 'npm test'
                }
            }
        }
        
        stage('Deploy with Fallback') {
            steps {
                script {
                    try {
                        sh './deploy-v2.sh'
                    } catch (Exception e) {
                        echo "V2 deployment failed: ${e.message}"
                        echo "Falling back to V1 deployment"
                        sh './deploy-v1.sh'
                    }
                }
            }
        }
        
        stage('Verification') {
            steps {
                script {
                    def maxRetries = 5
                    def retryCount = 0
                    def success = false
                    
                    while (retryCount < maxRetries && !success) {
                        try {
                            sh 'curl -f http://app/health'
                            success = true
                        } catch (Exception e) {
                            retryCount++
                            echo "Health check failed (${retryCount}/${maxRetries})"
                            if (retryCount < maxRetries) {
                                sleep 10
                            } else {
                                error "Application failed to start"
                            }
                        }
                    }
                }
            }
        }
    }
}
```

---

## 常见问题与解决方案

### Q1: Pipeline 超时或卡死

**问题**: Pipeline 长时间无响应

**解决**:
```groovy
pipeline {
    options {
        // 全局超时
        timeout(time: 2, unit: 'HOURS')
    }
    
    stages {
        stage('Potentially Slow Stage') {
            options {
                // Stage 级别超时
                timeout(time: 30, unit: 'MINUTES')
            }
            steps {
                sh 'long-running-command'
            }
        }
    }
}
```

---

### Q2: 并发构建冲突

**问题**: 多个构建同时运行导致资源冲突

**解决**:
```groovy
pipeline {
    options {
        // 禁止并发
        disableConcurrentBuilds()
        
        // 或者限制并发数
        throttleJobProperty(
            categories: ['deployment'],
            maxConcurrentPerNode: 1,
            maxConcurrentTotal: 2
        )
    }
}
```

---

### Q3: 工作空间清理

**问题**: 构建遗留文件导致问题

**解决**:
```groovy
pipeline {
    options {
        // 构建前清理工作空间
        skipDefaultCheckout(true)
    }
    
    stages {
        stage('Checkout') {
            steps {
                cleanWs()  // 清理工作空间
                checkout scm
            }
        }
    }
    
    post {
        always {
            cleanWs()  // 构建后清理
        }
    }
}
```

---

### Q4: Docker 缓存优化

**问题**: Docker 构建缓慢

**解决**:
```groovy
stage('Build Image') {
    steps {
        script {
            // 启用 BuildKit
            sh '''
                export DOCKER_BUILDKIT=1
                docker build \
                    --cache-from myapp:latest \
                    --build-arg BUILDKIT_INLINE_CACHE=1 \
                    -t myapp:${BUILD_NUMBER} .
            '''
        }
    }
}
```

---

## 学习资源

### 官方文档
- **Pipeline 语法**: https://www.jenkins.io/doc/book/pipeline/syntax/
- **Pipeline 步骤参考**: https://www.jenkins.io/doc/pipeline/steps/
- **最佳实践**: https://www.jenkins.io/doc/book/pipeline/best-practices/

### 实用工具
- **Pipeline Syntax Generator**: Jenkins → 任务 → Pipeline Syntax
- **Snippet Generator**: 生成常用代码片段
- **Declarative Directive Generator**: 生成声明式语法

### 社区资源
- GitHub: https://github.com/jenkinsci/pipeline-examples
- Stack Overflow: jenkins-pipeline 标签
- Jenkins 中文社区: https://jenkins-zh.cn

---

## 总结

### 快速参考卡片

```groovy
// 最小 Pipeline
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'make'
            }
        }
    }
}

// 完整 Pipeline 模板
pipeline {
    agent { docker 'maven:3.8-jdk-11' }
    
    environment {
        APP_NAME = 'myapp'
    }
    
    parameters {
        choice(name: 'ENV', choices: ['dev', 'prod'])
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'mvn clean package'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Test') {
                    steps { sh 'mvn test' }
                }
                stage('Integration Test') {
                    steps { sh 'mvn verify' }
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh "./deploy.sh ${params.ENV}"
            }
        }
    }
    
    post {
        success {
            echo 'Success!'
        }
        failure {
            echo 'Failed!'
        }
        always {
            cleanWs()
        }
    }
}
```

### 下一步学习路径

1. ✅ **基础**: 掌握声明式 Pipeline 核心语法
2. ✅ **进阶**: 学习脚本式 Pipeline 处理复杂逻辑
3. 📚 **高级**: 创建共享库实现代码复用
4. 🚀 **专家**: 结合 Kubernetes、GitOps 构建完整 CI/CD

**开始你的 Pipeline 之旅，让 CI/CD 自动化起来！** 🎉