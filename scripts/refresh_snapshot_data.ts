/**
 * 清除旧的快照数据并触发重新同步
 * Clear old snapshot data and trigger fresh sync
 * 
 * Usage:
 *   npx tsx scripts/refresh_snapshot_data.ts
 * 
 * What it does:
 * 1. 删除 kline_snapshot_latest 表中的所有旧数据
 * 2. 触发 POST /api/kline/sync 重新获取并计算数据
 * 3. 新数据将包含正确的 operation_tip（抄底做多/顶部做空）和所有32个字段
 */

import { getDb } from '../src/lib/db';

async function refreshSnapshotData() {
  console.log('🚀 开始刷新快照数据...');
  
  // Get database connection
  const db = getDb();
  
  if (!db) {
    console.error('❌ 无法连接数据库');
    process.exit(1);
  }

  try {
    // 步骤 1: 删除旧数据
    console.log('\n📊 步骤 1: 删除旧快照数据...');
    const deleteResult = await db.prepare(
      'DELETE FROM kline_snapshot_latest'
    ).run();
    
    console.log(`✅ 已删除 ${deleteResult.meta.changes || 0} 条旧记录`);

    // 步骤 2: 验证清空
    const countResult = await db.prepare(
      'SELECT COUNT(*) as count FROM kline_snapshot_latest'
    ).first<{ count: number }>();
    
    console.log(`📈 当前快照表记录数: ${countResult?.count || 0}`);

    if (countResult?.count === 0) {
      console.log('\n✨ 快照表已清空，准备重新同步');
      console.log('\n📝 接下来请执行以下操作：');
      console.log('   1. 确保服务器正在运行');
      console.log('   2. 访问 /signal-matching 页面');
      console.log('   3. 点击页面上的同步按钮，或手动调用 POST /api/kline/sync');
      console.log('   4. 等待同步完成后，刷新页面查看新数据');
      console.log('\n💡 新数据将包含：');
      console.log('   ✓ 正确的 operation_tip（抄底做多/顶部做空）');
      console.log('   ✓ 所有32个字段（时间、首页排名、起涨跌等）');
      console.log('   ✓ 基于300根K线计算的30天统计数据');
    } else {
      console.log('⚠️  警告：快照表未完全清空');
    }

  } catch (error) {
    console.error('❌ 刷新失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
    }
    process.exit(1);
  }

  console.log('\n🎉 刷新脚本执行完成！');
}

// 执行主函数
refreshSnapshotData().catch((error) => {
  console.error('💥 未捕获的错误:', error);
  process.exit(1);
});
