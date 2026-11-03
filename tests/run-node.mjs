// 逐檔執行 tests/*.test.mjs 的單行程 runner。
//
// 為什麼不用 `node --test`：它會為每個測試檔另開子行程，在 Windows 前景執行時父行程
// 等不到管線關閉，整個指令卡住不返回。`node 檔案.mjs` 直接跑 node:test 的檔案會在同一
// 行程完成並把失敗反映到 exit code，所以這裡只是把 13 個檔依序 spawn 起來、彙總結果。
// 任何一檔失敗，整個 runner 回 exit 1——shell 的 `for … || break` 做不到這點
// （break 本身回 0，CI 與本機都會誤判成全綠）。
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here).filter((f) => f.endsWith('.test.mjs')).sort();
const failed = [];
for (const f of files) {
  const r = spawnSync(process.execPath, [join(here, f)], { stdio: 'inherit' });
  if (r.status !== 0) failed.push(f);
}
console.log(`\n${files.length - failed.length}/${files.length} 個測試檔通過` + (failed.length ? `，失敗：${failed.join(', ')}` : ''));
process.exitCode = failed.length ? 1 : 0;
