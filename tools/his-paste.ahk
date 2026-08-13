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
; 漏字在這裡特別危險：E11.9 掉一個字元變成 E1.9，那是另一個「合法但錯誤」的代碼，
; HIS 照樣帶得出病名、不會報錯。真的遇到漏字就把這兩個值調大，不要將就。
CODE_DELAY := 250       ; 代碼之間的等待毫秒數；HIS 反應慢就調大
KEY_DELAY  := 25        ; 每個按鍵之間的毫秒數；舊系統漏字就調大

; 有些碼（例如 I10）在 2014→2023 版是一對多，送出後 HIS 會跳出「ICD10 2014延伸2023
; 醫令說明」要醫師用滑鼠雙擊選一個。那個視窗一出現，後面的碼就會打到它上面。
; 選哪個 2023 碼是臨床判斷，不可以自動代選——所以改成「偵測到就停下來等你選完」。
DIALOG_PROBE := 600     ; 送出一個碼後，觀察這麼久確認有沒有跳出視窗（毫秒）
DIALOG_WAIT  := 90      ; 跳出視窗後最多等你處理幾秒；超過就停下，剩下的碼不送

; 工具視窗貼齊（Ctrl+Alt+D）。用來取代瀏覽器的「置頂」——Chrome／Edge 把
; Document Picture-in-Picture 視窗的尺寸限制在螢幕的 80%，那是防止網頁用永遠置頂的
; 視窗蓋滿螢幕的安全設計，網頁端改不掉。改成讓一般 Edge 視窗貼在螢幕邊緣並由這裡
; 設為永遠置頂，高度就不受那個上限約束。
ICD_WIN    := "ICD-10 門診導引"   ; 工具的網頁標題，用來認出那個 Edge 視窗
DOCK_WIDTH := 340                 ; 貼齊時的寬度（側掛窄欄的設計範圍是 176–565px）
ICD_FILE   := A_ScriptDir "\icd10.html"   ; 找不到視窗時要開哪個檔（預設與本腳本同資料夾）

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
^!d::DockIcdWindow()
^!t::ToggleTopmost()
^!F9::ToggleSuspend()
^!x::ExitApp()

; ── 主要動作 ────────────────────────────────────────────────────────────────
SendCodes(onlyFirst) {
    global CHECK_WINDOW, TARGET_WIN, SEND_ENTER, CODE_DELAY, DIALOG_PROBE, DIALOG_WAIT

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

    sent := 0
    for index, code in codes {
        SendText code
        if (SEND_ENTER)
            Send "{Enter}"
        sent += 1
        if (index >= codes.Length)
            break
        Sleep CODE_DELAY
        if (!WaitForDialog(codes.Length - index))
            return                      ; 等太久，剩下的碼不送（訊息已在 WaitForDialog 裡給了）
    }
    Notify("已送出 " sent " 碼：" Join(codes, "  "))
}

; 送出一個碼之後，HIS 可能跳出版本對照視窗要人工選取。
; 回傳 true ＝ 可以繼續送下一個碼；false ＝ 等太久，呼叫端應該停止。
; 判斷方式是「前景視窗還是不是 HIS 主視窗」，不綁定特定對話框標題——
; 這樣其他會跳窗的情況（重複碼提醒、確認框）也一樣擋得住。
WaitForDialog(remaining) {
    global TARGET_WIN, DIALOG_PROBE, DIALOG_WAIT

    if (TARGET_WIN = "")
        return true

    ; 對話框不一定馬上跳出來，觀察一小段時間再決定要不要等
    waited := 0
    while (waited < DIALOG_PROBE) {
        if (!WinActive(TARGET_WIN))
            break
        Sleep 100
        waited += 100
    }
    if (WinActive(TARGET_WIN))
        return true                     ; 沒跳窗，直接繼續

    Notify("HIS 跳出視窗了，請用滑鼠選好`n選完我會自動送剩下的 " remaining " 碼", 5000)
    if (!WinWaitActive(TARGET_WIN, , DIALOG_WAIT)) {
        Notify("等超過 " DIALOG_WAIT " 秒，剩下的 " remaining " 碼沒有送出`n"
             . "處理完視窗後再按一次 F9，或用 Shift+F9 一次送一碼", 6000)
        return false
    }
    Sleep 300                           ; 讓 HIS 的焦點回到疾病碼欄位再繼續
    return true
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

; 把工具視窗貼到螢幕右緣、拉到工作區全高，並設為永遠置頂。
; 這是瀏覽器「置頂」（Document PiP）的替代品：PiP 視窗被瀏覽器限制在螢幕 80% 以內，
; 一般視窗沒有這個限制，高度可以拉滿。工作列的高度由 MonitorGetWorkArea 自動避開。
DockIcdWindow() {
    global ICD_WIN, DOCK_WIDTH, ICD_FILE

    hwnd := WinExist(ICD_WIN)
    if (!hwnd)
        hwnd := OpenIcdAppWindow()
    if (!hwnd) {
        Notify("找不到也開不了工具視窗`n請確認 icd10.html 與本檔在同一個資料夾", 4000)
        return
    }

    MonitorGetWorkArea(, &left, &top, &right, &bottom)
    h := bottom - top

    if (WinGetMinMax(hwnd) != 0)        ; 最大化／最小化狀態下 WinMove 不會生效
        WinRestore hwnd

    ; 先套寬度、讀回實際值，再據此貼齊右緣。直接拿要求的寬度去算 x 會出事：
    ; Edge 一般視窗有最小寬度（實測 772px），視窗會有一半被推到螢幕外面。
    WinMove left, top, DOCK_WIDTH, h, hwnd
    Sleep 150
    WinGetPos(, , &gw, , hwnd)
    WinMove right - gw, top, gw, h, hwnd
    WinSetAlwaysOnTop 1, hwnd
    WinActivate hwnd

    WinGetPos(&x2, &y2, &w2, &h2, hwnd)
    note := "已貼到螢幕右側並置頂`n" w2 "×" h2
    if (w2 > DOCK_WIDTH + 2)
        note .= "`n這個視窗縮不到 " DOCK_WIDTH "px（Edge 一般視窗的最小寬度）`n"
              . "關掉它再按一次 Ctrl+Alt+D，我會用應用程式模式重開"
    Notify(note, 4000)
}

; 用 Edge 的應用程式模式開啟工具：沒有網址列與分頁列，而且縮得比一般視窗窄得多
; （實測最窄 267px，一般視窗是 772px）。側掛窄欄的設計範圍是 176–565px，
; 一般視窗根本進不去，所以這裡刻意走 --app。
OpenIcdAppWindow() {
    global ICD_WIN, ICD_FILE

    if (!FileExist(ICD_FILE))
        return 0
    url := "file:///" StrReplace(ICD_FILE, "\", "/")
    try Run 'msedge.exe --app="' url '"'
    catch
        return 0
    hwnd := WinWait(ICD_WIN, , 20)
    if (hwnd)
        Sleep 1200                      ; 等頁面把版面畫出來再動它
    return hwnd
}

; 切換目前視窗的永遠置頂。想貼在別的位置、或想暫時取消置頂時用。
ToggleTopmost() {
    hwnd := WinExist("A")
    if (!hwnd)
        return
    WinSetAlwaysOnTop -1, hwnd
    isTop := (WinGetExStyle(hwnd) & 0x8) != 0      ; WS_EX_TOPMOST
    Notify(isTop ? "已設為永遠置頂" : "已取消置頂")
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
