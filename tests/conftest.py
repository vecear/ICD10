"""Session 層級前置：用目前 src/ 內容重建 dist/icd10.html；並提供共用的 chromium 行程。

pytest 依檔名排序蒐集測試，e2e_test.py 會排在 test_build.py 之前，若不在這裡搶先
建置一次，E2E 測到的就是「上一輪建置」殘留的舊 dist——改了 src 忘記重建的情況因此
測不出來，是真實的回歸破口。這裡用 session 層級 autouse fixture 保證整個 session
只建置一次（約 2 秒），且一定發生在任何測試（含 e2e）真正執行之前。

建置失敗要讓測試明確失敗，不能靜默略過或跳過。

共用瀏覽器（`browser` fixture）：
  * 只共用 chromium **行程**；context 與 page 仍由各檔 module 級 fixture 自己建，
    localStorage 隨 context 走，所以檔與檔之間不會互相污染。
  * 同一個執行緒裡同時只能有一個 sync_playwright（第二個會拋「Sync API inside the
    asyncio loop」，已實測）。還有檔案自己 `with sync_playwright()`（沒改用共用的），
    所以輪到那種檔案之前，先把共用的關掉；下一個用共用瀏覽器的檔案再重開。
"""
import subprocess
import sys
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture(scope="session", autouse=True)
def _rebuild_dist_before_tests():
    result = subprocess.run(
        [sys.executable, str(ROOT / "build" / "build.py")],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        pytest.fail(
            "測試前置建置失敗（python build/build.py），dist/icd10.html 可能是舊內容：\n"
            f"--- stdout ---\n{result.stdout}\n--- stderr ---\n{result.stderr}",
            pytrace=False,
        )
    return result


class _SharedChromium:
    """延遲啟動、可中途關閉再重開的單一 chromium。"""

    def __init__(self):
        self._pw = None
        self._browser = None

    def get(self):
        if self._browser is None or not self._browser.is_connected():
            self.stop()
            self._pw = sync_playwright().start()
            self._browser = self._pw.chromium.launch()
        return self._browser

    def stop(self):
        try:
            if self._browser is not None and self._browser.is_connected():
                self._browser.close()
        finally:
            self._browser = None
            if self._pw is not None:
                self._pw.stop()
                self._pw = None


_SHARED = _SharedChromium()
_SELF_LAUNCH_CACHE = {}


def _module_self_launches(module):
    """該模組（或它借用的 fixture 所在模組）自己開 sync_playwright 嗎？"""
    if module is None or module.__name__ == __name__:
        return False
    name = module.__name__
    if name not in _SELF_LAUNCH_CACHE:
        path = getattr(module, "__file__", None)
        text = Path(path).read_text(encoding="utf-8") if path else ""
        _SELF_LAUNCH_CACHE[name] = "sync_playwright(" in text
    return _SELF_LAUNCH_CACHE[name]


@pytest.hookimpl(tryfirst=True)
def pytest_runtest_setup(item):
    """輪到自己開 sync_playwright 的測試前，先關掉共用的（兩者不能同時存在）。

    此時上一個模組的 module 級 fixture（context／page）已經 teardown 完，關掉是安全的。
    """
    if _SHARED._pw is None:
        return
    modules = {getattr(item, "module", None)}
    for defs in item._fixtureinfo.name2fixturedefs.values():
        for d in defs:
            modules.add(sys.modules.get(getattr(d.func, "__module__", "")))
    if any(_module_self_launches(m) for m in modules):
        _SHARED.stop()


def pytest_sessionfinish(session, exitstatus):
    _SHARED.stop()


@pytest.fixture(scope="module")
def browser():
    """共用的 chromium（行程跨檔共用；拿到的物件每個模組重取一次，中途重開過也拿得到新的）。

    模組結束時把這個模組留下的 context 全部關掉：以前每檔各自 browser.close() 會順手收掉
    沒關的頁面（每頁載入全庫後上百 MB），共用行程之後要由這裡代收，否則一路累積到 session 結束。
    """
    b = _SHARED.get()
    yield b
    if not b.is_connected():
        return
    for ctx in list(b.contexts):
        try:
            ctx.close()
        except Exception:      # 已被關掉或行程已結束：收尾不得蓋掉測試本身的結果
            pass


@pytest.fixture(scope="session")
def page_url():
    """用 file:// 而不是本機 HTTP server。

    這台機器上的安全軟體會掃描 loopback 傳輸，dist 這個 2.2MB 單檔傳到約 248KB 就被
    連線重設（WinError 10054），整批 E2E 會在 Page.goto 逾時 —— 而那與被測程式碼無關。
    file:// 沒有網路層，Chromium 又視它為 secure context，clipboard 與 Document PiP
    都照常可用（已實測），順帶省掉每個測試的傳輸時間。"""
    return (ROOT / "dist" / "icd10.html").as_uri()
