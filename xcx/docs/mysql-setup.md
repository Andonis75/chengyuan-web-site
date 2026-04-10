# 小程序后端 MySQL 切换说明

当前 `xcx/server` 默认仍使用 SQLite 作为本地开发库，但已经补齐了 MySQL 切换命令，方便后续部署到正式环境。

## 1. 环境变量

可参考 [`.env.example`](D:/Projects/chengyuan-web/xcx/server/.env.example)：

```env
PORT=4300
DATABASE_URL="file:./dev.db"
DATABASE_URL_SQLITE="file:./dev.db"
DATABASE_URL_MYSQL="mysql://root:password@127.0.0.1:3306/chengyuan_xcx"
WECHAT_APP_ID=""
WECHAT_APP_SECRET=""
PDF_FONT_PATH=""
```

说明：

- `DATABASE_URL` 仍作为服务运行时默认连接串
- `DATABASE_URL_SQLITE` 用于本地 SQLite Prisma 命令
- `DATABASE_URL_MYSQL` 用于 MySQL Prisma 命令

## 2. 常用命令

SQLite 开发：

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

MySQL 初始化：

```bash
npm run prisma:generate:mysql
npm run db:push:mysql
npm run db:seed:mysql
```

或直接：

```bash
npm run setup:mysql
```

说明：

- `db:seed` / `db:seed:mysql` 在执行种子前会先生成对应目标库的 Prisma Client
- 这样在 SQLite 与 MySQL 之间切换时，不会出现 client 与目标连接串不匹配的问题

## 3. 切换机制

- Prisma schema 模板位于 `xcx/server/prisma/schema.template.prisma`
- 执行不同命令时，会先临时渲染出目标数据源对应的 `xcx/server/prisma/.schema.generated.prisma`
- 仓库内保留的 `xcx/server/prisma/schema.prisma` 继续作为默认 SQLite 开发参考文件
- 当前支持目标：
  - `sqlite`
  - `mysql`

## 4. 注意事项

- 当前运行中的 Express 服务仍由 `DATABASE_URL` 决定实际连接库
- 如果要让服务直接连 MySQL，请把 `DATABASE_URL` 改成 MySQL 连接串后再启动服务
- `db:seed:mysql` 会向 MySQL 写入与 SQLite 一致的演示种子数据
- 目前 Prisma 模型保持跨 SQLite / MySQL 的通用字段设计，未引入特定数据库专属类型
