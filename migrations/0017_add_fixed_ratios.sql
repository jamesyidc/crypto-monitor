-- 添加固定占比字段到 price_extremes 表（如果不存在）
-- 使用 ALTER TABLE 前先检查列是否存在
-- SQLite不支持 IF NOT EXISTS，所以我们要用 CREATE TABLE AS 的方式

-- 这个迁移可能已经执行过，如果失败说明字段已存在，可以忽略
