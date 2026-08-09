"""Session 層級前置：用目前 src/ 內容重建 dist/icd10.html。

pytest 依檔名排序蒐集測試，e2e_test.py 會排在 test_build.py 之前，若不在這裡搶先
建置一次，E2E 測到的就是「上一輪建置」殘留的舊 dist——改了 src 忘記重建的情況因此
測不出來，是真實的回歸破口。這裡用 session 層級 autouse fixture 保證整個 session
只建置一次（約 2 秒），且一定發生在任何測試（含 e2e）真正執行之前。

建置失敗要讓測試明確失敗，不能靜默略過或跳過。
"""
import subprocess
import sys
from pathlib import Path

import pytest

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
