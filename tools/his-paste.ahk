; ICD-10 門診導引 → HIS 熱鍵貼入（AutoHotkey v2）
;
; 用途：工具（dist/icd10.html）只能把代碼放進剪貼簿——瀏覽器碰不到 HIS 這種原生視窗。
; 這支常駐小程式補上最後一哩：游標點進 HIS 的疾病碼欄位後按 F9，把剪貼簿裡的
; ICD 代碼逐一打進去。**一定要按鍵才會動作**，不監看剪貼簿、不自動送出，
; 避免焦點不對時把代碼打進病歷或處方欄位。
;
; 熱鍵
;   F9         送出剪貼簿裡的所有 ICD 代碼（每碼之後按 Enter）
;   Shift+F9   只送第一個代碼
;   F10        預覽：顯示解析到哪些代碼，不送出
;   Ctrl+Alt+F9  暫停／恢復（暫停時 F9 交還給原本的程式）
;   Ctrl+Alt+X   結束
;
; 安裝：winget install AutoHotkey.AutoHotkey  然後雙擊本檔。
; 要開機自動啟動：Win+R 打 shell:startup，把本檔的捷徑丟進去。

#Requires AutoHotkey v2.0
#SingleInstance Force

; ── 可調設定 ────────────────────────────────────────────────────────────────
; 視窗守門：只有前景視窗標題含 TARGET_WIN 時才送出，免得打到別的程式。
; 你的 HIS 標題是「診間批價修改作業 [OpoC200]」，所以預設比對 OpoC200。
; 換了作業畫面（標題不同）就把這裡改成共同的字串，或設 CHECK_WINDOW := false 關掉檢查。
CHECK_WINDOW := true
TARGET_WIN   := "OpoC200"

SEND_ENTER := true      ; 每個代碼之後是否按 Enter（HIS 要 Enter 才帶出病名時保持 true）
CODE_DELAY := 250       ; 代碼之間的等待毫秒數；HIS 反應慢就調大
KEY_DELAY  := 25        ; 每個按鍵之間的毫秒數；舊系統漏字就調大

; 舊型 Windows 應用（Delphi／PowerBuilder 這類）常常吃不下 SendInput 的高速輸入，
; 用 Event 模式逐鍵送比較不會漏字。
SendMode "Event"
SetKeyDelay KEY_DELAY, KEY_DELAY
SetTitleMatchMode 2     ; 標題「包含」即可

; ICD-10-CM 代碼外形：字母＋數字＋（數字，或那 8 個第 3 碼是字母的類目），
; 後面可接「.」加 1-4 位英數字。第 3 碼放死白名單是為了擋掉病歷裡形狀相同的縮寫——
; 「A1C」（糖化血色素）完全符合「字母＋數字＋字母」，不擋就會被當成代碼打進 HIS。
CODE_PATTERN := "(?:[A-Z]\d\d|C4A|C7A|C7B|D3A|I5A|M1A|O9A|Z3A)(?:\.[A-Z0-9]{1,4})?"

; ── 熱鍵 ────────────────────────────────────────────────────────────────────
F9::SendCodes(false)
+F9::SendCodes(true)
F10::PreviewCodes()
^!F9::ToggleSuspend()
^!x::ExitApp()

; ── 主要動作 ────────────────────────────────────────────────────────────────
SendCodes(onlyFirst) {
    global CHECK_WINDOW, TARGET_WIN, SEND_ENTER, CODE_DELAY

    codes := ExtractCodes(A_Clipboard)
    if (codes.Length = 0) {
        Notify("剪貼簿裡沒有 ICD 代碼")
        return
    }
    ; 剪貼簿若是病歷段落而不是代碼清單，裡頭形狀像代碼的縮寫（T12、B12…）會被送進 HIS。
    ; 工具複製出來的三種格式每一行都以代碼開頭，據此擋掉「剛才複製的是別的東西」。
    if (!LooksLikeCodeList(A_Clipboard)) {
        Notify("剪貼簿看起來不是代碼清單，已取消`n先按 F10 預覽，或用工具的「複製並貼入 HIS」")
        return
    }
    if (CHECK_WINDOW && TARGET_WIN != "" && !WinActive(TARGET_WIN)) {
        Notify("前景視窗不是 HIS（找不到「" TARGET_WIN "」），已取消")
        return
    }

    if (onlyFirst)
        codes := [codes[1]]

    ; 讓目標欄位的鍵盤焦點穩定下來。實測（tools 的自我測試）：視窗剛取得焦點就立刻送字，
    ; 整批可能被吞掉；手動點進欄位再按 F9 通常不會遇到，但這 60ms 是免費的保險。
    Sleep 60

    for index, code in codes {
        SendText code
        if (SEND_ENTER)
            Send "{Enter}"
        if (index < codes.Length)
            Sleep CODE_DELAY
    }
    Notify("已送出 " codes.Length " 碼：" Join(codes, "  "))
}

PreviewCodes() {
    codes := ExtractCodes(A_Clipboard)
    if (codes.Length = 0) {
        Notify("剪貼簿裡沒有 ICD 代碼")
        return
    }
    Notify("解析到 " codes.Length " 碼（未送出）：`n" Join(codes, "`n"), 3000)
}

ToggleSuspend() {
    Suspend -1
    Notify(A_IsSuspended ? "已暫停（F9 交還給原程式）" : "已恢復")
}

; ── 工具函式 ────────────────────────────────────────────────────────────────
; 三種複製格式（每行一碼、逗號分隔、碼＋名稱）都能解析，中文病名不會被誤判成代碼。
; 前後不得緊接英數字，才不會從一長串英數字裡截出假代碼。
ExtractCodes(text) {
    global CODE_PATTERN
    codes := []
    seen := Map()
    pos := 1
    needle := "i)(?<![A-Za-z0-9])" CODE_PATTERN "(?![A-Za-z0-9])"
    while (found := RegExMatch(text, needle, &m, pos)) {
        pos := found + StrLen(m[0])
        code := StrUpper(m[0])
        if (!seen.Has(code)) {
            seen[code] := true
            codes.Push(code)
        }
    }
    return codes
}

; 每個非空行都必須「以代碼開頭，且代碼後面是行尾、逗號或中文」。
; 三種複製格式都成立（碼、碼,碼、碼＋中文病名），病歷段落不成立——
; 只檢查行首還不夠：「T12 compression fracture」「B12 deficiency」這種脊椎節段與
; 維生素寫法本身就是合法的 ICD 類目外形，後面接英文才分得出那不是病名。
LooksLikeCodeList(text) {
    global CODE_PATTERN
    needle := "i)^" CODE_PATTERN "(?![A-Za-z0-9])[ \t]*(?:$|[,，]|[^\x00-\x7F])"
    seenLine := false
    for index, line in StrSplit(text, "`n", "`r") {
        line := Trim(line, " `t")
        if (line = "")
            continue
        seenLine := true
        if (!RegExMatch(line, needle))
            return false
    }
    return seenLine
}

Join(list, sep) {
    out := ""
    for index, item in list
        out .= (index > 1 ? sep : "") item
    return out
}

Notify(msg, ms := 1800) {
    ToolTip msg
    SetTimer(() => ToolTip(), -ms)
}
