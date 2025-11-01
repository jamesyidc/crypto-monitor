INSERT INTO dashboard_snapshots (
  snapshot_time, snapshot_date, snapshot_hour, snapshot_minute,
  dashboard_data, compare_data,
  risk_alert_count, average_change, surge_count, crash_count
) VALUES (
  '2025-11-01T01:20:00.000Z',
  '2025-11-01',
  1,
  20,
  '{"latestRound":{"risk_alert_count":3,"average_change":2.5,"surge_count":2,"crash_count":1,"min_change":-5.2,"max_change":8.3},"specialStats":{"change24hOver10Up":5,"change24hOver10Down":2,"todayNewHighCount":8,"todayNewLowCount":3},"coinDetails":[{"symbol":"BTC","price":68500.50,"change_5m":0.5,"change_24h":2.3,"priority":1},{"symbol":"ETH","price":2450.25,"change_5m":-0.3,"change_24h":1.8,"priority":1},{"symbol":"BNB","price":305.80,"change_5m":1.2,"change_24h":-0.5,"priority":2}]}',
  '{"coins":[{"symbol":"BTC","high_ratio":95.5,"low_ratio":88.2,"today_new_high_count":3,"today_new_low_count":0},{"symbol":"ETH","high_ratio":92.1,"low_ratio":85.5,"today_new_high_count":2,"today_new_low_count":1},{"symbol":"BNB","high_ratio":88.8,"low_ratio":90.3,"today_new_high_count":1,"today_new_low_count":0}]}',
  3,
  2.5,
  2,
  1
);
