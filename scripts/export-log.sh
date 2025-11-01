#!/bin/bash

# 导出日志到dist目录供Web实时访问
export TZ='Asia/Shanghai'

# 同时写入public和dist目录
tail -100 /home/user/webapp/health-monitor.log > /home/user/webapp/public/static/monitor-log-view.txt
tail -100 /home/user/webapp/health-monitor.log > /home/user/webapp/dist/static/monitor-log-view.txt
