# INT6066 平台：Vercel + Prisma Postgres 部署

## 先准备项目

解压项目包，根目录选择包含 `package.json` 的 `int6066-design-studio` 文件夹。上传到自己的 GitHub / GitLab 仓库，再在 Vercel 选择 **Add New → Project** 导入。框架选择 **Next.js**，Node.js 推荐 **24.x**（[Vercel 官方支持说明](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)），部署命令已经写在 `vercel.json` 中，无需手动改动。

## 连接数据库

在该 Vercel 项目的 **Storage / Marketplace** 中添加 **Prisma Postgres**，并连接到这个项目。确认项目的环境变量中出现 `DATABASE_URL`，内容应以 `postgres://` 或 `postgresql://` 开头。它是数据库地址，不需要复制到网页代码里。

如果你的 Vercel 页面入口名称略有变化，找到 Prisma Postgres 集成并执行 Connect Project 即可。本项目使用 Prisma ORM 7 与 PostgreSQL 连接适配器。

## 添加两项环境变量

进入 **Settings → Environment Variables**：

| 名称 | 值 |
| --- | --- |
| `DATABASE_URL` | Prisma Postgres 集成提供的连接地址 |
| `SESSION_SECRET` | 新生成的至少 32 位随机字符串 |
| `TEACHER_PASSWORD` | `yinyin2948`（按照你指定的 Nicole 登录密码） |

生成随机字符串的方法：在有 Node.js 的电脑终端运行：

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

把结果填入 `SESSION_SECRET`。生产环境必须使用自己的随机值，不要保留 `.env.example` 的占位符。环境变量选择 **Production**；如也使用预览部署，另勾选 **Preview**。所有三个变量都只在服务器读取，教师密码不会写入学生端页面。

## 部署

连接数据库和保存环境变量后点击 Deploy / Redeploy。构建会依次检查配置、创建数据库表、22 个正式小组及独立的 Test 试用组、生成网站。后续部署只执行尚未应用的迁移，不清空学生记录。

如果第一次导入时还没连接数据库，首次构建可能提示缺少环境变量；补齐后重新部署即可。

## 课前检查

打开部署网址：

1. 首页应出现你提供的 Design Thinking 原图。
2. 点击 **Join your group**，下拉应包含全部 22 个正式组名、**Test**，以及 **Nicole · Teacher**。
3. 选择 Nicole，输入你的密码；教师页面应显示 22 个正式组和 Test，课程总人数仍为 132。
4. 选择 Test，用一个试用名字进入，分享一条观察；刷新页面确认记录仍在。
5. 教师打开这个组，可以看到观察并保存反馈。

学生第一次选择小组、填写姓名，就建立该用户。再次登录时选择同一组并使用同一个名字。系统会统一处理姓名的大小写和多余空格；正式组最多 6 人。没有预填学生名单，也没有自动分配学生。Test 供试用，不限制 6 人，其用户和记录不计入课程统计或班级导出。Nicole 可删除没有贡献记录的误注册身份，已经贡献的记录会保留。

## 不连接云端也能先看

安装 Node.js 22.12 或以上后，在项目根目录运行：

```sh
npm ci
npm run dev:local
```

浏览器打开 `http://127.0.0.1:3000`。它会启动本地 PostgreSQL 兼容数据库，保存位置是 `.local-data/`。本地预览与 Vercel 的正式数据库相互独立。本地教师登录同样选择 Nicole 并使用你指定的密码。

## 本版必填检查

网站用英文 Required / Optional 标明必填、选填。每名学生需要先保存至少一条个人观察。后续依次检查小组聚焦、学习者与情境、直接依据、未知及调查方法、关联依据的 pattern、选定的问题与学习目标、四部分定义、问题陈述与 HMW。

附件、来源补充、评论、解释与替代解释、教师反馈请求及下一步调查可不填写。空白的额外行可以保留；已经开始填写的行需要完成或删除。小组提交不要求等齐全部 6 人。

继续按钮、侧边栏和直接打开后续页面都会检查前置内容。返回修改仍然允许。教学截图使用独立演示数据库，项目包没有学生名单或演示账号。

## 当前交付范围

已经实现英文学生界面、22 个正式组和 Test 注册、个人观察、小组讨论、依据与未知、Empathize 完成检查、Define 引导、问题陈述与 HMW、版本提交、教师总览与反馈、个人反思、记录导出。多人共同字段有自动保存和冲突提示。

Ideate、Prototype、Test 在页面中呈现为课程后续阶段，本次没有实现这些阶段的编辑功能。网站不需要 AI API key；当前引导使用课程思考提示与可编辑句式模板。

项目包包含源代码、锁定的依赖清单、数据库结构、初始化迁移和测试。没有绑定你的 Vercel 账号，也没有真实生产数据库凭证。完成上述连接步骤，才会成为可供全班访问的正式网站。
