# 臨床內容驗收清單

由 `python build/inventory.py` 自動產生，資料來源為 `src/curated/`。

**怎麼用**：看「介面標籤」與「健保官方中文名」是否語意一致。
標籤是看診時顯示在按鈕上的字，官方名是健保申報的正式名稱——
兩者可以不同（標籤是速記），但**不能語意衝突**，否則會選錯碼。

## 內科急診（7 個部位群組 / 20 張面板）

### 全身／感染

#### 發燒／寒顫

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R50.9` | 發燒 | 發燒 | Fever, unspecified |
| `R68.83` | 寒顫（未伴發燒） | 寒顫(未伴有發燒) | Chills (without fever) |
| **常見疾病** | | | |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `J11.1` | 流感（伴其他呼吸道表徵） | 未確認流感病毒所致流行性感冒併其他呼吸道表徵 | Influenza due to unidentified influenza virus with other respiratory manifestations |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `J02.9` | 急性咽炎 | 急性咽炎 | Acute pharyngitis, unspecified |
| `J03.90` | 急性扁桃腺炎 | 急性扁桃腺炎 | Acute tonsillitis, unspecified |
| `J20.9` | 急性支氣管炎 | 急性支氣管炎 | Acute bronchitis, unspecified |
| `J01.90` | 急性鼻竇炎 | 急性鼻竇炎 | Acute sinusitis, unspecified |
| `H66.90` | 中耳炎（未明示側） | 未明示側性中耳炎 | Otitis media, unspecified, unspecified ear |
| `B34.9` | 病毒感染 | 病毒感染 | Viral infection, unspecified |
| `A49.9` | 細菌感染 | 細菌感染 | Bacterial infection, unspecified |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `L02.91` | 皮膚膿瘍 | 皮膚膿瘍 | Cutaneous abscess, unspecified |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `K83.09` | 急性膽管炎（其他膽管炎） | 其他膽管炎 | Other cholangitis |
| `K75.0` | 肝膿瘍 | 肝膿瘍 | Abscess of liver |
| `K65.9` | 腹膜炎 | 腹膜炎 | Peritonitis, unspecified |
| `N15.1` | 腎及腎周圍膿瘍 | 腎及腎周圍膿瘍 | Renal and perinephric abscess |
| `J85.2` | 肺膿瘍（未伴肺炎） | 肺膿瘍未伴有肺炎 | Abscess of lung without pneumonia |
| `M86.9` | 骨髓炎 | 骨髓炎 | Osteomyelitis, unspecified |
| `M00.9` | 化膿性關節炎 | 化膿性關節炎 | Pyogenic arthritis, unspecified |
| `A90` | 登革熱 | 登革熱[典型登革熱] | Dengue fever [classical dengue] |
| `B27.90` | 傳染性單核球增多症（未伴併發症） | 傳染性單核球過多症，未伴有併發症 | Infectious mononucleosis, unspecified without complication |
| `A75.3` | 恙蟲病 | 恙蟲立克次體所致之斑疹傷寒熱 | Typhus fever due to Rickettsia tsutsugamushi |
| `A15.0` | 肺結核 | 肺結核 | Tuberculosis of lung |
| `A01.00` | 傷寒 | 傷寒 | Typhoid fever, unspecified |
| `A27.9` | 鉤端螺旋體病 | 細鉤端螺旋體病 | Leptospirosis, unspecified |
| `T88.7XXA` | 藥物不良反應 | 藥物或藥劑未明示之不良作用之初期照護 | Unspecified adverse effect of drug or medicament, initial encounter |
| `J69.0` | 吸入性肺炎 | 吸入食物或嘔吐物所致之肺炎 | Pneumonitis due to inhalation of food and vomit |
| `A41.50` | 革蘭氏陰性菌敗血症 | 革蘭氏陰性菌敗血症 | Gram-negative sepsis, unspecified |
| `A41.52` | 綠膿桿菌敗血症 | 綠膿桿菌所致之敗血症 | Sepsis due to Pseudomonas |
| `B37.7` | 念珠菌敗血症 | 念珠菌性敗血症 | Candidal sepsis |
| `D70.1` | 化療後嗜中性球低下（發熱性嗜中性球低下） | 癌症化療引發的續發顆粒性白血球缺乏症 | Agranulocytosis secondary to cancer chemotherapy |
| `I26.01` | 敗血性肺栓塞併急性肺性心臟病 | 敗血性肺栓塞伴有急性肺性心臟病 | Septic pulmonary embolism with acute cor pulmonale |
| `A48.3` | 中毒性休克症候群 TSS | 中毒性休克症候群 | Toxic shock syndrome |
| **優先排除（紅旗）** | | | |
| `A41.9` | 敗血症 | 敗血症，未明示病原體 | Sepsis, unspecified organism |
| `R65.20` | 嚴重敗血症（未伴休克，附加碼） | 未伴有敗血性休克的嚴重敗血症 | Severe sepsis without septic shock |
| `R65.21` | 敗血性休克（附加碼） | 伴有敗血性休克的嚴重敗血症 | Severe sepsis with septic shock |
| `D70.9` | 嗜中性球低下 | 嗜中性白血球缺乏症 | Neutropenia, unspecified |
| `G03.9` | 腦膜炎 | 腦膜炎 | Meningitis, unspecified |
| `M72.6` | 壞死性筋膜炎 | 壞死性筋膜炎 | Necrotizing fasciitis |
| `I33.0` | 感染性心內膜炎 IE | 急性及亞急性感染性心內膜炎 | Acute and subacute infective endocarditis |

#### 休克／低血壓

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `I95.9` | 低血壓 | 低血壓 | Hypotension, unspecified |
| `R57.9` | 休克（未明示型態） | 休克 | Shock, unspecified |
| **常見疾病** | | | |
| `A41.9` | 敗血症 | 敗血症，未明示病原體 | Sepsis, unspecified organism |
| `E86.1` | 低血容量 | 低血容量 | Hypovolemia |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `D62` | 急性失血性貧血 | 急性出血後貧血 | Acute posthemorrhagic anemia |
| `K92.2` | 胃腸道出血 | 胃腸道出血 | Gastrointestinal hemorrhage, unspecified |
| `I21.9` | 急性心肌梗塞 | 急性心肌梗塞 | Acute myocardial infarction, unspecified |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `I49.9` | 心律不整 | 心臟節律不整 | Cardiac arrhythmia, unspecified |
| `I48.91` | 心房顫動 | 心房顫動 | Unspecified atrial fibrillation |
| `I95.1` | 姿勢性低血壓 | 直立性低血壓 | Orthostatic hypotension |
| `I95.2` | 藥物所致低血壓 | 藥物所致之低血壓 | Hypotension due to drugs |
| `I95.81` | 處置後低血壓 | 處置後低血壓 | Postprocedural hypotension |
| `I95.3` | 血液透析性低血壓 | 血液透析性低血壓 | Hypotension of hemodialysis |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `E16.2` | 低血糖 | 低血糖 | Hypoglycemia, unspecified |
| `E87.6` | 低血鉀症 | 低血鉀症 | Hypokalemia |
| `N17.9` | 急性腎衰竭（AKI） | 急性腎衰竭 | Acute kidney failure, unspecified |
| `E11.10` | 糖尿病酮酸中毒 DKA（第二型，未伴昏迷） | 第二型糖尿病，伴有酮酸中毒，未伴有昏迷 | Type 2 diabetes mellitus with ketoacidosis without coma |
| `E27.40` | 腎上腺皮質功能不足 | 腎上腺皮質功能不足 | Unspecified adrenocortical insufficiency |
| `K72.90` | 肝衰竭（未伴昏迷） | 肝衰竭未伴有昏迷 | Hepatic failure, unspecified without coma |
| `T88.7XXA` | 藥物不良反應 | 藥物或藥劑未明示之不良作用之初期照護 | Unspecified adverse effect of drug or medicament, initial encounter |
| `R57.8` | 其他休克 | 其他休克 | Other shock |
| `I26.99` | 其他肺栓塞（未伴急性肺性心臟病） | 其他肺栓塞未伴有急性肺性心臟病 | Other pulmonary embolism without acute cor pulmonale |
| `I26.02` | 肺動脈鞍形栓塞併急性肺性心臟病 | 肺動脈鞍形栓塞伴有急性肺性心臟病 | Saddle embolus of pulmonary artery with acute cor pulmonale |
| **優先排除（紅旗）** | | | |
| `R65.21` | 敗血性休克（附加碼） | 伴有敗血性休克的嚴重敗血症 | Severe sepsis with septic shock |
| `R57.0` | 心因性休克 | 心因性休克 | Cardiogenic shock |
| `R57.1` | 低血容性休克 | 低血容性休克 | Hypovolemic shock |
| `T78.2XXA` | 過敏性休克 | 過敏性休克之初期照護 | Anaphylactic shock, unspecified, initial encounter |
| `I26.09` | 肺栓塞併急性肺性心臟病（大範圍 PE） | 其他肺栓塞併急性肺性心臟病 | Other pulmonary embolism with acute cor pulmonale |
| `I31.4` | 心包填塞 | 心包膜填塞 | Cardiac tamponade |
| `E27.2` | 艾迪森氏危象（腎上腺危象） | 艾迪森氏危象 | Addisonian crisis |

### 神經／頭頸

#### 頭痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R51.9` | 頭痛 | 頭痛 | Headache, unspecified |
| **常見疾病** | | | |
| `G44.209` | 緊縮型頭痛 | 緊縮型頭痛，未明確定義型態，非頑固性 | Tension-type headache, unspecified, not intractable |
| `G43.909` | 偏頭痛 | 偏頭痛，未明確定義型態，非頑固性，未伴有偏頭痛重積狀態 | Migraine, unspecified, not intractable, without status migrainosus |
| `G43.009` | 無預兆偏頭痛 | 無預兆偏頭痛，非頑固性，未伴有偏頭痛重積狀態 | Migraine without aura, not intractable, without status migrainosus |
| `G43.109` | 預兆偏頭痛（非頑固性、未伴重積） | 預兆偏頭痛，非頑固性，未伴有偏頭痛重積狀態 | Migraine with aura, not intractable, without status migrainosus |
| `J01.90` | 急性鼻竇炎 | 急性鼻竇炎 | Acute sinusitis, unspecified |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `I16.0` | 高血壓緊急狀況（urgency） | 高血壓緊急狀況 | Hypertensive urgency |
| `I16.1` | 高血壓急症（emergency） | 高血壓急症 | Hypertensive emergency |
| `M54.2` | 頸椎痛 | 頸椎痛 | Cervicalgia |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `G44.009` | 叢發性頭痛（非頑固性） | 叢發性頭痛症候群，未明確定義型態，非頑固性 | Cluster headache syndrome, unspecified, not intractable |
| `G44.40` | 藥物導致之頭痛（非頑固性） | 藥物導致之頭痛，他處未歸類者，非頑固性 | Drug-induced headache, not elsewhere classified, not intractable |
| `G44.1` | 血管性頭痛 | 血管性頭痛，他處未歸類者 | Vascular headache, not elsewhere classified |
| `G44.89` | 其他頭痛症候群 | 其他頭痛症候群 | Other headache syndrome |
| `G50.0` | 三叉神經痛 | 三叉神經痛 | Trigeminal neuralgia |
| `G93.2` | 良性顱內高壓 | 良性顱內高壓 | Benign intracranial hypertension |
| `S06.0X0A` | 腦震盪（未伴意識喪失，初期照護） | 腦震盪，未伴有意識喪失之初期照護 | Concussion without loss of consciousness, initial encounter |
| `S06.5X0A` | 創傷性硬腦膜下出血（未伴意識喪失，初期照護） | 創傷性硬腦膜下出血，未伴有意識喪失之初期照護 | Traumatic subdural hemorrhage without loss of consciousness, initial encounter |
| `I62.00` | 非創傷性硬腦膜下出血 | 非創傷性硬腦膜下出血 | Nontraumatic subdural hemorrhage, unspecified |
| `I67.4` | 高血壓性腦病變 | 高血壓性腦病變 | Hypertensive encephalopathy |
| `G97.1` | 腰椎穿刺後反應（穿刺後頭痛） | 脊椎及腰椎穿刺所致的其他反應 | Other reaction to spinal and lumbar puncture |
| `T67.01XA` | 熱中暑／中暑 | 熱中暑及日中暑之初期照護 | Heatstroke and sunstroke, initial encounter |
| **優先排除（紅旗）** | | | |
| `G03.9` | 腦膜炎 | 腦膜炎 | Meningitis, unspecified |
| `I60.9` | 蜘蛛膜下腔出血 | 非創傷性蜘蛛網膜下腔出血 | Nontraumatic subarachnoid hemorrhage, unspecified |
| `I61.9` | 腦出血 | 非創傷性腦出血 | Nontraumatic intracerebral hemorrhage, unspecified |
| `G04.90` | 腦炎／腦脊髓炎 | 腦炎及腦脊髓炎 | Encephalitis and encephalomyelitis, unspecified |
| `G06.0` | 顱內膿瘍及肉芽腫 | 顱內膿瘍及肉芽腫 | Intracranial abscess and granuloma |
| `H40.219` | 急性隅角閉鎖性青光眼（未明示側） | 未明示側性急性隅角閉鎖性青光眼 | Acute angle-closure glaucoma, unspecified eye |
| `T58.91XA` | 一氧化碳中毒 | 未明示來源一氧化碳意外毒性作用之初期照護 | Toxic effect of carbon monoxide from unspecified source, accidental (unintentional), initial encounter |

#### 頭暈／眩暈

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R42` | 頭暈及目眩 | 頭暈及目眩 | Dizziness and giddiness |
| **常見疾病** | | | |
| `H81.10` | 良性陣發性眩暈 BPPV（未明示側） | 未明示側性之良性陣發性眩暈 | Benign paroxysmal vertigo, unspecified ear |
| `H81.20` | 前庭神經元炎 | 未明示側性之前庭神經元炎 | Vestibular neuronitis, unspecified ear |
| `I95.1` | 姿勢性低血壓 | 直立性低血壓 | Orthostatic hypotension |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `D50.9` | 缺鐵性貧血 | 缺鐵性貧血 | Iron deficiency anemia, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `H81.09` | 梅尼爾氏病（未明示側） | 未明示側性之梅尼爾氏病 | Meniere's disease, unspecified ear |
| `H81.399` | 其他末梢性眩暈（未明示側） | 未明示側性之其他末梢性眩暈 | Other peripheral vertigo, unspecified ear |
| `H81.90` | 前庭功能障礙（未明示） | 未明示側性之前庭功能疾患 | Unspecified disorder of vestibular function, unspecified ear |
| `H83.2X9` | 迷路功能不良 | 未明示側性之迷路功能不良 | Labyrinthine dysfunction, unspecified ear |
| `H61.20` | 耳垢嵌塞（未明示側） | 未明示側性耳垢嵌塞 | Impacted cerumen, unspecified ear |
| `H66.90` | 中耳炎（未明示側） | 未明示側性中耳炎 | Otitis media, unspecified, unspecified ear |
| `G45.9` | 短暫性腦缺血發作 TIA | 短暫性大腦缺血發作 | Transient cerebral ischemic attack, unspecified |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| `I48.91` | 心房顫動 | 心房顫動 | Unspecified atrial fibrillation |
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `I16.0` | 高血壓緊急狀況（urgency） | 高血壓緊急狀況 | Hypertensive urgency |
| `E87.1` | 低血鈉及低滲透壓 | 低滲壓及低血鈉 | Hypo-osmolality and hyponatremia |
| `T88.7XXA` | 藥物不良反應 | 藥物或藥劑未明示之不良作用之初期照護 | Unspecified adverse effect of drug or medicament, initial encounter |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `B02.21` | 疱疹後膝狀神經節炎（Ramsay Hunt） | 疱疹後膝狀神經節炎 | Postherpetic geniculate ganglionitis |
| **優先排除（紅旗）** | | | |
| `I63.9` | 急性缺血性腦中風 | 腦梗塞 | Cerebral infarction, unspecified |
| `I61.9` | 腦出血 | 非創傷性腦出血 | Nontraumatic intracerebral hemorrhage, unspecified |
| `E16.2` | 低血糖 | 低血糖 | Hypoglycemia, unspecified |
| `I21.9` | 急性心肌梗塞 | 急性心肌梗塞 | Acute myocardial infarction, unspecified |
| `K92.2` | 胃腸道出血 | 胃腸道出血 | Gastrointestinal hemorrhage, unspecified |
| `I49.9` | 心律不整 | 心臟節律不整 | Cardiac arrhythmia, unspecified |

#### 意識改變

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R41.82` | 精神狀態改變 | 精神狀態改變 | Altered mental status, unspecified |
| `R40.20` | 昏迷 | 昏迷 | Unspecified coma |
| **常見疾病** | | | |
| `F05` | 譫妄 | 已知生理狀況引起的譫妄 | Delirium due to known physiological condition |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `E87.1` | 低血鈉及低滲透壓 | 低滲壓及低血鈉 | Hypo-osmolality and hyponatremia |
| `E87.0` | 高血鈉 | 高滲壓及高血鈉 | Hyperosmolality and hypernatremia |
| `F03.90` | 失智症（未明示嚴重度、無行為障礙） | 非特定的失智症，未明示嚴重度，無行為、精神病症、情緒困擾及焦慮症狀 | Unspecified dementia, unspecified severity, without behavioral disturbance, psychotic disturbance, mood disturbance, and anxiety |
| `F03.911` | 失智症（未明示嚴重度、有激動行為） | 非特定的失智症，未明示嚴重度，有激動行為 | Unspecified dementia, unspecified severity, with agitation |
| `G93.40` | 腦病變 | 腦病變 | Encephalopathy, unspecified |
| `K72.90` | 肝衰竭（未伴昏迷） | 肝衰竭未伴有昏迷 | Hepatic failure, unspecified without coma |
| `K72.91` | 肝衰竭併昏迷（肝性腦病變 III／IV 級） | 肝衰竭併昏迷 | Hepatic failure, unspecified with coma |
| `F10.929` | 急性酒精中毒 | 非特定的酒精使用，有非特定的中毒 | Alcohol use, unspecified with intoxication, unspecified |
| `E11.65` | 第二型糖尿病伴高血糖 | 第二型糖尿病，伴有高血糖 | Type 2 diabetes mellitus with hyperglycemia |
| `E11.00` | 高滲透壓高血糖狀態 HHS（第二型，未伴昏迷） | 第二型糖尿病，伴有高滲透壓，未伴有非酮病之高血糖-高滲透壓的昏迷 | Type 2 diabetes mellitus with hyperosmolarity without nonketotic hyperglycemic-hyperosmolar coma (NKHHC) |
| `E11.01` | 高滲透壓高血糖狀態 HHS（第二型，伴昏迷） | 第二型糖尿病，伴有高滲透壓，伴有昏迷 | Type 2 diabetes mellitus with hyperosmolarity with coma |
| `E11.10` | 糖尿病酮酸中毒 DKA（第二型，未伴昏迷） | 第二型糖尿病，伴有酮酸中毒，未伴有昏迷 | Type 2 diabetes mellitus with ketoacidosis without coma |
| `E11.11` | 糖尿病酮酸中毒 DKA（第二型，伴昏迷） | 第二型糖尿病，伴有酮酸中毒，伴有昏迷 | Type 2 diabetes mellitus with ketoacidosis with coma |
| `E10.11` | 糖尿病酮酸中毒 DKA（第一型，伴昏迷） | 第一型糖尿病，伴有酮酸中毒，伴有昏迷 | Type 1 diabetes mellitus with ketoacidosis with coma |
| `N19` | 腎衰竭（尿毒症） | 腎衰竭 | Unspecified kidney failure |
| `N18.6` | 末期腎病 ESRD | 末期腎疾病 | End stage renal disease |
| `J96.02` | 急性呼吸衰竭併高碳酸血症 | 急性呼吸衰竭併高碳酸血症 | Acute respiratory failure with hypercapnia |
| `J96.00` | 急性呼吸衰竭 | 急性呼吸衰竭，未明示是否伴有缺氧或高碳酸血症 | Acute respiratory failure, unspecified whether with hypoxia or hypercapnia |
| `I62.00` | 非創傷性硬腦膜下出血 | 非創傷性硬腦膜下出血 | Nontraumatic subdural hemorrhage, unspecified |
| `S06.5X0A` | 創傷性硬腦膜下出血（未伴意識喪失，初期照護） | 創傷性硬腦膜下出血，未伴有意識喪失之初期照護 | Traumatic subdural hemorrhage without loss of consciousness, initial encounter |
| `S06.0X0A` | 腦震盪（未伴意識喪失，初期照護） | 腦震盪，未伴有意識喪失之初期照護 | Concussion without loss of consciousness, initial encounter |
| `R56.9` | 痙攣（抽搐） | 痙攣 | Unspecified convulsions |
| `G40.909` | 癲癇（非難治，未伴重積） | 癲癇，非難治之癲癇，未伴有癲癇重積狀態 | Epilepsy, unspecified, not intractable, without status epilepticus |
| `G04.90` | 腦炎／腦脊髓炎 | 腦炎及腦脊髓炎 | Encephalitis and encephalomyelitis, unspecified |
| `T58.91XA` | 一氧化碳中毒 | 未明示來源一氧化碳意外毒性作用之初期照護 | Toxic effect of carbon monoxide from unspecified source, accidental (unintentional), initial encounter |
| `T50.901A` | 藥物中毒（意外） | 未明示藥物、藥物或生物物質意外中毒之初期照護 | Poisoning by unspecified drugs, medicaments and biological substances, accidental (unintentional), initial encounter |
| `T42.4X1A` | 苯二氮平類中毒（意外） | 苯重氮基鹽藥物意外中毒之初期照護 | Poisoning by benzodiazepines, accidental (unintentional), initial encounter |
| `I67.4` | 高血壓性腦病變 | 高血壓性腦病變 | Hypertensive encephalopathy |
| `E51.2` | Wernicke 氏腦病變 | Wernicke氏腦病變 | Wernicke's encephalopathy |
| `E27.40` | 腎上腺皮質功能不足 | 腎上腺皮質功能不足 | Unspecified adrenocortical insufficiency |
| `B00.4` | 疱疹病毒性腦炎 HSE | 疱疹病毒性腦炎 | Herpesviral encephalitis |
| **優先排除（紅旗）** | | | |
| `E16.2` | 低血糖 | 低血糖 | Hypoglycemia, unspecified |
| `A41.9` | 敗血症 | 敗血症，未明示病原體 | Sepsis, unspecified organism |
| `G03.9` | 腦膜炎 | 腦膜炎 | Meningitis, unspecified |
| `I61.9` | 腦出血 | 非創傷性腦出血 | Nontraumatic intracerebral hemorrhage, unspecified |
| `I63.9` | 急性缺血性腦中風 | 腦梗塞 | Cerebral infarction, unspecified |
| `I60.9` | 蜘蛛膜下腔出血 | 非創傷性蜘蛛網膜下腔出血 | Nontraumatic subarachnoid hemorrhage, unspecified |
| `G40.901` | 癲癇重積狀態 | 癲癇，非難治之癲癇，伴有癲癇重積狀態 | Epilepsy, unspecified, not intractable, with status epilepticus |

#### 局部無力／疑似中風

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `G81.90` | 偏癱 | 未明示影響側別偏癱 | Hemiplegia, unspecified affecting unspecified side |
| `R47.01` | 失語症 | 失語症 | Aphasia |
| `R29.810` | 臉部無力 | 臉部無力 | Facial weakness |
| **常見疾病** | | | |
| `G45.9` | 短暫性腦缺血發作 TIA | 短暫性大腦缺血發作 | Transient cerebral ischemic attack, unspecified |
| `G51.0` | 貝爾氏麻痺 | Bell 氏麻痺 | Bell's palsy |
| `I62.00` | 非創傷性硬腦膜下出血 | 非創傷性硬腦膜下出血 | Nontraumatic subdural hemorrhage, unspecified |
| `S06.5X0A` | 創傷性硬腦膜下出血（未伴意識喪失，初期照護） | 創傷性硬腦膜下出血，未伴有意識喪失之初期照護 | Traumatic subdural hemorrhage without loss of consciousness, initial encounter |
| `G40.909` | 癲癇（非難治，未伴重積） | 癲癇，非難治之癲癇，未伴有癲癇重積狀態 | Epilepsy, unspecified, not intractable, without status epilepticus |
| `M62.81` | 肌肉無力（廣泛性） | 肌無力 | Muscle weakness (generalized) |
| `R53.1` | 虛弱 | 虛弱 | Weakness |
| `M54.16` | 腰椎神經根病變 | 腰椎神經根病變 | Radiculopathy, lumbar region |
| `M54.12` | 頸椎神經根病變 | 頸椎神經根病變 | Radiculopathy, cervical region |
| `G56.00` | 腕隧道症候群（未明示側） | 未明示側性腕隧道症候群 | Carpal tunnel syndrome, unspecified upper limb |
| `G57.30` | 外側膕神經（腓神經）病灶／垂足 | 未明示側性下肢外側膕神經病灶 | Lesion of lateral popliteal nerve, unspecified lower limb |
| `G70.00` | 重症肌無力（未伴急性惡化） | 重症肌無力未伴有急性惡化 | Myasthenia gravis without (acute) exacerbation |
| `G70.01` | 重症肌無力伴急性惡化（肌無力危象） | 重症肌無力伴有急性惡化 | Myasthenia gravis with (acute) exacerbation |
| `G62.9` | 多發神經病變 | 多發神經病變 | Polyneuropathy, unspecified |
| `G35` | 多發性硬化症 | 多發性硬化症 | Multiple sclerosis |
| `G72.3` | 週期性麻痺 | 週期性麻痺 | Periodic paralysis |
| `E87.6` | 低血鉀症 | 低血鉀症 | Hypokalemia |
| `E05.90` | 甲狀腺毒症／甲亢（未伴危象或風暴） | 未明示之甲狀腺毒症，未伴有甲狀腺毒性危象或風暴 | Thyrotoxicosis, unspecified without thyrotoxic crisis or storm |
| `G43.109` | 預兆偏頭痛（非頑固性、未伴重積） | 預兆偏頭痛，非頑固性，未伴有偏頭痛重積狀態 | Migraine with aura, not intractable, without status migrainosus |
| `F44.4` | 轉化症（伴動作症狀） | 有動作症狀或缺損的轉化症 | Conversion disorder with motor symptom or deficit |
| `C79.31` | 腦轉移 | 腦續發性惡性腫瘤 | Secondary malignant neoplasm of brain |
| `G06.0` | 顱內膿瘍及肉芽腫 | 顱內膿瘍及肉芽腫 | Intracranial abscess and granuloma |
| `G04.90` | 腦炎／腦脊髓炎 | 腦炎及腦脊髓炎 | Encephalitis and encephalomyelitis, unspecified |
| `B02.21` | 疱疹後膝狀神經節炎（Ramsay Hunt） | 疱疹後膝狀神經節炎 | Postherpetic geniculate ganglionitis |
| `G83.20` | 上肢單肢癱 | 影響未明示側別上肢單肢癱 | Monoplegia of upper limb affecting unspecified side |
| `G83.10` | 下肢單肢癱 | 影響未明示側別下肢單肢癱 | Monoplegia of lower limb affecting unspecified side |
| `G82.20` | 截癱（下半身癱瘓） | 截癱 | Paraplegia, unspecified |
| **優先排除（紅旗）** | | | |
| `I63.9` | 急性缺血性腦中風 | 腦梗塞 | Cerebral infarction, unspecified |
| `I61.9` | 腦出血 | 非創傷性腦出血 | Nontraumatic intracerebral hemorrhage, unspecified |
| `I60.9` | 蜘蛛膜下腔出血 | 非創傷性蜘蛛網膜下腔出血 | Nontraumatic subarachnoid hemorrhage, unspecified |
| `E16.2` | 低血糖 | 低血糖 | Hypoglycemia, unspecified |
| `G95.20` | 脊髓壓迫 | 脊髓壓迫 | Unspecified cord compression |
| `G61.0` | Guillain-Barre 症候群（GBS） | Guillain-Barre 氏症候群 | Guillain-Barre syndrome |
| `I71.00` | 主動脈剝離 | 未明示部位之主動脈瘤剝離 | Dissection of unspecified site of aorta |

#### 喉嚨痛／頸部腫脹

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R07.0` | 喉嚨痛 | 喉嚨痛 | Pain in throat |
| `R22.1` | 頸部腫脹／腫塊 | 頸部局部腫脹、腫塊及小腫塊 | Localized swelling, mass and lump, neck |
| **常見疾病** | | | |
| `J02.9` | 急性咽炎 | 急性咽炎 | Acute pharyngitis, unspecified |
| `J00` | 急性鼻咽炎（感冒） | 急性鼻咽炎（感冒） | Acute nasopharyngitis [common cold] |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `J02.0` | 鏈球菌性咽炎 | 鏈球菌性咽炎 | Streptococcal pharyngitis |
| `J03.90` | 急性扁桃腺炎 | 急性扁桃腺炎 | Acute tonsillitis, unspecified |
| `J04.0` | 急性喉炎 | 急性喉炎 | Acute laryngitis |
| `J11.1` | 流感（伴其他呼吸道表徵） | 未確認流感病毒所致流行性感冒併其他呼吸道表徵 | Influenza due to unidentified influenza virus with other respiratory manifestations |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `B08.5` | 腸病毒性囊泡性咽炎（疱疹性咽峽炎） | 腸病毒性囊泡性咽炎 | Enteroviral vesicular pharyngitis |
| `B08.4` | 手足口病（腸病毒囊泡性口炎伴皮疹） | 腸病毒性囊泡性口炎伴有皮疹 | Enteroviral vesicular stomatitis with exanthem |
| `B27.90` | 傳染性單核球增多症（未伴併發症） | 傳染性單核球過多症，未伴有併發症 | Infectious mononucleosis, unspecified without complication |
| `K12.0` | 復發性口瘡（口腔潰瘍） | 復發性口瘡 | Recurrent oral aphthae |
| `K21.9` | 胃食道逆流 GERD（未伴食道炎） | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `J31.2` | 慢性咽炎 | 慢性咽炎 | Chronic pharyngitis |
| `J35.01` | 慢性扁桃腺炎 | 慢性扁桃腺炎 | Chronic tonsillitis |
| `J39.2` | 咽部其他疾病 | 咽之其他疾病 | Other diseases of pharynx |
| `J05.10` | 急性會厭炎（未伴阻塞） | 急性會厭炎，未伴有阻塞 | Acute epiglottitis without obstruction |
| `T18.108A` | 食道異物（如魚刺） | 未明示異物在食道導致其他損傷之初期照護 | Unspecified foreign body in esophagus causing other injury, initial encounter |
| `T18.0XXA` | 口腔異物 | 異物在口腔之初期照護 | Foreign body in mouth, initial encounter |
| `L04.0` | 頭頸部急性淋巴腺炎 | 臉、頭及頸部急性淋巴腺炎 | Acute lymphadenitis of face, head and neck |
| `R59.0` | 局部淋巴結腫大 | 局部性淋巴結腫大 | Localized enlarged lymph nodes |
| `K11.20` | 唾液腺炎 | 唾液腺炎 | Sialoadenitis, unspecified |
| `B26.9` | 流行性腮腺炎（未伴併發症） | 其他流行性腮腺炎未伴有併發症 | Mumps without complication |
| `E04.1` | 非毒性單一甲狀腺結節 | 非毒性單一甲狀腺結節 | Nontoxic single thyroid nodule |
| `E06.1` | 亞急性甲狀腺炎 | 亞急性甲狀腺炎 | Subacute thyroiditis |
| `A18.2` | 結核性周邊淋巴腺病變 | 結核性周邊淋巴腺病變 | Tuberculous peripheral lymphadenopathy |
| `C77.0` | 頭頸部淋巴結轉移 | 頭，顏面及頸部淋巴結之續發性及未明性惡性腫瘤 | Secondary and unspecified malignant neoplasm of lymph nodes of head, face and neck |
| **優先排除（紅旗）** | | | |
| `J36` | 扁桃腺周圍膿瘍 | 扁桃腺周圍膿瘍 | Peritonsillar abscess |
| `J39.0` | 咽後及咽旁膿瘍 | 後咽、咽旁膿瘍 | Retropharyngeal and parapharyngeal abscess |
| `K12.2` | 口腔蜂窩組織炎（Ludwig） | 口腔蜂窩組織炎及膿瘍 | Cellulitis and abscess of mouth |
| `J05.11` | 急性會厭炎併阻塞 | 急性會厭炎，併阻塞 | Acute epiglottitis with obstruction |
| `I82.C19` | 頸內靜脈血栓（Lemierre） | 未明示側性頸內靜脈急性栓塞及血栓 | Acute embolism and thrombosis of unspecified internal jugular vein |
| `M72.6` | 壞死性筋膜炎 | 壞死性筋膜炎 | Necrotizing fasciitis |

### 胸肺／心臟

#### 胸痛／心悸

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R07.9` | 胸痛 | 胸痛 | Chest pain, unspecified |
| `R00.2` | 心悸 | 心悸 | Palpitations |
| `R00.0` | 心搏過速 | 心搏過速 | Tachycardia, unspecified |
| **常見疾病** | | | |
| `I20.9` | 心絞痛 | 心絞痛 | Angina pectoris, unspecified |
| `I20.0` | 不穩定心絞痛 | 不穩定心絞痛 | Unstable angina |
| `I25.10` | 冠狀動脈粥狀硬化性心臟病（未伴心絞痛） | 自體的冠狀動脈粥樣硬化心臟病未伴有心絞痛 | Atherosclerotic heart disease of native coronary artery without angina pectoris |
| `K21.9` | 胃食道逆流 GERD（未伴食道炎） | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K21.00` | 胃食道逆流伴食道炎（未伴出血） | 胃食道逆流性疾病伴有食道炎未伴有出血 | Gastro-esophageal reflux disease with esophagitis, without bleeding |
| `K29.70` | 胃炎（未伴出血） | 胃炎未伴有出血 | Gastritis, unspecified, without bleeding |
| `K25.9` | 胃潰瘍（未明示急慢性、未伴出血或穿孔） | 胃潰瘍，未明示急性或慢性，未伴有出血或穿孔 | Gastric ulcer, unspecified as acute or chronic, without hemorrhage or perforation |
| `M94.0` | 肋軟骨連接處症候群（Tietze） | 肋軟骨與肋連接處症候群 [Tietze] | Chondrocostal junction syndrome [Tietze] |
| `R07.82` | 肋間疼痛 | 肋間疼痛 | Intercostal pain |
| `R09.1` | 肋膜炎 | 肋膜炎 | Pleurisy |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| `F41.0` | 恐慌症 | 特定場所畏懼症的恐慌症 | Panic disorder [episodic paroxysmal anxiety] |
| `I49.9` | 心律不整 | 心臟節律不整 | Cardiac arrhythmia, unspecified |
| `I48.91` | 心房顫動 | 心房顫動 | Unspecified atrial fibrillation |
| `I47.1` | 心室上心搏過速 SVT | 心室上部心搏過速 | Supraventricular tachycardia |
| `I49.1` | 心房早期收縮 APC | 心房早期去極化 | Atrial premature depolarization |
| `I49.3` | 心室早期收縮 PVC | 心室早期去極化 | Ventricular premature depolarization |
| `R00.1` | 心搏過緩 | 心博過慢 | Bradycardia, unspecified |
| `I45.6` | 預激症候群（WPW） | 預激症候群 | Pre-excitation syndrome |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `I16.0` | 高血壓緊急狀況（urgency） | 高血壓緊急狀況 | Hypertensive urgency |
| `I30.9` | 急性心包膜炎 | 急性心包膜炎 | Acute pericarditis, unspecified |
| `I20.1` | 血管痙攣性心絞痛 | 因痙攣引起之心絞痛 | Angina pectoris with documented spasm |
| `J93.11` | 原發性自發性氣胸 | 原發性自發性氣胸 | Primary spontaneous pneumothorax |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `J20.9` | 急性支氣管炎 | 急性支氣管炎 | Acute bronchitis, unspecified |
| `J90` | 肋膜積水 | 肋膜積水，他處未歸類者 | Pleural effusion, not elsewhere classified |
| `B02.9` | 帶狀疱疹（未伴併發症） | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `E05.90` | 甲狀腺毒症／甲亢（未伴危象或風暴） | 未明示之甲狀腺毒症，未伴有甲狀腺毒性危象或風暴 | Thyrotoxicosis, unspecified without thyrotoxic crisis or storm |
| `I26.99` | 其他肺栓塞（未伴急性肺性心臟病） | 其他肺栓塞未伴有急性肺性心臟病 | Other pulmonary embolism without acute cor pulmonale |
| **優先排除（紅旗）** | | | |
| `I21.9` | 急性心肌梗塞 | 急性心肌梗塞 | Acute myocardial infarction, unspecified |
| `I26.09` | 肺栓塞併急性肺性心臟病（大範圍 PE） | 其他肺栓塞併急性肺性心臟病 | Other pulmonary embolism with acute cor pulmonale |
| `I71.00` | 主動脈剝離 | 未明示部位之主動脈瘤剝離 | Dissection of unspecified site of aorta |
| `J93.0` | 張力性氣胸（自發性） | 自發性壓力性氣胸 | Spontaneous tension pneumothorax |
| `I31.4` | 心包填塞 | 心包膜填塞 | Cardiac tamponade |
| `K22.3` | 食道穿孔（Boerhaave） | 食道穿孔 | Perforation of esophagus |
| `I40.9` | 急性心肌炎 | 急性心肌炎 | Acute myocarditis, unspecified |

#### 呼吸困難

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R06.02` | 呼吸短促 | 呼吸短促 | Shortness of breath |
| `R06.00` | 呼吸困難 | 呼吸困難 | Dyspnea, unspecified |
| `R06.2` | 哮鳴 | 哮鳴 | Wheezing |
| **常見疾病** | | | |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `J44.1` | COPD 急性惡化 | 慢性阻塞性肺病伴有(急性)發作 | Chronic obstructive pulmonary disease with (acute) exacerbation |
| `J45.901` | 氣喘急性發作 | 氣喘併(急性)發作 | Unspecified asthma with (acute) exacerbation |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `J20.9` | 急性支氣管炎 | 急性支氣管炎 | Acute bronchitis, unspecified |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `J11.1` | 流感（伴其他呼吸道表徵） | 未確認流感病毒所致流行性感冒併其他呼吸道表徵 | Influenza due to unidentified influenza virus with other respiratory manifestations |
| `J69.0` | 吸入性肺炎 | 吸入食物或嘔吐物所致之肺炎 | Pneumonitis due to inhalation of food and vomit |
| `J90` | 肋膜積水 | 肋膜積水，他處未歸類者 | Pleural effusion, not elsewhere classified |
| `I48.91` | 心房顫動 | 心房顫動 | Unspecified atrial fibrillation |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `J44.9` | 慢性阻塞性肺病 COPD | 慢性阻塞性肺病 | Chronic obstructive pulmonary disease, unspecified |
| `J45.909` | 氣喘（無併發症） | 氣喘,無併發症 | Unspecified asthma, uncomplicated |
| `J96.01` | 急性呼吸衰竭併缺氧 | 急性呼吸衰竭併缺氧 | Acute respiratory failure with hypoxia |
| `J96.02` | 急性呼吸衰竭併高碳酸血症 | 急性呼吸衰竭併高碳酸血症 | Acute respiratory failure with hypercapnia |
| `J96.00` | 急性呼吸衰竭 | 急性呼吸衰竭，未明示是否伴有缺氧或高碳酸血症 | Acute respiratory failure, unspecified whether with hypoxia or hypercapnia |
| `J93.11` | 原發性自發性氣胸 | 原發性自發性氣胸 | Primary spontaneous pneumothorax |
| `J43.9` | 肺氣腫 | 肺氣腫 | Emphysema, unspecified |
| `J47.9` | 支氣管擴張症（未併發） | 支氣管擴張症 | Bronchiectasis, uncomplicated |
| `J98.11` | 肺擴張不全 | 肺擴張不全 | Atelectasis |
| `J84.9` | 間質性肺疾病 | 間質性肺疾病 | Interstitial pulmonary disease, unspecified |
| `J85.2` | 肺膿瘍（未伴肺炎） | 肺膿瘍未伴有肺炎 | Abscess of lung without pneumonia |
| `C34.90` | 肺／支氣管惡性腫瘤（未明示側） | 未明示側性支氣管或肺惡性腫瘤 | Malignant neoplasm of unspecified part of unspecified bronchus or lung |
| `J91.0` | 惡性肋膜積水 | 惡性肋膜積水 | Malignant pleural effusion |
| `A15.0` | 肺結核 | 肺結核 | Tuberculosis of lung |
| `N17.9` | 急性腎衰竭（AKI） | 急性腎衰竭 | Acute kidney failure, unspecified |
| `N18.6` | 末期腎病 ESRD | 末期腎疾病 | End stage renal disease |
| `E87.20` | 酸中毒 | 酸中毒 | Acidosis, unspecified |
| `R06.4` | 換氣過度 | 換氣過度 | Hyperventilation |
| `F41.0` | 恐慌症 | 特定場所畏懼症的恐慌症 | Panic disorder [episodic paroxysmal anxiety] |
| `I26.99` | 其他肺栓塞（未伴急性肺性心臟病） | 其他肺栓塞未伴有急性肺性心臟病 | Other pulmonary embolism without acute cor pulmonale |
| `I26.02` | 肺動脈鞍形栓塞併急性肺性心臟病 | 肺動脈鞍形栓塞伴有急性肺性心臟病 | Saddle embolus of pulmonary artery with acute cor pulmonale |
| `E11.11` | 糖尿病酮酸中毒 DKA（第二型，伴昏迷） | 第二型糖尿病，伴有酮酸中毒，伴有昏迷 | Type 2 diabetes mellitus with ketoacidosis with coma |
| **優先排除（紅旗）** | | | |
| `I26.09` | 肺栓塞併急性肺性心臟病（大範圍 PE） | 其他肺栓塞併急性肺性心臟病 | Other pulmonary embolism with acute cor pulmonale |
| `I21.9` | 急性心肌梗塞 | 急性心肌梗塞 | Acute myocardial infarction, unspecified |
| `T78.2XXA` | 過敏性休克 | 過敏性休克之初期照護 | Anaphylactic shock, unspecified, initial encounter |
| `T78.3XXA` | 血管性水腫 | 血管神經性水腫之初期照護 | Angioneurotic edema, initial encounter |
| `J93.0` | 張力性氣胸（自發性） | 自發性壓力性氣胸 | Spontaneous tension pneumothorax |
| `I50.1` | 左心衰竭／急性肺水腫 | 左心衰竭 | Left ventricular failure, unspecified |
| `E11.10` | 糖尿病酮酸中毒 DKA（第二型，未伴昏迷） | 第二型糖尿病，伴有酮酸中毒，未伴有昏迷 | Type 2 diabetes mellitus with ketoacidosis without coma |

#### 暈厥

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R55` | 暈厥及虛脫 | 暈厥及虛脫 | Syncope and collapse |
| **常見疾病** | | | |
| `I95.1` | 姿勢性低血壓 | 直立性低血壓 | Orthostatic hypotension |
| `I95.9` | 低血壓 | 低血壓 | Hypotension, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `E86.9` | 體液缺乏 | 體液缺乏 | Volume depletion, unspecified |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `D62` | 急性失血性貧血 | 急性出血後貧血 | Acute posthemorrhagic anemia |
| `I49.9` | 心律不整 | 心臟節律不整 | Cardiac arrhythmia, unspecified |
| `R00.1` | 心搏過緩 | 心博過慢 | Bradycardia, unspecified |
| `I48.91` | 心房顫動 | 心房顫動 | Unspecified atrial fibrillation |
| `I47.1` | 心室上心搏過速 SVT | 心室上部心搏過速 | Supraventricular tachycardia |
| `I44.0` | 第一度房室傳導阻滯 | 第一度房室傳導阻滯 | Atrioventricular block, first degree |
| `I44.1` | 第二度房室傳導阻斷 | 第二度房室傳導阻滯 | Atrioventricular block, second degree |
| `I45.5` | 其他特定心臟傳導阻斷 | 其他特定心臟傳導阻滯 | Other specified heart block |
| `I45.6` | 預激症候群（WPW） | 預激症候群 | Pre-excitation syndrome |
| `I42.1` | 肥厚性阻塞型心肌病變 HOCM | 肥厚性阻塞性心肌病變 | Obstructive hypertrophic cardiomyopathy |
| `G40.909` | 癲癇（非難治，未伴重積） | 癲癇，非難治之癲癇，未伴有癲癇重積狀態 | Epilepsy, unspecified, not intractable, without status epilepticus |
| `R56.9` | 痙攣（抽搐） | 痙攣 | Unspecified convulsions |
| `G45.9` | 短暫性腦缺血發作 TIA | 短暫性大腦缺血發作 | Transient cerebral ischemic attack, unspecified |
| `I95.2` | 藥物所致低血壓 | 藥物所致之低血壓 | Hypotension due to drugs |
| `I95.81` | 處置後低血壓 | 處置後低血壓 | Postprocedural hypotension |
| `T88.7XXA` | 藥物不良反應 | 藥物或藥劑未明示之不良作用之初期照護 | Unspecified adverse effect of drug or medicament, initial encounter |
| `R06.4` | 換氣過度 | 換氣過度 | Hyperventilation |
| `A41.9` | 敗血症 | 敗血症，未明示病原體 | Sepsis, unspecified organism |
| `E27.40` | 腎上腺皮質功能不足 | 腎上腺皮質功能不足 | Unspecified adrenocortical insufficiency |
| `I26.99` | 其他肺栓塞（未伴急性肺性心臟病） | 其他肺栓塞未伴有急性肺性心臟病 | Other pulmonary embolism without acute cor pulmonale |
| **優先排除（紅旗）** | | | |
| `I21.9` | 急性心肌梗塞 | 急性心肌梗塞 | Acute myocardial infarction, unspecified |
| `I26.09` | 肺栓塞併急性肺性心臟病（大範圍 PE） | 其他肺栓塞併急性肺性心臟病 | Other pulmonary embolism with acute cor pulmonale |
| `I71.00` | 主動脈剝離 | 未明示部位之主動脈瘤剝離 | Dissection of unspecified site of aorta |
| `K92.2` | 胃腸道出血 | 胃腸道出血 | Gastrointestinal hemorrhage, unspecified |
| `E16.2` | 低血糖 | 低血糖 | Hypoglycemia, unspecified |
| `I44.2` | 完全房室傳導阻斷 | 完全性房室傳導阻滯 | Atrioventricular block, complete |
| `I35.0` | 非風濕性主動脈瓣狹窄 | 非風濕性主動脈瓣狹窄 | Nonrheumatic aortic (valve) stenosis |

### 腹部／消化

#### 腹痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R10.9` | 腹痛 | 腹痛 | Unspecified abdominal pain |
| `R10.13` | 心窩部痛 | 心窩部痛 | Epigastric pain |
| `R10.84` | 全腹痛 | 全腹痛 | Generalized abdominal pain |
| **常見疾病** | | | |
| `K29.70` | 胃炎（未伴出血） | 胃炎未伴有出血 | Gastritis, unspecified, without bleeding |
| `K21.9` | 胃食道逆流 GERD（未伴食道炎） | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K59.00` | 便秘 | 便秘 | Constipation, unspecified |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `K52.9` | 非感染性腸胃炎及結腸炎 | 非傳染性胃腸炎及結腸炎 | Noninfective gastroenteritis and colitis, unspecified |
| `K80.20` | 膽囊結石（未伴膽囊炎、未伴阻塞） | 膽囊結石未伴有膽囊炎未伴有阻塞 | Calculus of gallbladder without cholecystitis without obstruction |
| `K80.00` | 膽囊結石併急性膽囊炎（未伴阻塞） | 膽囊結石併急性膽囊炎未伴有阻塞 | Calculus of gallbladder with acute cholecystitis without obstruction |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `K85.90` | 急性胰臟炎（未伴壞死或感染） | 急性胰臟炎未伴有壞死或感染 | Acute pancreatitis without necrosis or infection, unspecified |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `N20.1` | 輸尿管結石 | 輸尿管結石 | Calculus of ureter |
| `N23` | 腎絞痛 | 腎絞痛 | Unspecified renal colic |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `K92.2` | 胃腸道出血 | 胃腸道出血 | Gastrointestinal hemorrhage, unspecified |
| `K58.9` | 腸躁症（未伴腹瀉） | 激躁性腸症候群未伴有腹瀉 | Irritable bowel syndrome without diarrhea |
| `K57.32` | 大腸憩室炎（未伴穿孔或膿瘍、無出血） | 大腸憩室炎未伴有穿孔或膿瘍無出血 | Diverticulitis of large intestine without perforation or abscess without bleeding |
| `K57.30` | 大腸憩室（未伴穿孔或膿瘍、無出血） | 大腸憩室未伴有穿孔或膿瘍無出血 | Diverticulosis of large intestine without perforation or abscess without bleeding |
| `K25.9` | 胃潰瘍（未明示急慢性、未伴出血或穿孔） | 胃潰瘍，未明示急性或慢性，未伴有出血或穿孔 | Gastric ulcer, unspecified as acute or chronic, without hemorrhage or perforation |
| `K26.9` | 十二指腸潰瘍（未明示急慢性、未伴出血或穿孔） | 十二指腸潰瘍，未明示急性或慢性，未伴有出血或穿孔 | Duodenal ulcer, unspecified as acute or chronic, without hemorrhage or perforation |
| `K30` | 功能性消化不良 | 功能性消化不良 | Functional dyspepsia |
| `K40.90` | 單側腹股溝疝氣（未伴阻塞或壞疽） | 單側腹股溝疝氣，未伴有阻塞或壞疽，未明示為復發 | Unilateral inguinal hernia, without obstruction or gangrene, not specified as recurrent |
| `K46.9` | 腹部疝氣（未伴阻塞或壞疽） | 腹部疝氣未伴有阻塞或壞疽 | Unspecified abdominal hernia without obstruction or gangrene |
| `K65.9` | 腹膜炎 | 腹膜炎 | Peritonitis, unspecified |
| `K75.0` | 肝膿瘍 | 肝膿瘍 | Abscess of liver |
| `K61.0` | 肛門膿瘍 | 肛門膿瘍 | Anal abscess |
| `A04.72` | 艱難梭菌腸道感染 CDI（非復發型） | 艱難梭菌所致腸道感染，未明示為復發型 | Enterocolitis due to Clostridium difficile, not specified as recurrent |
| `K51.90` | 潰瘍性結腸炎（未伴併發症） | 潰瘍性結腸炎未伴有併發症 | Ulcerative colitis, unspecified, without complications |
| `K50.90` | 克隆氏病（未伴併發症） | 克隆氏病未伴有併發症 | Crohn's disease, unspecified, without complications |
| `N83.209` | 卵巢囊腫 | 未明示側性卵巢囊腫 | Unspecified ovarian cyst, unspecified side |
| `N73.9` | 女性骨盆炎性疾病 PID | 女性骨盆炎性疾病 | Female pelvic inflammatory disease, unspecified |
| `N94.6` | 經痛 | 痛經症 | Dysmenorrhea, unspecified |
| `B02.9` | 帶狀疱疹（未伴併發症） | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `I21.9` | 急性心肌梗塞 | 急性心肌梗塞 | Acute myocardial infarction, unspecified |
| `E11.10` | 糖尿病酮酸中毒 DKA（第二型，未伴昏迷） | 第二型糖尿病，伴有酮酸中毒，未伴有昏迷 | Type 2 diabetes mellitus with ketoacidosis without coma |
| `O00.91` | 子宮外孕伴子宮內妊娠 | 子宮外孕伴有子宮內妊娠 | Unspecified ectopic pregnancy with intrauterine pregnancy |
| **優先排除（紅旗）** | | | |
| `K35.80` | 急性闌尾炎 | 急性闌尾炎 | Unspecified acute appendicitis |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |
| `K55.069` | 腸繫膜梗塞 | 急性腸部分梗塞，未明示程度 | Acute infarction of intestine, part and extent unspecified |
| `I71.30` | 腹主動脈瘤破裂 | 腹主動脈瘤，已破裂 | Abdominal aortic aneurysm, ruptured, unspecified |
| `K63.1` | 腸穿孔 | 腸穿孔(非創傷性) | Perforation of intestine (nontraumatic) |
| `O00.90` | 子宮外孕（未伴子宮內妊娠） | 子宮外孕未伴有子宮內妊娠 | Unspecified ectopic pregnancy without intrauterine pregnancy |
| `K83.09` | 急性膽管炎（其他膽管炎） | 其他膽管炎 | Other cholangitis |

#### 噁心嘔吐

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R11.2` | 噁心伴嘔吐 | 噁心伴有嘔吐 | Nausea with vomiting, unspecified |
| `R11.10` | 嘔吐 | 嘔吐 | Vomiting, unspecified |
| **常見疾病** | | | |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `K52.9` | 非感染性腸胃炎及結腸炎 | 非傳染性胃腸炎及結腸炎 | Noninfective gastroenteritis and colitis, unspecified |
| `A08.4` | 病毒性腸炎 | 病毒性腸道病毒感染 | Viral intestinal infection, unspecified |
| `A05.9` | 細菌性食物中毒 | 細菌性食物中毒 | Bacterial foodborne intoxication, unspecified |
| `K21.9` | 胃食道逆流 GERD（未伴食道炎） | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K29.70` | 胃炎（未伴出血） | 胃炎未伴有出血 | Gastritis, unspecified, without bleeding |
| `K25.9` | 胃潰瘍（未明示急慢性、未伴出血或穿孔） | 胃潰瘍，未明示急性或慢性，未伴有出血或穿孔 | Gastric ulcer, unspecified as acute or chronic, without hemorrhage or perforation |
| `K30` | 功能性消化不良 | 功能性消化不良 | Functional dyspepsia |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `K59.00` | 便秘 | 便秘 | Constipation, unspecified |
| `K85.90` | 急性胰臟炎（未伴壞死或感染） | 急性胰臟炎未伴有壞死或感染 | Acute pancreatitis without necrosis or infection, unspecified |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `N23` | 腎絞痛 | 腎絞痛 | Unspecified renal colic |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `H81.10` | 良性陣發性眩暈 BPPV（未明示側） | 未明示側性之良性陣發性眩暈 | Benign paroxysmal vertigo, unspecified ear |
| `G43.909` | 偏頭痛 | 偏頭痛，未明確定義型態，非頑固性，未伴有偏頭痛重積狀態 | Migraine, unspecified, not intractable, without status migrainosus |
| `T88.7XXA` | 藥物不良反應 | 藥物或藥劑未明示之不良作用之初期照護 | Unspecified adverse effect of drug or medicament, initial encounter |
| `T45.1X5A` | 化療／免疫抑制劑不良反應（附加碼） | 抗腫瘤及免疫抑制藥物不良反應之初期照護 | Adverse effect of antineoplastic and immunosuppressive drugs, initial encounter |
| `F10.929` | 急性酒精中毒 | 非特定的酒精使用，有非特定的中毒 | Alcohol use, unspecified with intoxication, unspecified |
| `O21.0` | 妊娠孕吐（輕度） | 輕度妊娠孕吐 | Mild hyperemesis gravidarum |
| `E87.1` | 低血鈉及低滲透壓 | 低滲壓及低血鈉 | Hypo-osmolality and hyponatremia |
| `N19` | 腎衰竭（尿毒症） | 腎衰竭 | Unspecified kidney failure |
| `K72.90` | 肝衰竭（未伴昏迷） | 肝衰竭未伴有昏迷 | Hepatic failure, unspecified without coma |
| `K31.84` | 胃輕癱 | 胃輕癱 | Gastroparesis |
| `E27.40` | 腎上腺皮質功能不足 | 腎上腺皮質功能不足 | Unspecified adrenocortical insufficiency |
| `E11.11` | 糖尿病酮酸中毒 DKA（第二型，伴昏迷） | 第二型糖尿病，伴有酮酸中毒，伴有昏迷 | Type 2 diabetes mellitus with ketoacidosis with coma |
| `E10.11` | 糖尿病酮酸中毒 DKA（第一型，伴昏迷） | 第一型糖尿病，伴有酮酸中毒，伴有昏迷 | Type 1 diabetes mellitus with ketoacidosis with coma |
| **優先排除（紅旗）** | | | |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |
| `K92.2` | 胃腸道出血 | 胃腸道出血 | Gastrointestinal hemorrhage, unspecified |
| `E11.10` | 糖尿病酮酸中毒 DKA（第二型，未伴昏迷） | 第二型糖尿病，伴有酮酸中毒，未伴有昏迷 | Type 2 diabetes mellitus with ketoacidosis without coma |
| `E10.10` | 糖尿病酮酸中毒 DKA（第一型，未伴昏迷） | 第一型糖尿病，伴有酮酸中毒，未伴有昏迷 | Type 1 diabetes mellitus with ketoacidosis without coma |
| `I21.9` | 急性心肌梗塞 | 急性心肌梗塞 | Acute myocardial infarction, unspecified |
| `G03.9` | 腦膜炎 | 腦膜炎 | Meningitis, unspecified |
| `G93.6` | 腦水腫 | 腦水腫 | Cerebral edema |

#### 腹瀉

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R19.7` | 腹瀉 | 腹瀉 | Diarrhea, unspecified |
| **常見疾病** | | | |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `A08.4` | 病毒性腸炎 | 病毒性腸道病毒感染 | Viral intestinal infection, unspecified |
| `A08.11` | 諾羅病毒急性胃腸炎 | 類諾瓦克病毒所致之急性胃腸病變 | Acute gastroenteropathy due to Norwalk agent |
| `A08.0` | 輪狀病毒性腸炎 | 輪狀病毒性腸炎 | Rotaviral enteritis |
| `K52.9` | 非感染性腸胃炎及結腸炎 | 非傳染性胃腸炎及結腸炎 | Noninfective gastroenteritis and colitis, unspecified |
| `A05.9` | 細菌性食物中毒 | 細菌性食物中毒 | Bacterial foodborne intoxication, unspecified |
| `A05.3` | 副溶血弧菌食物中毒 | 副溶血弧菌食物中毒 | Foodborne Vibrio parahaemolyticus intoxication |
| `A05.0` | 葡萄球菌食物中毒 | 葡萄球菌食物中毒 | Foodborne staphylococcal intoxication |
| `A02.0` | 沙門桿菌腸炎 | 沙門桿菌腸炎 | Salmonella enteritis |
| `A04.5` | 彎曲桿菌腸炎 | 彎曲桿菌腸炎 | Campylobacter enteritis |
| `A04.4` | 其他大腸桿菌腸道感染 | 其他大腸桿菌腸道感染 | Other intestinal Escherichia coli infections |
| `A04.9` | 細菌性腸道感染 | 細菌性腸道感染 | Bacterial intestinal infection, unspecified |
| `A03.9` | 志賀桿菌病 | 志賀桿菌病 | Shigellosis, unspecified |
| `A06.0` | 急性阿米巴痢疾 | 急性阿米巴性痢疾 | Acute amebic dysentery |
| `A07.1` | 梨形鞭毛蟲病 | 梨形鞭毛蟲病[腸梨形蟲病] | Giardiasis [lambliasis] |
| `A01.00` | 傷寒 | 傷寒 | Typhoid fever, unspecified |
| `K58.0` | 腸躁症伴腹瀉 | 激躁性腸症候群併腹瀉 | Irritable bowel syndrome with diarrhea |
| `K59.1` | 功能性腹瀉 | 功能性腹瀉 | Functional diarrhea |
| `K52.1` | 毒性（藥物性）胃腸炎及結腸炎 | 毒性胃腸炎及結腸炎 | Toxic gastroenteritis and colitis |
| `T88.7XXA` | 藥物不良反應 | 藥物或藥劑未明示之不良作用之初期照護 | Unspecified adverse effect of drug or medicament, initial encounter |
| `E73.9` | 乳糖不耐 | 乳糖耐受不良 | Lactose intolerance, unspecified |
| `K51.90` | 潰瘍性結腸炎（未伴併發症） | 潰瘍性結腸炎未伴有併發症 | Ulcerative colitis, unspecified, without complications |
| `K50.90` | 克隆氏病（未伴併發症） | 克隆氏病未伴有併發症 | Crohn's disease, unspecified, without complications |
| `K59.00` | 便秘 | 便秘 | Constipation, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `E87.6` | 低血鉀症 | 低血鉀症 | Hypokalemia |
| `E05.90` | 甲狀腺毒症／甲亢（未伴危象或風暴） | 未明示之甲狀腺毒症，未伴有甲狀腺毒性危象或風暴 | Thyrotoxicosis, unspecified without thyrotoxic crisis or storm |
| `A04.71` | 艱難梭菌腸道感染 CDI（復發型） | 艱難梭菌所致腸道感染，復發型 | Enterocolitis due to Clostridium difficile, recurrent |
| **優先排除（紅旗）** | | | |
| `A04.72` | 艱難梭菌腸道感染 CDI（非復發型） | 艱難梭菌所致腸道感染，未明示為復發型 | Enterocolitis due to Clostridium difficile, not specified as recurrent |
| `K55.039` | 缺血性大腸炎 | 急性(可逆)大腸缺血，未明示程度 | Acute (reversible) ischemia of large intestine, extent unspecified |
| `K59.31` | 毒性巨結腸症 | 毒性巨結腸症 | Toxic megacolon |
| `A41.9` | 敗血症 | 敗血症，未明示病原體 | Sepsis, unspecified organism |

#### 吐血／解黑便

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `K92.0` | 吐血 | 吐血 | Hematemesis |
| `K92.1` | 黑便 | 黑便 | Melena |
| **常見疾病** | | | |
| `K92.2` | 胃腸道出血 | 胃腸道出血 | Gastrointestinal hemorrhage, unspecified |
| `K25.4` | 胃潰瘍伴出血（慢性或未明示） | 慢性或未明示胃潰瘍併出血 | Chronic or unspecified gastric ulcer with hemorrhage |
| `K26.4` | 十二指腸潰瘍伴出血（慢性或未明示） | 慢性或未明示十二指腸潰瘍併出血 | Chronic or unspecified duodenal ulcer with hemorrhage |
| `K25.0` | 急性胃潰瘍併出血 | 急性胃潰瘍併出血 | Acute gastric ulcer with hemorrhage |
| `K26.0` | 急性十二指腸潰瘍併出血 | 急性十二指腸潰瘍併出血 | Acute duodenal ulcer with hemorrhage |
| `K27.4` | 消化性潰瘍併出血（部位未明示） | 慢性或未明示消化性潰瘍併出血，部位未明示 | Chronic or unspecified peptic ulcer, site unspecified, with hemorrhage |
| `K29.01` | 急性胃炎伴出血 | 急性胃炎併出血 | Acute gastritis with bleeding |
| `K29.71` | 胃炎併出血 | 胃炎併出血 | Gastritis, unspecified, with bleeding |
| `K29.81` | 十二指腸炎併出血 | 十二指腸炎併出血 | Duodenitis with bleeding |
| `K22.6` | Mallory-Weiss 撕裂傷 | 胃、食道接合部裂傷出血徵候群 | Gastro-esophageal laceration-hemorrhage syndrome |
| `K20.91` | 食道炎併出血 | 食道炎伴有出血 | Esophagitis, unspecified with bleeding |
| `K21.01` | 胃食道逆流併食道炎併出血 | 胃食道逆流性疾病伴有食道炎伴有出血 | Gastro-esophageal reflux disease with esophagitis, with bleeding |
| `K22.11` | 食道潰瘍併出血 | 食道潰瘍併出血 | Ulcer of esophagus with bleeding |
| `K31.811` | 胃十二指腸血管發育不良併出血 | 胃及十二指腸血管發育不良併出血 | Angiodysplasia of stomach and duodenum with bleeding |
| `I86.4` | 胃靜脈曲張 | 胃靜脈曲張 | Gastric varices |
| `C16.9` | 胃惡性腫瘤 | 胃惡性腫瘤 | Malignant neoplasm of stomach, unspecified |
| `K74.60` | 肝硬化 | 肝硬化 | Unspecified cirrhosis of liver |
| `K76.6` | 門脈高壓 | 門脈高壓 | Portal hypertension |
| `R04.0` | 鼻出血 | 鼻出血 | Epistaxis |
| `K62.5` | 肛門及直腸出血 | 肛門及直腸出血 | Hemorrhage of anus and rectum |
| `K57.31` | 大腸憩室併出血 | 大腸憩室未伴有穿孔或膿瘍併出血 | Diverticulosis of large intestine without perforation or abscess with bleeding |
| `T45.515A` | 抗凝血劑不良反應（附加碼） | 抗凝血藥劑不良反應之初期照護 | Adverse effect of anticoagulants, initial encounter |
| `D68.32` | 抗凝血物質所致出血性疾患 | 循環中抗凝血物質所致的出血性疾患 | Hemorrhagic disorder due to extrinsic circulating anticoagulants |
| `D69.6` | 血小板缺乏症 | 血小板缺乏症 | Thrombocytopenia, unspecified |
| `D50.9` | 缺鐵性貧血 | 缺鐵性貧血 | Iron deficiency anemia, unspecified |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| **優先排除（紅旗）** | | | |
| `I85.01` | 食道靜脈曲張出血（原發） | 食道靜脈曲張伴有出血 | Esophageal varices with bleeding |
| `I85.11` | 續發性食道靜脈曲張伴出血（肝硬化等） | 續發性食道靜脈曲張伴有出血 | Secondary esophageal varices with bleeding |
| `R57.1` | 低血容性休克 | 低血容性休克 | Hypovolemic shock |
| `D62` | 急性失血性貧血 | 急性出血後貧血 | Acute posthemorrhagic anemia |
| `K25.5` | 胃潰瘍併穿孔（慢性或未明示） | 慢性或未明示胃潰瘍併穿孔 | Chronic or unspecified gastric ulcer with perforation |
| `K26.5` | 十二指腸潰瘍併穿孔（慢性或未明示） | 慢性或未明示十二指腸潰瘍併穿孔 | Chronic or unspecified duodenal ulcer with perforation |
| `K22.3` | 食道穿孔（Boerhaave） | 食道穿孔 | Perforation of esophagus |

### 泌尿／生殖

#### 排尿症狀

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R30.0` | 排尿困難 | 排尿困難 | Dysuria |
| `R35.0` | 頻尿 | 頻尿 | Frequency of micturition |
| **常見疾病** | | | |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `N30.00` | 急性膀胱炎（未伴血尿） | 急性膀胱炎未伴有血尿 | Acute cystitis without hematuria |
| `N30.01` | 急性膀胱炎伴血尿 | 急性膀胱炎伴有血尿 | Acute cystitis with hematuria |
| `N30.90` | 膀胱炎（未伴血尿） | 膀胱炎未伴有血尿 | Cystitis, unspecified without hematuria |
| `N40.1` | 攝護腺增生伴下泌尿道症狀 BPH | 良性攝護腺增生伴有下泌尿道症狀 | Benign prostatic hyperplasia with lower urinary tract symptoms |
| `N41.0` | 急性攝護腺炎 | 急性攝護腺炎 | Acute prostatitis |
| `N41.1` | 慢性攝護腺炎 | 慢性攝護腺炎 | Chronic prostatitis |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `N20.1` | 輸尿管結石 | 輸尿管結石 | Calculus of ureter |
| `N21.0` | 膀胱內結石 | 膀胱內結石 | Calculus in bladder |
| `N34.1` | 非特異性尿道炎 | 非特定性的尿道炎 | Nonspecific urethritis |
| `N34.2` | 其他尿道炎 | 其他尿道炎 | Other urethritis |
| `A54.01` | 淋菌性膀胱炎及尿道炎 | 淋病雙球菌性膀胱炎及尿道炎，未明示 | Gonococcal cystitis and urethritis, unspecified |
| `A56.01` | 披衣菌性膀胱炎及尿道炎 | 披衣菌性膀胱炎和尿道炎 | Chlamydial cystitis and urethritis |
| `N45.1` | 副睪炎 | 副睪丸炎 | Epididymitis |
| `N45.3` | 副睪—睪丸炎 | 副睪－睪丸炎 | Epididymo-orchitis |
| `N76.0` | 急性陰道炎 | 急性陰道炎 | Acute vaginitis |
| `N32.81` | 膀胱過動症 | 膀胱過動症 | Overactive bladder |
| `N39.41` | 急迫性尿失禁 | 急迫性尿失禁 | Urge incontinence |
| `N39.3` | 應力性尿失禁 | 應力性尿失禁 | Stress incontinence (female) (male) |
| `R35.1` | 夜尿 | 夜尿 | Nocturia |
| `N31.9` | 膀胱神經肌肉功能障礙（神經性膀胱） | 膀胱神經肌肉機功能障礙 | Neuromuscular dysfunction of bladder, unspecified |
| `N13.30` | 腎水腫 | 腎水腫 | Unspecified hydronephrosis |
| `N15.1` | 腎及腎周圍膿瘍 | 腎及腎周圍膿瘍 | Renal and perinephric abscess |
| `N18.9` | 慢性腎臟疾病 CKD | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `C61` | 攝護腺惡性腫瘤 | 攝護腺惡性腫瘤 | Malignant neoplasm of prostate |
| **優先排除（紅旗）** | | | |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `R33.9` | 尿滯留 | 尿滯留 | Retention of urine, unspecified |
| `N13.6` | 腎盂蓄膿 | 腎盂蓄膿 | Pyonephrosis |
| `A41.9` | 敗血症 | 敗血症，未明示病原體 | Sepsis, unspecified organism |
| `N17.9` | 急性腎衰竭（AKI） | 急性腎衰竭 | Acute kidney failure, unspecified |
| `N44.00` | 睪丸扭轉 | 睪丸扭轉 | Torsion of testis, unspecified |

#### 血尿

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R31.9` | 血尿 | 血尿 | Hematuria, unspecified |
| `R31.0` | 肉眼可見性血尿 | 肉眼可見性血尿 | Gross hematuria |
| **常見疾病** | | | |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `N20.1` | 輸尿管結石 | 輸尿管結石 | Calculus of ureter |
| `N21.0` | 膀胱內結石 | 膀胱內結石 | Calculus in bladder |
| `N30.01` | 急性膀胱炎伴血尿 | 急性膀胱炎伴有血尿 | Acute cystitis with hematuria |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `N30.90` | 膀胱炎（未伴血尿） | 膀胱炎未伴有血尿 | Cystitis, unspecified without hematuria |
| `N40.1` | 攝護腺增生伴下泌尿道症狀 BPH | 良性攝護腺增生伴有下泌尿道症狀 | Benign prostatic hyperplasia with lower urinary tract symptoms |
| `N41.0` | 急性攝護腺炎 | 急性攝護腺炎 | Acute prostatitis |
| `N34.2` | 其他尿道炎 | 其他尿道炎 | Other urethritis |
| `N13.30` | 腎水腫 | 腎水腫 | Unspecified hydronephrosis |
| `N18.9` | 慢性腎臟疾病 CKD | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `N02.9` | 復發性及持續性血尿（未特異性組織形態改變） | 再發性及持續性血尿伴有非特異性的組織形態改變 | Recurrent and persistent hematuria with unspecified morphologic changes |
| `N12` | 腎小管間質性腎炎 | 腎小管－間質腎炎，未明示為急性或慢性者 | Tubulo-interstitial nephritis, not specified as acute or chronic |
| `N28.1` | 後天性腎囊腫 | 後天性腎囊腫 | Cyst of kidney, acquired |
| `Q61.2` | 成人型多囊腎 | 成人型多囊腎 | Polycystic kidney, adult type |
| `C61` | 攝護腺惡性腫瘤 | 攝護腺惡性腫瘤 | Malignant neoplasm of prostate |
| `A18.10` | 生殖泌尿系統結核 | 生殖泌尿系統結核 | Tuberculosis of genitourinary system, unspecified |
| `T45.515A` | 抗凝血劑不良反應（附加碼） | 抗凝血藥劑不良反應之初期照護 | Adverse effect of anticoagulants, initial encounter |
| `D68.32` | 抗凝血物質所致出血性疾患 | 循環中抗凝血物質所致的出血性疾患 | Hemorrhagic disorder due to extrinsic circulating anticoagulants |
| `D69.6` | 血小板缺乏症 | 血小板缺乏症 | Thrombocytopenia, unspecified |
| `N92.0` | 月經量過多（規則週期） | 月經量過多及次數過多伴有規則週期 | Excessive and frequent menstruation with regular cycle |
| **優先排除（紅旗）** | | | |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `C67.9` | 膀胱惡性腫瘤 | 膀胱惡性腫瘤 | Malignant neoplasm of bladder, unspecified |
| `C64.9` | 腎惡性腫瘤（腎盂除外、未明示側） | 未明示側性腎惡性腫瘤，腎盂除外 | Malignant neoplasm of unspecified kidney, except renal pelvis |
| `N05.9` | 腎炎症候群（未特異性組織形態改變） | 非特異性的腎炎症候群伴有非特異性的組織形態改變 | Unspecified nephritic syndrome with unspecified morphologic changes |
| `R33.9` | 尿滯留 | 尿滯留 | Retention of urine, unspecified |

### 皮膚／軟組織

#### 皮疹／搔癢

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R21` | 皮疹 | 皮疹及其他非特定性皮膚出疹 | Rash and other nonspecific skin eruption |
| `L29.9` | 搔癢 | 搔癢症 | Pruritus, unspecified |
| **常見疾病** | | | |
| `L50.9` | 蕁麻疹 | 蕁麻疹 | Urticaria, unspecified |
| `L30.9` | 皮膚炎 | 皮膚炎 | Dermatitis, unspecified |
| `L23.9` | 過敏性接觸性皮膚炎 | 過敏性接觸性皮膚炎，未明示原因 | Allergic contact dermatitis, unspecified cause |
| `L24.9` | 刺激性接觸性皮膚炎（未明示原因） | 刺激性接觸性皮膚炎，未明示原因 | Irritant contact dermatitis, unspecified cause |
| `L27.0` | 全身性藥物疹 | 內服藥所致之全身性皮疹 | Generalized skin eruption due to drugs and medicaments taken internally |
| `L27.1` | 局部性藥物疹 | 內服藥所致之局部性皮疹 | Localized skin eruption due to drugs and medicaments taken internally |
| `T88.7XXA` | 藥物不良反應 | 藥物或藥劑未明示之不良作用之初期照護 | Unspecified adverse effect of drug or medicament, initial encounter |
| `B02.9` | 帶狀疱疹（未伴併發症） | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `B00.9` | 單純疱疹病毒感染 | 疱疹病毒感染 | Herpesviral infection, unspecified |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `L02.91` | 皮膚膿瘍 | 皮膚膿瘍 | Cutaneous abscess, unspecified |
| `A46` | 丹毒 | 丹毒 | Erysipelas |
| `L01.00` | 膿痂疹 | 膿痂疹 | Impetigo, unspecified |
| `L08.9` | 皮膚及皮下組織局部感染 | 皮膚及皮下組織局部感染 | Local infection of the skin and subcutaneous tissue, unspecified |
| `L20.9` | 異位性皮膚炎 | 異位性皮膚炎 | Atopic dermatitis, unspecified |
| `L21.9` | 脂漏性皮膚炎 | 脂漏性皮膚炎 | Seborrheic dermatitis, unspecified |
| `L50.1` | 特發性蕁麻疹 | 特發性蕁麻疹 | Idiopathic urticaria |
| `L50.6` | 接觸性蕁麻疹 | 接觸性蕁麻疹 | Contact urticaria |
| `B09` | 病毒疹（皮膚黏膜病灶） | 皮膚及黏膜病灶為特徵未明示之病毒性感染(症) | Unspecified viral infection characterized by skin and mucous membrane lesions |
| `B08.4` | 手足口病（腸病毒囊泡性口炎伴皮疹） | 腸病毒性囊泡性口炎伴有皮疹 | Enteroviral vesicular stomatitis with exanthem |
| `B34.9` | 病毒感染 | 病毒感染 | Viral infection, unspecified |
| `B35.4` | 體癬 | 體癬 | Tinea corporis |
| `B35.6` | 股癬 | 股癬 | Tinea cruris |
| `B37.2` | 皮膚及指甲念珠菌病 | 皮膚及指(趾)甲念珠菌病 | Candidiasis of skin and nail |
| `B86` | 疥瘡 | 疥癬(疥瘡) | Scabies |
| `L42` | 玫瑰糠疹 | 玫瑰糠疹 | Pityriasis rosea |
| `L40.9` | 乾癬 | 乾癬 | Psoriasis, unspecified |
| `L51.9` | 多形性紅斑 | 多形性紅斑 | Erythema multiforme, unspecified |
| `D69.0` | 過敏性紫斑症 | 過敏性紫斑症 | Allergic purpura |
| `D69.6` | 血小板缺乏症 | 血小板缺乏症 | Thrombocytopenia, unspecified |
| `M31.0` | 過敏性血管炎 | 過敏性血管炎 | Hypersensitivity angiitis |
| `A90` | 登革熱 | 登革熱[典型登革熱] | Dengue fever [classical dengue] |
| `N18.6` | 末期腎病 ESRD | 末期腎疾病 | End stage renal disease |
| `B05.9` | 麻疹（未伴併發症） | 麻疹未伴有併發症 | Measles without complication |
| `B02.7` | 散播性帶狀疱疹 | 散播性帶狀疱疹 | Disseminated zoster |
| **優先排除（紅旗）** | | | |
| `M72.6` | 壞死性筋膜炎 | 壞死性筋膜炎 | Necrotizing fasciitis |
| `L51.1` | 史帝芬強生症候群 SJS | 史帝芬-強生氏症候群 | Stevens-Johnson syndrome |
| `L51.2` | 毒性表皮壞死症 TEN | 毒性表皮壞死鬆解症 | Toxic epidermal necrolysis [Lyell] |
| `T78.2XXA` | 過敏性休克 | 過敏性休克之初期照護 | Anaphylactic shock, unspecified, initial encounter |
| `T78.3XXA` | 血管性水腫 | 血管神經性水腫之初期照護 | Angioneurotic edema, initial encounter |
| `A39.2` | 腦膜炎球菌菌血症 | 急性腦膜炎球菌菌血症 | Acute meningococcemia |

#### 過敏反應

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `T78.40XA` | 過敏反應（初期照護） | 過敏之初期照護 | Allergy, unspecified, initial encounter |
| **常見疾病** | | | |
| `L50.9` | 蕁麻疹 | 蕁麻疹 | Urticaria, unspecified |
| `L50.0` | 過敏性蕁麻疹 | 過敏性蕁麻疹 | Allergic urticaria |
| `T78.1XXA` | 食物不良反應 | 其他有害食物反應，他處未歸類之初期照護 | Other adverse food reactions, not elsewhere classified, initial encounter |
| `T88.7XXA` | 藥物不良反應 | 藥物或藥劑未明示之不良作用之初期照護 | Unspecified adverse effect of drug or medicament, initial encounter |
| `L27.0` | 全身性藥物疹 | 內服藥所致之全身性皮疹 | Generalized skin eruption due to drugs and medicaments taken internally |
| `L27.1` | 局部性藥物疹 | 內服藥所致之局部性皮疹 | Localized skin eruption due to drugs and medicaments taken internally |
| `J30.9` | 過敏性鼻炎 | 過敏性鼻炎 | Allergic rhinitis, unspecified |
| `J30.1` | 花粉所致過敏性鼻炎 | 花粉所致過敏性鼻炎 | Allergic rhinitis due to pollen |
| `L23.9` | 過敏性接觸性皮膚炎 | 過敏性接觸性皮膚炎，未明示原因 | Allergic contact dermatitis, unspecified cause |
| `L24.9` | 刺激性接觸性皮膚炎（未明示原因） | 刺激性接觸性皮膚炎，未明示原因 | Irritant contact dermatitis, unspecified cause |
| `L50.1` | 特發性蕁麻疹 | 特發性蕁麻疹 | Idiopathic urticaria |
| `L50.6` | 接觸性蕁麻疹 | 接觸性蕁麻疹 | Contact urticaria |
| `H10.45` | 其他慢性過敏性結膜炎 | 其他慢性過敏性結膜炎 | Other chronic allergic conjunctivitis |
| `T63.441A` | 蜜蜂螫傷（毒性作用，初期照護） | 蜜蜂之毒液意外毒性作用之初期照護 | Toxic effect of venom of bees, accidental (unintentional), initial encounter |
| `T78.49XA` | 其他過敏反應 | 其他過敏之初期照護 | Other allergy, initial encounter |
| `J45.909` | 氣喘（無併發症） | 氣喘,無併發症 | Unspecified asthma, uncomplicated |
| `L56.1` | 藥物光過敏反應 | 藥物光過敏性反應 | Drug photoallergic response |
| `T50.8X5A` | 顯影劑／診斷用藥不良反應（附加碼） | 診斷用藥物不良反應之初期照護 | Adverse effect of diagnostic agents, initial encounter |
| `L51.9` | 多形性紅斑 | 多形性紅斑 | Erythema multiforme, unspecified |
| `M31.0` | 過敏性血管炎 | 過敏性血管炎 | Hypersensitivity angiitis |
| `D84.1` | 補體系統缺陷（遺傳性血管水腫） | 補體系統缺陷 | Defects in the complement system |
| **優先排除（紅旗）** | | | |
| `T78.2XXA` | 過敏性休克 | 過敏性休克之初期照護 | Anaphylactic shock, unspecified, initial encounter |
| `T78.3XXA` | 血管性水腫 | 血管神經性水腫之初期照護 | Angioneurotic edema, initial encounter |
| `J38.4` | 喉部水腫 | 喉部水腫 | Edema of larynx |
| `J45.901` | 氣喘急性發作 | 氣喘併(急性)發作 | Unspecified asthma with (acute) exacerbation |
| `J96.00` | 急性呼吸衰竭 | 急性呼吸衰竭，未明示是否伴有缺氧或高碳酸血症 | Acute respiratory failure, unspecified whether with hypoxia or hypercapnia |

### 肌肉骨骼

#### 背痛／頸痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `M54.50` | 下背痛 | 下背痛 | Low back pain, unspecified |
| `M54.2` | 頸椎痛 | 頸椎痛 | Cervicalgia |
| **常見疾病** | | | |
| `M54.59` | 其他下背痛 | 其他下背痛 | Other low back pain |
| `M54.9` | 背痛（未明示） | 背痛 | Dorsalgia, unspecified |
| `M54.40` | 腰痛伴坐骨神經痛（未明示側） | 未明示側性腰痛伴有坐骨神經痛 | Lumbago with sciatica, unspecified side |
| `M54.30` | 坐骨神經痛（未明示側） | 未明示側性坐骨神經痛 | Sciatica, unspecified side |
| `M54.16` | 腰椎神經根病變 | 腰椎神經根病變 | Radiculopathy, lumbar region |
| `M54.12` | 頸椎神經根病變 | 頸椎神經根病變 | Radiculopathy, cervical region |
| `M51.26` | 腰椎椎間盤移位 | 其他腰椎椎間盤移位 | Other intervertebral disc displacement, lumbar region |
| `M51.36` | 其他腰椎椎間盤退化 | 其他腰椎椎間盤退化 | Other intervertebral disc degeneration, lumbar region |
| `M50.20` | 其他頸椎椎間盤移位（未明示頸椎） | 未明示頸椎之其他頸椎椎間盤移位 | Other cervical disc displacement, unspecified cervical region |
| `M47.816` | 腰椎退化性脊椎炎（未伴脊髓或神經根病變） | 腰椎退化性脊椎炎未伴有脊髓病變或神經根病變 | Spondylosis without myelopathy or radiculopathy, lumbar region |
| `M47.812` | 頸椎退化性脊椎炎（未伴脊髓或神經根病變） | 頸椎退化性脊椎炎未伴有脊髓病變或神經根病變 | Spondylosis without myelopathy or radiculopathy, cervical region |
| `M48.061` | 腰椎脊椎狹窄（未伴神經性跛行） | 腰椎脊椎狹窄症未伴有神經源性跛行 | Spinal stenosis, lumbar region without neurogenic claudication |
| `M48.062` | 腰椎脊椎狹窄（伴神經性跛行） | 腰椎脊椎狹窄症伴有神經源性跛行 | Spinal stenosis, lumbar region with neurogenic claudication |
| `M48.02` | 頸椎脊椎狹窄症 | 頸椎脊椎狹窄症 | Spinal stenosis, cervical region |
| `M62.830` | 背部肌肉痙攣 | 背部肌肉痙攣 | Muscle spasm of back |
| `M79.18` | 其他部位肌痛症 | 其他部位肌痛症 | Myalgia, other site |
| `M54.51` | 椎體性下背痛 | 椎體性下背痛 | Vertebrogenic low back pain |
| `M54.6` | 胸椎痛 | 胸椎痛 | Pain in thoracic spine |
| `M19.90` | 骨關節炎（未明示部位） | 未明示部位骨關節炎 | Unspecified osteoarthritis, unspecified site |
| `M43.16` | 腰椎脊椎滑脫症 | 腰椎脊椎滑脫症 | Spondylolisthesis, lumbar region |
| `M46.1` | 薦髂關節炎 | (薦)髂(腸)關節炎，他處未歸類者 | Sacroiliitis, not elsewhere classified |
| `M45.9` | 僵直性脊椎炎（未明示部位） | 未明示部位脊椎僵直性脊椎炎 | Ankylosing spondylitis of unspecified sites in spine |
| `M79.7` | 纖維肌痛 | 纖維肌痛 | Fibromyalgia |
| `M80.08XA` | 椎骨老年性骨質疏鬆伴病理性骨折（初期照護） | 椎骨老年性骨質疏鬆症伴有病理性骨折之初期照護 | Age-related osteoporosis with current pathological fracture, vertebra(e), initial encounter for fracture |
| `M48.50XA` | 脊椎塌陷（部位未明示，初期照護） | 未明示部位脊椎萎(塌)陷之初期照護，他處未歸類 | Collapsed vertebra, not elsewhere classified, site unspecified, initial encounter for fracture |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `N23` | 腎絞痛 | 腎絞痛 | Unspecified renal colic |
| `B02.9` | 帶狀疱疹（未伴併發症） | 帶狀疱疹未伴有併發症 | Zoster without complications |
| **優先排除（紅旗）** | | | |
| `G06.1` | 脊椎管內膿瘍 | 脊椎管內膿瘍及肉芽腫 | Intraspinal abscess and granuloma |
| `G83.4` | 馬尾症候群 | 馬尾症候群 | Cauda equina syndrome |
| `M46.26` | 腰椎脊椎骨髓炎 | 腰椎脊椎骨髓炎 | Osteomyelitis of vertebra, lumbar region |
| `I71.00` | 主動脈剝離 | 未明示部位之主動脈瘤剝離 | Dissection of unspecified site of aorta |
| `I71.30` | 腹主動脈瘤破裂 | 腹主動脈瘤，已破裂 | Abdominal aortic aneurysm, ruptured, unspecified |
| `C79.51` | 骨骼續發性惡性腫瘤（骨轉移） | 骨骼續發性惡性腫瘤 | Secondary malignant neoplasm of bone |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |

#### 關節痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `M25.50` | 關節痛 | 關節痛 | Pain in unspecified joint |
| **常見疾病** | | | |
| `M10.9` | 痛風 | 痛風 | Gout, unspecified |
| `M19.90` | 骨關節炎（未明示部位） | 未明示部位骨關節炎 | Unspecified osteoarthritis, unspecified site |
| `M17.9` | 膝部骨關節炎 | 膝部骨關節炎 | Osteoarthritis of knee, unspecified |
| `M16.10` | 髖部原發性骨關節炎（單側） | 未明示側性髖部原發性骨關節炎，單側性 | Unilateral primary osteoarthritis, unspecified hip |
| `M15.9` | 多發性骨關節炎 | 多發性骨關節炎 | Polyosteoarthritis, unspecified |
| `M06.9` | 類風濕性關節炎 RA | 類風濕性關節炎 | Rheumatoid arthritis, unspecified |
| `M11.20` | 其他軟骨鈣化症（假性痛風、未明示部位） | 未明示部位其他軟骨鈣化症 | Other chondrocalcinosis, unspecified site |
| `M25.40` | 關節滲液 | 關節滲液 | Effusion, unspecified joint |
| `M13.10` | 單發性關節炎 | 未明示部位單發性關節炎，他處未歸類者 | Monoarthritis, not elsewhere classified, unspecified site |
| `M13.0` | 多發性關節炎 | 多發性關節炎 | Polyarthritis, unspecified |
| `M65.9` | 滑膜炎及腱鞘炎 | 其他滑膜炎及腱鞘炎 | Synovitis and tenosynovitis, unspecified |
| `M75.100` | 肩部旋轉肌袖撕裂（未明示側、非創傷性） | 未明示側性肩部旋轉環帶撕裂或破裂，未明示為創傷性 | Unspecified rotator cuff tear or rupture of unspecified shoulder, not specified as traumatic |
| `M75.00` | 肩部沾黏性關節囊炎（五十肩、未明示側） | 未明示側性肩部粘連性囊炎 | Adhesive capsulitis of unspecified shoulder |
| `M77.10` | 肘外側上髁炎（網球肘、未明示側） | 未明示側性肘外側上髁炎 | Lateral epicondylitis, unspecified elbow |
| `M70.20` | 鷹嘴滑囊炎 | 未明示側性腕部鷹嘴突滑囊炎 | Olecranon bursitis, unspecified elbow |
| `M71.20` | 膕窩滑膜囊腫（Baker 氏囊腫） | 膕區滑膜囊腫[Baker (氏)] | Synovial cyst of popliteal space [Baker], unspecified knee |
| `M45.9` | 僵直性脊椎炎（未明示部位） | 未明示部位脊椎僵直性脊椎炎 | Ankylosing spondylitis of unspecified sites in spine |
| `M46.1` | 薦髂關節炎 | (薦)髂(腸)關節炎，他處未歸類者 | Sacroiliitis, not elsewhere classified |
| `L40.50` | 關節病型乾癬（乾癬性關節炎） | 關節病型乾癬 | Arthropathic psoriasis, unspecified |
| `M02.9` | 反應性關節病變 | 反應性關節病變 | Reactive arthropathy, unspecified |
| `M32.10` | 全身性紅斑性狼瘡 | 全身性紅斑性狼瘡侵及(侵犯、涉及)器官或系統 | Systemic lupus erythematosus, organ or system involvement unspecified |
| `M12.80` | 其他特定關節病變 | 未明示部位其他特定關節病變，他處未歸類者 | Other specific arthropathies, not elsewhere classified, unspecified site |
| `M79.7` | 纖維肌痛 | 纖維肌痛 | Fibromyalgia |
| `M79.18` | 其他部位肌痛症 | 其他部位肌痛症 | Myalgia, other site |
| `A90` | 登革熱 | 登革熱[典型登革熱] | Dengue fever [classical dengue] |
| `A92.0` | 屈公病（Chikungunya） | 奇孔古尼亞病毒疾病 | Chikungunya virus disease |
| **優先排除（紅旗）** | | | |
| `M00.9` | 化膿性關節炎 | 化膿性關節炎 | Pyogenic arthritis, unspecified |
| `I82.409` | 下肢深部靜脈栓塞 DVT（急性、未明示側） | 未明示側性下肢未明示深部靜脈急性栓塞及血栓 | Acute embolism and thrombosis of unspecified deep veins of unspecified lower extremity |
| `M86.9` | 骨髓炎 | 骨髓炎 | Osteomyelitis, unspecified |
| `M72.6` | 壞死性筋膜炎 | 壞死性筋膜炎 | Necrotizing fasciitis |

## 內科門診（11 個部位群組 / 50 張面板）

### 慢性疾病

#### 高血壓／血壓管理

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `I15.9` | 續發性高血壓 | 續發性高血壓 | Secondary hypertension, unspecified |
| `R03.0` | 血壓讀數升高（未診斷高血壓） | 血壓上升，非診斷為高血壓者 | Elevated blood-pressure reading, without diagnosis of hypertension |
| **常見疾病** | | | |
| `I11.9` | 高血壓性心臟病（無心臟衰竭） | 高血壓性心臟病，無心臟衰竭 | Hypertensive heart disease without heart failure |
| `I11.0` | 高血壓性心臟病伴心衰竭 | 高血壓性心臟病伴有心臟衰竭 | Hypertensive heart disease with heart failure |
| `I12.9` | 高血壓性慢性腎病（CKD 1-4 期） | 高血壓性慢性腎臟病伴有第一至第四期慢性腎病或未明示慢性腎病 | Hypertensive chronic kidney disease with stage 1 through stage 4 chronic kidney disease, or unspecified chronic kidney disease |
| `I12.0` | 高血壓性慢性腎病（CKD 5 期或 ESRD） | 高血壓性慢性腎臟病伴有第五期慢性腎病或末期腎病 | Hypertensive chronic kidney disease with stage 5 chronic kidney disease or end stage renal disease |
| `I13.0` | 高血壓性心腎病伴心衰竭（CKD 1-4 期） | 高血壓性心臟及慢性腎臟病伴有心臟衰竭及第一至第四期慢性腎病或未明示慢性腎病 | Hypertensive heart and chronic kidney disease with heart failure and stage 1 through stage 4 chronic kidney disease, or unspecified chronic kidney disease |
| `I13.10` | 高血壓性心腎病未伴心衰竭（CKD 1-4 期） | 高血壓性心臟及慢性腎臟病未伴有心臟衰竭合併第一至第四期慢性腎病或未明示慢性腎病 | Hypertensive heart and chronic kidney disease without heart failure, with stage 1 through stage 4 chronic kidney disease, or unspecified chronic kidney disease |
| `I13.2` | 高血壓性心腎病伴心衰竭（CKD 5 期或 ESRD） | 高血壓性心臟及慢性腎臟病伴有心臟衰竭及第五期慢性腎病或末期腎病 | Hypertensive heart and chronic kidney disease with heart failure and with stage 5 chronic kidney disease, or end stage renal disease |
| `I15.0` | 腎血管性高血壓 | 腎血管性續發性高血壓 | Renovascular hypertension |
| `I15.1` | 其他腎疾病續發之高血壓 | 其他腎疾患引起之續發性高血壓 | Hypertension secondary to other renal disorders |
| `I15.2` | 內分泌疾病續發之高血壓 | 其他內分泌疾患引起之續發性高血壓 | Hypertension secondary to endocrine disorders |
| `I16.0` | 高血壓緊急狀況（urgency） | 高血壓緊急狀況 | Hypertensive urgency |
| `I16.1` | 高血壓急症（emergency） | 高血壓急症 | Hypertensive emergency |
| `I27.20` | 肺高血壓 | 肺高血壓 | Pulmonary hypertension, unspecified |
| `I70.209` | 四肢動脈粥狀硬化（未明示） | 未明示四肢動脈粥樣硬化 | Unspecified atherosclerosis of native arteries of extremities, unspecified extremity |
| `I73.9` | 末梢血管疾病 | 末梢血管疾病 | Peripheral vascular disease, unspecified |
| `I87.2` | 慢性靜脈功能不足 | 靜脈功能不足（慢性）（周邊） | Venous insufficiency (chronic) (peripheral) |
| `I95.1` | 姿勢性低血壓 | 直立性低血壓 | Orthostatic hypotension |
| `E78.5` | 高血脂症 | 高血脂症 | Hyperlipidemia, unspecified |
| `N18.30` | 第三期慢性腎臟疾病 | 慢性腎臟疾病stage 3 | Chronic kidney disease, stage 3 unspecified |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `I25.10` | 冠狀動脈粥狀硬化性心臟病（未伴心絞痛） | 自體的冠狀動脈粥樣硬化心臟病未伴有心絞痛 | Atherosclerotic heart disease of native coronary artery without angina pectoris |
| `Z79.899` | 長期藥物治療 | 長期 （現在之）藥物治療 | Other long term (current) drug therapy |
| `Z71.3` | 飲食諮詢衛教 | 飲食諮詢與監測 | Dietary counseling and surveillance |

#### 糖尿病

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `E11.65` | 第二型糖尿病伴高血糖 | 第二型糖尿病，伴有高血糖 | Type 2 diabetes mellitus with hyperglycemia |
| `E10.9` | 第一型糖尿病（未伴併發症） | 第一型糖尿病，未伴有併發症 | Type 1 diabetes mellitus without complications |
| `R73.03` | 糖尿病前期 | 糖尿病前期 | Prediabetes |
| **常見疾病** | | | |
| `E11.21` | 第二型糖尿病伴糖尿病腎病變 | 第二型糖尿病，伴有糖尿病的腎臟病變 | Type 2 diabetes mellitus with diabetic nephropathy |
| `E11.22` | 第二型糖尿病伴糖尿病慢性腎臟疾病 | 第二型糖尿病，糖尿病的慢性腎臟疾病 | Type 2 diabetes mellitus with diabetic chronic kidney disease |
| `E11.29` | 第二型糖尿病伴其他腎併發症 | 第二型糖尿病，伴有其他糖尿病的腎臟併發症 | Type 2 diabetes mellitus with other diabetic kidney complication |
| `E11.319` | 第二型糖尿病伴視網膜病變（未伴黃斑部水腫） | 第二型糖尿病，伴有糖尿病的視網膜病變，未伴有黃斑部水腫 | Type 2 diabetes mellitus with unspecified diabetic retinopathy without macular edema |
| `E11.36` | 第二型糖尿病伴糖尿病白內障 | 第二型糖尿病，伴有糖尿病的白內障 | Type 2 diabetes mellitus with diabetic cataract |
| `E11.40` | 第二型糖尿病伴神經病變 | 第二型糖尿病，伴有糖尿病的神經病變 | Type 2 diabetes mellitus with diabetic neuropathy, unspecified |
| `E11.42` | 第二型糖尿病伴多發神經病變 | 第二型糖尿病，伴有糖尿病的多發神經病變 | Type 2 diabetes mellitus with diabetic polyneuropathy |
| `E11.43` | 第二型糖尿病伴自主神經病變 | 第二型糖尿病，伴有糖尿病的自主(多發)神經病變 | Type 2 diabetes mellitus with diabetic autonomic (poly)neuropathy |
| `E11.51` | 第二型糖尿病伴周邊血管病變（未伴壞疽） | 第二型糖尿病，伴有糖尿病的周邊血管病變，未伴有壞疽 | Type 2 diabetes mellitus with diabetic peripheral angiopathy without gangrene |
| `E11.52` | 第二型糖尿病伴周邊血管病變伴壞疽 | 第二型糖尿病，伴有糖尿病的周邊血管病變，伴有壞疽 | Type 2 diabetes mellitus with diabetic peripheral angiopathy with gangrene |
| `E11.610` | 第二型糖尿病伴神經病變性關節病變（夏柯氏足） | 第二型糖尿病，伴有糖尿病的神經病變引起之關節病變 | Type 2 diabetes mellitus with diabetic neuropathic arthropathy |
| `E11.621` | 第二型糖尿病伴足部潰瘍 | 第二型糖尿病，伴有足部潰瘍 | Type 2 diabetes mellitus with foot ulcer |
| `E11.622` | 第二型糖尿病伴其他皮膚潰瘍 | 第二型糖尿病，伴有其他皮膚潰瘍 | Type 2 diabetes mellitus with other skin ulcer |
| `E11.628` | 第二型糖尿病伴其他皮膚併發症 | 第二型糖尿病，伴有其他皮膚併發症 | Type 2 diabetes mellitus with other skin complications |
| `E11.69` | 第二型糖尿病伴其他特定併發症 | 第二型糖尿病，伴有其他特定併發症 | Type 2 diabetes mellitus with other specified complication |
| `E11.8` | 第二型糖尿病伴未明示併發症 | 第二型糖尿病，伴有未明示之併發症 | Type 2 diabetes mellitus with unspecified complications |
| `E11.00` | 高滲透壓高血糖狀態 HHS（第二型，未伴昏迷） | 第二型糖尿病，伴有高滲透壓，未伴有非酮病之高血糖-高滲透壓的昏迷 | Type 2 diabetes mellitus with hyperosmolarity without nonketotic hyperglycemic-hyperosmolar coma (NKHHC) |
| `E11.10` | 糖尿病酮酸中毒 DKA（第二型，未伴昏迷） | 第二型糖尿病，伴有酮酸中毒，未伴有昏迷 | Type 2 diabetes mellitus with ketoacidosis without coma |
| `E10.65` | 第一型糖尿病伴高血糖 | 第一型糖尿病，伴有高血糖 | Type 1 diabetes mellitus with hyperglycemia |
| `E13.9` | 其他特定糖尿病（未伴併發症） | 其他特定糖尿病，未伴有併發症 | Other specified diabetes mellitus without complications |
| `E16.2` | 低血糖 | 低血糖 | Hypoglycemia, unspecified |
| `R73.09` | 其他異常血糖檢驗 | 其他葡萄糖異常 | Other abnormal glucose |
| `R73.9` | 高血糖 | 高血糖 | Hyperglycemia, unspecified |
| `Z79.4` | 長期使用胰島素 | 長期（現在之）服用胰島素 | Long term (current) use of insulin |
| `Z79.84` | 長期使用口服降血糖藥 | 長期(現存)使用口服降糖藥治療 | Long term (current) use of oral hypoglycemic drugs |
| `Z13.1` | 糖尿病篩檢 | 來院接受糖尿病篩檢 | Encounter for screening for diabetes mellitus |

#### 血脂／肥胖代謝

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `E78.5` | 高血脂症 | 高血脂症 | Hyperlipidemia, unspecified |
| `E78.00` | 純高膽固醇血症 | 純高膽固醇血症 | Pure hypercholesterolemia, unspecified |
| `E78.2` | 混合型高血脂症 | 混合型高血脂症 | Mixed hyperlipidemia |
| **常見疾病** | | | |
| `E78.1` | 純高三酸甘油酯血症 | 純高三酸甘油酯血症 | Pure hyperglyceridemia |
| `E78.41` | 高脂蛋白 Lp(a) 血症 | 脂蛋白升高 | Elevated Lipoprotein(a) |
| `E78.49` | 其他高脂血症 | 其他高血脂症 | Other hyperlipidemia |
| `E78.6` | 脂蛋白缺乏症 | 脂蛋白缺乏 | Lipoprotein deficiency |
| `E88.81` | 新陳代謝症候群 | 新陳代謝症候群 | Metabolic syndrome |
| `E66.9` | 肥胖 | 肥胖 | Obesity, unspecified |
| `E66.01` | 病態性肥胖（熱量過多） | 起因於熱量過多的病態性(重度)肥胖 | Morbid (severe) obesity due to excess calories |
| `E66.3` | 過重 | 體重過重 | Overweight |
| `E79.0` | 高尿酸血症（未伴發炎性關節炎及痛風石） | 高尿酸血症未伴有關節炎及痛風石 | Hyperuricemia without signs of inflammatory arthritis and tophaceous disease |
| `K76.0` | 脂肪肝 | 脂肪肝(變化)，他處未歸類者 | Fatty (change of) liver, not elsewhere classified |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `R73.03` | 糖尿病前期 | 糖尿病前期 | Prediabetes |
| `Z68.30` | BMI 30.0-30.9 | 成人身體質量指數(BMI) 介於30.0-30.9 | Body mass index [BMI] 30.0-30.9, adult |
| `Z68.35` | BMI 35.0-35.9 | 成人身體質量指數(BMI) 介於35.0-35.9 | Body mass index [BMI] 35.0-35.9, adult |
| `Z68.41` | BMI 40.0-44.9 | 成人身體質量指數(BMI) 介於40.0-44.9 | Body mass index [BMI] 40.0-44.9, adult |
| `Z71.3` | 飲食諮詢衛教 | 飲食諮詢與監測 | Dietary counseling and surveillance |
| `Z79.899` | 長期藥物治療 | 長期 （現在之）藥物治療 | Other long term (current) drug therapy |
| `R74.01` | 肝指數上升（轉胺酶） | 轉胺基脢含量上升 | Elevation of levels of liver transaminase levels |
| `E88.89` | 其他特定代謝疾患 | 其他特定新陳代謝疾患 | Other specified metabolic disorders |

#### 慢性腎臟病／透析

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `N18.30` | 第三期慢性腎臟疾病 | 慢性腎臟疾病stage 3 | Chronic kidney disease, stage 3 unspecified |
| `N18.4` | 第四期慢性腎臟疾病（重度） | 第四期慢性腎臟疾病(重度) | Chronic kidney disease, stage 4 (severe) |
| `N18.6` | 末期腎病 ESRD | 末期腎疾病 | End stage renal disease |
| **常見疾病** | | | |
| `N18.1` | CKD 第1期 | 第一期慢性腎臟疾病 | Chronic kidney disease, stage 1 |
| `N18.2` | CKD 第2期 | 第二期慢性腎臟疾病(輕度) | Chronic kidney disease, stage 2 (mild) |
| `N18.31` | 第三a期慢性腎臟疾病 | 慢性腎臟疾病stage 3a | Chronic kidney disease, stage 3a |
| `N18.32` | 第三b期慢性腎臟疾病 | 慢性腎臟疾病stage 3b | Chronic kidney disease, stage 3b |
| `N18.5` | 第五期慢性腎臟疾病 | 第五期慢性腎臟疾病 | Chronic kidney disease, stage 5 |
| `N18.9` | 慢性腎臟疾病 CKD | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `Z99.2` | 依賴腎透析 | 腎（臟）透析依賴 | Dependence on renal dialysis |
| `Z49.31` | 血液透析照護 | 血液透析之充分性檢驗 | Encounter for adequacy testing for hemodialysis |
| `Z49.32` | 腹膜透析照護 | 腹膜透析之充分性檢驗 | Encounter for adequacy testing for peritoneal dialysis |
| `Z94.0` | 腎臟移植狀態 | 腎臟移植狀態 | Kidney transplant status |
| `D63.1` | 慢性腎臟疾病導致的貧血（附加碼） | 慢性腎臟疾病導致的貧血 | Anemia in chronic kidney disease |
| `N25.81` | 續發性副甲狀腺功能亢進（腎源性） | 腎源性續發性副甲狀腺機能亢進症 | Secondary hyperparathyroidism of renal origin |
| `E87.5` | 高血鉀症 | 高血鉀症 | Hyperkalemia |
| `E87.6` | 低血鉀症 | 低血鉀症 | Hypokalemia |
| `E87.22` | 慢性代謝性酸中毒 | 慢性代謝性酸中毒 | Chronic metabolic acidosis |
| `N04.9` | 腎病症候群 | 腎病症候群伴有非特異性的組織形態改變 | Nephrotic syndrome with unspecified morphologic changes |
| `N05.9` | 腎炎症候群（未特異性組織形態改變） | 非特異性的腎炎症候群伴有非特異性的組織形態改變 | Unspecified nephritic syndrome with unspecified morphologic changes |
| `N26.9` | 腎臟萎縮（未明示） | 腎硬化 | Renal sclerosis, unspecified |
| `Q61.3` | 多囊腎 | 多囊腎 | Polycystic kidney, unspecified |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `R80.9` | 蛋白尿 | 蛋白尿 | Proteinuria, unspecified |
| `I12.9` | 高血壓性慢性腎病（CKD 1-4 期） | 高血壓性慢性腎臟病伴有第一至第四期慢性腎病或未明示慢性腎病 | Hypertensive chronic kidney disease with stage 1 through stage 4 chronic kidney disease, or unspecified chronic kidney disease |
| `E11.22` | 第二型糖尿病伴糖尿病慢性腎臟疾病 | 第二型糖尿病，糖尿病的慢性腎臟疾病 | Type 2 diabetes mellitus with diabetic chronic kidney disease |

#### 冠心病／心衰竭／心律不整

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `I25.10` | 冠狀動脈粥狀硬化性心臟病（未伴心絞痛） | 自體的冠狀動脈粥樣硬化心臟病未伴有心絞痛 | Atherosclerotic heart disease of native coronary artery without angina pectoris |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `I48.91` | 心房顫動 | 心房顫動 | Unspecified atrial fibrillation |
| **常見疾病** | | | |
| `I25.2` | 陳舊性心肌梗塞 | 陳舊性心肌梗塞 | Old myocardial infarction |
| `I25.5` | 缺血性心肌病變 | 缺血性心肌病變 | Ischemic cardiomyopathy |
| `I25.9` | 慢性缺血性心臟病（未明示） | 慢性缺血性心臟病 | Chronic ischemic heart disease, unspecified |
| `I50.22` | 慢性收縮性心臟衰竭 | 慢性收縮性(充血性)心臟衰竭 | Chronic systolic (congestive) heart failure |
| `I50.32` | 慢性舒張性心臟衰竭 | 慢性舒張性(充血性)心臟衰竭 | Chronic diastolic (congestive) heart failure |
| `I50.42` | 慢性收縮併舒張性心衰竭 | 慢性收縮性併舒張性(充血性)心臟衰竭 | Chronic combined systolic (congestive) and diastolic (congestive) heart failure |
| `I48.0` | 陣發性心房顫動 | 陣發性心房顫動 | Paroxysmal atrial fibrillation |
| `I48.20` | 慢性心房顫動（未明示） | 慢性心房顫動 | Chronic atrial fibrillation, unspecified |
| `I48.92` | 心房撲動（未明示） | 心房撲動 | Unspecified atrial flutter |
| `I44.2` | 完全房室傳導阻斷 | 完全性房室傳導阻滯 | Atrioventricular block, complete |
| `I49.9` | 心律不整 | 心臟節律不整 | Cardiac arrhythmia, unspecified |
| `I34.0` | 非風濕性二尖瓣閉鎖不全 | 非風濕性二尖瓣閉鎖不全 | Nonrheumatic mitral (valve) insufficiency |
| `I35.0` | 非風濕性主動脈瓣狹窄 | 非風濕性主動脈瓣狹窄 | Nonrheumatic aortic (valve) stenosis |
| `I35.1` | 主動脈瓣逆流 | 非風濕主動脈瓣閉鎖不全 | Nonrheumatic aortic (valve) insufficiency |
| `I42.0` | 擴張性心肌病變 | 擴張性心肌病變 | Dilated cardiomyopathy |
| `I42.2` | 其他肥厚性心肌病變 | 其他肥厚性心肌病變 | Other hypertrophic cardiomyopathy |
| `Z95.1` | 冠狀動脈繞道手術狀態 | 存有主動脈冠狀動脈繞道移植物 | Presence of aortocoronary bypass graft |
| `Z95.5` | 冠狀動脈支架植入狀態 | 存有冠狀動脈血管成形術植入物及移植物 | Presence of coronary angioplasty implant and graft |
| `Z95.0` | 心臟節律器植入狀態 | 存有心臟節律器 | Presence of cardiac pacemaker |
| `Z79.01` | 長期服用抗凝血劑 | 長期（現在之）服用抗凝血劑 | Long term (current) use of anticoagulants |
| `Z79.02` | 長期使用抗血小板藥 | 長期（現在之）服用抗血栓劑/抗血小板劑 | Long term (current) use of antithrombotics/antiplatelets |
| `I73.9` | 末梢血管疾病 | 末梢血管疾病 | Peripheral vascular disease, unspecified |
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `E78.5` | 高血脂症 | 高血脂症 | Hyperlipidemia, unspecified |

#### 腦中風後／神經退化

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `I69.30` | 腦中風後遺症 | 腦梗塞後遺症 | Unspecified sequelae of cerebral infarction |
| `G20` | 巴金森氏症 | 巴金森氏症 | Parkinson's disease |
| `F03.90` | 失智症（未明示嚴重度、無行為障礙） | 非特定的失智症，未明示嚴重度，無行為、精神病症、情緒困擾及焦慮症狀 | Unspecified dementia, unspecified severity, without behavioral disturbance, psychotic disturbance, mood disturbance, and anxiety |
| **常見疾病** | | | |
| `Z86.73` | 中風病史（無後遺症） | 短暫性腦缺血發作 （TIA）與無殘餘缺損之腦梗塞之個人史 | Personal history of transient ischemic attack (TIA), and cerebral infarction without residual deficits |
| `I69.351` | 腦梗塞後右側偏癱 | 右側優勢側偏癱/輕偏癱，腦梗塞後遺症 | Hemiplegia and hemiparesis following cerebral infarction affecting right dominant side |
| `I69.354` | 腦梗塞後左側偏癱 | 左側非優勢側偏癱/輕偏癱，腦梗塞後遺症 | Hemiplegia and hemiparesis following cerebral infarction affecting left non-dominant side |
| `I69.391` | 腦梗塞後吞嚥困難 | 吞嚥困難，腦梗塞後遺症 | Dysphagia following cerebral infarction |
| `G30.9` | 阿茲海默氏病 | 非特定的阿茲海默氏病 | Alzheimer's disease, unspecified |
| `G31.84` | 輕度認知障礙 | 病因不明之輕型認知障礙 | Mild cognitive impairment of uncertain or unknown etiology |
| `G45.9` | 短暫性腦缺血發作 TIA | 短暫性大腦缺血發作 | Transient cerebral ischemic attack, unspecified |
| `I65.29` | 頸動脈狹窄（未明示側） | 未明示側性頸動脈阻塞及狹窄 | Occlusion and stenosis of unspecified carotid artery |
| `I67.9` | 腦血管疾病（未明示） | 診斷欠明之腦血管疾病 | Cerebrovascular disease, unspecified |
| `G40.909` | 癲癇（非難治，未伴重積） | 癲癇，非難治之癲癇，未伴有癲癇重積狀態 | Epilepsy, unspecified, not intractable, without status epilepticus |
| `G43.909` | 偏頭痛 | 偏頭痛，未明確定義型態，非頑固性，未伴有偏頭痛重積狀態 | Migraine, unspecified, not intractable, without status migrainosus |
| `G47.00` | 失眠 | 非特定的失眠症 | Insomnia, unspecified |
| `G47.33` | 阻塞型睡眠呼吸中止 OSA | 阻塞性睡眠呼吸中止 (成人) (小兒) | Obstructive sleep apnea (adult) (pediatric) |
| `G62.9` | 多發神經病變 | 多發神經病變 | Polyneuropathy, unspecified |
| `G35` | 多發性硬化症 | 多發性硬化症 | Multiple sclerosis |
| `R27.0` | 運動失調 | 共濟失調 | Ataxia, unspecified |
| `R26.81` | 站立不穩 | 站立不穩 | Unsteadiness on feet |
| `R13.10` | 吞嚥困難 | 吞嚥困難 | Dysphagia, unspecified |
| `Z79.02` | 長期使用抗血小板藥 | 長期（現在之）服用抗血栓劑/抗血小板劑 | Long term (current) use of antithrombotics/antiplatelets |
| `Z79.01` | 長期服用抗凝血劑 | 長期（現在之）服用抗凝血劑 | Long term (current) use of anticoagulants |
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |

#### 氣喘／COPD

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `J44.9` | 慢性阻塞性肺病 COPD | 慢性阻塞性肺病 | Chronic obstructive pulmonary disease, unspecified |
| `J45.909` | 氣喘（無併發症） | 氣喘,無併發症 | Unspecified asthma, uncomplicated |
| **常見疾病** | | | |
| `J44.0` | COPD 伴急性下呼吸道感染 | 慢性阻塞性肺病伴有急性下呼吸道感染 | Chronic obstructive pulmonary disease with (acute) lower respiratory infection |
| `J44.1` | COPD 急性惡化 | 慢性阻塞性肺病伴有(急性)發作 | Chronic obstructive pulmonary disease with (acute) exacerbation |
| `J42` | 慢性支氣管炎 | 慢性支氣管炎 | Unspecified chronic bronchitis |
| `J43.9` | 肺氣腫 | 肺氣腫 | Emphysema, unspecified |
| `J45.20` | 間歇性氣喘（未併發症） | 輕度間歇性氣喘,無併發症 | Mild intermittent asthma, uncomplicated |
| `J45.30` | 輕度持續性氣喘（未併發症） | 輕度持續性氣喘,無併發症 | Mild persistent asthma, uncomplicated |
| `J45.40` | 中度持續性氣喘（無併發症） | 中度持續性氣喘，無併發症 | Moderate persistent asthma, uncomplicated |
| `J45.50` | 重度持續性氣喘（未併發症） | 重度持續發作性氣喘，無併發症 | Severe persistent asthma, uncomplicated |
| `J45.901` | 氣喘急性發作 | 氣喘併(急性)發作 | Unspecified asthma with (acute) exacerbation |
| `J47.9` | 支氣管擴張症（未併發） | 支氣管擴張症 | Bronchiectasis, uncomplicated |
| `J96.10` | 慢性呼吸衰竭（未明示缺氧或高碳酸） | 慢性呼吸衰竭，未明示是否伴有缺氧或高碳酸血症 | Chronic respiratory failure, unspecified whether with hypoxia or hypercapnia |
| `J84.10` | 肺部纖維化 | 肺部纖維化 | Pulmonary fibrosis, unspecified |
| `G47.33` | 阻塞型睡眠呼吸中止 OSA | 阻塞性睡眠呼吸中止 (成人) (小兒) | Obstructive sleep apnea (adult) (pediatric) |
| `J30.9` | 過敏性鼻炎 | 過敏性鼻炎 | Allergic rhinitis, unspecified |
| `J31.0` | 慢性鼻炎 | 慢性鼻炎 | Chronic rhinitis |
| `R05.3` | 慢性咳嗽 | 慢性咳嗽 | Chronic cough |
| `R06.02` | 呼吸短促 | 呼吸短促 | Shortness of breath |
| `Z99.81` | 依賴補充氧氣 | 補充氧氣之依賴 | Dependence on supplemental oxygen |
| `F17.210` | 尼古丁依賴（香菸、未併發症） | 尼古丁依賴，香菸，無併發症 | Nicotine dependence, cigarettes, uncomplicated |
| `Z87.891` | 尼古丁依賴病史 | 尼古丁依賴之個人史 | Personal history of nicotine dependence |
| `Z23` | 預防接種 | 來院接受疫苗接種 | Encounter for immunization |

#### 慢性肝膽腸胃

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `K21.9` | 胃食道逆流 GERD（未伴食道炎） | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K29.50` | 慢性胃炎 | 慢性胃炎未伴有出血 | Unspecified chronic gastritis without bleeding |
| `B18.2` | 慢性 C 型肝炎 | 慢性病毒性C型肝炎 | Chronic viral hepatitis C |
| **常見疾病** | | | |
| `K21.00` | 胃食道逆流伴食道炎（未伴出血） | 胃食道逆流性疾病伴有食道炎未伴有出血 | Gastro-esophageal reflux disease with esophagitis, without bleeding |
| `K25.9` | 胃潰瘍（未明示急慢性、未伴出血或穿孔） | 胃潰瘍，未明示急性或慢性，未伴有出血或穿孔 | Gastric ulcer, unspecified as acute or chronic, without hemorrhage or perforation |
| `K26.9` | 十二指腸潰瘍（未明示急慢性、未伴出血或穿孔） | 十二指腸潰瘍，未明示急性或慢性，未伴有出血或穿孔 | Duodenal ulcer, unspecified as acute or chronic, without hemorrhage or perforation |
| `K29.70` | 胃炎（未伴出血） | 胃炎未伴有出血 | Gastritis, unspecified, without bleeding |
| `K58.9` | 腸躁症（未伴腹瀉） | 激躁性腸症候群未伴有腹瀉 | Irritable bowel syndrome without diarrhea |
| `K59.00` | 便秘 | 便秘 | Constipation, unspecified |
| `K64.9` | 痔瘡 | 痔瘡 | Unspecified hemorrhoids |
| `K57.30` | 大腸憩室（未伴穿孔或膿瘍、無出血） | 大腸憩室未伴有穿孔或膿瘍無出血 | Diverticulosis of large intestine without perforation or abscess without bleeding |
| `K51.90` | 潰瘍性結腸炎（未伴併發症） | 潰瘍性結腸炎未伴有併發症 | Ulcerative colitis, unspecified, without complications |
| `K50.90` | 克隆氏病（未伴併發症） | 克隆氏病未伴有併發症 | Crohn's disease, unspecified, without complications |
| `B18.1` | 慢性 B 型肝炎（未伴 D 型） | 慢性病毒性B型肝炎未伴有D 型肝炎病毒 | Chronic viral hepatitis B without delta-agent |
| `K74.60` | 肝硬化 | 肝硬化 | Unspecified cirrhosis of liver |
| `K76.0` | 脂肪肝 | 脂肪肝(變化)，他處未歸類者 | Fatty (change of) liver, not elsewhere classified |
| `K70.30` | 酒精性肝硬化（未伴腹水） | 酒精性肝硬化未伴有腹水 | Alcoholic cirrhosis of liver without ascites |
| `K86.1` | 其他慢性胰臟炎 | 其他慢性胰臟炎 | Other chronic pancreatitis |
| `K80.20` | 膽囊結石（未伴膽囊炎、未伴阻塞） | 膽囊結石未伴有膽囊炎未伴有阻塞 | Calculus of gallbladder without cholecystitis without obstruction |
| `K90.0` | 乳糜瀉 | 乳糜瀉 | Celiac disease |
| `R74.01` | 肝指數上升（轉胺酶） | 轉胺基脢含量上升 | Elevation of levels of liver transaminase levels |
| `Z86.010` | 大腸息肉病史 | 結腸息肉之個人史 | Personal history of colonic polyps |
| `Z79.899` | 長期藥物治療 | 長期 （現在之）藥物治療 | Other long term (current) drug therapy |

#### 甲狀腺／內分泌

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `E05.90` | 甲狀腺毒症／甲亢（未伴危象或風暴） | 未明示之甲狀腺毒症，未伴有甲狀腺毒性危象或風暴 | Thyrotoxicosis, unspecified without thyrotoxic crisis or storm |
| **常見疾病** | | | |
| `E03.8` | 其他特定甲狀腺功能低下 | 其他特定甲狀腺低下 | Other specified hypothyroidism |
| `E02` | 亞臨床碘缺乏性甲狀腺功能低下 | 臨床無症狀的缺碘性甲狀腺低下 | Subclinical iodine-deficiency hypothyroidism |
| `E06.3` | 自體免疫甲狀腺炎 | 自體免疫的甲狀腺炎 | Autoimmune thyroiditis |
| `E04.1` | 非毒性單一甲狀腺結節 | 非毒性單一甲狀腺結節 | Nontoxic single thyroid nodule |
| `E04.2` | 非毒性多結節性甲狀腺腫 | 非毒性多結節性甲狀腺腫 | Nontoxic multinodular goiter |
| `E05.00` | 毒性瀰漫性甲狀腺腫（未伴危象或風暴） | 毒性瀰漫性甲狀腺腫，未伴有甲狀腺毒性危象或風暴 | Thyrotoxicosis with diffuse goiter without thyrotoxic crisis or storm |
| `E89.0` | 術後甲狀腺功能低下 | 手術後甲狀腺低下 | Postprocedural hypothyroidism |
| `E21.0` | 原發性副甲狀腺功能亢進 | 原發性副甲狀腺亢進 | Primary hyperparathyroidism |
| `E20.9` | 副甲狀腺功能低下（未明示） | 副甲狀腺低下 | Hypoparathyroidism, unspecified |
| `E27.40` | 腎上腺皮質功能不足 | 腎上腺皮質功能不足 | Unspecified adrenocortical insufficiency |
| `E24.9` | 庫欣氏症候群（未明示） | 庫欣氏症候群 | Cushing's syndrome, unspecified |
| `E28.2` | 多囊卵巢症候群 | 多囊性卵巢症候群 | Polycystic ovarian syndrome |
| `E23.0` | 腦下垂體功能低下 | 腦下腺功能低下 | Hypopituitarism |
| `E22.1` | 高泌乳素血症 | 高泌乳素血症 | Hyperprolactinemia |
| `E29.1` | 睪丸功能低下 | 睪丸功能低下 | Testicular hypofunction |
| `E55.9` | 維生素 D 缺乏 | 維生素D缺乏 | Vitamin D deficiency, unspecified |
| `E88.81` | 新陳代謝症候群 | 新陳代謝症候群 | Metabolic syndrome |
| `R94.6` | 甲狀腺功能檢查結果異常 | 甲狀腺功能檢查結果異常 | Abnormal results of thyroid function studies |
| `Z79.899` | 長期藥物治療 | 長期 （現在之）藥物治療 | Other long term (current) drug therapy |

#### 骨關節／骨鬆／慢性疼痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `M10.9` | 痛風 | 痛風 | Gout, unspecified |
| `M81.0` | 老年性骨質疏鬆（未伴病理性骨折） | 老年性骨質疏鬆症未伴有病理性骨折 | Age-related osteoporosis without current pathological fracture |
| `M54.50` | 下背痛 | 下背痛 | Low back pain, unspecified |
| **常見疾病** | | | |
| `E79.0` | 高尿酸血症（未伴發炎性關節炎及痛風石） | 高尿酸血症未伴有關節炎及痛風石 | Hyperuricemia without signs of inflammatory arthritis and tophaceous disease |
| `M15.0` | 原發性廣泛性骨關節炎 | 原發性廣泛性(骨)關節炎 | Primary generalized (osteo)arthritis |
| `M16.0` | 雙側原發性髖關節炎 | 髖部原發性骨關節炎，雙側性 | Bilateral primary osteoarthritis of hip |
| `M17.0` | 雙側膝部原發性骨關節炎 | 膝部原發性骨關節炎，雙側性 | Bilateral primary osteoarthritis of knee |
| `M17.11` | 右膝原發性骨關節炎（單側） | 右側膝部原發性骨關節炎，單側性 | Unilateral primary osteoarthritis, right knee |
| `M17.12` | 左膝原發性骨關節炎（單側） | 左側膝部原發性骨關節炎，單側性 | Unilateral primary osteoarthritis, left knee |
| `M19.90` | 骨關節炎（未明示部位） | 未明示部位骨關節炎 | Unspecified osteoarthritis, unspecified site |
| `M06.9` | 類風濕性關節炎 RA | 類風濕性關節炎 | Rheumatoid arthritis, unspecified |
| `M32.9` | 全身性紅斑性狼瘡 SLE | 全身性紅斑性狼瘡 | Systemic lupus erythematosus, unspecified |
| `M35.00` | 修格蘭氏症候群（乾燥症） | sjogren's症候群 | Sjogren syndrome, unspecified |
| `M79.7` | 纖維肌痛 | 纖維肌痛 | Fibromyalgia |
| `M54.2` | 頸椎痛 | 頸椎痛 | Cervicalgia |
| `M54.51` | 椎體性下背痛 | 椎體性下背痛 | Vertebrogenic low back pain |
| `M54.59` | 其他下背痛 | 其他下背痛 | Other low back pain |
| `M47.816` | 腰椎退化性脊椎炎（未伴脊髓或神經根病變） | 腰椎退化性脊椎炎未伴有脊髓病變或神經根病變 | Spondylosis without myelopathy or radiculopathy, lumbar region |
| `M48.061` | 腰椎脊椎狹窄（未伴神經性跛行） | 腰椎脊椎狹窄症未伴有神經源性跛行 | Spinal stenosis, lumbar region without neurogenic claudication |
| `M25.561` | 右膝痛 | 右側膝部關節痛 | Pain in right knee |
| `M25.562` | 左膝痛 | 左側膝部關節痛 | Pain in left knee |
| `M75.100` | 肩部旋轉肌袖撕裂（未明示側、非創傷性） | 未明示側性肩部旋轉環帶撕裂或破裂，未明示為創傷性 | Unspecified rotator cuff tear or rupture of unspecified shoulder, not specified as traumatic |
| `M77.10` | 肘外側上髁炎（網球肘、未明示側） | 未明示側性肘外側上髁炎 | Lateral epicondylitis, unspecified elbow |
| `G89.29` | 其他慢性疼痛 | 其他慢性疼痛 | Other chronic pain |
| `M85.80` | 其他特定骨密度及結構異常（未明示部位） | 未明示部位其他特定骨密度及構造疾患 | Other specified disorders of bone density and structure, unspecified site |
| `Z79.899` | 長期藥物治療 | 長期 （現在之）藥物治療 | Other long term (current) drug therapy |

#### 情緒／睡眠／成癮

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| `F32.A` | 憂鬱症 | 非特定性的鬱症 | Depression, unspecified |
| `G47.00` | 失眠 | 非特定的失眠症 | Insomnia, unspecified |
| **常見疾病** | | | |
| `F33.9` | 鬱症（復發型） | 非特定的鬱症，復發 | Major depressive disorder, recurrent, unspecified |
| `F31.9` | 雙相情緒障礙症 | 非特定的雙相情緒障礙症 | Bipolar disorder, unspecified |
| `F41.1` | 廣泛性焦慮症 | 廣泛性焦慮症 | Generalized anxiety disorder |
| `F40.10` | 社交焦慮症（未明示） | 非特定的社交畏懼症 | Social phobia, unspecified |
| `F42.9` | 強迫症（未明示） | 強迫症 | Obsessive-compulsive disorder, unspecified |
| `F43.10` | 創傷後壓力症 PTSD | 創傷後壓力症，非特定 | Post-traumatic stress disorder, unspecified |
| `F43.21` | 適應障礙伴憂鬱情緒 | 有憂鬱情緒的適應障礙症 | Adjustment disorder with depressed mood |
| `F45.9` | 擬身體障礙症 | 非特定的擬身體障礙症 | Somatoform disorder, unspecified |
| `F51.01` | 原發性失眠 | 原發性失眠症 | Primary insomnia |
| `G47.33` | 阻塞型睡眠呼吸中止 OSA | 阻塞性睡眠呼吸中止 (成人) (小兒) | Obstructive sleep apnea (adult) (pediatric) |
| `G47.10` | 多眠症 | 非特定的多眠症 | Hypersomnia, unspecified |
| `F10.20` | 酒精依賴（無併發症） | 酒精依賴，無併發症 | Alcohol dependence, uncomplicated |
| `F17.210` | 尼古丁依賴（香菸、未併發症） | 尼古丁依賴，香菸，無併發症 | Nicotine dependence, cigarettes, uncomplicated |
| `F03.90` | 失智症（未明示嚴重度、無行為障礙） | 非特定的失智症，未明示嚴重度，無行為、精神病症、情緒困擾及焦慮症狀 | Unspecified dementia, unspecified severity, without behavioral disturbance, psychotic disturbance, mood disturbance, and anxiety |
| `F90.9` | 注意力不足過動症（未明示） | 注意力不足過動症，非特定型 | Attention-deficit hyperactivity disorder, unspecified type |
| `R45.851` | 自殺意念 | 自殺意念 | Suicidal ideations |
| `R41.3` | 其他失憶症 | 其他失憶症 | Other amnesia |
| `Z79.899` | 長期藥物治療 | 長期 （現在之）藥物治療 | Other long term (current) drug therapy |
| `Z91.148` | 未遵醫囑用藥（其他理由） | 由於其他理由，病人對其他用藥療程不順從 | Patient's other noncompliance with medication regimen for other reason |

#### 貧血／營養缺乏

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `D50.9` | 缺鐵性貧血 | 缺鐵性貧血 | Iron deficiency anemia, unspecified |
| **常見疾病** | | | |
| `D50.0` | 慢性失血導致之缺鐵性貧血 | (慢性)血液流失引起之續發缺鐵性貧血 | Iron deficiency anemia secondary to blood loss (chronic) |
| `D51.0` | 維生素 B12 缺乏性貧血（惡性貧血） | 內因子缺乏所致的維生素Ｂ12缺乏性貧血 | Vitamin B12 deficiency anemia due to intrinsic factor deficiency |
| `D52.9` | 葉酸缺乏性貧血 | 葉酸缺乏性貧血 | Folate deficiency anemia, unspecified |
| `D53.9` | 營養性貧血（未明示） | 營養性貧血 | Nutritional anemia, unspecified |
| `D63.1` | 慢性腎臟疾病導致的貧血（附加碼） | 慢性腎臟疾病導致的貧血 | Anemia in chronic kidney disease |
| `D63.0` | 腫瘤疾病導致之貧血 | 腫瘤疾病導致的貧血 | Anemia in neoplastic disease |
| `D46.9` | 骨髓化生不良症候群 MDS（未明示） | 骨髓分化不良症候群 | Myelodysplastic syndrome, unspecified |
| `D69.6` | 血小板缺乏症 | 血小板缺乏症 | Thrombocytopenia, unspecified |
| `D70.9` | 嗜中性球低下 | 嗜中性白血球缺乏症 | Neutropenia, unspecified |
| `D75.9` | 血液及造血器官疾病（未明示） | 血液與造血器官疾病 | Disease of blood and blood-forming organs, unspecified |
| `E55.9` | 維生素 D 缺乏 | 維生素D缺乏 | Vitamin D deficiency, unspecified |
| `E53.8` | 其他特定維生素 B 群缺乏症 | 其他特定維生素B群缺乏症 | Deficiency of other specified B group vitamins |
| `E61.1` | 鐵缺乏 | 缺鐵 | Iron deficiency |
| `E43` | 未明示重度蛋白質熱量營養不良 | 重度蛋白質-熱量營養不良症 | Unspecified severe protein-calorie malnutrition |
| `E44.0` | 中度蛋白質熱量營養不良 | 中度蛋白質-熱量營養不良症 | Moderate protein-calorie malnutrition |
| `R53.83` | 疲倦 | 其他疲勞 | Other fatigue |
| `R71.8` | 其他紅血球異常 | 其他紅血球異常 | Other abnormality of red blood cells |
| `Z79.899` | 長期藥物治療 | 長期 （現在之）藥物治療 | Other long term (current) drug therapy |

#### 長期用藥／照護狀態

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `Z79.899` | 長期藥物治療 | 長期 （現在之）藥物治療 | Other long term (current) drug therapy |
| `Z09` | 治療後追蹤檢查 | 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 | Encounter for follow-up examination after completed treatment for conditions other than malignant neoplasm |
| **常見疾病** | | | |
| `Z79.4` | 長期使用胰島素 | 長期（現在之）服用胰島素 | Long term (current) use of insulin |
| `Z79.84` | 長期使用口服降血糖藥 | 長期(現存)使用口服降糖藥治療 | Long term (current) use of oral hypoglycemic drugs |
| `Z79.01` | 長期服用抗凝血劑 | 長期（現在之）服用抗凝血劑 | Long term (current) use of anticoagulants |
| `Z79.02` | 長期使用抗血小板藥 | 長期（現在之）服用抗血栓劑/抗血小板劑 | Long term (current) use of antithrombotics/antiplatelets |
| `Z79.52` | 長期使用全身性類固醇 | 長期（現在之）全身性類固醇 | Long term (current) use of systemic steroids |
| `Z79.891` | 長期使用鴉片類止痛劑 | 長期 （現在之）之鴉片類之鎮痛劑 | Long term (current) use of opiate analgesic |
| `Z79.83` | 長期使用骨質疏鬆藥物 | 長期（現在之）服用雙磷酸鹽類藥物 | Long term (current) use of bisphosphonates |
| `Z79.1` | 長期使用非類固醇消炎止痛藥 NSAID | 長期（現在之）服用非類固醇類消炎藥 | Long term (current) use of non-steroidal anti-inflammatories (NSAID) |
| `Z95.0` | 心臟節律器植入狀態 | 存有心臟節律器 | Presence of cardiac pacemaker |
| `Z95.1` | 冠狀動脈繞道手術狀態 | 存有主動脈冠狀動脈繞道移植物 | Presence of aortocoronary bypass graft |
| `Z95.5` | 冠狀動脈支架植入狀態 | 存有冠狀動脈血管成形術植入物及移植物 | Presence of coronary angioplasty implant and graft |
| `Z99.2` | 依賴腎透析 | 腎（臟）透析依賴 | Dependence on renal dialysis |
| `Z99.81` | 依賴補充氧氣 | 補充氧氣之依賴 | Dependence on supplemental oxygen |
| `Z94.0` | 腎臟移植狀態 | 腎臟移植狀態 | Kidney transplant status |
| `Z86.73` | 中風病史（無後遺症） | 短暫性腦缺血發作 （TIA）與無殘餘缺損之腦梗塞之個人史 | Personal history of transient ischemic attack (TIA), and cerebral infarction without residual deficits |
| `Z87.891` | 尼古丁依賴病史 | 尼古丁依賴之個人史 | Personal history of nicotine dependence |
| `Z91.148` | 未遵醫囑用藥（其他理由） | 由於其他理由，病人對其他用藥療程不順從 | Patient's other noncompliance with medication regimen for other reason |
| `Z71.3` | 飲食諮詢衛教 | 飲食諮詢與監測 | Dietary counseling and surveillance |
| `Z13.1` | 糖尿病篩檢 | 來院接受糖尿病篩檢 | Encounter for screening for diabetes mellitus |
| `Z23` | 預防接種 | 來院接受疫苗接種 | Encounter for immunization |

### 全身／感染

#### 發燒／寒顫

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R50.9` | 發燒 | 發燒 | Fever, unspecified |
| `R68.83` | 寒顫（未伴發燒） | 寒顫(未伴有發燒) | Chills (without fever) |
| **常見疾病** | | | |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `J00` | 急性鼻咽炎（感冒） | 急性鼻咽炎（感冒） | Acute nasopharyngitis [common cold] |
| `B34.9` | 病毒感染 | 病毒感染 | Viral infection, unspecified |
| `J11.1` | 流感（伴其他呼吸道表徵） | 未確認流感病毒所致流行性感冒併其他呼吸道表徵 | Influenza due to unidentified influenza virus with other respiratory manifestations |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `J01.90` | 急性鼻竇炎 | 急性鼻竇炎 | Acute sinusitis, unspecified |
| `J02.9` | 急性咽炎 | 急性咽炎 | Acute pharyngitis, unspecified |
| `J03.90` | 急性扁桃腺炎 | 急性扁桃腺炎 | Acute tonsillitis, unspecified |
| `J20.9` | 急性支氣管炎 | 急性支氣管炎 | Acute bronchitis, unspecified |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `A46` | 丹毒 | 丹毒 | Erysipelas |
| `A49.9` | 細菌感染 | 細菌感染 | Bacterial infection, unspecified |
| `A41.9` | 敗血症 | 敗血症，未明示病原體 | Sepsis, unspecified organism |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `K83.09` | 急性膽管炎（其他膽管炎） | 其他膽管炎 | Other cholangitis |
| `A04.72` | 艱難梭菌腸道感染 CDI（非復發型） | 艱難梭菌所致腸道感染，未明示為復發型 | Enterocolitis due to Clostridium difficile, not specified as recurrent |
| `B02.9` | 帶狀疱疹（未伴併發症） | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `B27.90` | 傳染性單核球增多症（未伴併發症） | 傳染性單核球過多症，未伴有併發症 | Infectious mononucleosis, unspecified without complication |
| `A15.9` | 呼吸道結核病 | 呼吸道結核病 | Respiratory tuberculosis unspecified |
| `A90` | 登革熱 | 登革熱[典型登革熱] | Dengue fever [classical dengue] |
| `A75.3` | 恙蟲病 | 恙蟲立克次體所致之斑疹傷寒熱 | Typhus fever due to Rickettsia tsutsugamushi |
| `A27.9` | 鉤端螺旋體病 | 細鉤端螺旋體病 | Leptospirosis, unspecified |
| `A78` | Q 熱病 | Q熱病 | Q fever |
| `I33.0` | 感染性心內膜炎 IE | 急性及亞急性感染性心內膜炎 | Acute and subacute infective endocarditis |
| `H66.90` | 中耳炎（未明示側） | 未明示側性中耳炎 | Otitis media, unspecified, unspecified ear |
| `K61.0` | 肛門膿瘍 | 肛門膿瘍 | Anal abscess |
| `C80.1` | 惡性腫瘤未明示部位 | 未明示惡性腫瘤（原發性） | Malignant (primary) neoplasm, unspecified |

#### 疲倦／體重減輕

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R53.83` | 疲倦 | 其他疲勞 | Other fatigue |
| `R53.1` | 虛弱 | 虛弱 | Weakness |
| `R63.4` | 體重減輕 | 體重異常減輕 | Abnormal weight loss |
| `R61` | 盜汗 | 全身性多汗症 | Generalized hyperhidrosis |
| `R63.0` | 食慾不振 | 厭食 | Anorexia |
| **常見疾病** | | | |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `D50.9` | 缺鐵性貧血 | 缺鐵性貧血 | Iron deficiency anemia, unspecified |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `F32.A` | 憂鬱症 | 非特定性的鬱症 | Depression, unspecified |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| `G47.33` | 阻塞型睡眠呼吸中止 OSA | 阻塞性睡眠呼吸中止 (成人) (小兒) | Obstructive sleep apnea (adult) (pediatric) |
| `N18.9` | 慢性腎臟疾病 CKD | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `J44.9` | 慢性阻塞性肺病 COPD | 慢性阻塞性肺病 | Chronic obstructive pulmonary disease, unspecified |
| `K74.60` | 肝硬化 | 肝硬化 | Unspecified cirrhosis of liver |
| `E05.90` | 甲狀腺毒症／甲亢（未伴危象或風暴） | 未明示之甲狀腺毒症，未伴有甲狀腺毒性危象或風暴 | Thyrotoxicosis, unspecified without thyrotoxic crisis or storm |
| `D51.9` | 維生素 B12 缺乏性貧血 | 維生素B12缺乏性貧血 | Vitamin B12 deficiency anemia, unspecified |
| `D52.9` | 葉酸缺乏性貧血 | 葉酸缺乏性貧血 | Folate deficiency anemia, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `E46` | 蛋白質熱量營養不良 | 蛋白質-熱量營養不良症 | Unspecified protein-calorie malnutrition |
| `A15.9` | 呼吸道結核病 | 呼吸道結核病 | Respiratory tuberculosis unspecified |
| `B20` | HIV 疾病 | 人類免疫不全病毒疾病 | Human immunodeficiency virus [HIV] disease |
| `C80.1` | 惡性腫瘤未明示部位 | 未明示惡性腫瘤（原發性） | Malignant (primary) neoplasm, unspecified |
| `C34.90` | 肺／支氣管惡性腫瘤（未明示側） | 未明示側性支氣管或肺惡性腫瘤 | Malignant neoplasm of unspecified part of unspecified bronchus or lung |
| `C16.9` | 胃惡性腫瘤 | 胃惡性腫瘤 | Malignant neoplasm of stomach, unspecified |
| `C18.9` | 結腸惡性腫瘤 | 結腸惡性腫瘤 | Malignant neoplasm of colon, unspecified |
| `M06.9` | 類風濕性關節炎 RA | 類風濕性關節炎 | Rheumatoid arthritis, unspecified |
| `M32.9` | 全身性紅斑性狼瘡 SLE | 全身性紅斑性狼瘡 | Systemic lupus erythematosus, unspecified |
| `E10.9` | 第一型糖尿病（未伴併發症） | 第一型糖尿病，未伴有併發症 | Type 1 diabetes mellitus without complications |
| `E27.40` | 腎上腺皮質功能不足 | 腎上腺皮質功能不足 | Unspecified adrenocortical insufficiency |
| `R53.82` | 慢性疲勞 | 慢性疲勞 | Chronic fatigue, unspecified |
| `E66.9` | 肥胖 | 肥胖 | Obesity, unspecified |

#### 淋巴結腫大

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R59.0` | 局部淋巴結腫大 | 局部性淋巴結腫大 | Localized enlarged lymph nodes |
| `R59.1` | 全身淋巴結腫大 | 全身性淋巴結腫大 | Generalized enlarged lymph nodes |
| `R59.9` | 淋巴結腫大 | 淋巴結腫大 | Enlarged lymph nodes, unspecified |
| **常見疾病** | | | |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `L04.0` | 頭頸部急性淋巴腺炎 | 臉、頭及頸部急性淋巴腺炎 | Acute lymphadenitis of face, head and neck |
| `B34.9` | 病毒感染 | 病毒感染 | Viral infection, unspecified |
| `A49.9` | 細菌感染 | 細菌感染 | Bacterial infection, unspecified |
| `B27.90` | 傳染性單核球增多症（未伴併發症） | 傳染性單核球過多症，未伴有併發症 | Infectious mononucleosis, unspecified without complication |
| `B27.00` | EB 病毒單核球增多症（未伴併發症） | γ疱疹病毒性單核球過多未伴有併發症 | Gammaherpesviral mononucleosis without complication |
| `I88.1` | 慢性淋巴腺炎（不含腸系膜） | 腸系膜除外之慢性淋巴腺炎 | Chronic lymphadenitis, except mesenteric |
| `I88.8` | 其他非特異性淋巴腺炎 | 其他非特定性淋巴腺炎 | Other nonspecific lymphadenitis |
| `A18.2` | 結核性周邊淋巴腺病變 | 結核性周邊淋巴腺病變 | Tuberculous peripheral lymphadenopathy |
| `A15.4` | 胸腔內淋巴結結核 | 胸腔內淋巴結結核 | Tuberculosis of intrathoracic lymph nodes |
| `A28.1` | 貓抓病 | 貓抓病 | Cat-scratch disease |
| `B58.9` | 弓漿蟲病 | 弓漿蟲病 | Toxoplasmosis, unspecified |
| `B25.9` | 巨細胞病毒疾病 CMV | 巨細胞病毒疾病 | Cytomegaloviral disease, unspecified |
| `A53.9` | 梅毒 | 梅毒 | Syphilis, unspecified |
| `A51.49` | 其他第二期梅毒 | 其他第二期(續發性)梅毒 | Other secondary syphilitic conditions |
| `B20` | HIV 疾病 | 人類免疫不全病毒疾病 | Human immunodeficiency virus [HIV] disease |
| `C81.90` | 霍奇金淋巴瘤 | 未明示部位之何杰金淋巴瘤 | Hodgkin lymphoma, unspecified, unspecified site |
| `C85.90` | 非霍奇金淋巴瘤 | 未明示部位之非何杰金(氏)淋巴瘤 | Non-Hodgkin lymphoma, unspecified, unspecified site |
| `C83.30` | 瀰漫性大 B 細胞淋巴瘤（未明示部位） | 未明示部位之瀰漫性巨大B-細胞淋巴瘤 | Diffuse large B-cell lymphoma, unspecified site |
| `C91.10` | 慢性淋巴性白血病（未緩解） | 慢性B細胞淋巴性白血病，未達到緩解 | Chronic lymphocytic leukemia of B-cell type not having achieved remission |
| `C77.9` | 淋巴結續發性惡性腫瘤（轉移） | 未明示部位淋巴結之續發性及未明性惡性腫瘤 | Secondary and unspecified malignant neoplasm of lymph node, unspecified |
| `D86.1` | 淋巴結類肉瘤病 | 淋巴結類肉瘤病 | Sarcoidosis of lymph nodes |
| `M32.9` | 全身性紅斑性狼瘡 SLE | 全身性紅斑性狼瘡 | Systemic lupus erythematosus, unspecified |

### 感染科追蹤

#### HIV 感染追蹤

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `Z21` | 無症狀 HIV 感染狀態 | 無症狀之人類免疫不全病毒感染狀態 | Asymptomatic human immunodeficiency virus [HIV] infection status |
| `Z79.899` | 長期藥物治療 | 長期 （現在之）藥物治療 | Other long term (current) drug therapy |
| `Z11.4` | HIV 篩檢 | 來院接受人類免疫缺乏病毒[HIV]之篩檢 | Encounter for screening for human immunodeficiency virus [HIV] |
| `Z20.6` | HIV 接觸暴露 | 人類免疫不全病毒之接觸和疑似曝露 | Contact with and (suspected) exposure to human immunodeficiency virus [HIV] |
| `Z71.7` | HIV 諮詢 | 後天免疫缺乏病毒疾病之諮詢 | Human immunodeficiency virus [HIV] counseling |
| **常見疾病** | | | |
| `B20` | HIV 疾病 | 人類免疫不全病毒疾病 | Human immunodeficiency virus [HIV] disease |
| `R75` | HIV 檢驗結果未確定 | 後天免疫不全病毒檢驗結果未確定 | Inconclusive laboratory evidence of human immunodeficiency virus [HIV] |
| `A53.9` | 梅毒 | 梅毒 | Syphilis, unspecified |
| `A53.0` | 潛伏性梅毒（未明示早晚期） | 未明示早期或晚期的潛伏性梅毒 | Latent syphilis, unspecified as early or late |
| `A51.0` | 第一期生殖器梅毒 | 第一期(原發性)生殖器梅毒 | Primary genital syphilis |
| `A51.49` | 其他第二期梅毒 | 其他第二期(續發性)梅毒 | Other secondary syphilitic conditions |
| `A63.0` | 肛門生殖器疣 | 肛門生殖器疣 | Anogenital (venereal) warts |
| `A54.9` | 淋病雙球菌感染 | 淋病雙球菌感染 | Gonococcal infection, unspecified |
| `A56.2` | 生殖泌尿道披衣菌感染 | 生殖泌尿道披衣菌感染 | Chlamydial infection of genitourinary tract, unspecified |
| `A60.00` | 泌尿生殖系統疱疹病毒感染 | 泌尿生殖系統疱疹病毒性感染 | Herpesviral infection of urogenital system, unspecified |
| `B18.1` | 慢性 B 型肝炎（未伴 D 型） | 慢性病毒性B型肝炎未伴有D 型肝炎病毒 | Chronic viral hepatitis B without delta-agent |
| `B18.2` | 慢性 C 型肝炎 | 慢性病毒性C型肝炎 | Chronic viral hepatitis C |
| `A15.9` | 呼吸道結核病 | 呼吸道結核病 | Respiratory tuberculosis unspecified |
| `Z22.7` | 潛伏結核感染 | 潛伏結核病 | Latent tuberculosis |
| `B59` | 肺囊蟲病 PJP | 肺囊蟲病 | Pneumocystosis |
| `B37.0` | 念珠菌性口炎 | 念珠菌性口炎 | Candidal stomatitis |
| `B37.81` | 念珠菌性食道炎 | 念珠菌性食道炎 | Candidal esophagitis |
| `B58.9` | 弓漿蟲病 | 弓漿蟲病 | Toxoplasmosis, unspecified |
| `B45.1` | 腦隱球菌病 | 腦隱球菌病 | Cerebral cryptococcosis |
| `B25.9` | 巨細胞病毒疾病 CMV | 巨細胞病毒疾病 | Cytomegaloviral disease, unspecified |
| `B25.8` | 其他巨細胞病毒疾病 | 其他巨細胞病毒性疾病 | Other cytomegaloviral diseases |
| `A31.2` | 播散性禽型分枝桿菌複合群感染 DMAC | 擴散性禽-細胞內複合型分枝桿菌症 | Disseminated mycobacterium avium-intracellulare complex (DMAC) |
| `B02.9` | 帶狀疱疹（未伴併發症） | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `C46.9` | 卡波西氏肉瘤 | 卡波西氏肉瘤 | Kaposi's sarcoma, unspecified |
| `C83.30` | 瀰漫性大 B 細胞淋巴瘤（未明示部位） | 未明示部位之瀰漫性巨大B-細胞淋巴瘤 | Diffuse large B-cell lymphoma, unspecified site |
| `E78.5` | 高血脂症 | 高血脂症 | Hyperlipidemia, unspecified |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `N18.9` | 慢性腎臟疾病 CKD | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `M81.0` | 老年性骨質疏鬆（未伴病理性骨折） | 老年性骨質疏鬆症未伴有病理性骨折 | Age-related osteoporosis without current pathological fracture |
| `F32.A` | 憂鬱症 | 非特定性的鬱症 | Depression, unspecified |

#### 慢性 B／C 型肝炎追蹤

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `B18.1` | 慢性 B 型肝炎（未伴 D 型） | 慢性病毒性B型肝炎未伴有D 型肝炎病毒 | Chronic viral hepatitis B without delta-agent |
| `B18.2` | 慢性 C 型肝炎 | 慢性病毒性C型肝炎 | Chronic viral hepatitis C |
| `R74.01` | 肝指數上升（轉胺酶） | 轉胺基脢含量上升 | Elevation of levels of liver transaminase levels |
| `Z22.8` | 其他感染性疾病帶菌者 | 其他感染性疾病之帶菌者 | Carrier of other infectious diseases |
| `Z12.89` | 其他部位腫瘤篩檢 | 來院接受其他部位惡性腫瘤之篩檢 | Encounter for screening for malignant neoplasm of other sites |
| **常見疾病** | | | |
| `K74.60` | 肝硬化 | 肝硬化 | Unspecified cirrhosis of liver |
| `K76.0` | 脂肪肝 | 脂肪肝(變化)，他處未歸類者 | Fatty (change of) liver, not elsewhere classified |
| `K75.81` | 非酒精性脂肪肝炎 NASH | 非酒精性脂肪肝炎 | Nonalcoholic steatohepatitis (NASH) |
| `C22.0` | 肝細胞癌 | 肝細胞癌 | Liver cell carcinoma |
| `K74.00` | 肝纖維化 | 肝纖維化 | Hepatic fibrosis, unspecified |
| `K74.01` | 早期肝纖維化 | 早期肝纖維化 | Hepatic fibrosis, early fibrosis |
| `K76.6` | 門脈高壓 | 門脈高壓 | Portal hypertension |
| `I85.10` | 續發性食道靜脈曲張（未伴出血） | 續發性食道靜脈曲張未伴有出血 | Secondary esophageal varices without bleeding |
| `R18.8` | 其他腹水 | 其他腹水 | Other ascites |
| `K72.10` | 慢性肝衰竭（未伴昏迷） | 慢性肝衰竭未伴有昏迷 | Chronic hepatic failure without coma |
| `D69.6` | 血小板缺乏症 | 血小板缺乏症 | Thrombocytopenia, unspecified |
| `R16.1` | 脾腫大 | 脾腫大，他處未歸類者 | Splenomegaly, not elsewhere classified |
| `R16.0` | 肝腫大 | 肝腫大，他處未歸類者 | Hepatomegaly, not elsewhere classified |
| `B16.9` | 急性 B 型肝炎（未伴 D 型、未伴肝昏迷） | 急性B型病毒性肝炎未併D 型肝炎病毒未伴有肝昏迷 | Acute hepatitis B without delta-agent and without hepatic coma |
| `B17.10` | 急性 C 型肝炎（未伴肝昏迷） | 急性C型病毒性肝炎未伴有肝昏迷 | Acute hepatitis C without hepatic coma |
| `B15.9` | A 型肝炎（未伴肝昏迷） | Ａ型肝炎未伴有肝昏迷 | Hepatitis A without hepatic coma |
| `B18.0` | 慢性 B 型肝炎伴 D 型肝炎 | 慢性病毒性B型肝炎伴有D 型肝炎病毒 | Chronic viral hepatitis B with delta-agent |
| `K70.30` | 酒精性肝硬化（未伴腹水） | 酒精性肝硬化未伴有腹水 | Alcoholic cirrhosis of liver without ascites |
| `K75.4` | 自體免疫性肝炎 | 自體免疫性肝炎 | Autoimmune hepatitis |
| `K71.9` | 毒性肝疾病（藥物性肝損傷） | 毒性肝疾病 | Toxic liver disease, unspecified |
| `K80.20` | 膽囊結石（未伴膽囊炎、未伴阻塞） | 膽囊結石未伴有膽囊炎未伴有阻塞 | Calculus of gallbladder without cholecystitis without obstruction |
| `C22.1` | 肝內膽管癌 | 肝內膽管癌 | Intrahepatic bile duct carcinoma |
| `I85.11` | 續發性食道靜脈曲張伴出血（肝硬化等） | 續發性食道靜脈曲張伴有出血 | Secondary esophageal varices with bleeding |
| `K72.90` | 肝衰竭（未伴昏迷） | 肝衰竭未伴有昏迷 | Hepatic failure, unspecified without coma |
| `K76.7` | 肝腎症候群 | 肝腎徵候群 | Hepatorenal syndrome |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `E78.5` | 高血脂症 | 高血脂症 | Hyperlipidemia, unspecified |
| `R93.2` | 肝膽影像異常 | 肝及膽道診斷性影像異常發現 | Abnormal findings on diagnostic imaging of liver and biliary tract |
| `K76.89` | 其他特定肝疾病 | 其他特定之肝疾病 | Other specified diseases of liver |
| `Z79.899` | 長期藥物治療 | 長期 （現在之）藥物治療 | Other long term (current) drug therapy |

#### 潛伏結核／結核治療追蹤

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R76.11` | 結核菌素試驗陽性 | 無活動性結核病結核菌素皮膚試驗之非明示性反應 | Nonspecific reaction to tuberculin skin test without active tuberculosis |
| `R76.12` | 干擾素釋放試驗陽性 | 無活動性結核病γ干擾素抗原反應的細胞介導免疫測定之非特定性反應 | Nonspecific reaction to cell mediated immunity measurement of gamma interferon antigen response without active tuberculosis |
| `Z20.1` | 結核病接觸暴露 | 結核病之接觸或疑似曝露 | Contact with and (suspected) exposure to tuberculosis |
| `Z11.1` | 呼吸道結核篩檢 | 來院接受呼吸道結核病之篩檢 | Encounter for screening for respiratory tuberculosis |
| **常見疾病** | | | |
| `Z22.7` | 潛伏結核感染 | 潛伏結核病 | Latent tuberculosis |
| `A15.0` | 肺結核 | 肺結核 | Tuberculosis of lung |
| `A15.9` | 呼吸道結核病 | 呼吸道結核病 | Respiratory tuberculosis unspecified |
| `A15.4` | 胸腔內淋巴結結核 | 胸腔內淋巴結結核 | Tuberculosis of intrathoracic lymph nodes |
| `A15.6` | 結核性肋膜炎 | 結核性肋膜炎 | Tuberculous pleurisy |
| `A15.5` | 喉、氣管及支氣管結核 | 喉、氣管及支氣管結核 | Tuberculosis of larynx, trachea and bronchus |
| `A18.2` | 結核性周邊淋巴腺病變 | 結核性周邊淋巴腺病變 | Tuberculous peripheral lymphadenopathy |
| `A18.01` | 脊椎結核 | 脊椎結核病 | Tuberculosis of spine |
| `A18.10` | 生殖泌尿系統結核 | 生殖泌尿系統結核 | Tuberculosis of genitourinary system, unspecified |
| `A18.31` | 結核性腹膜炎 | 結核性腹膜炎 | Tuberculous peritonitis |
| `A18.02` | 其他關節結核性關節炎 | 其他關節之結核性關節炎 | Tuberculous arthritis of other joints |
| `A17.0` | 結核性腦膜炎 | 結核性腦膜炎 | Tuberculous meningitis |
| `A19.9` | 粟粒性結核 | 粟粒狀結核 | Miliary tuberculosis, unspecified |
| `Z86.11` | 結核病個人史 | 結核病之個人史 | Personal history of tuberculosis |
| `A31.0` | 肺部非結核分枝桿菌感染 NTM | 肺分枝桿菌感染 | Pulmonary mycobacterial infection |
| `A31.9` | 分枝桿菌感染 | 分枝桿菌感染 | Mycobacterial infection, unspecified |
| `A31.1` | 皮膚分枝桿菌感染 | 皮膚分枝桿菌感染 | Cutaneous mycobacterial infection |
| `R91.8` | 肺部影像其他異常 | 肺部其他非特定性異常發現 | Other nonspecific abnormal finding of lung field |
| `R04.2` | 咳血 | 咳血 | Hemoptysis |
| `J47.9` | 支氣管擴張症（未併發） | 支氣管擴張症 | Bronchiectasis, uncomplicated |
| `R74.01` | 肝指數上升（轉胺酶） | 轉胺基脢含量上升 | Elevation of levels of liver transaminase levels |
| `K71.9` | 毒性肝疾病（藥物性肝損傷） | 毒性肝疾病 | Toxic liver disease, unspecified |
| `T37.1X5A` | 抗分枝桿菌藥物不良反應（初期照護，附加碼） | 抗分枝桿菌藥物不良反應之初期照護 | Adverse effect of antimycobacterial drugs, initial encounter |
| `G62.0` | 藥物導致之多發神經病變 | 藥物導致之多發神經病變 | Drug-induced polyneuropathy |
| `H53.9` | 視覺障礙 | 視覺障礙 | Unspecified visual disturbance |
| `B20` | HIV 疾病 | 人類免疫不全病毒疾病 | Human immunodeficiency virus [HIV] disease |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `N18.9` | 慢性腎臟疾病 CKD | 慢性腎臟疾病 | Chronic kidney disease, unspecified |

#### 長期抗生素治療／OPAT

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `Z79.2` | 長期使用抗生素 | 長期（現在之）服用抗生素 | Long term (current) use of antibiotics |
| `Z45.2` | 血管導管裝置處置 | 來院接受血管導管裝置之調整及處理 | Encounter for adjustment and management of vascular access device |
| `Z51.81` | 藥物濃度監測 | 來院接受治療性藥物值監測 | Encounter for therapeutic drug level monitoring |
| `Z09` | 治療後追蹤檢查 | 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 | Encounter for follow-up examination after completed treatment for conditions other than malignant neoplasm |
| **常見疾病** | | | |
| `I33.0` | 感染性心內膜炎 IE | 急性及亞急性感染性心內膜炎 | Acute and subacute infective endocarditis |
| `I33.9` | 急性及亞急性心內膜炎（未明示） | 急性及亞急性心內膜炎 | Acute and subacute endocarditis, unspecified |
| `I38` | 心內膜炎（瓣膜未明示） | 未明示瓣膜之心內膜炎 | Endocarditis, valve unspecified |
| `M86.9` | 骨髓炎 | 骨髓炎 | Osteomyelitis, unspecified |
| `M86.60` | 其他慢性骨髓炎（未明示部位） | 未明示部位其他慢性骨髓炎 | Other chronic osteomyelitis, unspecified site |
| `M46.20` | 脊椎骨髓炎（未明示部位） | 未明示部位脊椎骨髓炎 | Osteomyelitis of vertebra, site unspecified |
| `M00.9` | 化膿性關節炎 | 化膿性關節炎 | Pyogenic arthritis, unspecified |
| `T84.50XA` | 人工關節感染（初期照護） | 未明示部位內人工關節所致之感染症及發炎性反應之初期照護 | Infection and inflammatory reaction due to unspecified internal joint prosthesis, initial encounter |
| `T84.50XD` | 人工關節感染（後續照護） | 未明示部位內人工關節所致之感染症及發炎性反應之後續照護 | Infection and inflammatory reaction due to unspecified internal joint prosthesis, subsequent encounter |
| `T84.60XD` | 內固定裝置感染（後續照護） | 未明示部位之內固定裝置所致之感染症與發炎性反應之後續照護 | Infection and inflammatory reaction due to internal fixation device of unspecified site, subsequent encounter |
| `T80.211A` | 中心靜脈導管血流感染（初期照護） | 中心靜脈導管所致血流感染之初期照護 | Bloodstream infection due to central venous catheter, initial encounter |
| `T80.211D` | 中心靜脈導管血流感染（後續照護） | 中心靜脈導管所致血流感染之後續照護 | Bloodstream infection due to central venous catheter, subsequent encounter |
| `T80.219A` | 中心靜脈導管所致感染（初期照護） | 中心靜脈導管所致感染之初期照護 | Unspecified infection due to central venous catheter, initial encounter |
| `T82.7XXA` | 心臟血管裝置感染（初期照護） | 其他心臟及血管裝置植入及移植物所致感染及發炎反應之初期照護 | Infection and inflammatory reaction due to other cardiac and vascular devices, implants and grafts, initial encounter |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `K75.0` | 肝膿瘍 | 肝膿瘍 | Abscess of liver |
| `K65.1` | 腹膜膿瘍 | 腹膜膿瘍 | Peritoneal abscess |
| `N15.1` | 腎及腎周圍膿瘍 | 腎及腎周圍膿瘍 | Renal and perinephric abscess |
| `J86.9` | 肺積膿（未伴瘻管） | 肺積膿未伴有瘻管 | Pyothorax without fistula |
| `G06.0` | 顱內膿瘍及肉芽腫 | 顱內膿瘍及肉芽腫 | Intracranial abscess and granuloma |
| `G00.9` | 細菌性腦膜炎 | 細菌性腦膜炎 | Bacterial meningitis, unspecified |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `A41.9` | 敗血症 | 敗血症，未明示病原體 | Sepsis, unspecified organism |
| `A41.02` | MRSA 敗血症 | 抗甲氧西林（抗藥性）金黃色葡萄球菌所致敗血症 | Sepsis due to Methicillin resistant Staphylococcus aureus |
| `A41.01` | MSSA 敗血症 | 甲氧西林敏感性金黃色葡萄球菌所致敗血症 | Sepsis due to Methicillin susceptible Staphylococcus aureus |
| `A41.51` | 大腸桿菌敗血症 | 大腸桿菌性敗血症 | Sepsis due to Escherichia coli [E. coli] |
| `A04.72` | 艱難梭菌腸道感染 CDI（非復發型） | 艱難梭菌所致腸道感染，未明示為復發型 | Enterocolitis due to Clostridium difficile, not specified as recurrent |
| `R74.01` | 肝指數上升（轉胺酶） | 轉胺基脢含量上升 | Elevation of levels of liver transaminase levels |
| `N17.9` | 急性腎衰竭（AKI） | 急性腎衰竭 | Acute kidney failure, unspecified |
| `Z16.24` | 多重抗生素抗藥性（附加碼） | 多種抗生素之抗藥性 | Resistance to multiple antibiotics |
| `Z16.11` | 青黴素抗藥性（附加碼） | 青黴素之抗藥性 | Resistance to penicillins |
| `B95.62` | MRSA 為他處疾病之病因（附加碼） | 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病 | Methicillin resistant Staphylococcus aureus infection as the cause of diseases classified elsewhere |
| `B95.61` | MSSA 為他處疾病之病因（附加碼） | 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病 | Methicillin susceptible Staphylococcus aureus infection as the cause of diseases classified elsewhere |
| `Z22.322` | MRSA 帶菌者 | 金黃色葡萄球菌青黴素抗藥性之帶菌者或疑似帶菌者 | Carrier or suspected carrier of Methicillin resistant Staphylococcus aureus |
| `A04.71` | 艱難梭菌腸道感染 CDI（復發型） | 艱難梭菌所致腸道感染，復發型 | Enterocolitis due to Clostridium difficile, recurrent |
| `T36.0X5A` | 盤尼西林類抗生素不良反應（初期照護，附加碼） | 盤尼西林抗生素不良反應之初期照護 | Adverse effect of penicillins, initial encounter |
| `T36.8X5A` | 其他全身性抗生素不良反應（初期照護，附加碼） | 其他系統性抗生素不良反應之初期照護 | Adverse effect of other systemic antibiotics, initial encounter |
| `T82.6XXA` | 人工心臟瓣膜感染 PVE（初期照護） | 心臟瓣膜裝置物所致感染及發炎反應之初期照護 | Infection and inflammatory reaction due to cardiac valve prosthesis, initial encounter |
| `A41.52` | 綠膿桿菌敗血症 | 綠膿桿菌所致之敗血症 | Sepsis due to Pseudomonas |

#### 骨與關節感染追蹤

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `M25.40` | 關節滲液 | 關節滲液 | Effusion, unspecified joint |
| `M25.50` | 關節痛 | 關節痛 | Pain in unspecified joint |
| `Z09` | 治療後追蹤檢查 | 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 | Encounter for follow-up examination after completed treatment for conditions other than malignant neoplasm |
| **常見疾病** | | | |
| `M86.9` | 骨髓炎 | 骨髓炎 | Osteomyelitis, unspecified |
| `M86.10` | 急性骨髓炎 | 未明示部位其他急性骨髓炎 | Other acute osteomyelitis, unspecified site |
| `M86.20` | 亞急性骨髓炎（未明示部位） | 未明示部位亞急性骨髓炎 | Subacute osteomyelitis, unspecified site |
| `M86.60` | 其他慢性骨髓炎（未明示部位） | 未明示部位其他慢性骨髓炎 | Other chronic osteomyelitis, unspecified site |
| `M00.9` | 化膿性關節炎 | 化膿性關節炎 | Pyogenic arthritis, unspecified |
| `M00.00` | 葡萄球菌性關節炎 | 未明示側性關節葡萄球菌性關節炎 | Staphylococcal arthritis, unspecified joint |
| `T84.50XA` | 人工關節感染（初期照護） | 未明示部位內人工關節所致之感染症及發炎性反應之初期照護 | Infection and inflammatory reaction due to unspecified internal joint prosthesis, initial encounter |
| `T84.50XD` | 人工關節感染（後續照護） | 未明示部位內人工關節所致之感染症及發炎性反應之後續照護 | Infection and inflammatory reaction due to unspecified internal joint prosthesis, subsequent encounter |
| `T84.60XA` | 內固定裝置感染（初期照護） | 未明示部位之內固定裝置所致之感染症與發炎性反應之初期照護 | Infection and inflammatory reaction due to internal fixation device of unspecified site, initial encounter |
| `T84.60XD` | 內固定裝置感染（後續照護） | 未明示部位之內固定裝置所致之感染症與發炎性反應之後續照護 | Infection and inflammatory reaction due to internal fixation device of unspecified site, subsequent encounter |
| `M46.20` | 脊椎骨髓炎（未明示部位） | 未明示部位脊椎骨髓炎 | Osteomyelitis of vertebra, site unspecified |
| `M46.26` | 腰椎脊椎骨髓炎 | 腰椎脊椎骨髓炎 | Osteomyelitis of vertebra, lumbar region |
| `M46.40` | 椎間盤炎 | 未明示部位椎間盤炎 | Discitis, unspecified, site unspecified |
| `A18.01` | 脊椎結核 | 脊椎結核病 | Tuberculosis of spine |
| `A18.02` | 其他關節結核性關節炎 | 其他關節之結核性關節炎 | Tuberculous arthritis of other joints |
| `M71.10` | 其他感染性滑囊炎（未明示部位） | 未明示部位之其他感染性滑囊炎 | Other infective bursitis, unspecified site |
| `L03.119` | 肢體蜂窩組織炎（未明示部位） | 肢體未明示部位蜂窩組織炎 | Cellulitis of unspecified part of limb |
| `L02.419` | 肢體皮膚膿瘍 | 未明示肢體皮膚膿瘍 | Cutaneous abscess of limb, unspecified |
| `E11.621` | 第二型糖尿病伴足部潰瘍 | 第二型糖尿病，伴有足部潰瘍 | Type 2 diabetes mellitus with foot ulcer |
| `L97.509` | 足部慢性潰瘍（非壓迫性、未明示嚴重度） | 未明示側性足部其他部位非壓迫性慢性潰瘍，未明示嚴重程度 | Non-pressure chronic ulcer of other part of unspecified foot with unspecified severity |
| `M10.9` | 痛風 | 痛風 | Gout, unspecified |
| `M06.9` | 類風濕性關節炎 RA | 類風濕性關節炎 | Rheumatoid arthritis, unspecified |
| `M19.90` | 骨關節炎（未明示部位） | 未明示部位骨關節炎 | Unspecified osteoarthritis, unspecified site |
| `M65.9` | 滑膜炎及腱鞘炎 | 其他滑膜炎及腱鞘炎 | Synovitis and tenosynovitis, unspecified |
| `B95.61` | MSSA 為他處疾病之病因（附加碼） | 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病 | Methicillin susceptible Staphylococcus aureus infection as the cause of diseases classified elsewhere |
| `B95.62` | MRSA 為他處疾病之病因（附加碼） | 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病 | Methicillin resistant Staphylococcus aureus infection as the cause of diseases classified elsewhere |
| `Z16.24` | 多重抗生素抗藥性（附加碼） | 多種抗生素之抗藥性 | Resistance to multiple antibiotics |
| `Z96.649` | 存有人工髖關節（狀態附加碼） | 存有人工髖關節 | Presence of unspecified artificial hip joint |
| `Z96.659` | 存有人工膝關節（狀態附加碼） | 存有人工膝關節 | Presence of unspecified artificial knee joint |

#### 疫苗接種與預防

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `Z23` | 預防接種 | 來院接受疫苗接種 | Encounter for immunization |
| `Z28.9` | 未接種疫苗 | 因未明示原因而未執行疫苗接種 | Immunization not carried out for unspecified reason |
| `Z20.828` | 病毒傳染病接觸暴露 | 病毒傳染性疾病之接觸和疑似曝露 | Contact with and (suspected) exposure to other viral communicable diseases |
| `Z20.5` | 病毒性肝炎接觸暴露 | 病毒性肝炎之接觸和疑似曝露 | Contact with and (suspected) exposure to viral hepatitis |
| `Z11.3` | 性傳染病篩檢 | 來院接受主要經由性傳播模式感染之篩檢 | Encounter for screening for infections with a predominantly sexual mode of transmission |
| **常見疾病** | | | |
| `A63.0` | 肛門生殖器疣 | 肛門生殖器疣 | Anogenital (venereal) warts |
| `A53.9` | 梅毒 | 梅毒 | Syphilis, unspecified |
| `B20` | HIV 疾病 | 人類免疫不全病毒疾病 | Human immunodeficiency virus [HIV] disease |
| `R50.83` | 疫苗接種後發燒 | 疫苗接種後發燒 | Postvaccination fever |
| `T88.1XXA` | 疫苗接種後其他併發症（初期照護） | 免疫接種後其他併發症，他處未歸類之初期照護 | Other complications following immunization, not elsewhere classified, initial encounter |
| `T80.52XA` | 疫苗接種後過敏性休克（初期照護） | 接種疫苗所致過敏性休克反應之初期照護 | Anaphylactic reaction due to vaccination, initial encounter |
| `Z28.03` | 因免疫功能不全未接種 | 因病患之免疫功能不全而未執行疫苗接種 | Immunization not carried out because of immune compromised state of patient |
| `Z28.04` | 因對疫苗成分過敏未接種 | 因病患對疫苗或成份過敏而未執行疫苗接種 | Immunization not carried out because of patient allergy to vaccine or component |
| `Z28.20` | 因病人其他未明示原因決定不接種 | 因其他未明示原因而使病患決定不執行疫苗接種 | Immunization not carried out because of patient decision for unspecified reason |
| `Z28.82` | 因照顧者拒絕未接種 | 因為照顧者拒絕而未執行疫苗接種 | Immunization not carried out because of caregiver refusal |
| `J44.9` | 慢性阻塞性肺病 COPD | 慢性阻塞性肺病 | Chronic obstructive pulmonary disease, unspecified |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `N18.5` | 第五期慢性腎臟疾病 | 第五期慢性腎臟疾病 | Chronic kidney disease, stage 5 |
| `N18.6` | 末期腎病 ESRD | 末期腎疾病 | End stage renal disease |
| `K74.60` | 肝硬化 | 肝硬化 | Unspecified cirrhosis of liver |
| `Z90.81` | 無脾（脾臟切除後） | 脾臟後天性缺損 | Acquired absence of spleen |
| `D89.9` | 涉及免疫機轉之疾患 | 涉及免疫機轉之疾患 | Disorder involving the immune mechanism, unspecified |
| `Z79.52` | 長期使用全身性類固醇 | 長期（現在之）全身性類固醇 | Long term (current) use of systemic steroids |
| `Z51.11` | 來院接受抗腫瘤化學治療 | 來院接受抗腫瘤化學治療 | Encounter for antineoplastic chemotherapy |
| `Z94.0` | 腎臟移植狀態 | 腎臟移植狀態 | Kidney transplant status |
| `Z94.4` | 肝臟移植狀態 | 肝臟移植狀態 | Liver transplant status |
| `Z86.19` | 其他感染症個人史 | 其他感染症和寄生蟲病之個人史 | Personal history of other infectious and parasitic diseases |

#### 旅遊醫學／境外移入發燒

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R50.9` | 發燒 | 發燒 | Fever, unspecified |
| `Z71.89` | 其他特定諮詢（旅遊） | 其他特定之諮詢 | Other specified counseling |
| `Z11.8` | 其他感染症篩檢 | 來院接受其他感染及寄生蟲疾病之篩檢 | Encounter for screening for other infectious and parasitic diseases |
| **常見疾病** | | | |
| `A90` | 登革熱 | 登革熱[典型登革熱] | Dengue fever [classical dengue] |
| `A91` | 登革出血熱 | 登革出血熱 | Dengue hemorrhagic fever |
| `B54` | 瘧疾 | 瘧疾 | Unspecified malaria |
| `B50.9` | 惡性瘧 | 惡性瘧 | Plasmodium falciparum malaria, unspecified |
| `A92.0` | 屈公病（Chikungunya） | 奇孔古尼亞病毒疾病 | Chikungunya virus disease |
| `A92.5` | 茲卡病毒感染 | 茲卡病毒疾病 | Zika virus disease |
| `A75.3` | 恙蟲病 | 恙蟲立克次體所致之斑疹傷寒熱 | Typhus fever due to Rickettsia tsutsugamushi |
| `A27.9` | 鉤端螺旋體病 | 細鉤端螺旋體病 | Leptospirosis, unspecified |
| `A27.0` | 黃疸出血性鉤端螺旋體病 | 黃疸出血性鉤端螺旋體病 | Leptospirosis icterohemorrhagica |
| `A01.00` | 傷寒 | 傷寒 | Typhoid fever, unspecified |
| `A01.4` | 副傷寒 | 副傷寒 | Paratyphoid fever, unspecified |
| `A75.9` | 斑疹傷寒 | 斑疹傷寒熱 | Typhus fever, unspecified |
| `A78` | Q 熱病 | Q熱病 | Q fever |
| `A02.0` | 沙門桿菌腸炎 | 沙門桿菌腸炎 | Salmonella enteritis |
| `A03.9` | 志賀桿菌病 | 志賀桿菌病 | Shigellosis, unspecified |
| `A04.5` | 彎曲桿菌腸炎 | 彎曲桿菌腸炎 | Campylobacter enteritis |
| `A06.0` | 急性阿米巴痢疾 | 急性阿米巴性痢疾 | Acute amebic dysentery |
| `A07.1` | 梨形鞭毛蟲病 | 梨形鞭毛蟲病[腸梨形蟲病] | Giardiasis [lambliasis] |
| `A08.11` | 諾羅病毒急性胃腸炎 | 類諾瓦克病毒所致之急性胃腸病變 | Acute gastroenteropathy due to Norwalk agent |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `J11.1` | 流感（伴其他呼吸道表徵） | 未確認流感病毒所致流行性感冒併其他呼吸道表徵 | Influenza due to unidentified influenza virus with other respiratory manifestations |
| `B05.9` | 麻疹（未伴併發症） | 麻疹未伴有併發症 | Measles without complication |
| `A83.0` | 日本腦炎 | 日本腦炎 | Japanese encephalitis |
| `B15.9` | A 型肝炎（未伴肝昏迷） | Ａ型肝炎未伴有肝昏迷 | Hepatitis A without hepatic coma |
| `B78.9` | 糞小桿線蟲病 | 糞桿線蟲病 | Strongyloidiasis, unspecified |
| `A69.20` | 萊姆病 | 萊姆病 | Lyme disease, unspecified |
| `A15.9` | 呼吸道結核病 | 呼吸道結核病 | Respiratory tuberculosis unspecified |

### 神經／精神

#### 頭痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R51.9` | 頭痛 | 頭痛 | Headache, unspecified |
| **常見疾病** | | | |
| `G44.209` | 緊縮型頭痛 | 緊縮型頭痛，未明確定義型態，非頑固性 | Tension-type headache, unspecified, not intractable |
| `G43.909` | 偏頭痛 | 偏頭痛，未明確定義型態，非頑固性，未伴有偏頭痛重積狀態 | Migraine, unspecified, not intractable, without status migrainosus |
| `G43.109` | 預兆偏頭痛（非頑固性、未伴重積） | 預兆偏頭痛，非頑固性，未伴有偏頭痛重積狀態 | Migraine with aura, not intractable, without status migrainosus |
| `G43.709` | 慢性無預兆偏頭痛（非頑固性） | 慢性無預兆偏頭痛，非頑固性，未伴有偏頭痛重積狀態 | Chronic migraine without aura, not intractable, without status migrainosus |
| `G44.009` | 叢發性頭痛（非頑固性） | 叢發性頭痛症候群，未明確定義型態，非頑固性 | Cluster headache syndrome, unspecified, not intractable |
| `J01.90` | 急性鼻竇炎 | 急性鼻竇炎 | Acute sinusitis, unspecified |
| `J32.9` | 慢性鼻竇炎 | 慢性鼻竇炎 | Chronic sinusitis, unspecified |
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `M54.2` | 頸椎痛 | 頸椎痛 | Cervicalgia |
| `G50.0` | 三叉神經痛 | 三叉神經痛 | Trigeminal neuralgia |
| `B02.22` | 疱疹後三叉神經痛 | 疱疹後三叉神經痛 | Postherpetic trigeminal neuralgia |
| `G44.40` | 藥物導致之頭痛（非頑固性） | 藥物導致之頭痛，他處未歸類者，非頑固性 | Drug-induced headache, not elsewhere classified, not intractable |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| `F32.A` | 憂鬱症 | 非特定性的鬱症 | Depression, unspecified |
| `G47.33` | 阻塞型睡眠呼吸中止 OSA | 阻塞性睡眠呼吸中止 (成人) (小兒) | Obstructive sleep apnea (adult) (pediatric) |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `G44.1` | 血管性頭痛 | 血管性頭痛，他處未歸類者 | Vascular headache, not elsewhere classified |
| `R51.0` | 姿位性頭痛 | 伴有姿位性頭痛，他處未分類 | Headache with orthostatic component, not elsewhere classified |
| `H40.219` | 急性隅角閉鎖性青光眼（未明示側） | 未明示側性急性隅角閉鎖性青光眼 | Acute angle-closure glaucoma, unspecified eye |
| `S06.0X0D` | 腦震盪（未伴意識喪失，後續照護） | 腦震盪，未伴有意識喪失之後續照護 | Concussion without loss of consciousness, subsequent encounter |
| `S06.5X0D` | 創傷性硬腦膜下出血（未伴意識喪失，後續照護） | 創傷性硬腦膜下出血，未伴有意識喪失之後續照護 | Traumatic subdural hemorrhage without loss of consciousness, subsequent encounter |

#### 頭暈／眩暈

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R42` | 頭暈及目眩 | 頭暈及目眩 | Dizziness and giddiness |
| **常見疾病** | | | |
| `H81.10` | 良性陣發性眩暈 BPPV（未明示側） | 未明示側性之良性陣發性眩暈 | Benign paroxysmal vertigo, unspecified ear |
| `H81.20` | 前庭神經元炎 | 未明示側性之前庭神經元炎 | Vestibular neuronitis, unspecified ear |
| `H81.09` | 梅尼爾氏病（未明示側） | 未明示側性之梅尼爾氏病 | Meniere's disease, unspecified ear |
| `H81.399` | 其他末梢性眩暈（未明示側） | 未明示側性之其他末梢性眩暈 | Other peripheral vertigo, unspecified ear |
| `H83.09` | 迷路炎（未明示側） | 未明示側性之迷路炎 | Labyrinthitis, unspecified ear |
| `I95.1` | 姿勢性低血壓 | 直立性低血壓 | Orthostatic hypotension |
| `I95.9` | 低血壓 | 低血壓 | Hypotension, unspecified |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `E16.2` | 低血糖 | 低血糖 | Hypoglycemia, unspecified |
| `H61.20` | 耳垢嵌塞（未明示側） | 未明示側性耳垢嵌塞 | Impacted cerumen, unspecified ear |
| `H66.90` | 中耳炎（未明示側） | 未明示側性中耳炎 | Otitis media, unspecified, unspecified ear |
| `G45.9` | 短暫性腦缺血發作 TIA | 短暫性大腦缺血發作 | Transient cerebral ischemic attack, unspecified |
| `I48.91` | 心房顫動 | 心房顫動 | Unspecified atrial fibrillation |
| `I49.9` | 心律不整 | 心臟節律不整 | Cardiac arrhythmia, unspecified |
| `R55` | 暈厥及虛脫 | 暈厥及虛脫 | Syncope and collapse |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| `R26.81` | 站立不穩 | 站立不穩 | Unsteadiness on feet |
| `G43.909` | 偏頭痛 | 偏頭痛，未明確定義型態，非頑固性，未伴有偏頭痛重積狀態 | Migraine, unspecified, not intractable, without status migrainosus |
| `H91.20` | 突發性自發性聽力喪失（未明示側） | 未明示側性之突發性自發性聽力喪失 | Sudden idiopathic hearing loss, unspecified ear |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |

#### 失眠／情緒

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `G47.00` | 失眠 | 非特定的失眠症 | Insomnia, unspecified |
| `R45.0` | 神經過敏 | 神經過敏 | Nervousness |
| **常見疾病** | | | |
| `F32.A` | 憂鬱症 | 非特定性的鬱症 | Depression, unspecified |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| `F51.01` | 原發性失眠 | 原發性失眠症 | Primary insomnia |
| `G47.09` | 其他失眠症 | 其他失眠症 | Other insomnia |
| `G47.33` | 阻塞型睡眠呼吸中止 OSA | 阻塞性睡眠呼吸中止 (成人) (小兒) | Obstructive sleep apnea (adult) (pediatric) |
| `F41.1` | 廣泛性焦慮症 | 廣泛性焦慮症 | Generalized anxiety disorder |
| `F43.21` | 適應障礙伴憂鬱情緒 | 有憂鬱情緒的適應障礙症 | Adjustment disorder with depressed mood |
| `F43.22` | 適應障礙伴焦慮 | 有焦慮的適應障礙症 | Adjustment disorder with anxiety |
| `F33.9` | 鬱症（復發型） | 非特定的鬱症，復發 | Major depressive disorder, recurrent, unspecified |
| `F41.0` | 恐慌症 | 特定場所畏懼症的恐慌症 | Panic disorder [episodic paroxysmal anxiety] |
| `G25.81` | 腿不寧症候群 | 腿不寧症候群 | Restless legs syndrome |
| `G47.10` | 多眠症 | 非特定的多眠症 | Hypersomnia, unspecified |
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `E05.90` | 甲狀腺毒症／甲亢（未伴危象或風暴） | 未明示之甲狀腺毒症，未伴有甲狀腺毒性危象或風暴 | Thyrotoxicosis, unspecified without thyrotoxic crisis or storm |
| `F31.9` | 雙相情緒障礙症 | 非特定的雙相情緒障礙症 | Bipolar disorder, unspecified |
| `F43.10` | 創傷後壓力症 PTSD | 創傷後壓力症，非特定 | Post-traumatic stress disorder, unspecified |
| `F17.200` | 尼古丁依賴（無併發症） | 非特定的尼古丁依賴，無併發症 | Nicotine dependence, unspecified, uncomplicated |
| `F10.20` | 酒精依賴（無併發症） | 酒精依賴，無併發症 | Alcohol dependence, uncomplicated |
| `F45.9` | 擬身體障礙症 | 非特定的擬身體障礙症 | Somatoform disorder, unspecified |
| `R45.4` | 激躁及氣憤 | 激躁及氣憤 | Irritability and anger |
| `G30.9` | 阿茲海默氏病 | 非特定的阿茲海默氏病 | Alzheimer's disease, unspecified |
| `F03.90` | 失智症（未明示嚴重度、無行為障礙） | 非特定的失智症，未明示嚴重度，無行為、精神病症、情緒困擾及焦慮症狀 | Unspecified dementia, unspecified severity, without behavioral disturbance, psychotic disturbance, mood disturbance, and anxiety |
| `R41.3` | 其他失憶症 | 其他失憶症 | Other amnesia |
| `G20` | 巴金森氏症 | 巴金森氏症 | Parkinson's disease |
| `M79.7` | 纖維肌痛 | 纖維肌痛 | Fibromyalgia |

### 眼耳鼻喉

#### 紅眼／眼部不適

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `H57.10` | 眼痛 | 未明示側性眼睛疼痛 | Ocular pain, unspecified eye |
| `H04.219` | 溢淚 | 未明示側性之淚液分泌過多造成的溢淚 | Epiphora due to excess lacrimation, unspecified lacrimal gland |
| `H57.9` | 眼部不適 | 眼睛及附屬器官疾患 | Unspecified disorder of eye and adnexa |
| **常見疾病** | | | |
| `H10.9` | 結膜炎 | 結膜炎 | Unspecified conjunctivitis |
| `H10.30` | 急性結膜炎（未明示側） | 未明示側性之急性結膜炎 | Unspecified acute conjunctivitis, unspecified eye |
| `H10.10` | 急性過敏性結膜炎 | 未明示側性之急性過敏性結膜炎 | Acute atopic conjunctivitis, unspecified eye |
| `H10.409` | 慢性結膜炎 | 未明示側性之慢性結膜炎 | Unspecified chronic conjunctivitis, unspecified eye |
| `H10.45` | 其他慢性過敏性結膜炎 | 其他慢性過敏性結膜炎 | Other chronic allergic conjunctivitis |
| `B30.9` | 病毒性結膜炎 | 病毒性結膜炎 | Viral conjunctivitis, unspecified |
| `B30.1` | 腺病毒結膜炎 | 腺病毒所致之結膜炎 | Conjunctivitis due to adenovirus |
| `H04.129` | 乾眼症 | 未明示側性之淚腺乾眼症 | Dry eye syndrome of unspecified lacrimal gland |
| `H01.009` | 眼瞼緣炎 | 未明示左側、右側眼及上或下之眼瞼緣炎 | Unspecified blepharitis unspecified eye, unspecified eyelid |
| `H00.019` | 眼瞼外麥粒腫（針眼） | 未明示左側、右側眼之眼瞼外麥粒腫，未明示上或下眼瞼 | Hordeolum externum unspecified eye, unspecified eyelid |
| `H00.19` | 霰粒腫 | 未明示左側、右側眼及上或下眼瞼霰粒腫 | Chalazion unspecified eye, unspecified eyelid |
| `H11.30` | 結膜出血（未明示側） | 未明示側性之結膜出血 | Conjunctival hemorrhage, unspecified eye |
| `H11.009` | 翼狀贅肉（未明示側） | 未明示側性之翼狀贅肉 | Unspecified pterygium of unspecified eye |
| `H16.9` | 角膜炎 | 角膜炎 | Unspecified keratitis |
| `H16.009` | 角膜潰瘍（未明示側） | 未明示側性之角膜潰瘍 | Unspecified corneal ulcer, unspecified eye |
| `H20.9` | 虹膜睫狀體炎 | 虹膜睫狀體炎 | Unspecified iridocyclitis |
| `H40.219` | 急性隅角閉鎖性青光眼（未明示側） | 未明示側性急性隅角閉鎖性青光眼 | Acute angle-closure glaucoma, unspecified eye |
| `H25.9` | 老年性白內障 | 老年性白內障 | Unspecified age-related cataract |
| `H35.30` | 黃斑部退化 | 黃斑部退化 | Unspecified macular degeneration |
| `E11.319` | 第二型糖尿病伴視網膜病變（未伴黃斑部水腫） | 第二型糖尿病，伴有糖尿病的視網膜病變，未伴有黃斑部水腫 | Type 2 diabetes mellitus with unspecified diabetic retinopathy without macular edema |
| `B02.30` | 帶狀疱疹眼病 | 帶狀疱疹眼病 | Zoster ocular disease, unspecified |
| `B02.33` | 帶狀疱疹性角膜炎 | 帶狀疱疹性角膜炎 | Zoster keratitis |
| `B02.31` | 帶狀疱疹性結膜炎 | 帶狀疱疹性結膜炎 | Zoster conjunctivitis |
| `H43.399` | 其他玻璃體混濁（飛蚊、未明示側） | 未明示側性其他玻璃體混濁 | Other vitreous opacities, unspecified eye |
| `H52.4` | 老花眼 | 老花眼 | Presbyopia |

#### 耳痛／耳鳴

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `H92.09` | 耳痛 | 未明示側性之耳痛 | Otalgia, unspecified ear |
| `H93.19` | 耳鳴 | 未明示側性之耳鳴 | Tinnitus, unspecified ear |
| `H92.10` | 耳漏 | 未明示側性之耳漏 | Otorrhea, unspecified ear |
| `H91.90` | 聽力障礙 | 未明示側性之聽障 | Unspecified hearing loss, unspecified ear |
| **常見疾病** | | | |
| `H66.90` | 中耳炎（未明示側） | 未明示側性中耳炎 | Otitis media, unspecified, unspecified ear |
| `H65.90` | 非化膿性中耳炎（未明示側） | 未明示側性非化膿性中耳炎 | Unspecified nonsuppurative otitis media, unspecified ear |
| `H65.199` | 其他急性非化膿性中耳炎（未明示側） | 未明示側性其他急性非化膿性中耳炎 | Other acute nonsuppurative otitis media, unspecified ear |
| `H65.20` | 慢性漿液性中耳炎（未明示側） | 未明示側性慢性漿液性中耳炎 | Chronic serous otitis media, unspecified ear |
| `H60.90` | 外耳炎 | 未明示側性外耳炎 | Unspecified otitis externa, unspecified ear |
| `H60.509` | 急性非感染性外耳炎（未明示側） | 未明示側性急性非感染性外耳炎 | Unspecified acute noninfective otitis externa, unspecified ear |
| `H60.399` | 其他傳染性外耳炎（未明示側） | 未明示側性其他傳染性外耳炎 | Other infective otitis externa, unspecified ear |
| `H61.20` | 耳垢嵌塞（未明示側） | 未明示側性耳垢嵌塞 | Impacted cerumen, unspecified ear |
| `H69.80` | 耳咽管功能障礙 | 未明示側性其他特定之耳咽管疾患 | Other specified disorders of Eustachian tube, unspecified ear |
| `H72.90` | 鼓膜穿孔（未明示側） | 未明示側性之鼓膜穿孔 | Unspecified perforation of tympanic membrane, unspecified ear |
| `H90.2` | 傳導性聽力損失 | 傳導性聽力損失 | Conductive hearing loss, unspecified |
| `H90.5` | 感音神經性聽力損失 | 感音神經性聽力損失 | Unspecified sensorineural hearing loss |
| `H91.20` | 突發性自發性聽力喪失（未明示側） | 未明示側性之突發性自發性聽力喪失 | Sudden idiopathic hearing loss, unspecified ear |
| `H81.09` | 梅尼爾氏病（未明示側） | 未明示側性之梅尼爾氏病 | Meniere's disease, unspecified ear |
| `B02.21` | 疱疹後膝狀神經節炎（Ramsay Hunt） | 疱疹後膝狀神經節炎 | Postherpetic geniculate ganglionitis |
| `M26.629` | 顳頷關節痛（未明示側） | 未明示側性顳頷關節痛 | Arthralgia of temporomandibular joint, unspecified side |
| `J02.9` | 急性咽炎 | 急性咽炎 | Acute pharyngitis, unspecified |
| `J35.01` | 慢性扁桃腺炎 | 慢性扁桃腺炎 | Chronic tonsillitis |
| `C11.9` | 鼻咽惡性腫瘤 | 鼻咽惡性腫瘤 | Malignant neoplasm of nasopharynx, unspecified |

#### 鼻塞／鼻竇

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R09.81` | 鼻塞 | 鼻塞 | Nasal congestion |
| `R04.0` | 鼻出血 | 鼻出血 | Epistaxis |
| `R43.0` | 嗅覺喪失 | 嗅覺喪失 | Anosmia |
| **常見疾病** | | | |
| `J30.9` | 過敏性鼻炎 | 過敏性鼻炎 | Allergic rhinitis, unspecified |
| `J00` | 急性鼻咽炎（感冒） | 急性鼻咽炎（感冒） | Acute nasopharyngitis [common cold] |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `J01.90` | 急性鼻竇炎 | 急性鼻竇炎 | Acute sinusitis, unspecified |
| `J32.9` | 慢性鼻竇炎 | 慢性鼻竇炎 | Chronic sinusitis, unspecified |
| `J31.0` | 慢性鼻炎 | 慢性鼻炎 | Chronic rhinitis |
| `J30.1` | 花粉所致過敏性鼻炎 | 花粉所致過敏性鼻炎 | Allergic rhinitis due to pollen |
| `J30.89` | 其他過敏性鼻炎 | 其他過敏性鼻炎 | Other allergic rhinitis |
| `J30.0` | 血管舒縮性鼻炎 | 血管舒縮性鼻炎 | Vasomotor rhinitis |
| `J01.00` | 急性上頷竇炎 | 急性上頷竇炎 | Acute maxillary sinusitis, unspecified |
| `J32.0` | 慢性上頷竇炎 | 慢性上頷竇炎 | Chronic maxillary sinusitis |
| `J31.1` | 慢性鼻咽炎 | 慢性鼻咽炎 | Chronic nasopharyngitis |
| `J33.9` | 鼻息肉 | 鼻息肉 | Nasal polyp, unspecified |
| `J34.2` | 鼻中隔彎曲 | 鼻中隔彎曲 | Deviated nasal septum |
| `J34.3` | 鼻甲肥大 | 鼻甲肥大 | Hypertrophy of nasal turbinates |
| `J34.89` | 其他特定鼻及鼻竇疾患 | 其他特定鼻及鼻竇疾患 | Other specified disorders of nose and nasal sinuses |
| `R09.82` | 鼻涕倒流 | 鼻涕倒流 | Postnasal drip |
| `R43.1` | 嗅覺倒錯 | 嗅覺倒錯 | Parosmia |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `G47.33` | 阻塞型睡眠呼吸中止 OSA | 阻塞性睡眠呼吸中止 (成人) (小兒) | Obstructive sleep apnea (adult) (pediatric) |
| `C11.9` | 鼻咽惡性腫瘤 | 鼻咽惡性腫瘤 | Malignant neoplasm of nasopharynx, unspecified |

#### 喉嚨痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R07.0` | 喉嚨痛 | 喉嚨痛 | Pain in throat |
| **常見疾病** | | | |
| `J02.9` | 急性咽炎 | 急性咽炎 | Acute pharyngitis, unspecified |
| `J02.0` | 鏈球菌性咽炎 | 鏈球菌性咽炎 | Streptococcal pharyngitis |
| `J03.90` | 急性扁桃腺炎 | 急性扁桃腺炎 | Acute tonsillitis, unspecified |
| `J03.00` | 急性鏈球菌扁桃腺炎 | 急性鏈球菌扁桃腺炎 | Acute streptococcal tonsillitis, unspecified |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `J00` | 急性鼻咽炎（感冒） | 急性鼻咽炎（感冒） | Acute nasopharyngitis [common cold] |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `J11.1` | 流感（伴其他呼吸道表徵） | 未確認流感病毒所致流行性感冒併其他呼吸道表徵 | Influenza due to unidentified influenza virus with other respiratory manifestations |
| `J04.0` | 急性喉炎 | 急性喉炎 | Acute laryngitis |
| `J04.10` | 急性氣管炎（未伴阻塞） | 急性氣管炎，未伴有阻塞 | Acute tracheitis without obstruction |
| `J31.2` | 慢性咽炎 | 慢性咽炎 | Chronic pharyngitis |
| `J35.01` | 慢性扁桃腺炎 | 慢性扁桃腺炎 | Chronic tonsillitis |
| `K21.9` | 胃食道逆流 GERD（未伴食道炎） | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `B27.90` | 傳染性單核球增多症（未伴併發症） | 傳染性單核球過多症，未伴有併發症 | Infectious mononucleosis, unspecified without complication |
| `B00.2` | 疱疹病毒性齦口炎及咽扁桃體炎 | 疱疹病毒性齦口炎及咽扁桃體炎 | Herpesviral gingivostomatitis and pharyngotonsillitis |
| `B08.5` | 腸病毒性囊泡性咽炎（疱疹性咽峽炎） | 腸病毒性囊泡性咽炎 | Enteroviral vesicular pharyngitis |
| `B37.0` | 念珠菌性口炎 | 念珠菌性口炎 | Candidal stomatitis |
| `A54.5` | 淋病雙球菌性咽炎 | 淋病雙球菌性咽炎 | Gonococcal pharyngitis |
| `J36` | 扁桃腺周圍膿瘍 | 扁桃腺周圍膿瘍 | Peritonsillar abscess |
| `J39.0` | 咽後及咽旁膿瘍 | 後咽、咽旁膿瘍 | Retropharyngeal and parapharyngeal abscess |
| `R49.0` | 發聲困難 | 發聲困難 | Dysphonia |
| `J38.3` | 聲帶其他疾病 | 聲帶之其他疾病 | Other diseases of vocal cords |
| `R13.10` | 吞嚥困難 | 吞嚥困難 | Dysphagia, unspecified |
| `J02.8` | 其他特定病原體急性咽炎 | 其他特定病原體所致急性咽炎 | Acute pharyngitis due to other specified organisms |

### 胸肺／心臟

#### 咳嗽／感冒

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R05.9` | 咳嗽 | 咳嗽 | Cough, unspecified |
| `R05.1` | 急性咳嗽 | 急性咳嗽 | Acute cough |
| `R05.3` | 慢性咳嗽 | 慢性咳嗽 | Chronic cough |
| **常見疾病** | | | |
| `J00` | 急性鼻咽炎（感冒） | 急性鼻咽炎（感冒） | Acute nasopharyngitis [common cold] |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `J20.9` | 急性支氣管炎 | 急性支氣管炎 | Acute bronchitis, unspecified |
| `J11.1` | 流感（伴其他呼吸道表徵） | 未確認流感病毒所致流行性感冒併其他呼吸道表徵 | Influenza due to unidentified influenza virus with other respiratory manifestations |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `J40` | 支氣管炎（未明示急慢性） | 支氣管炎，未明示急性或慢性者 | Bronchitis, not specified as acute or chronic |
| `J45.901` | 氣喘急性發作 | 氣喘併(急性)發作 | Unspecified asthma with (acute) exacerbation |
| `J45.909` | 氣喘（無併發症） | 氣喘,無併發症 | Unspecified asthma, uncomplicated |
| `J44.1` | COPD 急性惡化 | 慢性阻塞性肺病伴有(急性)發作 | Chronic obstructive pulmonary disease with (acute) exacerbation |
| `J44.0` | COPD 伴急性下呼吸道感染 | 慢性阻塞性肺病伴有急性下呼吸道感染 | Chronic obstructive pulmonary disease with (acute) lower respiratory infection |
| `J44.9` | 慢性阻塞性肺病 COPD | 慢性阻塞性肺病 | Chronic obstructive pulmonary disease, unspecified |
| `J42` | 慢性支氣管炎 | 慢性支氣管炎 | Unspecified chronic bronchitis |
| `J30.9` | 過敏性鼻炎 | 過敏性鼻炎 | Allergic rhinitis, unspecified |
| `R09.82` | 鼻涕倒流 | 鼻涕倒流 | Postnasal drip |
| `J01.90` | 急性鼻竇炎 | 急性鼻竇炎 | Acute sinusitis, unspecified |
| `J32.9` | 慢性鼻竇炎 | 慢性鼻竇炎 | Chronic sinusitis, unspecified |
| `K21.9` | 胃食道逆流 GERD（未伴食道炎） | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `J47.9` | 支氣管擴張症（未併發） | 支氣管擴張症 | Bronchiectasis, uncomplicated |
| `J43.9` | 肺氣腫 | 肺氣腫 | Emphysema, unspecified |
| `A15.0` | 肺結核 | 肺結核 | Tuberculosis of lung |
| `A15.9` | 呼吸道結核病 | 呼吸道結核病 | Respiratory tuberculosis unspecified |
| `A37.90` | 百日咳（未伴肺炎） | 未明示病原體之百日咳未伴有肺炎 | Whooping cough, unspecified species without pneumonia |
| `J69.0` | 吸入性肺炎 | 吸入食物或嘔吐物所致之肺炎 | Pneumonitis due to inhalation of food and vomit |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `J84.10` | 肺部纖維化 | 肺部纖維化 | Pulmonary fibrosis, unspecified |
| `C34.90` | 肺／支氣管惡性腫瘤（未明示側） | 未明示側性支氣管或肺惡性腫瘤 | Malignant neoplasm of unspecified part of unspecified bronchus or lung |
| `T46.4X5A` | ACEI 藥物不良反應（初期照護，附加碼） | 血管張力素 - 轉化酶抑制藥劑[ACEI]不良反應之初期照護 | Adverse effect of angiotensin-converting-enzyme inhibitors, initial encounter |
| `R04.2` | 咳血 | 咳血 | Hemoptysis |
| `U09.9` | COVID-19 後的病況 | 嚴重特殊傳染性肺炎後的病況 | Post COVID-19 condition, unspecified |

#### 呼吸困難

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R06.02` | 呼吸短促 | 呼吸短促 | Shortness of breath |
| `R06.00` | 呼吸困難 | 呼吸困難 | Dyspnea, unspecified |
| `R06.2` | 哮鳴 | 哮鳴 | Wheezing |
| **常見疾病** | | | |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `J44.1` | COPD 急性惡化 | 慢性阻塞性肺病伴有(急性)發作 | Chronic obstructive pulmonary disease with (acute) exacerbation |
| `J44.9` | 慢性阻塞性肺病 COPD | 慢性阻塞性肺病 | Chronic obstructive pulmonary disease, unspecified |
| `J45.901` | 氣喘急性發作 | 氣喘併(急性)發作 | Unspecified asthma with (acute) exacerbation |
| `J45.909` | 氣喘（無併發症） | 氣喘,無併發症 | Unspecified asthma, uncomplicated |
| `J45.40` | 中度持續性氣喘（無併發症） | 中度持續性氣喘，無併發症 | Moderate persistent asthma, uncomplicated |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `I50.32` | 慢性舒張性心臟衰竭 | 慢性舒張性(充血性)心臟衰竭 | Chronic diastolic (congestive) heart failure |
| `I50.22` | 慢性收縮性心臟衰竭 | 慢性收縮性(充血性)心臟衰竭 | Chronic systolic (congestive) heart failure |
| `I48.91` | 心房顫動 | 心房顫動 | Unspecified atrial fibrillation |
| `I25.10` | 冠狀動脈粥狀硬化性心臟病（未伴心絞痛） | 自體的冠狀動脈粥樣硬化心臟病未伴有心絞痛 | Atherosclerotic heart disease of native coronary artery without angina pectoris |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `J90` | 肋膜積水 | 肋膜積水，他處未歸類者 | Pleural effusion, not elsewhere classified |
| `I26.99` | 其他肺栓塞（未伴急性肺性心臟病） | 其他肺栓塞未伴有急性肺性心臟病 | Other pulmonary embolism without acute cor pulmonale |
| `I27.20` | 肺高血壓 | 肺高血壓 | Pulmonary hypertension, unspecified |
| `J84.9` | 間質性肺疾病 | 間質性肺疾病 | Interstitial pulmonary disease, unspecified |
| `J84.10` | 肺部纖維化 | 肺部纖維化 | Pulmonary fibrosis, unspecified |
| `J47.9` | 支氣管擴張症（未併發） | 支氣管擴張症 | Bronchiectasis, uncomplicated |
| `J43.9` | 肺氣腫 | 肺氣腫 | Emphysema, unspecified |
| `J69.0` | 吸入性肺炎 | 吸入食物或嘔吐物所致之肺炎 | Pneumonitis due to inhalation of food and vomit |
| `J96.11` | 慢性呼吸衰竭併缺氧 | 慢性呼吸衰竭併缺氧 | Chronic respiratory failure with hypoxia |
| `R09.02` | 低血氧症 | 低血氧症 | Hypoxemia |
| `C34.90` | 肺／支氣管惡性腫瘤（未明示側） | 未明示側性支氣管或肺惡性腫瘤 | Malignant neoplasm of unspecified part of unspecified bronchus or lung |
| `F41.0` | 恐慌症 | 特定場所畏懼症的恐慌症 | Panic disorder [episodic paroxysmal anxiety] |
| `E66.9` | 肥胖 | 肥胖 | Obesity, unspecified |
| `G47.33` | 阻塞型睡眠呼吸中止 OSA | 阻塞性睡眠呼吸中止 (成人) (小兒) | Obstructive sleep apnea (adult) (pediatric) |
| `U09.9` | COVID-19 後的病況 | 嚴重特殊傳染性肺炎後的病況 | Post COVID-19 condition, unspecified |

#### 胸痛／心悸

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R07.9` | 胸痛 | 胸痛 | Chest pain, unspecified |
| `R00.2` | 心悸 | 心悸 | Palpitations |
| `R00.0` | 心搏過速 | 心搏過速 | Tachycardia, unspecified |
| **常見疾病** | | | |
| `I20.9` | 心絞痛 | 心絞痛 | Angina pectoris, unspecified |
| `I25.10` | 冠狀動脈粥狀硬化性心臟病（未伴心絞痛） | 自體的冠狀動脈粥樣硬化心臟病未伴有心絞痛 | Atherosclerotic heart disease of native coronary artery without angina pectoris |
| `K21.9` | 胃食道逆流 GERD（未伴食道炎） | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K21.00` | 胃食道逆流伴食道炎（未伴出血） | 胃食道逆流性疾病伴有食道炎未伴有出血 | Gastro-esophageal reflux disease with esophagitis, without bleeding |
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `I11.9` | 高血壓性心臟病（無心臟衰竭） | 高血壓性心臟病，無心臟衰竭 | Hypertensive heart disease without heart failure |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `I49.9` | 心律不整 | 心臟節律不整 | Cardiac arrhythmia, unspecified |
| `I48.91` | 心房顫動 | 心房顫動 | Unspecified atrial fibrillation |
| `I48.0` | 陣發性心房顫動 | 陣發性心房顫動 | Paroxysmal atrial fibrillation |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| `F41.0` | 恐慌症 | 特定場所畏懼症的恐慌症 | Panic disorder [episodic paroxysmal anxiety] |
| `I20.0` | 不穩定心絞痛 | 不穩定心絞痛 | Unstable angina |
| `I47.1` | 心室上心搏過速 SVT | 心室上部心搏過速 | Supraventricular tachycardia |
| `I49.1` | 心房早期收縮 APC | 心房早期去極化 | Atrial premature depolarization |
| `I49.3` | 心室早期收縮 PVC | 心室早期去極化 | Ventricular premature depolarization |
| `I49.5` | 病竇症候群 | 病竇症候群 | Sick sinus syndrome |
| `I44.0` | 第一度房室傳導阻滯 | 第一度房室傳導阻滯 | Atrioventricular block, first degree |
| `I45.10` | 右束支傳導阻滯 | 右束支傳導阻滯 | Unspecified right bundle-branch block |
| `R00.1` | 心搏過緩 | 心博過慢 | Bradycardia, unspecified |
| `E05.90` | 甲狀腺毒症／甲亢（未伴危象或風暴） | 未明示之甲狀腺毒症，未伴有甲狀腺毒性危象或風暴 | Thyrotoxicosis, unspecified without thyrotoxic crisis or storm |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `M94.0` | 肋軟骨連接處症候群（Tietze） | 肋軟骨與肋連接處症候群 [Tietze] | Chondrocostal junction syndrome [Tietze] |
| `R07.89` | 其他胸痛 | 其他胸痛 | Other chest pain |
| `R07.1` | 呼吸時胸痛 | 呼吸時胸痛 | Chest pain on breathing |
| `R07.2` | 胸口疼痛 | 胸口疼痛 | Precordial pain |
| `B02.9` | 帶狀疱疹（未伴併發症） | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `I30.9` | 急性心包膜炎 | 急性心包膜炎 | Acute pericarditis, unspecified |
| `I35.0` | 非風濕性主動脈瓣狹窄 | 非風濕性主動脈瓣狹窄 | Nonrheumatic aortic (valve) stenosis |
| `I34.0` | 非風濕性二尖瓣閉鎖不全 | 非風濕性二尖瓣閉鎖不全 | Nonrheumatic mitral (valve) insufficiency |
| `R94.31` | 心電圖檢查結果異常 | 心電圖檢查結果異常 | Abnormal electrocardiogram [ECG] [EKG] |
| `E87.6` | 低血鉀症 | 低血鉀症 | Hypokalemia |

#### 水腫

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R60.0` | 局部性水腫 | 局部性水腫 | Localized edema |
| `R60.9` | 水腫 | 水腫 | Edema, unspecified |
| **常見疾病** | | | |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `I50.32` | 慢性舒張性心臟衰竭 | 慢性舒張性(充血性)心臟衰竭 | Chronic diastolic (congestive) heart failure |
| `I50.22` | 慢性收縮性心臟衰竭 | 慢性收縮性(充血性)心臟衰竭 | Chronic systolic (congestive) heart failure |
| `I87.2` | 慢性靜脈功能不足 | 靜脈功能不足（慢性）（周邊） | Venous insufficiency (chronic) (peripheral) |
| `I83.90` | 下肢靜脈曲張（無症狀、未明示側） | 未明示側性下肢無症狀靜脈曲張 | Asymptomatic varicose veins of unspecified lower extremity |
| `I83.10` | 下肢靜脈曲張伴發炎（未明示側） | 未明示側性下肢靜脈曲張伴有發炎 | Varicose veins of unspecified lower extremity with inflammation |
| `I89.0` | 淋巴水腫 | 其他淋巴水腫，他處未歸類者 | Lymphedema, not elsewhere classified |
| `N18.9` | 慢性腎臟疾病 CKD | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `N04.9` | 腎病症候群 | 腎病症候群伴有非特異性的組織形態改變 | Nephrotic syndrome with unspecified morphologic changes |
| `K74.60` | 肝硬化 | 肝硬化 | Unspecified cirrhosis of liver |
| `R18.8` | 其他腹水 | 其他腹水 | Other ascites |
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `I82.409` | 下肢深部靜脈栓塞 DVT（急性、未明示側） | 未明示側性下肢未明示深部靜脈急性栓塞及血栓 | Acute embolism and thrombosis of unspecified deep veins of unspecified lower extremity |
| `I80.209` | 下肢深部靜脈炎及血栓靜脈炎（未明示側） | 未明示四肢未明示深部血管靜脈炎及血栓靜脈炎 | Phlebitis and thrombophlebitis of unspecified deep vessels of unspecified lower extremity |
| `T46.1X5A` | 鈣離子通道阻斷劑不良反應（初期照護，附加碼） | 鈣離子通道阻斷劑不良反應之初期照護 | Adverse effect of calcium-channel blockers, initial encounter |
| `E46` | 蛋白質熱量營養不良 | 蛋白質-熱量營養不良症 | Unspecified protein-calorie malnutrition |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |

### 腹部／消化

#### 腹痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R10.9` | 腹痛 | 腹痛 | Unspecified abdominal pain |
| `R10.13` | 心窩部痛 | 心窩部痛 | Epigastric pain |
| `R10.84` | 全腹痛 | 全腹痛 | Generalized abdominal pain |
| **常見疾病** | | | |
| `K29.70` | 胃炎（未伴出血） | 胃炎未伴有出血 | Gastritis, unspecified, without bleeding |
| `K21.9` | 胃食道逆流 GERD（未伴食道炎） | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K30` | 功能性消化不良 | 功能性消化不良 | Functional dyspepsia |
| `K25.9` | 胃潰瘍（未明示急慢性、未伴出血或穿孔） | 胃潰瘍，未明示急性或慢性，未伴有出血或穿孔 | Gastric ulcer, unspecified as acute or chronic, without hemorrhage or perforation |
| `K26.9` | 十二指腸潰瘍（未明示急慢性、未伴出血或穿孔） | 十二指腸潰瘍，未明示急性或慢性，未伴有出血或穿孔 | Duodenal ulcer, unspecified as acute or chronic, without hemorrhage or perforation |
| `K58.9` | 腸躁症（未伴腹瀉） | 激躁性腸症候群未伴有腹瀉 | Irritable bowel syndrome without diarrhea |
| `K59.00` | 便秘 | 便秘 | Constipation, unspecified |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `K52.9` | 非感染性腸胃炎及結腸炎 | 非傳染性胃腸炎及結腸炎 | Noninfective gastroenteritis and colitis, unspecified |
| `K80.20` | 膽囊結石（未伴膽囊炎、未伴阻塞） | 膽囊結石未伴有膽囊炎未伴有阻塞 | Calculus of gallbladder without cholecystitis without obstruction |
| `K80.00` | 膽囊結石併急性膽囊炎（未伴阻塞） | 膽囊結石併急性膽囊炎未伴有阻塞 | Calculus of gallbladder with acute cholecystitis without obstruction |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `K83.09` | 急性膽管炎（其他膽管炎） | 其他膽管炎 | Other cholangitis |
| `K85.90` | 急性胰臟炎（未伴壞死或感染） | 急性胰臟炎未伴有壞死或感染 | Acute pancreatitis without necrosis or infection, unspecified |
| `K86.1` | 其他慢性胰臟炎 | 其他慢性胰臟炎 | Other chronic pancreatitis |
| `K35.80` | 急性闌尾炎 | 急性闌尾炎 | Unspecified acute appendicitis |
| `K57.30` | 大腸憩室（未伴穿孔或膿瘍、無出血） | 大腸憩室未伴有穿孔或膿瘍無出血 | Diverticulosis of large intestine without perforation or abscess without bleeding |
| `K57.32` | 大腸憩室炎（未伴穿孔或膿瘍、無出血） | 大腸憩室炎未伴有穿孔或膿瘍無出血 | Diverticulitis of large intestine without perforation or abscess without bleeding |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |
| `K92.2` | 胃腸道出血 | 胃腸道出血 | Gastrointestinal hemorrhage, unspecified |
| `K92.1` | 黑便 | 黑便 | Melena |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `N20.1` | 輸尿管結石 | 輸尿管結石 | Calculus of ureter |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `K40.90` | 單側腹股溝疝氣（未伴阻塞或壞疽） | 單側腹股溝疝氣，未伴有阻塞或壞疽，未明示為復發 | Unilateral inguinal hernia, without obstruction or gangrene, not specified as recurrent |
| `K46.9` | 腹部疝氣（未伴阻塞或壞疽） | 腹部疝氣未伴有阻塞或壞疽 | Unspecified abdominal hernia without obstruction or gangrene |
| `K44.9` | 橫膈疝氣／裂孔疝（未伴阻塞或壞疽） | 橫膈疝氣未伴有阻塞或壞疽 | Diaphragmatic hernia without obstruction or gangrene |
| `N73.9` | 女性骨盆炎性疾病 PID | 女性骨盆炎性疾病 | Female pelvic inflammatory disease, unspecified |
| `K21.00` | 胃食道逆流伴食道炎（未伴出血） | 胃食道逆流性疾病伴有食道炎未伴有出血 | Gastro-esophageal reflux disease with esophagitis, without bleeding |
| `C18.9` | 結腸惡性腫瘤 | 結腸惡性腫瘤 | Malignant neoplasm of colon, unspecified |
| `C16.9` | 胃惡性腫瘤 | 胃惡性腫瘤 | Malignant neoplasm of stomach, unspecified |

#### 腹瀉

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R19.7` | 腹瀉 | 腹瀉 | Diarrhea, unspecified |
| **常見疾病** | | | |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `A08.4` | 病毒性腸炎 | 病毒性腸道病毒感染 | Viral intestinal infection, unspecified |
| `A08.11` | 諾羅病毒急性胃腸炎 | 類諾瓦克病毒所致之急性胃腸病變 | Acute gastroenteropathy due to Norwalk agent |
| `A08.0` | 輪狀病毒性腸炎 | 輪狀病毒性腸炎 | Rotaviral enteritis |
| `K52.9` | 非感染性腸胃炎及結腸炎 | 非傳染性胃腸炎及結腸炎 | Noninfective gastroenteritis and colitis, unspecified |
| `A05.9` | 細菌性食物中毒 | 細菌性食物中毒 | Bacterial foodborne intoxication, unspecified |
| `A02.0` | 沙門桿菌腸炎 | 沙門桿菌腸炎 | Salmonella enteritis |
| `A04.5` | 彎曲桿菌腸炎 | 彎曲桿菌腸炎 | Campylobacter enteritis |
| `A03.9` | 志賀桿菌病 | 志賀桿菌病 | Shigellosis, unspecified |
| `A04.72` | 艱難梭菌腸道感染 CDI（非復發型） | 艱難梭菌所致腸道感染，未明示為復發型 | Enterocolitis due to Clostridium difficile, not specified as recurrent |
| `A04.71` | 艱難梭菌腸道感染 CDI（復發型） | 艱難梭菌所致腸道感染，復發型 | Enterocolitis due to Clostridium difficile, recurrent |
| `A06.0` | 急性阿米巴痢疾 | 急性阿米巴性痢疾 | Acute amebic dysentery |
| `A07.1` | 梨形鞭毛蟲病 | 梨形鞭毛蟲病[腸梨形蟲病] | Giardiasis [lambliasis] |
| `K58.0` | 腸躁症伴腹瀉 | 激躁性腸症候群併腹瀉 | Irritable bowel syndrome with diarrhea |
| `K59.1` | 功能性腹瀉 | 功能性腹瀉 | Functional diarrhea |
| `K52.1` | 毒性（藥物性）胃腸炎及結腸炎 | 毒性胃腸炎及結腸炎 | Toxic gastroenteritis and colitis |
| `K51.90` | 潰瘍性結腸炎（未伴併發症） | 潰瘍性結腸炎未伴有併發症 | Ulcerative colitis, unspecified, without complications |
| `K50.90` | 克隆氏病（未伴併發症） | 克隆氏病未伴有併發症 | Crohn's disease, unspecified, without complications |
| `K57.92` | 腸憩室炎（未明示部位、未伴穿孔或膿瘍） | 腸憩室炎，未明示部位，未伴有穿孔或膿瘍無出血 | Diverticulitis of intestine, part unspecified, without perforation or abscess without bleeding |
| `K86.81` | 胰外分泌腺功能不足 | 胰外分泌腺功能不足 | Exocrine pancreatic insufficiency |
| `E11.43` | 第二型糖尿病伴自主神經病變 | 第二型糖尿病，伴有糖尿病的自主(多發)神經病變 | Type 2 diabetes mellitus with diabetic autonomic (poly)neuropathy |
| `E05.90` | 甲狀腺毒症／甲亢（未伴危象或風暴） | 未明示之甲狀腺毒症，未伴有甲狀腺毒性危象或風暴 | Thyrotoxicosis, unspecified without thyrotoxic crisis or storm |
| `C18.9` | 結腸惡性腫瘤 | 結腸惡性腫瘤 | Malignant neoplasm of colon, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `E86.9` | 體液缺乏 | 體液缺乏 | Volume depletion, unspecified |
| `R19.5` | 其他大便異常 | 其他大便異常 | Other fecal abnormalities |

#### 噁心嘔吐

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R11.0` | 噁心 | 噁心 | Nausea |
| `R11.10` | 嘔吐 | 嘔吐 | Vomiting, unspecified |
| `R11.2` | 噁心伴嘔吐 | 噁心伴有嘔吐 | Nausea with vomiting, unspecified |
| **常見疾病** | | | |
| `K21.9` | 胃食道逆流 GERD（未伴食道炎） | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K29.70` | 胃炎（未伴出血） | 胃炎未伴有出血 | Gastritis, unspecified, without bleeding |
| `K30` | 功能性消化不良 | 功能性消化不良 | Functional dyspepsia |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `A08.11` | 諾羅病毒急性胃腸炎 | 類諾瓦克病毒所致之急性胃腸病變 | Acute gastroenteropathy due to Norwalk agent |
| `A08.4` | 病毒性腸炎 | 病毒性腸道病毒感染 | Viral intestinal infection, unspecified |
| `K52.9` | 非感染性腸胃炎及結腸炎 | 非傳染性胃腸炎及結腸炎 | Noninfective gastroenteritis and colitis, unspecified |
| `K25.9` | 胃潰瘍（未明示急慢性、未伴出血或穿孔） | 胃潰瘍，未明示急性或慢性，未伴有出血或穿孔 | Gastric ulcer, unspecified as acute or chronic, without hemorrhage or perforation |
| `K31.84` | 胃輕癱 | 胃輕癱 | Gastroparesis |
| `E11.43` | 第二型糖尿病伴自主神經病變 | 第二型糖尿病，伴有糖尿病的自主(多發)神經病變 | Type 2 diabetes mellitus with diabetic autonomic (poly)neuropathy |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |
| `K85.90` | 急性胰臟炎（未伴壞死或感染） | 急性胰臟炎未伴有壞死或感染 | Acute pancreatitis without necrosis or infection, unspecified |
| `K80.20` | 膽囊結石（未伴膽囊炎、未伴阻塞） | 膽囊結石未伴有膽囊炎未伴有阻塞 | Calculus of gallbladder without cholecystitis without obstruction |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `H81.10` | 良性陣發性眩暈 BPPV（未明示側） | 未明示側性之良性陣發性眩暈 | Benign paroxysmal vertigo, unspecified ear |
| `H81.09` | 梅尼爾氏病（未明示側） | 未明示側性之梅尼爾氏病 | Meniere's disease, unspecified ear |
| `G43.909` | 偏頭痛 | 偏頭痛，未明確定義型態，非頑固性，未伴有偏頭痛重積狀態 | Migraine, unspecified, not intractable, without status migrainosus |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `E87.1` | 低血鈉及低滲透壓 | 低滲壓及低血鈉 | Hypo-osmolality and hyponatremia |
| `K59.00` | 便秘 | 便秘 | Constipation, unspecified |
| `K44.9` | 橫膈疝氣／裂孔疝（未伴阻塞或壞疽） | 橫膈疝氣未伴有阻塞或壞疽 | Diaphragmatic hernia without obstruction or gangrene |
| `R13.10` | 吞嚥困難 | 吞嚥困難 | Dysphagia, unspecified |
| `C16.9` | 胃惡性腫瘤 | 胃惡性腫瘤 | Malignant neoplasm of stomach, unspecified |

#### 便秘／排便異常

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `K59.00` | 便秘 | 便秘 | Constipation, unspecified |
| `R19.4` | 排便習慣改變 | 排便習慣改變 | Change in bowel habit |
| **常見疾病** | | | |
| `K58.9` | 腸躁症（未伴腹瀉） | 激躁性腸症候群未伴有腹瀉 | Irritable bowel syndrome without diarrhea |
| `K59.09` | 其他便秘 | 其他便秘 | Other constipation |
| `K59.03` | 藥物導致之便秘 | 藥物導致之便秘 | Drug induced constipation |
| `K59.02` | 出口功能障礙性便秘 | 出口功能障礙性便秘 | Outlet dysfunction constipation |
| `K64.9` | 痔瘡 | 痔瘡 | Unspecified hemorrhoids |
| `K64.0` | 第一級痔瘡 | 第一級痔瘡 | First degree hemorrhoids |
| `K64.1` | 第二級痔瘡 | 第二級痔瘡 | Second degree hemorrhoids |
| `K64.2` | 第三級痔瘡 | 第三級痔瘡 | Third degree hemorrhoids |
| `K60.2` | 肛門裂 | 肛門裂 | Anal fissure, unspecified |
| `K62.5` | 肛門及直腸出血 | 肛門及直腸出血 | Hemorrhage of anus and rectum |
| `K56.41` | 糞塊嵌塞 | 糞塊嵌塞 | Fecal impaction |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |
| `K57.30` | 大腸憩室（未伴穿孔或膿瘍、無出血） | 大腸憩室未伴有穿孔或膿瘍無出血 | Diverticulosis of large intestine without perforation or abscess without bleeding |
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `E11.43` | 第二型糖尿病伴自主神經病變 | 第二型糖尿病，伴有糖尿病的自主(多發)神經病變 | Type 2 diabetes mellitus with diabetic autonomic (poly)neuropathy |
| `E87.6` | 低血鉀症 | 低血鉀症 | Hypokalemia |
| `G20` | 巴金森氏症 | 巴金森氏症 | Parkinson's disease |
| `C18.9` | 結腸惡性腫瘤 | 結腸惡性腫瘤 | Malignant neoplasm of colon, unspecified |
| `C20` | 直腸惡性腫瘤 | 直腸惡性腫瘤 | Malignant neoplasm of rectum |
| `K51.90` | 潰瘍性結腸炎（未伴併發症） | 潰瘍性結腸炎未伴有併發症 | Ulcerative colitis, unspecified, without complications |
| `K50.90` | 克隆氏病（未伴併發症） | 克隆氏病未伴有併發症 | Crohn's disease, unspecified, without complications |
| `R19.5` | 其他大便異常 | 其他大便異常 | Other fecal abnormalities |
| `R15.9` | 大便完全失禁 | 大便完全失禁 | Full incontinence of feces |
| `K62.89` | 肛門及直腸其他特定疾病 | 肛門及直腸其他特定疾病 | Other specified diseases of anus and rectum |
| `Z12.11` | 來院接受結腸腫瘤篩檢 | 來院接受結腸惡性腫瘤之篩檢 | Encounter for screening for malignant neoplasm of colon |

### 泌尿／生殖

#### 排尿症狀

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R30.0` | 排尿困難 | 排尿困難 | Dysuria |
| `R35.0` | 頻尿 | 頻尿 | Frequency of micturition |
| `R32` | 尿失禁 | 尿失禁 | Unspecified urinary incontinence |
| **常見疾病** | | | |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `N30.00` | 急性膀胱炎（未伴血尿） | 急性膀胱炎未伴有血尿 | Acute cystitis without hematuria |
| `N30.90` | 膀胱炎（未伴血尿） | 膀胱炎未伴有血尿 | Cystitis, unspecified without hematuria |
| `N40.1` | 攝護腺增生伴下泌尿道症狀 BPH | 良性攝護腺增生伴有下泌尿道症狀 | Benign prostatic hyperplasia with lower urinary tract symptoms |
| `N40.0` | 攝護腺增生（未伴下泌尿道症狀） | 良性攝護腺增生未伴有下泌尿道症狀 | Benign prostatic hyperplasia without lower urinary tract symptoms |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `N32.81` | 膀胱過動症 | 膀胱過動症 | Overactive bladder |
| `N39.41` | 急迫性尿失禁 | 急迫性尿失禁 | Urge incontinence |
| `N39.3` | 應力性尿失禁 | 應力性尿失禁 | Stress incontinence (female) (male) |
| `N39.46` | 混合性尿失禁 | 混合性尿失禁 | Mixed incontinence |
| `R33.9` | 尿滯留 | 尿滯留 | Retention of urine, unspecified |
| `R35.1` | 夜尿 | 夜尿 | Nocturia |
| `R39.14` | 殘尿感 | 殘尿感 | Feeling of incomplete bladder emptying |
| `N41.1` | 慢性攝護腺炎 | 慢性攝護腺炎 | Chronic prostatitis |
| `N41.0` | 急性攝護腺炎 | 急性攝護腺炎 | Acute prostatitis |
| `N30.20` | 其他慢性膀胱炎（未伴血尿） | 其他慢性膀胱炎未伴有血尿 | Other chronic cystitis without hematuria |
| `N30.10` | 間質性膀胱炎（慢性、未伴血尿） | (慢性)間質性膀胱炎未伴有血尿 | Interstitial cystitis (chronic) without hematuria |
| `N34.2` | 其他尿道炎 | 其他尿道炎 | Other urethritis |
| `A54.01` | 淋菌性膀胱炎及尿道炎 | 淋病雙球菌性膀胱炎及尿道炎，未明示 | Gonococcal cystitis and urethritis, unspecified |
| `A56.01` | 披衣菌性膀胱炎及尿道炎 | 披衣菌性膀胱炎和尿道炎 | Chlamydial cystitis and urethritis |
| `B37.41` | 念珠菌性膀胱炎及尿道炎 | 念珠菌性膀胱炎和尿道炎 | Candidal cystitis and urethritis |
| `N76.0` | 急性陰道炎 | 急性陰道炎 | Acute vaginitis |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `N20.1` | 輸尿管結石 | 輸尿管結石 | Calculus of ureter |
| `N21.0` | 膀胱內結石 | 膀胱內結石 | Calculus in bladder |
| `N18.9` | 慢性腎臟疾病 CKD | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `C61` | 攝護腺惡性腫瘤 | 攝護腺惡性腫瘤 | Malignant neoplasm of prostate |
| `C67.9` | 膀胱惡性腫瘤 | 膀胱惡性腫瘤 | Malignant neoplasm of bladder, unspecified |
| `Z87.440` | 泌尿道感染個人史 | 泌尿道感染之個人史 | Personal history of urinary (tract) infections |

#### 血尿

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R31.9` | 血尿 | 血尿 | Hematuria, unspecified |
| `R31.0` | 肉眼可見性血尿 | 肉眼可見性血尿 | Gross hematuria |
| **常見疾病** | | | |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `N30.01` | 急性膀胱炎伴血尿 | 急性膀胱炎伴有血尿 | Acute cystitis with hematuria |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `N20.1` | 輸尿管結石 | 輸尿管結石 | Calculus of ureter |
| `N21.0` | 膀胱內結石 | 膀胱內結石 | Calculus in bladder |
| `R31.21` | 無症狀顯微鏡性血尿 | 無症狀顯微鏡性血尿 | Asymptomatic microscopic hematuria |
| `R31.29` | 其他顯微鏡性血尿 | 其他顯微鏡性血尿 | Other microscopic hematuria |
| `R31.1` | 良性本態性顯微鏡性血尿 | 良性本態性顯微鏡性血尿 | Benign essential microscopic hematuria |
| `N40.1` | 攝護腺增生伴下泌尿道症狀 BPH | 良性攝護腺增生伴有下泌尿道症狀 | Benign prostatic hyperplasia with lower urinary tract symptoms |
| `N41.1` | 慢性攝護腺炎 | 慢性攝護腺炎 | Chronic prostatitis |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `N18.9` | 慢性腎臟疾病 CKD | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `R80.9` | 蛋白尿 | 蛋白尿 | Proteinuria, unspecified |
| `N02.9` | 復發性及持續性血尿（未特異性組織形態改變） | 再發性及持續性血尿伴有非特異性的組織形態改變 | Recurrent and persistent hematuria with unspecified morphologic changes |
| `N05.9` | 腎炎症候群（未特異性組織形態改變） | 非特異性的腎炎症候群伴有非特異性的組織形態改變 | Unspecified nephritic syndrome with unspecified morphologic changes |
| `N03.9` | 慢性腎炎症候群（未特異性組織形態改變） | 慢性腎炎症候群伴有非特異性的組織形態改變 | Chronic nephritic syndrome with unspecified morphologic changes |
| `C67.9` | 膀胱惡性腫瘤 | 膀胱惡性腫瘤 | Malignant neoplasm of bladder, unspecified |
| `C64.9` | 腎惡性腫瘤（腎盂除外、未明示側） | 未明示側性腎惡性腫瘤，腎盂除外 | Malignant neoplasm of unspecified kidney, except renal pelvis |
| `C61` | 攝護腺惡性腫瘤 | 攝護腺惡性腫瘤 | Malignant neoplasm of prostate |
| `N28.1` | 後天性腎囊腫 | 後天性腎囊腫 | Cyst of kidney, acquired |
| `Q61.3` | 多囊腎 | 多囊腎 | Polycystic kidney, unspecified |
| `N13.30` | 腎水腫 | 腎水腫 | Unspecified hydronephrosis |
| `A18.10` | 生殖泌尿系統結核 | 生殖泌尿系統結核 | Tuberculosis of genitourinary system, unspecified |
| `Z79.01` | 長期服用抗凝血劑 | 長期（現在之）服用抗凝血劑 | Long term (current) use of anticoagulants |

### 皮膚／軟組織

#### 皮疹／搔癢

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R21` | 皮疹 | 皮疹及其他非特定性皮膚出疹 | Rash and other nonspecific skin eruption |
| `L29.9` | 搔癢 | 搔癢症 | Pruritus, unspecified |
| **常見疾病** | | | |
| `L50.9` | 蕁麻疹 | 蕁麻疹 | Urticaria, unspecified |
| `L50.0` | 過敏性蕁麻疹 | 過敏性蕁麻疹 | Allergic urticaria |
| `L50.1` | 特發性蕁麻疹 | 特發性蕁麻疹 | Idiopathic urticaria |
| `L30.9` | 皮膚炎 | 皮膚炎 | Dermatitis, unspecified |
| `L20.9` | 異位性皮膚炎 | 異位性皮膚炎 | Atopic dermatitis, unspecified |
| `L21.9` | 脂漏性皮膚炎 | 脂漏性皮膚炎 | Seborrheic dermatitis, unspecified |
| `L23.9` | 過敏性接觸性皮膚炎 | 過敏性接觸性皮膚炎，未明示原因 | Allergic contact dermatitis, unspecified cause |
| `L24.9` | 刺激性接觸性皮膚炎（未明示原因） | 刺激性接觸性皮膚炎，未明示原因 | Irritant contact dermatitis, unspecified cause |
| `L27.0` | 全身性藥物疹 | 內服藥所致之全身性皮疹 | Generalized skin eruption due to drugs and medicaments taken internally |
| `L27.1` | 局部性藥物疹 | 內服藥所致之局部性皮疹 | Localized skin eruption due to drugs and medicaments taken internally |
| `T78.40XA` | 過敏反應（初期照護） | 過敏之初期照護 | Allergy, unspecified, initial encounter |
| `B02.9` | 帶狀疱疹（未伴併發症） | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `B00.9` | 單純疱疹病毒感染 | 疱疹病毒感染 | Herpesviral infection, unspecified |
| `B01.9` | 水痘（未伴併發症） | 水痘未伴有併發症 | Varicella without complication |
| `B09` | 病毒疹（皮膚黏膜病灶） | 皮膚及黏膜病灶為特徵未明示之病毒性感染(症) | Unspecified viral infection characterized by skin and mucous membrane lesions |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `A46` | 丹毒 | 丹毒 | Erysipelas |
| `L01.00` | 膿痂疹 | 膿痂疹 | Impetigo, unspecified |
| `B35.4` | 體癬 | 體癬 | Tinea corporis |
| `B36.0` | 汗斑（變色糠疹） | 變色糠疹(汗斑) | Pityriasis versicolor |
| `B86` | 疥瘡 | 疥癬(疥瘡) | Scabies |
| `L40.9` | 乾癬 | 乾癬 | Psoriasis, unspecified |
| `L43.9` | 扁平苔癬 | 扁平苔癬 | Lichen planus, unspecified |
| `L51.9` | 多形性紅斑 | 多形性紅斑 | Erythema multiforme, unspecified |
| `L53.9` | 紅斑狀態 | 紅斑狀態 | Erythematous condition, unspecified |
| `L28.0` | 慢性單純苔癬 | 慢性單純苔癬 | Lichen simplex chronicus |
| `L85.3` | 乾皮症 | 乾皮症 | Xerosis cutis |
| `A51.39` | 其他第二期皮膚梅毒 | 其他第二期(續發性)皮膚梅毒 | Other secondary syphilis of skin |
| `L70.9` | 痤瘡 | 痤瘡 | Acne, unspecified |
| `L71.9` | 酒渣 | 酒渣 | Rosacea, unspecified |
| `N18.9` | 慢性腎臟疾病 CKD | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `K74.60` | 肝硬化 | 肝硬化 | Unspecified cirrhosis of liver |

#### 蜂窩性組織炎／膿瘍

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R22.40` | 下肢局部腫脹 | 未明示側性下肢局部腫脹、腫塊及小腫塊 | Localized swelling, mass and lump, unspecified lower limb |
| `M79.609` | 肢體疼痛 | 肢體疼痛 | Pain in unspecified limb |
| `R22.9` | 局部腫脹／腫塊 | 未明示部位局部腫脹、腫塊及小腫塊 | Localized swelling, mass and lump, unspecified |
| **常見疾病** | | | |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `L03.119` | 肢體蜂窩組織炎（未明示部位） | 肢體未明示部位蜂窩組織炎 | Cellulitis of unspecified part of limb |
| `L03.115` | 右下肢蜂窩組織炎 | 右側下肢蜂窩組織炎 | Cellulitis of right lower limb |
| `L03.116` | 左下肢蜂窩組織炎 | 左側下肢蜂窩組織炎 | Cellulitis of left lower limb |
| `L03.113` | 右上肢蜂窩組織炎 | 右側上肢蜂窩組織炎 | Cellulitis of right upper limb |
| `L03.114` | 左上肢蜂窩組織炎 | 左側上肢蜂窩組織炎 | Cellulitis of left upper limb |
| `L03.211` | 臉部蜂窩組織炎 | 臉部蜂窩組織炎 | Cellulitis of face |
| `L03.311` | 腹壁蜂窩組織炎 | 腹壁蜂窩組織炎 | Cellulitis of abdominal wall |
| `L03.019` | 手指蜂窩組織炎（未明示側） | 未明示側性手指蜂窩組織炎 | Cellulitis of unspecified finger |
| `L03.039` | 腳趾蜂窩組織炎（未明示側） | 未明示側性腳趾蜂窩組織炎 | Cellulitis of unspecified toe |
| `L02.91` | 皮膚膿瘍 | 皮膚膿瘍 | Cutaneous abscess, unspecified |
| `L02.419` | 肢體皮膚膿瘍 | 未明示肢體皮膚膿瘍 | Cutaneous abscess of limb, unspecified |
| `L02.219` | 軀幹皮膚膿瘍 | 軀幹皮膚膿瘍 | Cutaneous abscess of trunk, unspecified |
| `L02.01` | 臉部皮膚膿瘍 | 臉部皮膚膿瘍 | Cutaneous abscess of face |
| `L02.31` | 臀部皮膚膿瘍 | 臀部皮膚膿瘍 | Cutaneous abscess of buttock |
| `A46` | 丹毒 | 丹毒 | Erysipelas |
| `L08.9` | 皮膚及皮下組織局部感染 | 皮膚及皮下組織局部感染 | Local infection of the skin and subcutaneous tissue, unspecified |
| `L08.0` | 膿皮病 | 膿皮病 | Pyoderma |
| `L72.0` | 表皮囊腫 | 表皮囊腫 | Epidermal cyst |
| `L73.2` | 化膿性汗腺炎 | 化膿性汗腺炎 | Hidradenitis suppurativa |
| `I89.0` | 淋巴水腫 | 其他淋巴水腫，他處未歸類者 | Lymphedema, not elsewhere classified |
| `I87.2` | 慢性靜脈功能不足 | 靜脈功能不足（慢性）（周邊） | Venous insufficiency (chronic) (peripheral) |
| `I83.10` | 下肢靜脈曲張伴發炎（未明示側） | 未明示側性下肢靜脈曲張伴有發炎 | Varicose veins of unspecified lower extremity with inflammation |
| `I80.209` | 下肢深部靜脈炎及血栓靜脈炎（未明示側） | 未明示四肢未明示深部血管靜脈炎及血栓靜脈炎 | Phlebitis and thrombophlebitis of unspecified deep vessels of unspecified lower extremity |
| `I82.409` | 下肢深部靜脈栓塞 DVT（急性、未明示側） | 未明示側性下肢未明示深部靜脈急性栓塞及血栓 | Acute embolism and thrombosis of unspecified deep veins of unspecified lower extremity |
| `M10.9` | 痛風 | 痛風 | Gout, unspecified |
| `M86.9` | 骨髓炎 | 骨髓炎 | Osteomyelitis, unspecified |
| `M00.9` | 化膿性關節炎 | 化膿性關節炎 | Pyogenic arthritis, unspecified |
| `B35.3` | 足癬 | 足癬 | Tinea pedis |
| `L60.0` | 甲內生（嵌甲） | 指（趾）甲內生 | Ingrowing nail |
| `L97.909` | 小腿慢性潰瘍（非壓迫性、未明示部位） | 未明示側性小腿未明示部位非壓迫性慢性潰瘍，未明示嚴重程度 | Non-pressure chronic ulcer of unspecified part of unspecified lower leg with unspecified severity |
| `B95.62` | MRSA 為他處疾病之病因（附加碼） | 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病 | Methicillin resistant Staphylococcus aureus infection as the cause of diseases classified elsewhere |

#### 黴菌／念珠菌感染

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R23.4` | 皮膚質地改變 | 皮膚質地改變 | Changes in skin texture |
| `R23.8` | 其他皮膚變化 | 其他皮膚改變 | Other skin changes |
| **常見疾病** | | | |
| `B35.3` | 足癬 | 足癬 | Tinea pedis |
| `B35.1` | 甲癬 | 甲癬 | Tinea unguium |
| `B35.4` | 體癬 | 體癬 | Tinea corporis |
| `B35.6` | 股癬 | 股癬 | Tinea cruris |
| `B35.2` | 手癬 | 手癬 | Tinea manuum |
| `B35.0` | 鬚癬及頭癬 | 鬚癬及頭癬 | Tinea barbae and tinea capitis |
| `B35.8` | 其他皮癬 | 其他皮癬 | Other dermatophytoses |
| `B35.9` | 皮癬菌病 | 皮癬菌病 | Dermatophytosis, unspecified |
| `B36.0` | 汗斑（變色糠疹） | 變色糠疹(汗斑) | Pityriasis versicolor |
| `B36.8` | 其他特定表淺性黴菌病 | 其他特定之表淺性黴菌病 | Other specified superficial mycoses |
| `B37.2` | 皮膚及指甲念珠菌病 | 皮膚及指(趾)甲念珠菌病 | Candidiasis of skin and nail |
| `B37.0` | 念珠菌性口炎 | 念珠菌性口炎 | Candidal stomatitis |
| `B37.9` | 念珠菌病 | 念珠菌病 | Candidiasis, unspecified |
| `B37.31` | 女陰及陰道急性念珠菌病 | 女陰及陰道急性念珠菌病 | Acute candidiasis of vulva and vagina |
| `B37.32` | 女陰及陰道慢性念珠菌病 | 女陰及陰道慢性念珠菌病 | Chronic candidiasis of vulva and vagina |
| `B37.41` | 念珠菌性膀胱炎及尿道炎 | 念珠菌性膀胱炎和尿道炎 | Candidal cystitis and urethritis |
| `B37.49` | 其他泌尿生殖部位念珠菌病 | 其他泌尿生殖部位念珠菌病 | Other urogenital candidiasis |
| `B37.81` | 念珠菌性食道炎 | 念珠菌性食道炎 | Candidal esophagitis |
| `B37.82` | 念珠菌性腸炎 | 念珠菌性腸炎 | Candidal enteritis |
| `B37.83` | 念珠菌性唇炎 | 念珠菌性唇炎 | Candidal cheilitis |
| `L21.0` | 頭皮脂漏 | 頭皮脂漏 | Seborrhea capitis |
| `L21.9` | 脂漏性皮膚炎 | 脂漏性皮膚炎 | Seborrheic dermatitis, unspecified |
| `B49` | 黴菌病 | 黴菌病 | Unspecified mycosis |
| `B45.9` | 隱球菌病 | 隱球菌病 | Cryptococcosis, unspecified |
| `B44.9` | 麴菌病 | 麴菌病 | Aspergillosis, unspecified |
| `B44.81` | 過敏性支氣管肺麴菌病 ABPA | 過敏性支氣管與肺之麴菌病 | Allergic bronchopulmonary aspergillosis |
| `L60.0` | 甲內生（嵌甲） | 指（趾）甲內生 | Ingrowing nail |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |

#### 帶狀疱疹／後神經痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `M79.2` | 神經痛 | 神經痛及神經炎 | Neuralgia and neuritis, unspecified |
| `G89.29` | 其他慢性疼痛 | 其他慢性疼痛 | Other chronic pain |
| `R20.2` | 皮膚感覺異常 | 皮膚感覺異常 | Paresthesia of skin |
| **常見疾病** | | | |
| `B02.9` | 帶狀疱疹（未伴併發症） | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `B02.29` | 疱疹後侵及其他神經系統 | 疱疹後侵及其他神經系統 | Other postherpetic nervous system involvement |
| `B02.23` | 疱疹後多發神經病變 | 疱疹後多發神經病變 | Postherpetic polyneuropathy |
| `B02.22` | 疱疹後三叉神經痛 | 疱疹後三叉神經痛 | Postherpetic trigeminal neuralgia |
| `B02.21` | 疱疹後膝狀神經節炎（Ramsay Hunt） | 疱疹後膝狀神經節炎 | Postherpetic geniculate ganglionitis |
| `B02.24` | 疱疹後脊髓炎 | 疱疹後脊髓炎 | Postherpetic myelitis |
| `B02.30` | 帶狀疱疹眼病 | 帶狀疱疹眼病 | Zoster ocular disease, unspecified |
| `B02.33` | 帶狀疱疹性角膜炎 | 帶狀疱疹性角膜炎 | Zoster keratitis |
| `B02.31` | 帶狀疱疹性結膜炎 | 帶狀疱疹性結膜炎 | Zoster conjunctivitis |
| `B02.32` | 帶狀疱疹性虹膜睫狀體炎 | 帶狀疱疹性虹膜睫狀體炎 | Zoster iridocyclitis |
| `B02.34` | 帶狀疱疹性鞏膜炎 | 帶狀疱疹性鞏膜炎 | Zoster scleritis |
| `B02.7` | 散播性帶狀疱疹 | 散播性帶狀疱疹 | Disseminated zoster |
| `B02.8` | 帶狀疱疹伴其他併發症 | 帶狀疱疹伴有其他併發症 | Zoster with other complications |
| `B02.0` | 帶狀疱疹性腦炎 | 帶狀疱疹性腦炎 | Zoster encephalitis |
| `B02.1` | 帶狀疱疹性腦膜炎 | 帶狀疱疹性腦膜炎 | Zoster meningitis |
| `B00.1` | 疱疹病毒性水疱皮膚炎 | 疱疹病毒性囊泡狀皮膚炎 | Herpesviral vesicular dermatitis |
| `B00.9` | 單純疱疹病毒感染 | 疱疹病毒感染 | Herpesviral infection, unspecified |
| `B01.9` | 水痘（未伴併發症） | 水痘未伴有併發症 | Varicella without complication |
| `G50.0` | 三叉神經痛 | 三叉神經痛 | Trigeminal neuralgia |
| `G58.0` | 肋間神經病變 | 肋間神經病變 | Intercostal neuropathy |
| `G89.4` | 慢性痛症候群 | 慢性痛症候群 | Chronic pain syndrome |
| `R52` | 疼痛 | 疼痛 | Pain, unspecified |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |

#### 疥瘡／蟲咬

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `L29.9` | 搔癢 | 搔癢症 | Pruritus, unspecified |
| `R21` | 皮疹 | 皮疹及其他非特定性皮膚出疹 | Rash and other nonspecific skin eruption |
| **常見疾病** | | | |
| `B86` | 疥瘡 | 疥癬(疥瘡) | Scabies |
| `B88.0` | 其他疥蟲病 | 其他疥蟲病 | Other acariasis |
| `B85.2` | 蝨病 | 蝨病 | Pediculosis, unspecified |
| `B85.0` | 頭蝨病 | 人類頭蝨所致之蝨病 | Pediculosis due to Pediculus humanus capitis |
| `B85.1` | 體蝨病 | 人類體蝨所致之蝨病 | Pediculosis due to Pediculus humanus corporis |
| `B85.3` | 陰蝨病 | 蝨病 | Phthiriasis |
| `B88.9` | 侵染症 | 侵染(症) | Infestation, unspecified |
| `B88.2` | 其他節肢動物侵染 | 其他節肢動物侵染 | Other arthropod infestations |
| `B88.8` | 其他特定病蟲侵染 | 其他特定之病蟲侵染 | Other specified infestations |
| `W57.XXXA` | 無毒昆蟲叮咬（外因附加碼） | 被無毒昆蟲或節肢動物叮咬（傷）或螯（傷）之初期照護 | Bitten or stung by nonvenomous insect and other nonvenomous arthropods, initial encounter |
| `T63.441A` | 蜜蜂螫傷（毒性作用，初期照護） | 蜜蜂之毒液意外毒性作用之初期照護 | Toxic effect of venom of bees, accidental (unintentional), initial encounter |
| `T63.461A` | 黃蜂螫傷（初期照護） | 黃蜂之毒液意外毒性作用之初期照護 | Toxic effect of venom of wasps, accidental (unintentional), initial encounter |
| `L50.9` | 蕁麻疹 | 蕁麻疹 | Urticaria, unspecified |
| `L30.9` | 皮膚炎 | 皮膚炎 | Dermatitis, unspecified |
| `L23.9` | 過敏性接觸性皮膚炎 | 過敏性接觸性皮膚炎，未明示原因 | Allergic contact dermatitis, unspecified cause |
| `T78.40XA` | 過敏反應（初期照護） | 過敏之初期照護 | Allergy, unspecified, initial encounter |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `L01.00` | 膿痂疹 | 膿痂疹 | Impetigo, unspecified |
| `L28.0` | 慢性單純苔癬 | 慢性單純苔癬 | Lichen simplex chronicus |
| `A28.1` | 貓抓病 | 貓抓病 | Cat-scratch disease |
| `A75.3` | 恙蟲病 | 恙蟲立克次體所致之斑疹傷寒熱 | Typhus fever due to Rickettsia tsutsugamushi |
| `A69.20` | 萊姆病 | 萊姆病 | Lyme disease, unspecified |

#### 糖尿病足／慢性傷口

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `Z48.00` | 非手術傷口換藥 | 來院接受更換或移除非手術傷口敷料 | Encounter for change or removal of nonsurgical wound dressing |
| `Z48.01` | 手術傷口換藥 | 來院接受更換或移除手術傷口敷料 | Encounter for change or removal of surgical wound dressing |
| `L97.509` | 足部慢性潰瘍（非壓迫性、未明示嚴重度） | 未明示側性足部其他部位非壓迫性慢性潰瘍，未明示嚴重程度 | Non-pressure chronic ulcer of other part of unspecified foot with unspecified severity |
| **常見疾病** | | | |
| `E11.621` | 第二型糖尿病伴足部潰瘍 | 第二型糖尿病，伴有足部潰瘍 | Type 2 diabetes mellitus with foot ulcer |
| `E11.622` | 第二型糖尿病伴其他皮膚潰瘍 | 第二型糖尿病，伴有其他皮膚潰瘍 | Type 2 diabetes mellitus with other skin ulcer |
| `E11.40` | 第二型糖尿病伴神經病變 | 第二型糖尿病，伴有糖尿病的神經病變 | Type 2 diabetes mellitus with diabetic neuropathy, unspecified |
| `E11.42` | 第二型糖尿病伴多發神經病變 | 第二型糖尿病，伴有糖尿病的多發神經病變 | Type 2 diabetes mellitus with diabetic polyneuropathy |
| `E11.51` | 第二型糖尿病伴周邊血管病變（未伴壞疽） | 第二型糖尿病，伴有糖尿病的周邊血管病變，未伴有壞疽 | Type 2 diabetes mellitus with diabetic peripheral angiopathy without gangrene |
| `E11.52` | 第二型糖尿病伴周邊血管病變伴壞疽 | 第二型糖尿病，伴有糖尿病的周邊血管病變，伴有壞疽 | Type 2 diabetes mellitus with diabetic peripheral angiopathy with gangrene |
| `E11.610` | 第二型糖尿病伴神經病變性關節病變（夏柯氏足） | 第二型糖尿病，伴有糖尿病的神經病變引起之關節病變 | Type 2 diabetes mellitus with diabetic neuropathic arthropathy |
| `E11.65` | 第二型糖尿病伴高血糖 | 第二型糖尿病，伴有高血糖 | Type 2 diabetes mellitus with hyperglycemia |
| `L97.504` | 足部慢性潰瘍（非壓迫性、伴骨壞死） | 未明示側性足部其他部位非壓迫性慢性潰瘍與骨壞死 | Non-pressure chronic ulcer of other part of unspecified foot with necrosis of bone |
| `L97.503` | 足部慢性潰瘍（非壓迫性、伴肌肉壞死） | 未明示側性足部其他部位非壓迫性慢性潰瘍與肌肉壞死 | Non-pressure chronic ulcer of other part of unspecified foot with necrosis of muscle |
| `L97.502` | 足部慢性潰瘍（非壓迫性、伴脂肪層暴露） | 未明示側性足部其他部位非壓迫性慢性潰瘍與脂肪層暴露 | Non-pressure chronic ulcer of other part of unspecified foot with fat layer exposed |
| `L97.501` | 足部慢性潰瘍（非壓迫性、限於皮膚破損） | 未明示側性足部其他部位非壓迫性慢性潰瘍局限於皮膚損壞 | Non-pressure chronic ulcer of other part of unspecified foot limited to breakdown of skin |
| `L97.409` | 腳跟及足弓慢性潰瘍（非壓迫性） | 未明示側性腳跟及足弓非壓迫性慢性潰瘍，未明示嚴重程度 | Non-pressure chronic ulcer of unspecified heel and midfoot with unspecified severity |
| `L97.809` | 小腿其他部位慢性潰瘍（非壓迫性） | 未明示側性小腿其他部位非壓迫性慢性潰瘍，未明示嚴重程度 | Non-pressure chronic ulcer of other part of unspecified lower leg with unspecified severity |
| `L97.909` | 小腿慢性潰瘍（非壓迫性、未明示部位） | 未明示側性小腿未明示部位非壓迫性慢性潰瘍，未明示嚴重程度 | Non-pressure chronic ulcer of unspecified part of unspecified lower leg with unspecified severity |
| `L98.499` | 其他部位皮膚慢性潰瘍（非壓迫性） | 其他部位的皮膚非壓迫性慢性潰瘍，未明示嚴重程度 | Non-pressure chronic ulcer of skin of other sites with unspecified severity |
| `L89.90` | 壓迫性潰瘍（未明示部位及分期） | 未明示部位之壓迫性潰瘍，未明示分期 | Pressure ulcer of unspecified site, unspecified stage |
| `M86.9` | 骨髓炎 | 骨髓炎 | Osteomyelitis, unspecified |
| `M86.60` | 其他慢性骨髓炎（未明示部位） | 未明示部位其他慢性骨髓炎 | Other chronic osteomyelitis, unspecified site |
| `M86.679` | 踝部及足部其他慢性骨髓炎（未明示側） | 未明示側性踝部及足部其他慢性骨髓炎 | Other chronic osteomyelitis, unspecified ankle and foot |
| `L03.119` | 肢體蜂窩組織炎（未明示部位） | 肢體未明示部位蜂窩組織炎 | Cellulitis of unspecified part of limb |
| `L03.039` | 腳趾蜂窩組織炎（未明示側） | 未明示側性腳趾蜂窩組織炎 | Cellulitis of unspecified toe |
| `L02.419` | 肢體皮膚膿瘍 | 未明示肢體皮膚膿瘍 | Cutaneous abscess of limb, unspecified |
| `I70.209` | 四肢動脈粥狀硬化（未明示） | 未明示四肢動脈粥樣硬化 | Unspecified atherosclerosis of native arteries of extremities, unspecified extremity |
| `I73.9` | 末梢血管疾病 | 末梢血管疾病 | Peripheral vascular disease, unspecified |
| `I87.2` | 慢性靜脈功能不足 | 靜脈功能不足（慢性）（周邊） | Venous insufficiency (chronic) (peripheral) |
| `B35.1` | 甲癬 | 甲癬 | Tinea unguium |
| `B35.3` | 足癬 | 足癬 | Tinea pedis |
| `L60.0` | 甲內生（嵌甲） | 指（趾）甲內生 | Ingrowing nail |
| `Z89.419` | 大腳趾後天性缺損（截趾後） | 未明示側性大腳趾後天性缺損 | Acquired absence of unspecified great toe |
| `Z79.4` | 長期使用胰島素 | 長期（現在之）服用胰島素 | Long term (current) use of insulin |
| `Z16.24` | 多重抗生素抗藥性（附加碼） | 多種抗生素之抗藥性 | Resistance to multiple antibiotics |

### 肌肉骨骼

#### 關節痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `M25.50` | 關節痛 | 關節痛 | Pain in unspecified joint |
| `M25.561` | 右膝痛 | 右側膝部關節痛 | Pain in right knee |
| `M25.562` | 左膝痛 | 左側膝部關節痛 | Pain in left knee |
| `M25.511` | 右肩痛 | 右側肩部關節痛 | Pain in right shoulder |
| `M25.512` | 左肩痛 | 左側肩部關節痛 | Pain in left shoulder |
| **常見疾病** | | | |
| `M10.9` | 痛風 | 痛風 | Gout, unspecified |
| `M19.90` | 骨關節炎（未明示部位） | 未明示部位骨關節炎 | Unspecified osteoarthritis, unspecified site |
| `M17.9` | 膝部骨關節炎 | 膝部骨關節炎 | Osteoarthritis of knee, unspecified |
| `M17.0` | 雙側膝部原發性骨關節炎 | 膝部原發性骨關節炎，雙側性 | Bilateral primary osteoarthritis of knee |
| `M17.11` | 右膝原發性骨關節炎（單側） | 右側膝部原發性骨關節炎，單側性 | Unilateral primary osteoarthritis, right knee |
| `M17.12` | 左膝原發性骨關節炎（單側） | 左側膝部原發性骨關節炎，單側性 | Unilateral primary osteoarthritis, left knee |
| `M15.0` | 原發性廣泛性骨關節炎 | 原發性廣泛性(骨)關節炎 | Primary generalized (osteo)arthritis |
| `M06.9` | 類風濕性關節炎 RA | 類風濕性關節炎 | Rheumatoid arthritis, unspecified |
| `M05.79` | 多部位類風濕性關節炎伴類風濕因子（未侵及器官） | 多部位類風濕性關節炎伴有類風濕因子，未侵及器官及系統 | Rheumatoid arthritis with rheumatoid factor of multiple sites without organ or systems involvement |
| `M11.20` | 其他軟骨鈣化症（假性痛風、未明示部位） | 未明示部位其他軟骨鈣化症 | Other chondrocalcinosis, unspecified site |
| `M13.0` | 多發性關節炎 | 多發性關節炎 | Polyarthritis, unspecified |
| `M12.9` | 關節病變 | 關節病變 | Arthropathy, unspecified |
| `M02.9` | 反應性關節病變 | 反應性關節病變 | Reactive arthropathy, unspecified |
| `M45.9` | 僵直性脊椎炎（未明示部位） | 未明示部位脊椎僵直性脊椎炎 | Ankylosing spondylitis of unspecified sites in spine |
| `L40.50` | 關節病型乾癬（乾癬性關節炎） | 關節病型乾癬 | Arthropathic psoriasis, unspecified |
| `M32.9` | 全身性紅斑性狼瘡 SLE | 全身性紅斑性狼瘡 | Systemic lupus erythematosus, unspecified |
| `M35.00` | 修格蘭氏症候群（乾燥症） | sjogren's症候群 | Sjogren syndrome, unspecified |
| `M79.7` | 纖維肌痛 | 纖維肌痛 | Fibromyalgia |
| `M75.00` | 肩部沾黏性關節囊炎（五十肩、未明示側） | 未明示側性肩部粘連性囊炎 | Adhesive capsulitis of unspecified shoulder |
| `M75.100` | 肩部旋轉肌袖撕裂（未明示側、非創傷性） | 未明示側性肩部旋轉環帶撕裂或破裂，未明示為創傷性 | Unspecified rotator cuff tear or rupture of unspecified shoulder, not specified as traumatic |
| `M77.10` | 肘外側上髁炎（網球肘、未明示側） | 未明示側性肘外側上髁炎 | Lateral epicondylitis, unspecified elbow |
| `M65.9` | 滑膜炎及腱鞘炎 | 其他滑膜炎及腱鞘炎 | Synovitis and tenosynovitis, unspecified |
| `M65.30` | 扳機指（未明示手指） | 扳機指 | Trigger finger, unspecified finger |
| `M71.9` | 滑囊病變 | 滑囊病變 | Bursopathy, unspecified |
| `M76.60` | 跟腱肌腱炎（未明示側） | 未明示側性小腿跟腱肌腱炎 | Achilles tendinitis, unspecified leg |
| `M72.2` | 足底筋膜炎（蹠筋膜纖維瘤症） | 蹠筋膜纖維瘤症 | Plantar fascial fibromatosis |
| `M00.9` | 化膿性關節炎 | 化膿性關節炎 | Pyogenic arthritis, unspecified |
| `M79.10` | 肌痛症 | 肌痛症 | Myalgia, unspecified site |
| `E79.0` | 高尿酸血症（未伴發炎性關節炎及痛風石） | 高尿酸血症未伴有關節炎及痛風石 | Hyperuricemia without signs of inflammatory arthritis and tophaceous disease |

#### 背痛／頸痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `M54.50` | 下背痛 | 下背痛 | Low back pain, unspecified |
| `M54.2` | 頸椎痛 | 頸椎痛 | Cervicalgia |
| **常見疾病** | | | |
| `M54.59` | 其他下背痛 | 其他下背痛 | Other low back pain |
| `M54.51` | 椎體性下背痛 | 椎體性下背痛 | Vertebrogenic low back pain |
| `M54.9` | 背痛（未明示） | 背痛 | Dorsalgia, unspecified |
| `M62.830` | 背部肌肉痙攣 | 背部肌肉痙攣 | Muscle spasm of back |
| `M54.16` | 腰椎神經根病變 | 腰椎神經根病變 | Radiculopathy, lumbar region |
| `M54.30` | 坐骨神經痛（未明示側） | 未明示側性坐骨神經痛 | Sciatica, unspecified side |
| `M54.40` | 腰痛伴坐骨神經痛（未明示側） | 未明示側性腰痛伴有坐骨神經痛 | Lumbago with sciatica, unspecified side |
| `M51.26` | 腰椎椎間盤移位 | 其他腰椎椎間盤移位 | Other intervertebral disc displacement, lumbar region |
| `M51.36` | 其他腰椎椎間盤退化 | 其他腰椎椎間盤退化 | Other intervertebral disc degeneration, lumbar region |
| `M47.816` | 腰椎退化性脊椎炎（未伴脊髓或神經根病變） | 腰椎退化性脊椎炎未伴有脊髓病變或神經根病變 | Spondylosis without myelopathy or radiculopathy, lumbar region |
| `M48.061` | 腰椎脊椎狹窄（未伴神經性跛行） | 腰椎脊椎狹窄症未伴有神經源性跛行 | Spinal stenosis, lumbar region without neurogenic claudication |
| `M43.16` | 腰椎脊椎滑脫症 | 腰椎脊椎滑脫症 | Spondylolisthesis, lumbar region |
| `M54.6` | 胸椎痛 | 胸椎痛 | Pain in thoracic spine |
| `M54.12` | 頸椎神經根病變 | 頸椎神經根病變 | Radiculopathy, cervical region |
| `M50.20` | 其他頸椎椎間盤移位（未明示頸椎） | 未明示頸椎之其他頸椎椎間盤移位 | Other cervical disc displacement, unspecified cervical region |
| `M50.30` | 其他頸椎椎間盤退化（未明示頸椎） | 未明示頸椎之其他頸椎椎間盤退化 | Other cervical disc degeneration, unspecified cervical region |
| `M47.812` | 頸椎退化性脊椎炎（未伴脊髓或神經根病變） | 頸椎退化性脊椎炎未伴有脊髓病變或神經根病變 | Spondylosis without myelopathy or radiculopathy, cervical region |
| `M48.02` | 頸椎脊椎狹窄症 | 頸椎脊椎狹窄症 | Spinal stenosis, cervical region |
| `M19.90` | 骨關節炎（未明示部位） | 未明示部位骨關節炎 | Unspecified osteoarthritis, unspecified site |
| `M45.9` | 僵直性脊椎炎（未明示部位） | 未明示部位脊椎僵直性脊椎炎 | Ankylosing spondylitis of unspecified sites in spine |
| `M81.0` | 老年性骨質疏鬆（未伴病理性骨折） | 老年性骨質疏鬆症未伴有病理性骨折 | Age-related osteoporosis without current pathological fracture |
| `M80.08XA` | 椎骨老年性骨質疏鬆伴病理性骨折（初期照護） | 椎骨老年性骨質疏鬆症伴有病理性骨折之初期照護 | Age-related osteoporosis with current pathological fracture, vertebra(e), initial encounter for fracture |
| `M80.08XD` | 椎骨老年性骨質疏鬆伴病理性骨折（後續照護） | 椎骨老年性骨質疏鬆症伴有病理性骨折，癒合之後續照護 | Age-related osteoporosis with current pathological fracture, vertebra(e), subsequent encounter for fracture with routine healing |
| `M46.20` | 脊椎骨髓炎（未明示部位） | 未明示部位脊椎骨髓炎 | Osteomyelitis of vertebra, site unspecified |
| `A18.01` | 脊椎結核 | 脊椎結核病 | Tuberculosis of spine |
| `C79.51` | 骨骼續發性惡性腫瘤（骨轉移） | 骨骼續發性惡性腫瘤 | Secondary malignant neoplasm of bone |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `M79.18` | 其他部位肌痛症 | 其他部位肌痛症 | Myalgia, other site |
| `M79.7` | 纖維肌痛 | 纖維肌痛 | Fibromyalgia |
| `M48.50XD` | 脊椎塌陷（部位未明示，後續照護） | 未明示部位脊椎萎(塌)陷癒合之後續照護，他處未歸類 | Collapsed vertebra, not elsewhere classified, site unspecified, subsequent encounter for fracture with routine healing |

#### 肢體麻木

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R20.2` | 皮膚感覺異常 | 皮膚感覺異常 | Paresthesia of skin |
| **常見疾病** | | | |
| `G62.9` | 多發神經病變 | 多發神經病變 | Polyneuropathy, unspecified |
| `E11.42` | 第二型糖尿病伴多發神經病變 | 第二型糖尿病，伴有糖尿病的多發神經病變 | Type 2 diabetes mellitus with diabetic polyneuropathy |
| `E11.40` | 第二型糖尿病伴神經病變 | 第二型糖尿病，伴有糖尿病的神經病變 | Type 2 diabetes mellitus with diabetic neuropathy, unspecified |
| `G56.00` | 腕隧道症候群（未明示側） | 未明示側性腕隧道症候群 | Carpal tunnel syndrome, unspecified upper limb |
| `G56.01` | 右側腕隧道症候群 | 右側腕隧道症候群 | Carpal tunnel syndrome, right upper limb |
| `G56.02` | 左側腕隧道症候群 | 左側腕隧道症候群 | Carpal tunnel syndrome, left upper limb |
| `G56.20` | 尺神經病灶（未明示側） | 未明示側性尺神經病灶 | Lesion of ulnar nerve, unspecified upper limb |
| `M54.16` | 腰椎神經根病變 | 腰椎神經根病變 | Radiculopathy, lumbar region |
| `M54.12` | 頸椎神經根病變 | 頸椎神經根病變 | Radiculopathy, cervical region |
| `G57.00` | 下肢坐骨神經病灶（未明示側） | 未明示側性下肢坐骨神經病灶 | Lesion of sciatic nerve, unspecified lower limb |
| `G62.0` | 藥物導致之多發神經病變 | 藥物導致之多發神經病變 | Drug-induced polyneuropathy |
| `G62.1` | 酒精性多發神經病變 | 酒精性多發神經病變 | Alcoholic polyneuropathy |
| `E53.8` | 其他特定維生素 B 群缺乏症 | 其他特定維生素B群缺乏症 | Deficiency of other specified B group vitamins |
| `D51.9` | 維生素 B12 缺乏性貧血 | 維生素B12缺乏性貧血 | Vitamin B12 deficiency anemia, unspecified |
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `N18.9` | 慢性腎臟疾病 CKD | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `G45.9` | 短暫性腦缺血發作 TIA | 短暫性大腦缺血發作 | Transient cerebral ischemic attack, unspecified |
| `I73.9` | 末梢血管疾病 | 末梢血管疾病 | Peripheral vascular disease, unspecified |
| `G35` | 多發性硬化症 | 多發性硬化症 | Multiple sclerosis |
| `G58.7` | 多發性單一神經炎 | 多發性單一神經炎 | Mononeuritis multiplex |
| `B02.23` | 疱疹後多發神經病變 | 疱疹後多發神經病變 | Postherpetic polyneuropathy |
| `R20.0` | 皮膚感覺喪失 | 皮膚感覺喪失 | Anesthesia of skin |
| `R20.1` | 皮膚感覺減低 | 皮膚感覺減低 | Hypoesthesia of skin |
| `R20.3` | 感覺過度敏感 | 感覺過度敏感 | Hyperesthesia |
| `M35.00` | 修格蘭氏症候群（乾燥症） | sjogren's症候群 | Sjogren syndrome, unspecified |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |

### 代謝／檢驗

#### 檢驗異常

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R73.03` | 糖尿病前期 | 糖尿病前期 | Prediabetes |
| `R73.9` | 高血糖 | 高血糖 | Hyperglycemia, unspecified |
| `R74.01` | 肝指數上升（轉胺酶） | 轉胺基脢含量上升 | Elevation of levels of liver transaminase levels |
| `R80.9` | 蛋白尿 | 蛋白尿 | Proteinuria, unspecified |
| `R79.89` | 其他檢驗異常 | 其他特定性血液化學異常發現 | Other specified abnormal findings of blood chemistry |
| **常見疾病** | | | |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `E11.65` | 第二型糖尿病伴高血糖 | 第二型糖尿病，伴有高血糖 | Type 2 diabetes mellitus with hyperglycemia |
| `R73.01` | 空腹血糖異常 | 空腹血糖異常 | Impaired fasting glucose |
| `R73.02` | 葡萄糖耐受不良（口服） | 葡萄糖耐受不良(口服) | Impaired glucose tolerance (oral) |
| `E10.9` | 第一型糖尿病（未伴併發症） | 第一型糖尿病，未伴有併發症 | Type 1 diabetes mellitus without complications |
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `E78.5` | 高血脂症 | 高血脂症 | Hyperlipidemia, unspecified |
| `E78.00` | 純高膽固醇血症 | 純高膽固醇血症 | Pure hypercholesterolemia, unspecified |
| `E78.1` | 純高三酸甘油酯血症 | 純高三酸甘油酯血症 | Pure hyperglyceridemia |
| `E78.2` | 混合型高血脂症 | 混合型高血脂症 | Mixed hyperlipidemia |
| `E88.81` | 新陳代謝症候群 | 新陳代謝症候群 | Metabolic syndrome |
| `E66.9` | 肥胖 | 肥胖 | Obesity, unspecified |
| `E66.01` | 病態性肥胖（熱量過多） | 起因於熱量過多的病態性(重度)肥胖 | Morbid (severe) obesity due to excess calories |
| `E79.0` | 高尿酸血症（未伴發炎性關節炎及痛風石） | 高尿酸血症未伴有關節炎及痛風石 | Hyperuricemia without signs of inflammatory arthritis and tophaceous disease |
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `E05.90` | 甲狀腺毒症／甲亢（未伴危象或風暴） | 未明示之甲狀腺毒症，未伴有甲狀腺毒性危象或風暴 | Thyrotoxicosis, unspecified without thyrotoxic crisis or storm |
| `E06.3` | 自體免疫甲狀腺炎 | 自體免疫的甲狀腺炎 | Autoimmune thyroiditis |
| `R94.6` | 甲狀腺功能檢查結果異常 | 甲狀腺功能檢查結果異常 | Abnormal results of thyroid function studies |
| `E04.1` | 非毒性單一甲狀腺結節 | 非毒性單一甲狀腺結節 | Nontoxic single thyroid nodule |
| `E03.8` | 其他特定甲狀腺功能低下 | 其他特定甲狀腺低下 | Other specified hypothyroidism |
| `N18.9` | 慢性腎臟疾病 CKD | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `N18.30` | 第三期慢性腎臟疾病 | 慢性腎臟疾病stage 3 | Chronic kidney disease, stage 3 unspecified |
| `N18.31` | 第三a期慢性腎臟疾病 | 慢性腎臟疾病stage 3a | Chronic kidney disease, stage 3a |
| `N18.32` | 第三b期慢性腎臟疾病 | 慢性腎臟疾病stage 3b | Chronic kidney disease, stage 3b |
| `N18.4` | 第四期慢性腎臟疾病（重度） | 第四期慢性腎臟疾病(重度) | Chronic kidney disease, stage 4 (severe) |
| `E11.22` | 第二型糖尿病伴糖尿病慢性腎臟疾病 | 第二型糖尿病，糖尿病的慢性腎臟疾病 | Type 2 diabetes mellitus with diabetic chronic kidney disease |
| `N06.9` | 單獨性蛋白尿（未特異性組織形態改變） | 單獨性蛋白尿伴有非特異性的組織形態改變 | Isolated proteinuria with unspecified morphologic lesion |
| `R80.1` | 持續性蛋白尿 | 持續性蛋白尿 | Persistent proteinuria, unspecified |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `D50.9` | 缺鐵性貧血 | 缺鐵性貧血 | Iron deficiency anemia, unspecified |
| `D51.9` | 維生素 B12 缺乏性貧血 | 維生素B12缺乏性貧血 | Vitamin B12 deficiency anemia, unspecified |
| `D52.9` | 葉酸缺乏性貧血 | 葉酸缺乏性貧血 | Folate deficiency anemia, unspecified |
| `D63.1` | 慢性腎臟疾病導致的貧血（附加碼） | 慢性腎臟疾病導致的貧血 | Anemia in chronic kidney disease |
| `D69.6` | 血小板缺乏症 | 血小板缺乏症 | Thrombocytopenia, unspecified |
| `D72.829` | 白血球計數上升 | 白血球計數上升 | Elevated white blood cell count, unspecified |
| `D72.819` | 白血球計數下降 | 白血球計數下降 | Decreased white blood cell count, unspecified |
| `K76.0` | 脂肪肝 | 脂肪肝(變化)，他處未歸類者 | Fatty (change of) liver, not elsewhere classified |
| `K75.81` | 非酒精性脂肪肝炎 NASH | 非酒精性脂肪肝炎 | Nonalcoholic steatohepatitis (NASH) |
| `E87.1` | 低血鈉及低滲透壓 | 低滲壓及低血鈉 | Hypo-osmolality and hyponatremia |
| `E87.6` | 低血鉀症 | 低血鉀症 | Hypokalemia |
| `E87.5` | 高血鉀症 | 高血鉀症 | Hyperkalemia |
| `E83.52` | 高血鈣症 | 高血鈣症 | Hypercalcemia |
| `E21.3` | 副甲狀腺功能亢進 | 副甲狀腺亢進 | Hyperparathyroidism, unspecified |
| `E55.9` | 維生素 D 缺乏 | 維生素D缺乏 | Vitamin D deficiency, unspecified |
| `R77.1` | 球蛋白異常 | 球蛋白異常 | Abnormality of globulin |
| `R79.1` | 凝血功能狀況異常 | 凝血功能狀況異常 | Abnormal coagulation profile |
| `R93.2` | 肝膽影像異常 | 肝及膽道診斷性影像異常發現 | Abnormal findings on diagnostic imaging of liver and biliary tract |
| `R91.8` | 肺部影像其他異常 | 肺部其他非特定性異常發現 | Other nonspecific abnormal finding of lung field |
| `R94.31` | 心電圖檢查結果異常 | 心電圖檢查結果異常 | Abnormal electrocardiogram [ECG] [EKG] |
| `R70.0` | 紅血球沉降速率上升 ESR | 紅血球沉降速率升高 | Elevated erythrocyte sedimentation rate |
| `R79.82` | C-反應蛋白上升 CRP | C-反應蛋白升高 | Elevated C-reactive protein (CRP) |

## 外科（9 張面板）

### 撕裂傷

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `S01.01XA` | 頭皮撕裂傷（未伴異物，初期照護） | 頭皮撕裂傷未伴有異物之初期照護 | Laceration without foreign body of scalp, initial encounter |
| `S01.02XA` | 頭皮撕裂傷併異物（初期照護） | 頭皮撕裂傷伴有異物之初期照護 | Laceration with foreign body of scalp, initial encounter |
| `S01.81XA` | 頭部其他部位撕裂傷（未伴異物，初期照護） | 頭部其他部位撕裂傷未伴有異物之初期照護 | Laceration without foreign body of other part of head, initial encounter |
| `S01.82XA` | 頭部其他部位撕裂傷併異物（初期照護） | 頭部其他部位撕裂傷伴有異物之初期照護 | Laceration with foreign body of other part of head, initial encounter |
| `S01.511A` | 嘴唇撕裂傷（未伴異物，初期照護） | 唇撕裂傷未伴有異物之初期照護 | Laceration without foreign body of lip, initial encounter |
| `S01.521A` | 嘴唇撕裂傷併異物（初期照護） | 唇撕裂傷伴有異物之初期照護 | Laceration with foreign body of lip, initial encounter |
| `S61.419A` | 手部撕裂傷（未伴異物，初期照護） | 未明示側性手部撕裂傷未伴有異物之初期照護 | Laceration without foreign body of unspecified hand, initial encounter |
| `S61.429A` | 手部撕裂傷併異物（初期照護） | 未明示側性手部撕裂傷伴有異物之初期照護 | Laceration with foreign body of unspecified hand, initial encounter |
| `S51.819A` | 前臂撕裂傷（未伴異物，初期照護） | 未明示側性前臂撕裂傷未伴有異物之初期照護 | Laceration without foreign body of unspecified forearm, initial encounter |
| `S51.829A` | 前臂撕裂傷併異物（初期照護） | 未明示側性前臂撕裂傷伴有異物之初期照護 | Laceration with foreign body of unspecified forearm, initial encounter |
| `S81.819A` | 小腿撕裂傷（未伴異物，初期照護） | 未明示側性小腿未伴有異物撕裂傷之初期照護 | Laceration without foreign body, unspecified lower leg, initial encounter |
| `S81.829A` | 小腿撕裂傷併異物（初期照護） | 未明示側性小腿伴有異物撕裂傷之初期照護 | Laceration with foreign body, unspecified lower leg, initial encounter |
| `S91.319A` | 足部撕裂傷（未伴異物，初期照護） | 未明示側性足部撕裂傷未伴有異物之初期照護 | Laceration without foreign body, unspecified foot, initial encounter |
| `S91.329A` | 足部撕裂傷併異物（初期照護） | 未明示側性足部撕裂傷伴有異物之初期照護 | Laceration with foreign body, unspecified foot, initial encounter |
| `S71.119A` | 大腿撕裂傷（未伴異物，初期照護） | 未明示側性大腿未伴有異物撕裂傷之初期照護 | Laceration without foreign body, unspecified thigh, initial encounter |
| `S71.129A` | 大腿撕裂傷併異物（初期照護） | 未明示側性大腿伴有異物撕裂傷之初期照護 | Laceration with foreign body, unspecified thigh, initial encounter |
| `S81.019A` | 膝部撕裂傷（未伴異物，初期照護） | 未明示側性膝部未伴有異物撕裂傷之初期照護 | Laceration without foreign body, unspecified knee, initial encounter |
| `S81.029A` | 膝部撕裂傷併異物（初期照護） | 未明示側性膝部伴有異物撕裂傷之初期照護 | Laceration with foreign body, unspecified knee, initial encounter |
| `S41.119A` | 上臂撕裂傷（未伴異物，初期照護） | 未明示側性上臂撕裂傷未伴有異物之初期照護 | Laceration without foreign body of unspecified upper arm, initial encounter |
| `S41.129A` | 上臂撕裂傷併異物（初期照護） | 未明示側性上臂撕裂傷伴有異物之初期照護 | Laceration with foreign body of unspecified upper arm, initial encounter |
| `S01.419A` | 臉頰撕裂傷（未伴異物，初期照護） | 未明示側性臉頰與顳骨下頜周圍撕裂傷未伴有異物之初期照護 | Laceration without foreign body of unspecified cheek and temporomandibular area, initial encounter |
| `S01.429A` | 臉頰撕裂傷併異物（初期照護） | 未明示側性臉頰與顳骨下頜周圍撕裂傷伴有異物之初期照護 | Laceration with foreign body of unspecified cheek and temporomandibular area, initial encounter |
| `S01.319A` | 耳撕裂傷（未伴異物，初期照護） | 未明示側性耳撕裂傷未伴有異物之初期照護 | Laceration without foreign body of unspecified ear, initial encounter |
| `S01.329A` | 耳撕裂傷併異物（初期照護） | 未明示側性耳撕裂傷伴有異物之初期照護 | Laceration with foreign body of unspecified ear, initial encounter |
| `S01.21XA` | 鼻撕裂傷（未伴異物，初期照護） | 鼻撕裂傷未伴有異物之初期照護 | Laceration without foreign body of nose, initial encounter |
| `S01.22XA` | 鼻撕裂傷併異物（初期照護） | 鼻撕裂傷伴有異物之初期照護 | Laceration with foreign body of nose, initial encounter |

### 挫傷／擦傷

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `S00.03XA` | 頭皮挫傷（初期照護） | 頭皮挫傷之初期照護 | Contusion of scalp, initial encounter |
| `S60.229A` | 手部挫傷（初期照護） | 未明示側性手部挫傷之初期照護 | Contusion of unspecified hand, initial encounter |
| `S80.11XA` | 右小腿挫傷（初期照護） | 右側小腿挫傷之初期照護 | Contusion of right lower leg, initial encounter |
| `S80.12XA` | 左小腿挫傷（初期照護） | 左側小腿挫傷之初期照護 | Contusion of left lower leg, initial encounter |
| `S60.519A` | 手部擦傷（初期照護） | 未明示側性手部擦傷之初期照護 | Abrasion of unspecified hand, initial encounter |
| `T14.90XA` | 未明示損傷（初期照護） | 損傷之初期照護 | Injury, unspecified, initial encounter |
| `S70.10XA` | 大腿挫傷（初期照護） | 未明示側性大腿挫傷之初期照護 | Contusion of unspecified thigh, initial encounter |
| `S80.00XA` | 膝部挫傷（初期照護） | 未明示側性膝部挫傷之初期照護 | Contusion of unspecified knee, initial encounter |
| `S40.019A` | 肩膀挫傷（初期照護） | 未明示側性肩膀挫傷之初期照護 | Contusion of unspecified shoulder, initial encounter |
| `S50.00XA` | 手肘挫傷（初期照護） | 未明示側性手肘挫傷之初期照護 | Contusion of unspecified elbow, initial encounter |
| `S90.00XA` | 踝部挫傷（初期照護） | 未明示側性踝部挫傷之初期照護 | Contusion of unspecified ankle, initial encounter |
| `S90.30XA` | 足部挫傷（初期照護） | 未明示側性足部挫傷之初期照護 | Contusion of unspecified foot, initial encounter |
| `S00.83XA` | 頭部其他部位挫傷（初期照護） | 頭部其他部位挫傷之初期照護 | Contusion of other part of head, initial encounter |
| `S00.531A` | 唇挫傷（初期照護） | 唇挫傷之初期照護 | Contusion of lip, initial encounter |
| `S80.219A` | 膝部擦傷（初期照護） | 未明示側性膝部擦傷之初期照護 | Abrasion, unspecified knee, initial encounter |
| `S50.819A` | 前臂擦傷（初期照護） | 未明示側性前臂擦傷之初期照護 | Abrasion of unspecified forearm, initial encounter |
| `S70.319A` | 大腿擦傷（初期照護） | 未明示側性大腿擦傷之初期照護 | Abrasion, unspecified thigh, initial encounter |
| `S40.219A` | 肩膀擦傷（初期照護） | 未明示側性肩膀擦傷之初期照護 | Abrasion of unspecified shoulder, initial encounter |
| `S00.81XA` | 頭部其他部位擦傷（初期照護） | 頭部其他部位擦傷之初期照護 | Abrasion of other part of head, initial encounter |
| `S30.811A` | 腹壁擦傷（初期照護） | 腹壁擦傷之初期照護 | Abrasion of abdominal wall, initial encounter |
| `S00.511A` | 唇擦傷（初期照護） | 唇擦傷之初期照護 | Abrasion of lip, initial encounter |

### 傷口處置／術後

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `Z48.01` | 手術傷口換藥 | 來院接受更換或移除手術傷口敷料 | Encounter for change or removal of surgical wound dressing |
| `Z48.02` | 拆線 | 來院接受拆線 | Encounter for removal of sutures |
| `Z09` | 治療後追蹤檢查 | 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 | Encounter for follow-up examination after completed treatment for conditions other than malignant neoplasm |
| `T81.41XA` | 手術切口表淺感染 SSI（初期照護） | 手術切口表淺部位之處置後感染初期照護 | Infection following a procedure, superficial incisional surgical site, initial encounter |
| `T81.31XA` | 手術傷口裂開（初期照護） | 手術傷口外部破裂，他處未歸類之初期照護 | Disruption of external operation (surgical) wound, not elsewhere classified, initial encounter |
| `Z47.2` | 移除內固定物 | 來院接受移除內固定裝置 | Encounter for removal of internal fixation device |
| `Z47.89` | 骨科術後照護 | 來院接受其他骨科之術後療養 | Encounter for other orthopedic aftercare |
| `T81.42XA` | 手術傷口深部感染 SSI（初期照護） | 手術切口深層部位之處置後感染之初期照護 | Infection following a procedure, deep incisional surgical site, initial encounter |
| `Z48.817` | 皮膚及皮下組織手術後照護 | 皮膚及皮下組織手術後之外科照護 | Encounter for surgical aftercare following surgery on the skin and subcutaneous tissue |
| `Z43.3` | 結腸造口照護 | 來院接受結腸造口之照料 | Encounter for attention to colostomy |
| `T84.7XXA` | 骨科植入物感染／發炎反應（初期照護） | 其他骨內人工置換裝置、植入物及移植物所致之感染症及發炎性反應之初期照護 | Infection and inflammatory reaction due to other internal orthopedic prosthetic devices, implants and grafts, initial encounter |

### 後續照護（癒合期）

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `S01.01XD` | 頭皮撕裂傷（未伴異物，後續照護） | 頭皮撕裂傷未伴有異物之後續照護 | Laceration without foreign body of scalp, subsequent encounter |
| `S01.02XD` | 頭皮撕裂傷併異物（後續照護） | 頭皮撕裂傷伴有異物之後續照護 | Laceration with foreign body of scalp, subsequent encounter |
| `S01.81XD` | 頭部其他部位撕裂傷（未伴異物，後續照護） | 頭部其他部位撕裂傷未伴有異物之後續照護 | Laceration without foreign body of other part of head, subsequent encounter |
| `S01.82XD` | 頭部其他部位撕裂傷併異物（後續照護） | 頭部其他部位撕裂傷伴有異物之後續照護 | Laceration with foreign body of other part of head, subsequent encounter |
| `S01.511D` | 嘴唇撕裂傷（未伴異物，後續照護） | 唇撕裂傷未伴有異物之後續照護 | Laceration without foreign body of lip, subsequent encounter |
| `S01.521D` | 嘴唇撕裂傷併異物（後續照護） | 唇撕裂傷伴有異物之後續照護 | Laceration with foreign body of lip, subsequent encounter |
| `S61.419D` | 手部撕裂傷（未伴異物，後續照護） | 未明示側性手部撕裂傷未伴有異物之後續照護 | Laceration without foreign body of unspecified hand, subsequent encounter |
| `S61.429D` | 手部撕裂傷併異物（後續照護） | 未明示側性手部撕裂傷伴有異物之後續照護 | Laceration with foreign body of unspecified hand, subsequent encounter |
| `S51.819D` | 前臂撕裂傷（未伴異物，後續照護） | 未明示側性前臂撕裂傷未伴有異物之後續照護 | Laceration without foreign body of unspecified forearm, subsequent encounter |
| `S51.829D` | 前臂撕裂傷併異物（後續照護） | 未明示側性前臂撕裂傷伴有異物之後續照護 | Laceration with foreign body of unspecified forearm, subsequent encounter |
| `S81.819D` | 小腿撕裂傷（未伴異物，後續照護） | 未明示側性小腿未伴有異物撕裂傷之後遺症 | Laceration without foreign body, unspecified lower leg, subsequent encounter |
| `S81.829D` | 小腿撕裂傷併異物（後續照護） | 未明示側性小腿伴有異物撕裂傷之後續照護 | Laceration with foreign body, unspecified lower leg, subsequent encounter |
| `S91.319D` | 足部撕裂傷（未伴異物，後續照護） | 未明示側性足部撕裂傷未伴有異物之後續照護 | Laceration without foreign body, unspecified foot, subsequent encounter |
| `S91.329D` | 足部撕裂傷併異物（後續照護） | 未明示側性足部撕裂傷伴有異物之後續照護 | Laceration with foreign body, unspecified foot, subsequent encounter |
| `S00.03XD` | 頭皮挫傷（後續照護） | 頭皮挫傷之後續照護 | Contusion of scalp, subsequent encounter |
| `S60.229D` | 手部挫傷（後續照護） | 未明示側性手部挫傷之後續照護 | Contusion of unspecified hand, subsequent encounter |
| `S80.11XD` | 右小腿挫傷（後續照護） | 右側小腿挫傷之後續照護 | Contusion of right lower leg, subsequent encounter |
| `S80.12XD` | 左小腿挫傷（後續照護） | 左側小腿挫傷之後續照護 | Contusion of left lower leg, subsequent encounter |
| `S60.519D` | 手部擦傷（後續照護） | 未明示側性手部擦傷之後續照護 | Abrasion of unspecified hand, subsequent encounter |
| `T14.90XD` | 未明示損傷（後續照護） | 損傷之後續照護 | Injury, unspecified, subsequent encounter |
| `T81.41XD` | 手術切口表淺感染 SSI（後續照護） | 手術切口表淺部位之處置後感染後續照護 | Infection following a procedure, superficial incisional surgical site, subsequent encounter |
| `T81.31XD` | 手術傷口裂開（後續照護） | 手術傷口外部破裂，他處未歸類之後續照護 | Disruption of external operation (surgical) wound, not elsewhere classified, subsequent encounter |
| `T20.20XD` | 頭臉頸二度燙傷（後續照護） | 頭、臉及頸部未明示部位二度燒傷之後續照護 | Burn of second degree of head, face, and neck, unspecified site, subsequent encounter |
| `T23.209D` | 手部二度燙傷（後續照護） | 未明示側性手部未明示部位二度燒傷之後續照護 | Burn of second degree of unspecified hand, unspecified site, subsequent encounter |
| `T24.209D` | 下肢二度燙傷（後續照護） | 未明示側性下肢（踝部及足部除外）未明示部位二度燒傷之後續照護 | Burn of second degree of unspecified site of unspecified lower limb, except ankle and foot, subsequent encounter |
| `S93.401D` | 右踝扭傷（後續照護） | 右側踝部韌帶扭傷之後續照護 | Sprain of unspecified ligament of right ankle, subsequent encounter |
| `S93.402D` | 左踝扭傷（後續照護） | 左側踝部韌帶扭傷之後續照護 | Sprain of unspecified ligament of left ankle, subsequent encounter |
| `S63.509D` | 腕扭傷（後續照護） | 未明示側性腕部扭傷之後續照護 | Unspecified sprain of unspecified wrist, subsequent encounter |
| `S16.1XXD` | 頸部拉傷（後續照護） | 頸部肌肉，筋膜和肌腱拉傷之後續照護 | Strain of muscle, fascia and tendon at neck level, subsequent encounter |
| `S71.119D` | 大腿撕裂傷（未伴異物，後續照護） | 未明示側性大腿未伴有異物撕裂傷之後續照護 | Laceration without foreign body, unspecified thigh, subsequent encounter |
| `S71.129D` | 大腿撕裂傷併異物（後續照護） | 未明示側性大腿伴有異物撕裂傷之後續照護 | Laceration with foreign body, unspecified thigh, subsequent encounter |
| `S81.019D` | 膝部撕裂傷（未伴異物，後續照護） | 未明示側性膝部未伴有異物撕裂傷之後續照護 | Laceration without foreign body, unspecified knee, subsequent encounter |
| `S81.029D` | 膝部撕裂傷併異物（後續照護） | 未明示側性膝部伴有異物撕裂傷之後續照護 | Laceration with foreign body, unspecified knee, subsequent encounter |
| `S41.119D` | 上臂撕裂傷（未伴異物，後續照護） | 未明示側性上臂撕裂傷未伴有異物之後續照護 | Laceration without foreign body of unspecified upper arm, subsequent encounter |
| `S41.129D` | 上臂撕裂傷併異物（後續照護） | 未明示側性上臂撕裂傷伴有異物之後續照護 | Laceration with foreign body of unspecified upper arm, subsequent encounter |
| `S01.419D` | 臉頰撕裂傷（未伴異物，後續照護） | 未明示側性臉頰與顳骨下頜周圍撕裂傷未伴有異物之後續照護 | Laceration without foreign body of unspecified cheek and temporomandibular area, subsequent encounter |
| `S01.429D` | 臉頰撕裂傷併異物（後續照護） | 未明示側性臉頰與顳骨下頜周圍撕裂傷伴有異物之後續照護 | Laceration with foreign body of unspecified cheek and temporomandibular area, subsequent encounter |
| `S01.319D` | 耳撕裂傷（未伴異物，後續照護） | 未明示側性耳撕裂傷未伴有異物之後續照護 | Laceration without foreign body of unspecified ear, subsequent encounter |
| `S01.329D` | 耳撕裂傷併異物（後續照護） | 未明示側性耳撕裂傷伴有異物之後續照護 | Laceration with foreign body of unspecified ear, subsequent encounter |
| `S01.21XD` | 鼻撕裂傷（未伴異物，後續照護） | 鼻撕裂傷未伴有異物之後續照護 | Laceration without foreign body of nose, subsequent encounter |
| `S01.22XD` | 鼻撕裂傷併異物（後續照護） | 鼻撕裂傷伴有異物之後續照護 | Laceration with foreign body of nose, subsequent encounter |
| `S70.10XD` | 大腿挫傷（後續照護） | 未明示側性大腿挫傷之後續照護 | Contusion of unspecified thigh, subsequent encounter |
| `S80.00XD` | 膝部挫傷（後續照護） | 未明示側性膝部挫傷之後續照護 | Contusion of unspecified knee, subsequent encounter |
| `S40.019D` | 肩膀挫傷（後續照護） | 未明示側性肩膀挫傷之後續照護 | Contusion of unspecified shoulder, subsequent encounter |
| `S50.00XD` | 手肘挫傷（後續照護） | 未明示側性手肘挫傷之後續照護 | Contusion of unspecified elbow, subsequent encounter |
| `S90.00XD` | 踝部挫傷（後續照護） | 未明示側性踝部挫傷之後續照護 | Contusion of unspecified ankle, subsequent encounter |
| `S90.30XD` | 足部挫傷（後續照護） | 未明示側性足部挫傷之後續照護 | Contusion of unspecified foot, subsequent encounter |
| `S00.83XD` | 頭部其他部位挫傷（後續照護） | 頭部其他部位挫傷之後續照護 | Contusion of other part of head, subsequent encounter |
| `S00.531D` | 唇挫傷（後續照護） | 唇挫傷之後續照護 | Contusion of lip, subsequent encounter |
| `S80.219D` | 膝部擦傷（後續照護） | 未明示側性膝部擦傷之後續照護 | Abrasion, unspecified knee, subsequent encounter |
| `S50.819D` | 前臂擦傷（後續照護） | 未明示側性前臂擦傷之後續照護 | Abrasion of unspecified forearm, subsequent encounter |
| `S70.319D` | 大腿擦傷（後續照護） | 未明示側性大腿擦傷之後續照護 | Abrasion, unspecified thigh, subsequent encounter |
| `S40.219D` | 肩膀擦傷（後續照護） | 未明示側性肩膀擦傷之後續照護 | Abrasion of unspecified shoulder, subsequent encounter |
| `S00.81XD` | 頭部其他部位擦傷（後續照護） | 頭部其他部位擦傷之後續照護 | Abrasion of other part of head, subsequent encounter |
| `S30.811D` | 腹壁擦傷（後續照護） | 腹壁擦傷之後續照護 | Abrasion of abdominal wall, subsequent encounter |
| `S00.511D` | 唇擦傷（後續照護） | 唇擦傷之後續照護 | Abrasion of lip, subsequent encounter |
| `T81.42XD` | 手術傷口深部感染 SSI（後續照護） | 手術切口深層部位之處置後感染之後續照護 | Infection following a procedure, deep incisional surgical site, subsequent encounter |
| `T84.7XXD` | 骨科植入物感染／發炎反應（後續照護） | 其他骨內人工置換裝置、植入物及移植物所致之感染症及發炎性反應之後續照護 | Infection and inflammatory reaction due to other internal orthopedic prosthetic devices, implants and grafts, subsequent encounter |
| `T20.10XD` | 頭臉頸一度燙傷（後續照護） | 頭、臉及頸部一度未明示部位燒傷之後續照護 | Burn of first degree of head, face, and neck, unspecified site, subsequent encounter |
| `T22.219D` | 前臂二度燙傷（後續照護） | 未明示側性前臂二度燒傷之後續照護 | Burn of second degree of unspecified forearm, subsequent encounter |
| `T21.20XD` | 軀幹二度燙傷（後續照護） | 軀幹未明示部位二度燒傷之後續照護 | Burn of second degree of trunk, unspecified site, subsequent encounter |
| `T25.229D` | 足部二度燙傷（後續照護） | 未明示側性足部二度燒傷之後續照護 | Burn of second degree of unspecified foot, subsequent encounter |
| `T20.30XD` | 頭臉頸三度燙傷（後續照護） | 頭、臉及頸部未明示部位三度燒傷之後續照護 | Burn of third degree of head, face, and neck, unspecified site, subsequent encounter |
| `S83.90XD` | 膝部扭傷（後續照護） | 未明示側性及部位膝部扭傷之後續照護 | Sprain of unspecified site of unspecified knee, subsequent encounter |
| `S43.409D` | 肩關節扭傷（後續照護） | 未明示側性肩關節扭傷之後續照護 | Unspecified sprain of unspecified shoulder joint, subsequent encounter |
| `S63.609D` | 拇指扭傷（後續照護） | 未明示側性拇指扭傷之後續照護 | Unspecified sprain of unspecified thumb, subsequent encounter |
| `S39.012D` | 下背部拉傷（後續照護） | 下背部肌肉、筋膜及韌帶拉傷之後續照護 | Strain of muscle, fascia and tendon of lower back, subsequent encounter |
| `S86.019D` | 阿基里斯跟腱拉傷（後續照護） | 未明示側性阿基里斯跟腱拉傷之後續照護 | Strain of unspecified Achilles tendon, subsequent encounter |

### 燒燙傷

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `T30.0` | 燙傷（部位與程度均未明示） | 未明示身體部位燒傷 | Burn of unspecified body region, unspecified degree |
| `T20.20XA` | 頭臉頸二度燙傷（初期照護） | 頭、臉及頸部未明示部位二度燒傷之初期照護 | Burn of second degree of head, face, and neck, unspecified site, initial encounter |
| `T23.209A` | 手部二度燙傷（初期照護） | 未明示側性手部未明示部位二度燒傷之初期照護 | Burn of second degree of unspecified hand, unspecified site, initial encounter |
| `T24.209A` | 下肢二度燙傷（初期照護） | 未明示側性下肢（踝部及足部除外）未明示部位二度燒傷之初期照護 | Burn of second degree of unspecified site of unspecified lower limb, except ankle and foot, initial encounter |
| `T20.10XA` | 頭臉頸一度燙傷（初期照護） | 頭、臉及頸部一度未明示部位燒傷之初期照護 | Burn of first degree of head, face, and neck, unspecified site, initial encounter |
| `T22.219A` | 前臂二度燙傷（初期照護） | 未明示側性前臂二度燒傷之初期照護 | Burn of second degree of unspecified forearm, initial encounter |
| `T21.20XA` | 軀幹二度燙傷（初期照護） | 軀幹未明示部位二度燒傷之初期照護 | Burn of second degree of trunk, unspecified site, initial encounter |
| `T25.229A` | 足部二度燙傷（初期照護） | 未明示側性足部二度燒傷之初期照護 | Burn of second degree of unspecified foot, initial encounter |
| `T20.30XA` | 頭臉頸三度燙傷（初期照護） | 頭、臉及頸部未明示部位三度燒傷之初期照護 | Burn of third degree of head, face, and neck, unspecified site, initial encounter |

### 膿瘍／皮膚病灶

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `L02.91` | 皮膚膿瘍 | 皮膚膿瘍 | Cutaneous abscess, unspecified |
| `L05.01` | 藏毛囊腫伴膿瘍 | 潛毛性囊腫伴有膿瘍 | Pilonidal cyst with abscess |
| `L03.011` | 甲溝炎（右手指） | 右側手指蜂窩組織炎 | Cellulitis of right finger |
| `L03.012` | 甲溝炎（左手指） | 左側手指蜂窩組織炎 | Cellulitis of left finger |
| `L03.031` | 甲溝炎（右腳趾） | 右腳趾蜂窩組織炎 | Cellulitis of right toe |
| `L03.032` | 甲溝炎（左腳趾） | 左腳趾蜂窩組織炎 | Cellulitis of left toe |
| `L60.0` | 嵌甲 | 指（趾）甲內生 | Ingrowing nail |
| `L72.3` | 皮脂腺囊腫 | 皮脂腺囊腫 | Sebaceous cyst |
| `L72.0` | 表皮囊腫 | 表皮囊腫 | Epidermal cyst |
| `D17.9` | 脂肪瘤 | 良性脂肪瘤 | Benign lipomatous neoplasm, unspecified |
| `D22.9` | 色素痣 | 黑色素細胞痣 | Melanocytic nevi, unspecified |
| `D23.9` | 皮膚良性腫瘤 | 其他皮膚良性腫廇 | Other benign neoplasm of skin, unspecified |
| `L02.92` | 癤 | 癤 | Furuncle, unspecified |
| `L02.93` | 癰 | 癰 | Carbuncle, unspecified |
| `L73.2` | 化膿性汗腺炎 | 化膿性汗腺炎 | Hidradenitis suppurativa |
| `M67.40` | 腱鞘囊腫 | 未明示部位之腱鞘囊腫 | Ganglion, unspecified site |
| `B07.9` | 病毒疣 | 病毒性疣 | Viral wart, unspecified |
| `L91.0` | 肥厚性疤痕 | 肥厚性疤痕 | Hypertrophic scar |
| `L98.0` | 化膿性肉芽腫 | 化膿性肉芽腫 | Pyogenic granuloma |

### 肛門疾患

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `K64.9` | 痔瘡 | 痔瘡 | Unspecified hemorrhoids |
| `K64.5` | 血栓性外痔 | 肛門周圍靜脈血栓 | Perianal venous thrombosis |
| `K60.2` | 肛裂 | 肛門裂 | Anal fissure, unspecified |
| `K61.0` | 肛門膿瘍 | 肛門膿瘍 | Anal abscess |
| `K60.3` | 肛門瘻管 | 肛門廔管 | Anal fistula |
| `K62.5` | 肛門及直腸出血 | 肛門及直腸出血 | Hemorrhage of anus and rectum |
| `K64.0` | 第一級內痔 | 第一級痔瘡 | First degree hemorrhoids |
| `K64.1` | 第二級內痔 | 第二級痔瘡 | Second degree hemorrhoids |
| `K64.2` | 第三級內痔 | 第三級痔瘡 | Third degree hemorrhoids |
| `K64.3` | 第四級內痔 | 第四級痔瘡 | Fourth degree hemorrhoids |
| `K60.0` | 急性肛裂 | 急性肛裂 | Acute anal fissure |
| `K60.1` | 慢性肛裂 | 慢性肛裂 | Chronic anal fissure |
| `K61.2` | 肛門直腸膿瘍 | 肛門直腸膿瘍 | Anorectal abscess |
| `K62.3` | 直腸脫垂 | 直腸脫垂 | Rectal prolapse |
| `L29.0` | 肛門搔癢症 | 肛門搔癢症 | Pruritus ani |

### 疝氣／腹部

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `K40.90` | 單側腹股溝疝氣（未伴阻塞或壞疽） | 單側腹股溝疝氣，未伴有阻塞或壞疽，未明示為復發 | Unilateral inguinal hernia, without obstruction or gangrene, not specified as recurrent |
| `K40.30` | 單側腹股溝疝氣併阻塞（嵌頓、未伴壞疽） | 單側腹股溝疝氣，併阻塞，未伴有壞疽，未明示為復發 | Unilateral inguinal hernia, with obstruction, without gangrene, not specified as recurrent |
| `K40.40` | 單側腹股溝疝氣併壞疽（絞窄） | 單側腹股溝疝氣，併壞疽，未明示為復發 | Unilateral inguinal hernia, with gangrene, not specified as recurrent |
| `K42.9` | 臍疝氣（未伴阻塞或壞疽） | 臍疝氣未伴有阻塞或壞疽 | Umbilical hernia without obstruction or gangrene |
| `K42.0` | 臍疝氣併阻塞（嵌頓、未伴壞疽） | 臍疝氣，併阻塞，未伴有壞疽 | Umbilical hernia with obstruction, without gangrene |
| `K43.9` | 腹壁疝氣（未伴阻塞或壞疽） | 腹壁疝氣未伴有阻塞或壞疽 | Ventral hernia without obstruction or gangrene |
| `K43.6` | 其他及未明示腹壁疝氣併阻塞（嵌頓、未伴壞疽） | 其他及未明示腹壁疝氣併阻塞，未伴有壞疽 | Other and unspecified ventral hernia with obstruction, without gangrene |
| `K35.80` | 急性闌尾炎 | 急性闌尾炎 | Unspecified acute appendicitis |
| `K80.20` | 膽囊結石（未伴膽囊炎、未伴阻塞） | 膽囊結石未伴有膽囊炎未伴有阻塞 | Calculus of gallbladder without cholecystitis without obstruction |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |
| `K41.90` | 單側股疝氣（未伴阻塞或壞疽） | 單側股疝氣，未伴有阻塞或壞疽，未明示為復發 | Unilateral femoral hernia, without obstruction or gangrene, not specified as recurrent |
| `K41.30` | 單側股疝氣併阻塞（嵌頓、未伴壞疽） | 單側股疝氣併阻塞，未伴有壞疽，未明示為復發 | Unilateral femoral hernia, with obstruction, without gangrene, not specified as recurrent |
| `K41.40` | 單側股疝氣併壞疽（絞窄） | 單側股疝氣，併壞疽， 未明示為復發 | Unilateral femoral hernia, with gangrene, not specified as recurrent |
| `K43.2` | 切口疝氣（未伴阻塞或壞疽） | 切口腹壁疝氣，未伴有阻塞或壞疽 | Incisional hernia without obstruction or gangrene |
| `K43.0` | 切口疝氣併阻塞（嵌頓、未伴壞疽） | 切口腹壁疝氣併阻塞，未伴有壞疽 | Incisional hernia with obstruction, without gangrene |
| `K81.1` | 慢性膽囊炎 | 慢性膽囊炎 | Chronic cholecystitis |
| `K57.32` | 大腸憩室炎（未伴穿孔或膿瘍、無出血） | 大腸憩室炎未伴有穿孔或膿瘍無出血 | Diverticulitis of large intestine without perforation or abscess without bleeding |
| `K85.90` | 急性胰臟炎（未伴壞死或感染） | 急性胰臟炎未伴有壞死或感染 | Acute pancreatitis without necrosis or infection, unspecified |
| `K44.9` | 橫膈疝氣／裂孔疝（未伴阻塞或壞疽） | 橫膈疝氣未伴有阻塞或壞疽 | Diaphragmatic hernia without obstruction or gangrene |
| `K44.0` | 橫膈疝氣併阻塞（嵌頓、未伴壞疽） | 橫膈疝氣，併阻塞，未伴有壞疽 | Diaphragmatic hernia with obstruction, without gangrene |

### 扭傷／拉傷

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `S93.401A` | 右踝扭傷（初期照護） | 右側踝部韌帶扭傷之初期照護 | Sprain of unspecified ligament of right ankle, initial encounter |
| `S93.402A` | 左踝扭傷（初期照護） | 左側踝部韌帶扭傷之初期照護 | Sprain of unspecified ligament of left ankle, initial encounter |
| `S63.509A` | 腕扭傷（初期照護） | 未明示側性腕部扭傷之初期照護 | Unspecified sprain of unspecified wrist, initial encounter |
| `S16.1XXA` | 頸部拉傷（初期照護） | 頸部肌肉，筋膜和肌腱拉傷之初期照護 | Strain of muscle, fascia and tendon at neck level, initial encounter |
| `M62.830` | 背部肌肉痙攣 | 背部肌肉痙攣 | Muscle spasm of back |
| `Z47.89` | 骨科術後照護 | 來院接受其他骨科之術後療養 | Encounter for other orthopedic aftercare |
| `Z47.2` | 移除內固定物 | 來院接受移除內固定裝置 | Encounter for removal of internal fixation device |
| `S83.90XA` | 膝部扭傷（初期照護） | 未明示側性及部位膝部扭傷之初期照護 | Sprain of unspecified site of unspecified knee, initial encounter |
| `S43.409A` | 肩關節扭傷（初期照護） | 未明示側性肩關節扭傷之初期照護 | Unspecified sprain of unspecified shoulder joint, initial encounter |
| `S63.609A` | 拇指扭傷（初期照護） | 未明示側性拇指扭傷之初期照護 | Unspecified sprain of unspecified thumb, initial encounter |
| `S39.012A` | 下背部拉傷（初期照護） | 下背部肌肉、筋膜及韌帶拉傷之初期照護 | Strain of muscle, fascia and tendon of lower back, initial encounter |
| `S86.019A` | 阿基里斯跟腱拉傷（初期照護） | 未明示側性阿基里斯跟腱拉傷之初期照護 | Strain of unspecified Achilles tendon, initial encounter |

## 快選清單

### 常用慢性病（39 碼）

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `I10` | 本態性高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `E11.9` | 第二型糖尿病（未伴併發症） | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `E11.65` | 糖尿病伴高血糖 | 第二型糖尿病，伴有高血糖 | Type 2 diabetes mellitus with hyperglycemia |
| `E78.5` | 高脂血症 | 高血脂症 | Hyperlipidemia, unspecified |
| `E78.00` | 高膽固醇血症 | 純高膽固醇血症 | Pure hypercholesterolemia, unspecified |
| `E78.2` | 混合型高脂血症 | 混合型高血脂症 | Mixed hyperlipidemia |
| `E79.0` | 高尿酸血症（未伴發炎性關節炎及痛風石） | 高尿酸血症未伴有關節炎及痛風石 | Hyperuricemia without signs of inflammatory arthritis and tophaceous disease |
| `M10.9` | 痛風 | 痛風 | Gout, unspecified |
| `N18.30` | CKD 第3期 | 慢性腎臟疾病stage 3 | Chronic kidney disease, stage 3 unspecified |
| `N18.31` | CKD 3a | 慢性腎臟疾病stage 3a | Chronic kidney disease, stage 3a |
| `N18.32` | CKD 3b | 慢性腎臟疾病stage 3b | Chronic kidney disease, stage 3b |
| `N18.4` | CKD 第4期 | 第四期慢性腎臟疾病(重度) | Chronic kidney disease, stage 4 (severe) |
| `N18.5` | CKD 第5期 | 第五期慢性腎臟疾病 | Chronic kidney disease, stage 5 |
| `N18.6` | 末期腎病 ESRD | 末期腎疾病 | End stage renal disease |
| `I25.10` | 冠心病 CAD | 自體的冠狀動脈粥樣硬化心臟病未伴有心絞痛 | Atherosclerotic heart disease of native coronary artery without angina pectoris |
| `I48.91` | 心房顫動 Af | 心房顫動 | Unspecified atrial fibrillation |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `I69.30` | 腦中風後遺症 | 腦梗塞後遺症 | Unspecified sequelae of cerebral infarction |
| `Z86.73` | 中風病史（無後遺症） | 短暫性腦缺血發作 （TIA）與無殘餘缺損之腦梗塞之個人史 | Personal history of transient ischemic attack (TIA), and cerebral infarction without residual deficits |
| `J44.9` | COPD | 慢性阻塞性肺病 | Chronic obstructive pulmonary disease, unspecified |
| `J45.909` | 氣喘（無併發症） | 氣喘,無併發症 | Unspecified asthma, uncomplicated |
| `K21.9` | 胃食道逆流 GERD（未伴食道炎） | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K29.50` | 慢性胃炎 | 慢性胃炎未伴有出血 | Unspecified chronic gastritis without bleeding |
| `B18.1` | 慢性 B 型肝炎（未伴 D 型） | 慢性病毒性B型肝炎未伴有D 型肝炎病毒 | Chronic viral hepatitis B without delta-agent |
| `B18.2` | 慢性 C 型肝炎 | 慢性病毒性C型肝炎 | Chronic viral hepatitis C |
| `K74.60` | 肝硬化 | 肝硬化 | Unspecified cirrhosis of liver |
| `K76.0` | 脂肪肝 | 脂肪肝(變化)，他處未歸類者 | Fatty (change of) liver, not elsewhere classified |
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `E05.90` | 甲狀腺毒症／甲亢（未伴危象或風暴） | 未明示之甲狀腺毒症，未伴有甲狀腺毒性危象或風暴 | Thyrotoxicosis, unspecified without thyrotoxic crisis or storm |
| `N40.0` | 攝護腺增生未伴下泌尿道症狀 BPH | 良性攝護腺增生未伴有下泌尿道症狀 | Benign prostatic hyperplasia without lower urinary tract symptoms |
| `N40.1` | 攝護腺增生伴下泌尿道症狀 BPH | 良性攝護腺增生伴有下泌尿道症狀 | Benign prostatic hyperplasia with lower urinary tract symptoms |
| `M81.0` | 骨質疏鬆 | 老年性骨質疏鬆症未伴有病理性骨折 | Age-related osteoporosis without current pathological fracture |
| `F03.90` | 失智症（未明示嚴重度、無行為障礙） | 非特定的失智症，未明示嚴重度，無行為、精神病症、情緒困擾及焦慮症狀 | Unspecified dementia, unspecified severity, without behavioral disturbance, psychotic disturbance, mood disturbance, and anxiety |
| `G47.00` | 失眠 | 非特定的失眠症 | Insomnia, unspecified |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| `F32.A` | 憂鬱症 | 非特定性的鬱症 | Depression, unspecified |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `D50.9` | 缺鐵性貧血 | 缺鐵性貧血 | Iron deficiency anemia, unspecified |
| `E66.9` | 肥胖 | 肥胖 | Obesity, unspecified |

### 感染科常用（46 碼）

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `J02.9` | 急性咽炎 | 急性咽炎 | Acute pharyngitis, unspecified |
| `J02.0` | 鏈球菌性咽炎 | 鏈球菌性咽炎 | Streptococcal pharyngitis |
| `J03.90` | 急性扁桃腺炎 | 急性扁桃腺炎 | Acute tonsillitis, unspecified |
| `J20.9` | 急性支氣管炎 | 急性支氣管炎 | Acute bronchitis, unspecified |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `J15.9` | 細菌性肺炎 | 細菌性肺炎 | Unspecified bacterial pneumonia |
| `J69.0` | 吸入性肺炎 | 吸入食物或嘔吐物所致之肺炎 | Pneumonitis due to inhalation of food and vomit |
| `J11.1` | 流感（伴其他呼吸道表徵） | 未確認流感病毒所致流行性感冒併其他呼吸道表徵 | Influenza due to unidentified influenza virus with other respiratory manifestations |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `U09.9` | COVID 後症候群 | 嚴重特殊傳染性肺炎後的病況 | Post COVID-19 condition, unspecified |
| `A15.0` | 肺結核 | 肺結核 | Tuberculosis of lung |
| `A31.0` | 肺部非結核分枝桿菌感染 NTM | 肺分枝桿菌感染 | Pulmonary mycobacterial infection |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `N30.00` | 急性膀胱炎（未伴血尿） | 急性膀胱炎未伴有血尿 | Acute cystitis without hematuria |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `N41.0` | 急性攝護腺炎 | 急性攝護腺炎 | Acute prostatitis |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `L03.115` | 右下肢蜂窩組織炎 | 右側下肢蜂窩組織炎 | Cellulitis of right lower limb |
| `L03.116` | 左下肢蜂窩組織炎 | 左側下肢蜂窩組織炎 | Cellulitis of left lower limb |
| `A46` | 丹毒 | 丹毒 | Erysipelas |
| `L02.91` | 皮膚膿瘍 | 皮膚膿瘍 | Cutaneous abscess, unspecified |
| `B02.9` | 帶狀疱疹（未伴併發症） | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `B00.9` | 單純疱疹病毒感染 | 疱疹病毒感染 | Herpesviral infection, unspecified |
| `B35.1` | 甲癬 | 甲癬 | Tinea unguium |
| `B35.3` | 足癬 | 足癬 | Tinea pedis |
| `B37.9` | 念珠菌病 | 念珠菌病 | Candidiasis, unspecified |
| `B86` | 疥瘡 | 疥癬(疥瘡) | Scabies |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `A08.4` | 病毒性腸炎 | 病毒性腸道病毒感染 | Viral intestinal infection, unspecified |
| `A02.0` | 沙門桿菌腸炎 | 沙門桿菌腸炎 | Salmonella enteritis |
| `A04.72` | 艱難梭菌腸道感染 CDI（非復發型） | 艱難梭菌所致腸道感染，未明示為復發型 | Enterocolitis due to Clostridium difficile, not specified as recurrent |
| `K75.0` | 肝膿瘍 | 肝膿瘍 | Abscess of liver |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `K83.09` | 急性膽管炎（其他膽管炎） | 其他膽管炎 | Other cholangitis |
| `K65.2` | 自發性細菌性腹膜炎 SBP | 自發細菌性腹膜炎 | Spontaneous bacterial peritonitis |
| `A41.9` | 敗血症 | 敗血症，未明示病原體 | Sepsis, unspecified organism |
| `R78.81` | 菌血症 | 菌血症 | Bacteremia |
| `I33.0` | 感染性心內膜炎 IE | 急性及亞急性感染性心內膜炎 | Acute and subacute infective endocarditis |
| `M86.9` | 骨髓炎 | 骨髓炎 | Osteomyelitis, unspecified |
| `A90` | 登革熱 | 登革熱[典型登革熱] | Dengue fever [classical dengue] |
| `A75.3` | 恙蟲病 | 恙蟲立克次體所致之斑疹傷寒熱 | Typhus fever due to Rickettsia tsutsugamushi |
| `B20` | HIV 疾病 | 人類免疫不全病毒疾病 | Human immunodeficiency virus [HIV] disease |
| `Z21` | 無症狀 HIV 感染狀態 | 無症狀之人類免疫不全病毒感染狀態 | Asymptomatic human immunodeficiency virus [HIV] infection status |
| `A53.9` | 梅毒 | 梅毒 | Syphilis, unspecified |
| `A54.9` | 淋病 | 淋病雙球菌感染 | Gonococcal infection, unspecified |

### 病原體與抗藥性附加碼（17 碼）

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `B95.0` | A 群鏈球菌 GAS | 歸類於他處A群鏈球菌所致的疾病 | Streptococcus, group A, as the cause of diseases classified elsewhere |
| `B95.1` | B 群鏈球菌 GBS | 歸類於他處B群鏈球菌所致的疾病 | Streptococcus, group B, as the cause of diseases classified elsewhere |
| `B95.2` | 腸球菌 | 歸類於他處腸球菌所致的疾病 | Enterococcus as the cause of diseases classified elsewhere |
| `B95.5` | 鏈球菌（未明示） | 歸類於他處未明示之鏈球菌所致的疾病 | Unspecified streptococcus as the cause of diseases classified elsewhere |
| `B95.61` | MSSA | 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病 | Methicillin susceptible Staphylococcus aureus infection as the cause of diseases classified elsewhere |
| `B95.62` | MRSA | 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病 | Methicillin resistant Staphylococcus aureus infection as the cause of diseases classified elsewhere |
| `B96.0` | 黴漿菌 | 歸類於他處肺炎黴漿菌所致的疾病 | Mycoplasma pneumoniae [M. pneumoniae] as the cause of diseases classified elsewhere |
| `B96.1` | 克雷白氏肺炎桿菌 | 歸類於他處肺炎克氏桿菌所致的疾病 | Klebsiella pneumoniae [K. pneumoniae] as the cause of diseases classified elsewhere |
| `B96.20` | 大腸桿菌 E. coli | 歸類於他處大腸桿菌所致的疾病 | Unspecified Escherichia coli [E. coli] as the cause of diseases classified elsewhere |
| `B96.4` | 變形桿菌 Proteus | 歸類於他處(奇異型)(摩爾根)變形桿菌所致的疾病 | Proteus (mirabilis) (morganii) as the cause of diseases classified elsewhere |
| `B96.5` | 綠膿桿菌 | 歸類於他處(綠膿)(鼻疽)(類鼻疽)假單胞桿菌所致的疾病 | Pseudomonas (aeruginosa) (mallei) (pseudomallei) as the cause of diseases classified elsewhere |
| `B96.81` | 幽門螺旋桿菌 | 歸類於他處幽門桿菌所致的疾病 | Helicobacter pylori [H. pylori] as the cause of diseases classified elsewhere |
| `B96.89` | 其他細菌 | 歸類於他處其他特定細菌所致的疾病 | Other specified bacterial agents as the cause of diseases classified elsewhere |
| `B97.4` | 呼吸道融合病毒 RSV | 歸類於他處呼吸道融合細胞病毒[RVS]所致的疾病 | Respiratory syncytial virus as the cause of diseases classified elsewhere |
| `Z16.12` | ESBL 抗藥性 | 芽胞菌屬抗生素及β內醯氨抗生素之抗藥性 | Extended spectrum beta lactamase (ESBL) resistance |
| `Z16.21` | Vancomycin 抗藥性 | 萬古黴素（vancomycin）之抗藥性 | Resistance to vancomycin |
| `Z16.24` | 多重抗生素抗藥性 | 多種抗生素之抗藥性 | Resistance to multiple antibiotics |

### 急診快選（19 碼）

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `A41.9` | 敗血症 | 敗血症，未明示病原體 | Sepsis, unspecified organism |
| `R65.20` | 嚴重敗血症（未伴休克，附加碼） | 未伴有敗血性休克的嚴重敗血症 | Severe sepsis without septic shock |
| `R65.21` | 敗血性休克（附加碼） | 伴有敗血性休克的嚴重敗血症 | Severe sepsis with septic shock |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `K35.80` | 急性闌尾炎 | 急性闌尾炎 | Unspecified acute appendicitis |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |
| `I21.9` | 急性心肌梗塞 | 急性心肌梗塞 | Acute myocardial infarction, unspecified |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `J45.901` | 氣喘急性發作 | 氣喘併(急性)發作 | Unspecified asthma with (acute) exacerbation |
| `J96.00` | 急性呼吸衰竭 | 急性呼吸衰竭，未明示是否伴有缺氧或高碳酸血症 | Acute respiratory failure, unspecified whether with hypoxia or hypercapnia |
| `N17.9` | 急性腎衰竭（AKI） | 急性腎衰竭 | Acute kidney failure, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `E87.1` | 低血鈉及低滲透壓 | 低滲壓及低血鈉 | Hypo-osmolality and hyponatremia |
| `E87.5` | 高血鉀 | 高血鉀症 | Hyperkalemia |

### 外科快選（25 碼）

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `Z48.01` | 手術傷口換藥 | 來院接受更換或移除手術傷口敷料 | Encounter for change or removal of surgical wound dressing |
| `Z48.02` | 拆線 | 來院接受拆線 | Encounter for removal of sutures |
| `Z09` | 治療後追蹤檢查 | 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 | Encounter for follow-up examination after completed treatment for conditions other than malignant neoplasm |
| `T81.41XA` | 手術切口表淺感染 SSI（初期照護） | 手術切口表淺部位之處置後感染初期照護 | Infection following a procedure, superficial incisional surgical site, initial encounter |
| `T81.41XD` | 手術切口表淺感染 SSI（後續照護） | 手術切口表淺部位之處置後感染後續照護 | Infection following a procedure, superficial incisional surgical site, subsequent encounter |
| `T14.90XA` | 未明示損傷（初期照護） | 損傷之初期照護 | Injury, unspecified, initial encounter |
| `T14.90XD` | 未明示損傷（後續照護） | 損傷之後續照護 | Injury, unspecified, subsequent encounter |
| `S61.419A` | 手部撕裂傷（未伴異物，初期照護） | 未明示側性手部撕裂傷未伴有異物之初期照護 | Laceration without foreign body of unspecified hand, initial encounter |
| `S61.419D` | 手部撕裂傷（未伴異物，後續照護） | 未明示側性手部撕裂傷未伴有異物之後續照護 | Laceration without foreign body of unspecified hand, subsequent encounter |
| `S93.401D` | 右踝扭傷（後續照護） | 右側踝部韌帶扭傷之後續照護 | Sprain of unspecified ligament of right ankle, subsequent encounter |
| `S93.402D` | 左踝扭傷（後續照護） | 左側踝部韌帶扭傷之後續照護 | Sprain of unspecified ligament of left ankle, subsequent encounter |
| `S60.229D` | 手部挫傷（後續照護） | 未明示側性手部挫傷之後續照護 | Contusion of unspecified hand, subsequent encounter |
| `L02.91` | 皮膚膿瘍 | 皮膚膿瘍 | Cutaneous abscess, unspecified |
| `L03.011` | 甲溝炎（右手指） | 右側手指蜂窩組織炎 | Cellulitis of right finger |
| `L60.0` | 嵌甲 | 指（趾）甲內生 | Ingrowing nail |
| `L72.3` | 皮脂腺囊腫 | 皮脂腺囊腫 | Sebaceous cyst |
| `D17.9` | 脂肪瘤 | 良性脂肪瘤 | Benign lipomatous neoplasm, unspecified |
| `K64.9` | 痔瘡 | 痔瘡 | Unspecified hemorrhoids |
| `K60.2` | 肛裂 | 肛門裂 | Anal fissure, unspecified |
| `K40.90` | 單側腹股溝疝氣（未伴阻塞或壞疽） | 單側腹股溝疝氣，未伴有阻塞或壞疽，未明示為復發 | Unilateral inguinal hernia, without obstruction or gangrene, not specified as recurrent |
| `K35.80` | 急性闌尾炎 | 急性闌尾炎 | Unspecified acute appendicitis |
| `L02.92` | 癤 | 癤 | Furuncle, unspecified |
| `S81.019A` | 膝部撕裂傷（未伴異物，初期照護） | 未明示側性膝部未伴有異物撕裂傷之初期照護 | Laceration without foreign body, unspecified knee, initial encounter |
| `K60.0` | 急性肛裂 | 急性肛裂 | Acute anal fissure |
| `L73.2` | 化膿性汗腺炎 | 化膿性汗腺炎 | Hidradenitis suppurativa |

## 全域關聯表（203 組）

點選左欄代碼後，右側「相關評估碼」會建議的碼。

| 選了這個碼 | 會建議一併評估 |
|---|---|
| `A01.00` 傷寒 | `R50.9` 發燒、`A09` 感染性胃腸炎及大腸炎、`R19.7` 腹瀉、`B54` 瘧疾 |
| `A04.72` 艱難梭菌所致腸道感染，未明示為復發型 | `A04.71` 艱難梭菌所致腸道感染，復發型、`R19.7` 腹瀉 |
| `A09` 感染性胃腸炎及大腸炎 | `A08.4` 病毒性腸道病毒感染、`K52.9` 非傳染性胃腸炎及結腸炎、`E86.0` 脫水、`R19.7` 腹瀉、`R11.2` 噁心伴有嘔吐、`A02.0` 沙門桿菌腸炎、`A04.72` 艱難梭菌所致腸道感染，未明示為復發型 |
| `A15.0` 肺結核 | `R05.3` 慢性咳嗽、`R04.2` 咳血、`A15.9` 呼吸道結核病、`A15.6` 結核性肋膜炎、`A15.4` 胸腔內淋巴結結核、`Z22.7` 潛伏結核病、`Z86.11` 結核病之個人史、`R91.8` 肺部其他非特定性異常發現 |
| `A15.9` 呼吸道結核病 | `A15.0` 肺結核、`A15.6` 結核性肋膜炎、`A15.4` 胸腔內淋巴結結核、`Z22.7` 潛伏結核病、`Z86.11` 結核病之個人史、`A31.0` 肺分枝桿菌感染、`R05.3` 慢性咳嗽 |
| `A31.0` 肺分枝桿菌感染 | `A15.0` 肺結核、`A15.9` 呼吸道結核病、`R91.8` 肺部其他非特定性異常發現、`J44.9` 慢性阻塞性肺病、`Z22.7` 潛伏結核病、`R05.3` 慢性咳嗽 |
| `A39.2` 急性腦膜炎球菌菌血症 | `G03.9` 腦膜炎、`A41.9` 敗血症，未明示病原體、`R65.21` 伴有敗血性休克的嚴重敗血症、`R21` 皮疹及其他非特定性皮膚出疹 |
| `A41.9` 敗血症，未明示病原體 | `R78.81` 菌血症、`R65.20` 未伴有敗血性休克的嚴重敗血症、`N39.0` 未明示部位之泌尿道感染症、`J18.9` 肺炎，未明示病原體、`L03.90` 蜂窩組織炎、`B96.20` 歸類於他處大腸桿菌所致的疾病、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病 |
| `A46` 丹毒 | `B95.0` 歸類於他處A群鏈球菌所致的疾病、`L03.90` 蜂窩組織炎 |
| `A53.9` 梅毒 | `A54.9` 淋病雙球菌感染、`B20` 人類免疫不全病毒疾病、`Z11.3` 來院接受主要經由性傳播模式感染之篩檢、`Z21` 無症狀之人類免疫不全病毒感染狀態、`A63.0` 肛門生殖器疣 |
| `A54.9` 淋病雙球菌感染 | `A53.9` 梅毒、`Z11.3` 來院接受主要經由性傳播模式感染之篩檢、`B20` 人類免疫不全病毒疾病、`N41.0` 急性攝護腺炎 |
| `A63.0` 肛門生殖器疣 | `A53.9` 梅毒、`B20` 人類免疫不全病毒疾病、`Z11.3` 來院接受主要經由性傳播模式感染之篩檢、`Z23` 來院接受疫苗接種 |
| `A75.3` 恙蟲立克次體所致之斑疹傷寒熱 | `R50.9` 發燒 |
| `A75.9` 斑疹傷寒熱 | `A75.3` 恙蟲立克次體所致之斑疹傷寒熱、`R50.9` 發燒、`B54` 瘧疾、`A90` 登革熱[典型登革熱] |
| `A90` 登革熱[典型登革熱] | `R50.9` 發燒、`D69.6` 血小板缺乏症、`R21` 皮疹及其他非特定性皮膚出疹 |
| `A91` 登革出血熱 | `A90` 登革熱[典型登革熱]、`D69.6` 血小板缺乏症、`R50.9` 發燒、`R21` 皮疹及其他非特定性皮膚出疹 |
| `A92.0` 奇孔古尼亞病毒疾病 | `A90` 登革熱[典型登革熱]、`R50.9` 發燒、`R21` 皮疹及其他非特定性皮膚出疹、`B54` 瘧疾 |
| `B02.9` 帶狀疱疹未伴有併發症 | `B02.29` 疱疹後侵及其他神經系統 |
| `B16.9` 急性B型病毒性肝炎未併D 型肝炎病毒未伴有肝昏迷 | `B18.1` 慢性病毒性B型肝炎未伴有D 型肝炎病毒、`R74.01` 轉胺基脢含量上升、`Z23` 來院接受疫苗接種、`Z20.5` 病毒性肝炎之接觸和疑似曝露 |
| `B17.10` 急性C型病毒性肝炎未伴有肝昏迷 | `B18.2` 慢性病毒性C型肝炎、`R74.01` 轉胺基脢含量上升、`K74.60` 肝硬化 |
| `B18.1` 慢性病毒性B型肝炎未伴有D 型肝炎病毒 | `K74.60` 肝硬化、`R74.01` 轉胺基脢含量上升、`B18.2` 慢性病毒性C型肝炎、`C22.0` 肝細胞癌、`K72.10` 慢性肝衰竭未伴有昏迷、`I85.10` 續發性食道靜脈曲張未伴有出血、`B18.0` 慢性病毒性B型肝炎伴有D 型肝炎病毒、`Z12.89` 來院接受其他部位惡性腫瘤之篩檢、`Z22.8` 其他感染性疾病之帶菌者 |
| `B18.2` 慢性病毒性C型肝炎 | `K74.60` 肝硬化、`R74.01` 轉胺基脢含量上升、`B18.1` 慢性病毒性B型肝炎未伴有D 型肝炎病毒、`C22.0` 肝細胞癌、`K72.10` 慢性肝衰竭未伴有昏迷、`I85.10` 續發性食道靜脈曲張未伴有出血、`B17.10` 急性C型病毒性肝炎未伴有肝昏迷、`Z12.89` 來院接受其他部位惡性腫瘤之篩檢 |
| `B20` 人類免疫不全病毒疾病 | `Z21` 無症狀之人類免疫不全病毒感染狀態、`B59` 肺囊蟲病、`B37.9` 念珠菌病、`A15.0` 肺結核、`B02.9` 帶狀疱疹未伴有併發症、`Z79.899` 長期 （現在之）藥物治療、`B37.0` 念珠菌性口炎、`B45.1` 腦隱球菌病、`B25.9` 巨細胞病毒疾病、`B58.9` 弓漿蟲病、`A15.9` 呼吸道結核病、`A53.9` 梅毒 |
| `B50.9` 惡性瘧 | `B54` 瘧疾、`A90` 登革熱[典型登革熱]、`R50.9` 發燒 |
| `B54` 瘧疾 | `B50.9` 惡性瘧、`A90` 登革熱[典型登革熱]、`R50.9` 發燒、`D64.9` 貧血、`A01.00` 傷寒 |
| `B59` 肺囊蟲病 | `B20` 人類免疫不全病毒疾病、`Z79.899` 長期 （現在之）藥物治療、`J18.9` 肺炎，未明示病原體、`R06.02` 呼吸短促 |
| `C22.0` 肝細胞癌 | `K74.60` 肝硬化、`B18.1` 慢性病毒性B型肝炎未伴有D 型肝炎病毒、`B18.2` 慢性病毒性C型肝炎、`Z12.89` 來院接受其他部位惡性腫瘤之篩檢、`I85.10` 續發性食道靜脈曲張未伴有出血、`K72.10` 慢性肝衰竭未伴有昏迷 |
| `D50.9` 缺鐵性貧血 | `D64.9` 貧血、`K92.2` 胃腸道出血、`N92.0` 月經量過多及次數過多伴有規則週期 |
| `D64.9` 貧血 | `D50.9` 缺鐵性貧血、`D63.1` 慢性腎臟疾病導致的貧血、`R53.83` 其他疲勞 |
| `D70.9` 嗜中性白血球缺乏症 | `A41.9` 敗血症，未明示病原體、`R50.9` 發燒、`J18.9` 肺炎，未明示病原體、`B37.9` 念珠菌病、`R65.21` 伴有敗血性休克的嚴重敗血症 |
| `E03.9` 甲狀腺低下 | `E06.3` 自體免疫的甲狀腺炎、`R94.6` 甲狀腺功能檢查結果異常 |
| `E05.90` 未明示之甲狀腺毒症，未伴有甲狀腺毒性危象或風暴 | `E05.00` 毒性瀰漫性甲狀腺腫，未伴有甲狀腺毒性危象或風暴、`R94.6` 甲狀腺功能檢查結果異常、`R00.2` 心悸、`I48.91` 心房顫動 |
| `E11.10` 第二型糖尿病，伴有酮酸中毒，未伴有昏迷 | `E11.9` 第二型糖尿病，未伴有併發症、`E86.0` 脫水、`E87.5` 高血鉀症、`R11.2` 噁心伴有嘔吐、`A41.9` 敗血症，未明示病原體 |
| `E11.22` 第二型糖尿病，糖尿病的慢性腎臟疾病 | `N18.30` 慢性腎臟疾病stage 3、`N18.4` 第四期慢性腎臟疾病(重度)、`I12.9` 高血壓性慢性腎臟病伴有第一至第四期慢性腎病或未明示慢性腎病、`D63.1` 慢性腎臟疾病導致的貧血 |
| `E11.40` 第二型糖尿病，伴有糖尿病的神經病變 | `E11.9` 第二型糖尿病，未伴有併發症、`E11.621` 第二型糖尿病，伴有足部潰瘍、`G62.9` 多發神經病變、`E11.51` 第二型糖尿病，伴有糖尿病的周邊血管病變，未伴有壞疽 |
| `E11.51` 第二型糖尿病，伴有糖尿病的周邊血管病變，未伴有壞疽 | `E11.9` 第二型糖尿病，未伴有併發症、`E11.621` 第二型糖尿病，伴有足部潰瘍、`E11.40` 第二型糖尿病，伴有糖尿病的神經病變、`I87.2` 靜脈功能不足（慢性）（周邊） |
| `E11.621` 第二型糖尿病，伴有足部潰瘍 | `L97.509` 未明示側性足部其他部位非壓迫性慢性潰瘍，未明示嚴重程度、`E11.40` 第二型糖尿病，伴有糖尿病的神經病變、`E11.51` 第二型糖尿病，伴有糖尿病的周邊血管病變，未伴有壞疽、`M86.9` 骨髓炎、`L03.119` 肢體未明示部位蜂窩組織炎、`L02.419` 未明示肢體皮膚膿瘍、`E11.9` 第二型糖尿病，未伴有併發症 |
| `E11.65` 第二型糖尿病，伴有高血糖 | `E11.9` 第二型糖尿病，未伴有併發症、`E78.5` 高血脂症、`I10` 本態性(原發性)高血壓、`Z79.4` 長期（現在之）服用胰島素、`Z79.84` 長期(現存)使用口服降糖藥治療 |
| `E11.9` 第二型糖尿病，未伴有併發症 | `E11.65` 第二型糖尿病，伴有高血糖、`E78.5` 高血脂症、`I10` 本態性(原發性)高血壓、`E11.22` 第二型糖尿病，糖尿病的慢性腎臟疾病、`E11.40` 第二型糖尿病，伴有糖尿病的神經病變、`E11.319` 第二型糖尿病，伴有糖尿病的視網膜病變，未伴有黃斑部水腫、`E11.51` 第二型糖尿病，伴有糖尿病的周邊血管病變，未伴有壞疽、`Z79.4` 長期（現在之）服用胰島素、`Z79.84` 長期(現存)使用口服降糖藥治療、`E66.9` 肥胖 |
| `E16.2` 低血糖 | `E11.9` 第二型糖尿病，未伴有併發症、`Z79.4` 長期（現在之）服用胰島素、`N18.4` 第四期慢性腎臟疾病(重度)、`R40.20` 昏迷、`R41.82` 精神狀態改變 |
| `E78.5` 高血脂症 | `E78.00` 純高膽固醇血症、`E78.2` 混合型高血脂症、`I10` 本態性(原發性)高血壓、`E11.9` 第二型糖尿病，未伴有併發症、`E79.0` 高尿酸血症未伴有關節炎及痛風石 |
| `E79.0` 高尿酸血症未伴有關節炎及痛風石 | `M10.9` 痛風、`E78.5` 高血脂症 |
| `E86.0` 脫水 | `A09` 感染性胃腸炎及大腸炎、`R19.7` 腹瀉、`R11.2` 噁心伴有嘔吐、`E86.1` 低血容量、`N17.9` 急性腎衰竭、`E87.1` 低滲壓及低血鈉 |
| `E87.1` 低滲壓及低血鈉 | `E86.0` 脫水、`I50.9` 心臟衰竭、`K74.60` 肝硬化、`R41.82` 精神狀態改變、`N18.9` 慢性腎臟疾病 |
| `E87.5` 高血鉀症 | `N18.4` 第四期慢性腎臟疾病(重度)、`N18.5` 第五期慢性腎臟疾病、`N18.6` 末期腎疾病、`N17.9` 急性腎衰竭、`E11.22` 第二型糖尿病，糖尿病的慢性腎臟疾病 |
| `F32.A` 非特定性的鬱症 | `F41.9` 非特定的焦慮症、`G47.00` 非特定的失眠症、`R53.83` 其他疲勞 |
| `F41.9` 非特定的焦慮症 | `F32.A` 非特定性的鬱症、`G47.00` 非特定的失眠症、`R00.2` 心悸 |
| `G03.9` 腦膜炎 | `A41.9` 敗血症，未明示病原體、`R50.9` 發燒、`R41.82` 精神狀態改變、`B95.3` 歸類於他處肺炎鏈球菌所致的疾病、`A39.2` 急性腦膜炎球菌菌血症、`G04.90` 腦炎及腦脊髓炎、`G06.0` 顱內膿瘍及肉芽腫 |
| `G06.1` 脊椎管內膿瘍及肉芽腫 | `M46.26` 腰椎脊椎骨髓炎、`M54.50` 下背痛、`A41.9` 敗血症，未明示病原體、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`M86.9` 骨髓炎 |
| `G40.901` 癲癇，非難治之癲癇，伴有癲癇重積狀態 | `R40.20` 昏迷、`R41.82` 精神狀態改變、`E16.2` 低血糖、`I63.9` 腦梗塞、`G03.9` 腦膜炎 |
| `G47.00` 非特定的失眠症 | `F41.9` 非特定的焦慮症、`F32.A` 非特定性的鬱症 |
| `G83.4` 馬尾症候群 | `M54.50` 下背痛、`M51.26` 其他腰椎椎間盤移位、`G95.20` 脊髓壓迫、`M46.26` 腰椎脊椎骨髓炎 |
| `G95.20` 脊髓壓迫 | `M54.50` 下背痛、`C79.51` 骨骼續發性惡性腫瘤、`G06.1` 脊椎管內膿瘍及肉芽腫、`M46.26` 腰椎脊椎骨髓炎、`G83.4` 馬尾症候群 |
| `I10` 本態性(原發性)高血壓 | `E78.5` 高血脂症、`E11.9` 第二型糖尿病，未伴有併發症、`I25.10` 自體的冠狀動脈粥樣硬化心臟病未伴有心絞痛、`I11.9` 高血壓性心臟病，無心臟衰竭、`I12.9` 高血壓性慢性腎臟病伴有第一至第四期慢性腎病或未明示慢性腎病、`I50.9` 心臟衰竭 |
| `I21.9` 急性心肌梗塞 | `I25.10` 自體的冠狀動脈粥樣硬化心臟病未伴有心絞痛、`I20.0` 不穩定心絞痛、`I10` 本態性(原發性)高血壓、`E78.5` 高血脂症、`E11.9` 第二型糖尿病，未伴有併發症、`I50.1` 左心衰竭、`I49.9` 心臟節律不整 |
| `I25.10` 自體的冠狀動脈粥樣硬化心臟病未伴有心絞痛 | `I10` 本態性(原發性)高血壓、`E78.5` 高血脂症、`I20.9` 心絞痛、`Z95.5` 存有冠狀動脈血管成形術植入物及移植物、`Z95.1` 存有主動脈冠狀動脈繞道移植物 |
| `I26.99` 其他肺栓塞未伴有急性肺性心臟病 | `I82.409` 未明示側性下肢未明示深部靜脈急性栓塞及血栓、`I50.9` 心臟衰竭、`R06.02` 呼吸短促、`R07.9` 胸痛、`Z79.01` 長期（現在之）服用抗凝血劑 |
| `I33.0` 急性及亞急性感染性心內膜炎 | `B95.61` 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`B95.2` 歸類於他處腸球菌所致的疾病、`B95.4` 歸類於他處其它鏈球菌所致的疾病、`R78.81` 菌血症 |
| `I48.91` 心房顫動 | `Z79.01` 長期（現在之）服用抗凝血劑、`I50.9` 心臟衰竭、`I10` 本態性(原發性)高血壓、`Z86.73` 短暫性腦缺血發作 （TIA）與無殘餘缺損之腦梗塞之個人史 |
| `I50.1` 左心衰竭 | `I50.9` 心臟衰竭、`I10` 本態性(原發性)高血壓、`I21.9` 急性心肌梗塞、`I48.91` 心房顫動、`N18.4` 第四期慢性腎臟疾病(重度)、`J96.00` 急性呼吸衰竭，未明示是否伴有缺氧或高碳酸血症 |
| `I50.9` 心臟衰竭 | `I10` 本態性(原發性)高血壓、`I25.10` 自體的冠狀動脈粥樣硬化心臟病未伴有心絞痛、`I48.91` 心房顫動、`R60.9` 水腫、`N18.9` 慢性腎臟疾病 |
| `I60.9` 非創傷性蜘蛛網膜下腔出血 | `R51.9` 頭痛、`I10` 本態性(原發性)高血壓、`I61.9` 非創傷性腦出血、`G81.90` 未明示影響側別偏癱 |
| `I61.9` 非創傷性腦出血 | `I10` 本態性(原發性)高血壓、`I48.91` 心房顫動、`G81.90` 未明示影響側別偏癱、`R41.82` 精神狀態改變、`Z79.01` 長期（現在之）服用抗凝血劑、`I69.30` 腦梗塞後遺症 |
| `I63.9` 腦梗塞 | `I48.91` 心房顫動、`I10` 本態性(原發性)高血壓、`E78.5` 高血脂症、`E11.9` 第二型糖尿病，未伴有併發症、`I69.30` 腦梗塞後遺症、`G81.90` 未明示影響側別偏癱、`R47.01` 失語症、`Z86.73` 短暫性腦缺血發作 （TIA）與無殘餘缺損之腦梗塞之個人史 |
| `I69.30` 腦梗塞後遺症 | `Z86.73` 短暫性腦缺血發作 （TIA）與無殘餘缺損之腦梗塞之個人史、`I10` 本態性(原發性)高血壓、`E78.5` 高血脂症、`I48.91` 心房顫動 |
| `I71.00` 未明示部位之主動脈瘤剝離 | `R07.9` 胸痛、`I10` 本態性(原發性)高血壓、`M54.2` 頸椎痛、`I71.30` 腹主動脈瘤，已破裂 |
| `I71.30` 腹主動脈瘤，已破裂 | `R10.9` 腹痛、`I10` 本態性(原發性)高血壓、`I71.00` 未明示部位之主動脈瘤剝離、`R57.1` 低血容性休克 |
| `I82.409` 未明示側性下肢未明示深部靜脈急性栓塞及血栓 | `I26.99` 其他肺栓塞未伴有急性肺性心臟病、`Z79.01` 長期（現在之）服用抗凝血劑、`I87.2` 靜脈功能不足（慢性）（周邊）、`L03.90` 蜂窩組織炎 |
| `I85.00` 食道靜脈曲張未伴有出血 | `K74.60` 肝硬化、`I85.01` 食道靜脈曲張伴有出血、`R18.8` 其他腹水、`K72.10` 慢性肝衰竭未伴有昏迷、`C22.0` 肝細胞癌 |
| `I85.01` 食道靜脈曲張伴有出血 | `I85.00` 食道靜脈曲張未伴有出血、`K74.60` 肝硬化、`K92.0` 吐血、`D62` 急性出血後貧血、`R57.1` 低血容性休克 |
| `I85.10` 續發性食道靜脈曲張未伴有出血 | `K74.60` 肝硬化、`I85.11` 續發性食道靜脈曲張伴有出血、`R18.8` 其他腹水、`K72.10` 慢性肝衰竭未伴有昏迷、`C22.0` 肝細胞癌 |
| `I85.11` 續發性食道靜脈曲張伴有出血 | `I85.10` 續發性食道靜脈曲張未伴有出血、`K74.60` 肝硬化、`K92.0` 吐血、`D62` 急性出血後貧血、`R57.1` 低血容性休克 |
| `J18.9` 肺炎，未明示病原體 | `J15.9` 細菌性肺炎、`J13` 肺炎鏈球菌性肺炎、`J15.212` 抗甲氧西林（抗藥性）金黃色葡萄球菌所致之肺炎、`J69.0` 吸入食物或嘔吐物所致之肺炎、`B96.0` 歸類於他處肺炎黴漿菌所致的疾病、`B95.3` 歸類於他處肺炎鏈球菌所致的疾病、`U07.1` 嚴重特殊傳染性肺炎、`R05.9` 咳嗽、`R50.9` 發燒 |
| `J44.1` 慢性阻塞性肺病伴有(急性)發作 | `J44.9` 慢性阻塞性肺病、`J18.9` 肺炎，未明示病原體、`B95.3` 歸類於他處肺炎鏈球菌所致的疾病、`B96.3` 歸類於他處流行性感冒嗜血桿菌所致的疾病、`B96.1` 歸類於他處肺炎克氏桿菌所致的疾病 |
| `J44.9` 慢性阻塞性肺病 | `J44.1` 慢性阻塞性肺病伴有(急性)發作、`J44.0` 慢性阻塞性肺病伴有急性下呼吸道感染、`F17.210` 尼古丁依賴，香菸，無併發症、`Z99.81` 補充氧氣之依賴、`J45.909` 氣喘,無併發症 |
| `J45.909` 氣喘,無併發症 | `J45.901` 氣喘併(急性)發作、`J30.9` 過敏性鼻炎、`R05.9` 咳嗽 |
| `J69.0` 吸入食物或嘔吐物所致之肺炎 | `J18.9` 肺炎，未明示病原體、`R13.10` 吞嚥困難、`I69.391` 吞嚥困難，腦梗塞後遺症 |
| `J96.00` 急性呼吸衰竭，未明示是否伴有缺氧或高碳酸血症 | `J18.9` 肺炎，未明示病原體、`J44.1` 慢性阻塞性肺病伴有(急性)發作、`J45.901` 氣喘併(急性)發作、`U07.1` 嚴重特殊傳染性肺炎、`I50.1` 左心衰竭 |
| `K21.9` 胃食道逆性疾病未伴有食道炎 | `K29.70` 胃炎未伴有出血、`B96.81` 歸類於他處幽門桿菌所致的疾病、`R12` 胸口灼熱感、`K25.9` 胃潰瘍，未明示急性或慢性，未伴有出血或穿孔、`K44.9` 橫膈疝氣未伴有阻塞或壞疽 |
| `K29.50` 慢性胃炎未伴有出血 | `B96.81` 歸類於他處幽門桿菌所致的疾病、`K21.9` 胃食道逆性疾病未伴有食道炎、`K25.9` 胃潰瘍，未明示急性或慢性，未伴有出血或穿孔、`R10.13` 心窩部痛 |
| `K29.70` 胃炎未伴有出血 | `B96.81` 歸類於他處幽門桿菌所致的疾病、`K21.9` 胃食道逆性疾病未伴有食道炎、`K25.9` 胃潰瘍，未明示急性或慢性，未伴有出血或穿孔、`R10.13` 心窩部痛 |
| `K35.80` 急性闌尾炎 | `R10.31` 右下四分之一腹痛、`R11.2` 噁心伴有嘔吐、`R10.9` 腹痛、`K56.609` 腸阻塞，未明示阻塞程度、`K63.1` 腸穿孔(非創傷性)、`R50.9` 發燒 |
| `K40.90` 單側腹股溝疝氣，未伴有阻塞或壞疽，未明示為復發 | `K42.9` 臍疝氣未伴有阻塞或壞疽、`K43.9` 腹壁疝氣未伴有阻塞或壞疽 |
| `K55.069` 急性腸部分梗塞，未明示程度 | `R10.84` 全腹痛、`K92.1` 黑便、`I48.91` 心房顫動、`K63.1` 腸穿孔(非創傷性)、`A41.9` 敗血症，未明示病原體 |
| `K56.609` 腸阻塞，未明示阻塞程度 | `K35.80` 急性闌尾炎、`K40.90` 單側腹股溝疝氣，未伴有阻塞或壞疽，未明示為復發、`K43.9` 腹壁疝氣未伴有阻塞或壞疽、`R11.2` 噁心伴有嘔吐、`K92.2` 胃腸道出血、`K63.1` 腸穿孔(非創傷性) |
| `K59.00` 便秘 | `K64.9` 痔瘡、`R19.4` 排便習慣改變、`K58.9` 激躁性腸症候群未伴有腹瀉 |
| `K64.9` 痔瘡 | `K64.5` 肛門周圍靜脈血栓、`K60.2` 肛門裂、`K62.5` 肛門及直腸出血 |
| `K65.2` 自發細菌性腹膜炎 | `K74.60` 肝硬化、`R18.8` 其他腹水、`B96.20` 歸類於他處大腸桿菌所致的疾病 |
| `K72.10` 慢性肝衰竭未伴有昏迷 | `K74.60` 肝硬化、`I85.10` 續發性食道靜脈曲張未伴有出血、`R18.8` 其他腹水、`C22.0` 肝細胞癌、`B18.1` 慢性病毒性B型肝炎未伴有D 型肝炎病毒 |
| `K74.60` 肝硬化 | `B18.1` 慢性病毒性B型肝炎未伴有D 型肝炎病毒、`B18.2` 慢性病毒性C型肝炎、`K76.0` 脂肪肝(變化)，他處未歸類者、`R18.8` 其他腹水、`K65.2` 自發細菌性腹膜炎、`I85.10` 續發性食道靜脈曲張未伴有出血、`C22.0` 肝細胞癌、`K72.10` 慢性肝衰竭未伴有昏迷 |
| `K75.0` 肝膿瘍 | `B96.1` 歸類於他處肺炎克氏桿菌所致的疾病、`K83.09` 其他膽管炎、`A06.4` 阿米巴性肝膿瘍 |
| `K76.0` 脂肪肝(變化)，他處未歸類者 | `R74.01` 轉胺基脢含量上升、`E78.5` 高血脂症、`E11.9` 第二型糖尿病，未伴有併發症、`E66.9` 肥胖 |
| `K80.20` 膽囊結石未伴有膽囊炎未伴有阻塞 | `K81.0` 急性膽囊炎、`K83.09` 其他膽管炎、`R10.11` 右上四分之一腹痛、`K80.50` 膽管結石未伴有膽囊炎或膽管炎未伴有阻塞 |
| `K81.0` 急性膽囊炎 | `K80.20` 膽囊結石未伴有膽囊炎未伴有阻塞、`K80.00` 膽囊結石併急性膽囊炎未伴有阻塞、`K83.09` 其他膽管炎、`R10.11` 右上四分之一腹痛 |
| `K92.2` 胃腸道出血 | `K92.0` 吐血、`K92.1` 黑便、`K25.4` 慢性或未明示胃潰瘍併出血、`K26.4` 慢性或未明示十二指腸潰瘍併出血、`I85.11` 續發性食道靜脈曲張伴有出血、`I85.01` 食道靜脈曲張伴有出血、`D62` 急性出血後貧血、`K29.01` 急性胃炎併出血 |
| `L03.115` 右側下肢蜂窩組織炎 | `B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`B95.61` 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病、`B95.0` 歸類於他處A群鏈球菌所致的疾病、`E11.9` 第二型糖尿病，未伴有併發症、`I87.2` 靜脈功能不足（慢性）（周邊）、`B35.3` 足癬 |
| `L03.116` 左側下肢蜂窩組織炎 | `B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`B95.61` 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病、`B95.0` 歸類於他處A群鏈球菌所致的疾病、`E11.9` 第二型糖尿病，未伴有併發症、`I87.2` 靜脈功能不足（慢性）（周邊）、`B35.3` 足癬 |
| `L03.90` 蜂窩組織炎 | `L03.115` 右側下肢蜂窩組織炎、`L03.116` 左側下肢蜂窩組織炎、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`B95.61` 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病、`B95.0` 歸類於他處A群鏈球菌所致的疾病、`A46` 丹毒、`E11.9` 第二型糖尿病，未伴有併發症、`Z16.24` 多種抗生素之抗藥性 |
| `L51.1` 史帝芬-強生氏症候群 | `L51.2` 毒性表皮壞死鬆解症、`T88.7XXA` 藥物或藥劑未明示之不良作用之初期照護、`L27.0` 內服藥所致之全身性皮疹、`R21` 皮疹及其他非特定性皮膚出疹 |
| `L51.2` 毒性表皮壞死鬆解症 | `L51.1` 史帝芬-強生氏症候群、`T88.7XXA` 藥物或藥劑未明示之不良作用之初期照護、`L27.0` 內服藥所致之全身性皮疹、`R21` 皮疹及其他非特定性皮膚出疹 |
| `L97.509` 未明示側性足部其他部位非壓迫性慢性潰瘍，未明示嚴重程度 | `E11.621` 第二型糖尿病，伴有足部潰瘍、`E11.40` 第二型糖尿病，伴有糖尿病的神經病變、`E11.51` 第二型糖尿病，伴有糖尿病的周邊血管病變，未伴有壞疽、`M86.9` 骨髓炎、`L03.119` 肢體未明示部位蜂窩組織炎、`L98.499` 其他部位的皮膚非壓迫性慢性潰瘍，未明示嚴重程度、`Z48.00` 來院接受更換或移除非手術傷口敷料 |
| `M00.9` 化膿性關節炎 | `M00.00` 未明示側性關節葡萄球菌性關節炎、`M86.9` 骨髓炎、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`B95.61` 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病、`B95.0` 歸類於他處A群鏈球菌所致的疾病、`M10.9` 痛風、`T84.50XD` 未明示部位內人工關節所致之感染症及發炎性反應之後續照護 |
| `M10.9` 痛風 | `E79.0` 高尿酸血症未伴有關節炎及痛風石、`N20.0` 腎結石、`I10` 本態性(原發性)高血壓、`M25.561` 右側膝部關節痛、`M25.562` 左側膝部關節痛 |
| `M54.50` 下背痛 | `M54.16` 腰椎神經根病變、`M51.26` 其他腰椎椎間盤移位、`M47.816` 腰椎退化性脊椎炎未伴有脊髓病變或神經根病變、`M54.30` 未明示側性坐骨神經痛、`M62.830` 背部肌肉痙攣 |
| `M72.6` 壞死性筋膜炎 | `L03.90` 蜂窩組織炎、`A41.9` 敗血症，未明示病原體、`R65.21` 伴有敗血性休克的嚴重敗血症、`B95.0` 歸類於他處A群鏈球菌所致的疾病、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`E11.9` 第二型糖尿病，未伴有併發症、`L02.91` 皮膚膿瘍 |
| `M86.9` 骨髓炎 | `M00.9` 化膿性關節炎、`M86.10` 未明示部位其他急性骨髓炎、`L97.509` 未明示側性足部其他部位非壓迫性慢性潰瘍，未明示嚴重程度、`E11.621` 第二型糖尿病，伴有足部潰瘍、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`B95.61` 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病、`Z79.2` 長期（現在之）服用抗生素、`A18.01` 脊椎結核病 |
| `N10` 急性腎盂腎炎 | `N39.0` 未明示部位之泌尿道感染症、`B96.20` 歸類於他處大腸桿菌所致的疾病、`B96.1` 歸類於他處肺炎克氏桿菌所致的疾病、`Z16.12` 芽胞菌屬抗生素及β內醯氨抗生素之抗藥性、`N20.0` 腎結石、`R50.9` 發燒 |
| `N17.9` 急性腎衰竭 | `E86.0` 脫水、`A41.9` 敗血症，未明示病原體、`N39.0` 未明示部位之泌尿道感染症、`N18.9` 慢性腎臟疾病、`E87.5` 高血鉀症、`N13.6` 腎盂蓄膿 |
| `N18.30` 慢性腎臟疾病stage 3 | `I12.9` 高血壓性慢性腎臟病伴有第一至第四期慢性腎病或未明示慢性腎病、`D63.1` 慢性腎臟疾病導致的貧血、`E87.5` 高血鉀症、`N25.81` 腎源性續發性副甲狀腺機能亢進症、`E11.22` 第二型糖尿病，糖尿病的慢性腎臟疾病 |
| `N18.4` 第四期慢性腎臟疾病(重度) | `I12.9` 高血壓性慢性腎臟病伴有第一至第四期慢性腎病或未明示慢性腎病、`D63.1` 慢性腎臟疾病導致的貧血、`E87.5` 高血鉀症、`N25.81` 腎源性續發性副甲狀腺機能亢進症、`E11.22` 第二型糖尿病，糖尿病的慢性腎臟疾病 |
| `N18.5` 第五期慢性腎臟疾病 | `I12.9` 高血壓性慢性腎臟病伴有第一至第四期慢性腎病或未明示慢性腎病、`D63.1` 慢性腎臟疾病導致的貧血、`E87.5` 高血鉀症、`N25.81` 腎源性續發性副甲狀腺機能亢進症、`Z99.2` 腎（臟）透析依賴 |
| `N18.6` 末期腎疾病 | `Z99.2` 腎（臟）透析依賴、`D63.1` 慢性腎臟疾病導致的貧血、`E87.5` 高血鉀症、`N25.81` 腎源性續發性副甲狀腺機能亢進症、`I12.9` 高血壓性慢性腎臟病伴有第一至第四期慢性腎病或未明示慢性腎病 |
| `N20.0` 腎結石 | `R31.9` 血尿、`N13.30` 腎水腫、`N23` 腎絞痛 |
| `N30.00` 急性膀胱炎未伴有血尿 | `N39.0` 未明示部位之泌尿道感染症、`B96.20` 歸類於他處大腸桿菌所致的疾病、`R30.0` 排尿困難、`R31.9` 血尿 |
| `N39.0` 未明示部位之泌尿道感染症 | `N30.00` 急性膀胱炎未伴有血尿、`N10` 急性腎盂腎炎、`B96.20` 歸類於他處大腸桿菌所致的疾病、`B96.1` 歸類於他處肺炎克氏桿菌所致的疾病、`B95.2` 歸類於他處腸球菌所致的疾病、`Z16.12` 芽胞菌屬抗生素及β內醯氨抗生素之抗藥性、`R30.0` 排尿困難、`R35.0` 頻尿、`N40.1` 良性攝護腺增生伴有下泌尿道症狀 |
| `N40.0` 良性攝護腺增生未伴有下泌尿道症狀 | `N40.1` 良性攝護腺增生伴有下泌尿道症狀、`R35.1` 夜尿、`R33.9` 尿滯留 |
| `N40.1` 良性攝護腺增生伴有下泌尿道症狀 | `R35.0` 頻尿、`R35.1` 夜尿、`R33.9` 尿滯留、`N39.0` 未明示部位之泌尿道感染症 |
| `R42` 頭暈及目眩 | `H81.10` 未明示側性之良性陣發性眩暈、`H81.20` 未明示側性之前庭神經元炎、`I95.1` 直立性低血壓、`R55` 暈厥及虛脫 |
| `R50.9` 發燒 | `A49.9` 細菌感染、`B34.9` 病毒感染、`J06.9` 急性上呼吸道感染、`N39.0` 未明示部位之泌尿道感染症、`U07.1` 嚴重特殊傳染性肺炎、`J11.1` 未確認流感病毒所致流行性感冒併其他呼吸道表徵、`A41.9` 敗血症，未明示病原體 |
| `R57.9` 休克 | `R57.0` 心因性休克、`R57.1` 低血容性休克、`R65.21` 伴有敗血性休克的嚴重敗血症、`T78.2XXA` 過敏性休克之初期照護、`A41.9` 敗血症，未明示病原體、`I26.99` 其他肺栓塞未伴有急性肺性心臟病、`I95.9` 低血壓 |
| `R65.20` 未伴有敗血性休克的嚴重敗血症 | `A41.9` 敗血症，未明示病原體、`R65.21` 伴有敗血性休克的嚴重敗血症、`N39.0` 未明示部位之泌尿道感染症、`J18.9` 肺炎，未明示病原體、`L03.90` 蜂窩組織炎、`R78.81` 菌血症、`N17.9` 急性腎衰竭 |
| `R65.21` 伴有敗血性休克的嚴重敗血症 | `A41.9` 敗血症，未明示病原體、`R65.20` 未伴有敗血性休克的嚴重敗血症、`N39.0` 未明示部位之泌尿道感染症、`J18.9` 肺炎，未明示病原體、`L03.90` 蜂窩組織炎、`R78.81` 菌血症、`N17.9` 急性腎衰竭 |
| `R74.01` 轉胺基脢含量上升 | `K76.0` 脂肪肝(變化)，他處未歸類者、`B18.1` 慢性病毒性B型肝炎未伴有D 型肝炎病毒、`B18.2` 慢性病毒性C型肝炎、`K74.60` 肝硬化、`C22.0` 肝細胞癌、`B16.9` 急性B型病毒性肝炎未併D 型肝炎病毒未伴有肝昏迷、`B17.10` 急性C型病毒性肝炎未伴有肝昏迷 |
| `R75` 後天免疫不全病毒檢驗結果未確定 | `B20` 人類免疫不全病毒疾病、`Z21` 無症狀之人類免疫不全病毒感染狀態、`Z11.4` 來院接受人類免疫缺乏病毒[HIV]之篩檢、`Z20.6` 人類免疫不全病毒之接觸和疑似曝露 |
| `R76.11` 無活動性結核病結核菌素皮膚試驗之非明示性反應 | `Z22.7` 潛伏結核病、`A15.0` 肺結核、`A15.9` 呼吸道結核病、`R91.8` 肺部其他非特定性異常發現、`Z20.1` 結核病之接觸或疑似曝露、`Z86.11` 結核病之個人史 |
| `R76.12` 無活動性結核病γ干擾素抗原反應的細胞介導免疫測定之非特定性反應 | `Z22.7` 潛伏結核病、`A15.0` 肺結核、`A15.9` 呼吸道結核病、`R91.8` 肺部其他非特定性異常發現、`Z20.1` 結核病之接觸或疑似曝露、`Z86.11` 結核病之個人史 |
| `R78.81` 菌血症 | `A41.9` 敗血症，未明示病原體、`I33.0` 急性及亞急性感染性心內膜炎、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`B96.20` 歸類於他處大腸桿菌所致的疾病 |
| `R91.8` 肺部其他非特定性異常發現 | `A15.0` 肺結核、`A15.9` 呼吸道結核病、`A31.0` 肺分枝桿菌感染、`Z22.7` 潛伏結核病、`J18.9` 肺炎，未明示病原體、`C80.1` 未明示惡性腫瘤（原發性） |
| `S00.03XA` 頭皮挫傷之初期照護 | `S00.03XD` 頭皮挫傷之後續照護、`S01.01XA` 頭皮撕裂傷未伴有異物之初期照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S00.03XD` 頭皮挫傷之後續照護 | `S00.03XA` 頭皮挫傷之初期照護、`S01.01XD` 頭皮撕裂傷未伴有異物之後續照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S01.01XA` 頭皮撕裂傷未伴有異物之初期照護 | `S01.01XD` 頭皮撕裂傷未伴有異物之後續照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S01.01XD` 頭皮撕裂傷未伴有異物之後續照護 | `S01.01XA` 頭皮撕裂傷未伴有異物之初期照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S01.511A` 唇撕裂傷未伴有異物之初期照護 | `S01.511D` 唇撕裂傷未伴有異物之後續照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S01.511D` 唇撕裂傷未伴有異物之後續照護 | `S01.511A` 唇撕裂傷未伴有異物之初期照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S01.81XA` 頭部其他部位撕裂傷未伴有異物之初期照護 | `S01.81XD` 頭部其他部位撕裂傷未伴有異物之後續照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S01.81XD` 頭部其他部位撕裂傷未伴有異物之後續照護 | `S01.81XA` 頭部其他部位撕裂傷未伴有異物之初期照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S16.1XXA` 頸部肌肉，筋膜和肌腱拉傷之初期照護 | `S16.1XXD` 頸部肌肉，筋膜和肌腱拉傷之後續照護、`M62.830` 背部肌肉痙攣、`M54.2` 頸椎痛、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S16.1XXD` 頸部肌肉，筋膜和肌腱拉傷之後續照護 | `S16.1XXA` 頸部肌肉，筋膜和肌腱拉傷之初期照護、`M62.830` 背部肌肉痙攣、`M54.2` 頸椎痛、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S51.819A` 未明示側性前臂撕裂傷未伴有異物之初期照護 | `S51.819D` 未明示側性前臂撕裂傷未伴有異物之後續照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S51.819D` 未明示側性前臂撕裂傷未伴有異物之後續照護 | `S51.819A` 未明示側性前臂撕裂傷未伴有異物之初期照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S60.229A` 未明示側性手部挫傷之初期照護 | `S60.229D` 未明示側性手部挫傷之後續照護、`S60.519A` 未明示側性手部擦傷之初期照護、`S61.419A` 未明示側性手部撕裂傷未伴有異物之初期照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S60.229D` 未明示側性手部挫傷之後續照護 | `S60.229A` 未明示側性手部挫傷之初期照護、`S60.519D` 未明示側性手部擦傷之後續照護、`S61.419D` 未明示側性手部撕裂傷未伴有異物之後續照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S60.519A` 未明示側性手部擦傷之初期照護 | `S60.519D` 未明示側性手部擦傷之後續照護、`S60.229A` 未明示側性手部挫傷之初期照護、`Z48.00` 來院接受更換或移除非手術傷口敷料、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S60.519D` 未明示側性手部擦傷之後續照護 | `S60.519A` 未明示側性手部擦傷之初期照護、`S60.229D` 未明示側性手部挫傷之後續照護、`Z48.00` 來院接受更換或移除非手術傷口敷料、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S61.419A` 未明示側性手部撕裂傷未伴有異物之初期照護 | `S61.419D` 未明示側性手部撕裂傷未伴有異物之後續照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S61.419D` 未明示側性手部撕裂傷未伴有異物之後續照護 | `S61.419A` 未明示側性手部撕裂傷未伴有異物之初期照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S63.509A` 未明示側性腕部扭傷之初期照護 | `S63.509D` 未明示側性腕部扭傷之後續照護、`S60.229A` 未明示側性手部挫傷之初期照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S63.509D` 未明示側性腕部扭傷之後續照護 | `S63.509A` 未明示側性腕部扭傷之初期照護、`S60.229D` 未明示側性手部挫傷之後續照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S80.11XA` 右側小腿挫傷之初期照護 | `S80.11XD` 右側小腿挫傷之後續照護、`S80.12XA` 左側小腿挫傷之初期照護、`S81.819A` 未明示側性小腿未伴有異物撕裂傷之初期照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S80.11XD` 右側小腿挫傷之後續照護 | `S80.11XA` 右側小腿挫傷之初期照護、`S80.12XD` 左側小腿挫傷之後續照護、`S81.819D` 未明示側性小腿未伴有異物撕裂傷之後遺症、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S80.12XA` 左側小腿挫傷之初期照護 | `S80.12XD` 左側小腿挫傷之後續照護、`S80.11XA` 右側小腿挫傷之初期照護、`S81.819A` 未明示側性小腿未伴有異物撕裂傷之初期照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S80.12XD` 左側小腿挫傷之後續照護 | `S80.12XA` 左側小腿挫傷之初期照護、`S80.11XD` 右側小腿挫傷之後續照護、`S81.819D` 未明示側性小腿未伴有異物撕裂傷之後遺症、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S81.819A` 未明示側性小腿未伴有異物撕裂傷之初期照護 | `S81.819D` 未明示側性小腿未伴有異物撕裂傷之後遺症、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S81.819D` 未明示側性小腿未伴有異物撕裂傷之後遺症 | `S81.819A` 未明示側性小腿未伴有異物撕裂傷之初期照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S91.319A` 未明示側性足部撕裂傷未伴有異物之初期照護 | `S91.319D` 未明示側性足部撕裂傷未伴有異物之後續照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S91.319D` 未明示側性足部撕裂傷未伴有異物之後續照護 | `S91.319A` 未明示側性足部撕裂傷未伴有異物之初期照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S93.401A` 右側踝部韌帶扭傷之初期照護 | `S93.401D` 右側踝部韌帶扭傷之後續照護、`S93.402A` 左側踝部韌帶扭傷之初期照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S93.401D` 右側踝部韌帶扭傷之後續照護 | `S93.401A` 右側踝部韌帶扭傷之初期照護、`S93.402D` 左側踝部韌帶扭傷之後續照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S93.402A` 左側踝部韌帶扭傷之初期照護 | `S93.402D` 左側踝部韌帶扭傷之後續照護、`S93.401A` 右側踝部韌帶扭傷之初期照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `S93.402D` 左側踝部韌帶扭傷之後續照護 | `S93.402A` 左側踝部韌帶扭傷之初期照護、`S93.401D` 右側踝部韌帶扭傷之後續照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `T14.90XA` 損傷之初期照護 | `T14.90XD` 損傷之後續照護、`Z48.00` 來院接受更換或移除非手術傷口敷料、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `T14.90XD` 損傷之後續照護 | `T14.90XA` 損傷之初期照護、`Z48.00` 來院接受更換或移除非手術傷口敷料、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `T20.20XA` 頭、臉及頸部未明示部位二度燒傷之初期照護 | `T20.20XD` 頭、臉及頸部未明示部位二度燒傷之後續照護、`Z48.00` 來院接受更換或移除非手術傷口敷料、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `T20.20XD` 頭、臉及頸部未明示部位二度燒傷之後續照護 | `T20.20XA` 頭、臉及頸部未明示部位二度燒傷之初期照護、`Z48.00` 來院接受更換或移除非手術傷口敷料、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `T23.209A` 未明示側性手部未明示部位二度燒傷之初期照護 | `T23.209D` 未明示側性手部未明示部位二度燒傷之後續照護、`Z48.00` 來院接受更換或移除非手術傷口敷料、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `T23.209D` 未明示側性手部未明示部位二度燒傷之後續照護 | `T23.209A` 未明示側性手部未明示部位二度燒傷之初期照護、`Z48.00` 來院接受更換或移除非手術傷口敷料、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `T24.209A` 未明示側性下肢（踝部及足部除外）未明示部位二度燒傷之初期照護 | `T24.209D` 未明示側性下肢（踝部及足部除外）未明示部位二度燒傷之後續照護、`Z48.00` 來院接受更換或移除非手術傷口敷料、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `T24.209D` 未明示側性下肢（踝部及足部除外）未明示部位二度燒傷之後續照護 | `T24.209A` 未明示側性下肢（踝部及足部除外）未明示部位二度燒傷之初期照護、`Z48.00` 來院接受更換或移除非手術傷口敷料、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `T78.2XXA` 過敏性休克之初期照護 | `T78.40XA` 過敏之初期照護、`T78.3XXA` 血管神經性水腫之初期照護、`L50.9` 蕁麻疹、`T88.7XXA` 藥物或藥劑未明示之不良作用之初期照護、`T78.1XXA` 其他有害食物反應，他處未歸類之初期照護、`R57.9` 休克 |
| `T78.40XA` 過敏之初期照護 | `L50.9` 蕁麻疹、`T78.1XXA` 其他有害食物反應，他處未歸類之初期照護、`T88.7XXA` 藥物或藥劑未明示之不良作用之初期照護、`T78.2XXA` 過敏性休克之初期照護、`T78.3XXA` 血管神經性水腫之初期照護 |
| `T80.211D` 中心靜脈導管所致血流感染之後續照護 | `Z45.2` 來院接受血管導管裝置之調整及處理、`R78.81` 菌血症、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`B95.61` 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病、`A41.9` 敗血症，未明示病原體、`Z79.2` 長期（現在之）服用抗生素 |
| `T81.31XA` 手術傷口外部破裂，他處未歸類之初期照護 | `T81.31XD` 手術傷口外部破裂，他處未歸類之後續照護、`T81.41XA` 手術切口表淺部位之處置後感染初期照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `T81.31XD` 手術傷口外部破裂，他處未歸類之後續照護 | `T81.31XA` 手術傷口外部破裂，他處未歸類之初期照護、`T81.41XD` 手術切口表淺部位之處置後感染後續照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `T81.41XA` 手術切口表淺部位之處置後感染初期照護 | `B95.61` 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`B96.20` 歸類於他處大腸桿菌所致的疾病、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`T81.41XD` 手術切口表淺部位之處置後感染後續照護、`T81.31XA` 手術傷口外部破裂，他處未歸類之初期照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `T81.41XD` 手術切口表淺部位之處置後感染後續照護 | `T81.41XA` 手術切口表淺部位之處置後感染初期照護、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`B95.61` 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病 |
| `T84.50XD` 未明示部位內人工關節所致之感染症及發炎性反應之後續照護 | `M00.9` 化膿性關節炎、`M86.9` 骨髓炎、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`B95.61` 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病、`Z79.2` 長期（現在之）服用抗生素、`Z96.649` 存有人工髖關節 |
| `U07.1` 嚴重特殊傳染性肺炎 | `J12.82` 2019 冠狀病毒引起的肺炎、`U09.9` 嚴重特殊傳染性肺炎後的病況、`R05.9` 咳嗽、`R50.9` 發燒 |
| `Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 | `Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線、`T81.41XD` 手術切口表淺部位之處置後感染後續照護、`Z47.89` 來院接受其他骨科之術後療養 |
| `Z11.1` 來院接受呼吸道結核病之篩檢 | `Z22.7` 潛伏結核病、`A15.0` 肺結核、`A15.9` 呼吸道結核病、`R76.11` 無活動性結核病結核菌素皮膚試驗之非明示性反應、`R91.8` 肺部其他非特定性異常發現 |
| `Z11.4` 來院接受人類免疫缺乏病毒[HIV]之篩檢 | `Z21` 無症狀之人類免疫不全病毒感染狀態、`B20` 人類免疫不全病毒疾病、`R75` 後天免疫不全病毒檢驗結果未確定、`A53.9` 梅毒、`Z71.7` 後天免疫缺乏病毒疾病之諮詢、`Z20.6` 人類免疫不全病毒之接觸和疑似曝露 |
| `Z12.89` 來院接受其他部位惡性腫瘤之篩檢 | `C22.0` 肝細胞癌、`K74.60` 肝硬化、`B18.1` 慢性病毒性B型肝炎未伴有D 型肝炎病毒、`B18.2` 慢性病毒性C型肝炎、`R74.01` 轉胺基脢含量上升 |
| `Z16.11` 青黴素之抗藥性 | `Z16.24` 多種抗生素之抗藥性、`B95.61` 歸類於他處甲氧西林敏感性金黃色葡萄球菌感染所致的疾病、`B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`Z22.322` 金黃色葡萄球菌青黴素抗藥性之帶菌者或疑似帶菌者 |
| `Z16.24` 多種抗生素之抗藥性 | `B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`Z16.12` 芽胞菌屬抗生素及β內醯氨抗生素之抗藥性、`Z16.21` 萬古黴素（vancomycin）之抗藥性、`Z16.11` 青黴素之抗藥性、`Z79.2` 長期（現在之）服用抗生素 |
| `Z20.1` 結核病之接觸或疑似曝露 | `Z22.7` 潛伏結核病、`R76.11` 無活動性結核病結核菌素皮膚試驗之非明示性反應、`R76.12` 無活動性結核病γ干擾素抗原反應的細胞介導免疫測定之非特定性反應、`A15.0` 肺結核、`Z11.1` 來院接受呼吸道結核病之篩檢 |
| `Z20.6` 人類免疫不全病毒之接觸和疑似曝露 | `Z11.4` 來院接受人類免疫缺乏病毒[HIV]之篩檢、`R75` 後天免疫不全病毒檢驗結果未確定、`B20` 人類免疫不全病毒疾病、`Z21` 無症狀之人類免疫不全病毒感染狀態、`A53.9` 梅毒 |
| `Z21` 無症狀之人類免疫不全病毒感染狀態 | `B20` 人類免疫不全病毒疾病、`Z79.899` 長期 （現在之）藥物治療、`R75` 後天免疫不全病毒檢驗結果未確定、`Z11.4` 來院接受人類免疫缺乏病毒[HIV]之篩檢、`A53.9` 梅毒、`A63.0` 肛門生殖器疣 |
| `Z22.322` 金黃色葡萄球菌青黴素抗藥性之帶菌者或疑似帶菌者 | `B95.62` 歸類於他處抗甲氧西林（抗藥性）金黃色葡萄球菌感染所致的疾病、`L03.90` 蜂窩組織炎、`A41.9` 敗血症，未明示病原體、`Z16.24` 多種抗生素之抗藥性 |
| `Z22.7` 潛伏結核病 | `A15.0` 肺結核、`A15.9` 呼吸道結核病、`R76.11` 無活動性結核病結核菌素皮膚試驗之非明示性反應、`R76.12` 無活動性結核病γ干擾素抗原反應的細胞介導免疫測定之非特定性反應、`Z86.11` 結核病之個人史、`R91.8` 肺部其他非特定性異常發現、`Z20.1` 結核病之接觸或疑似曝露 |
| `Z22.8` 其他感染性疾病之帶菌者 | `B18.1` 慢性病毒性B型肝炎未伴有D 型肝炎病毒、`B18.2` 慢性病毒性C型肝炎、`K74.60` 肝硬化、`R74.01` 轉胺基脢含量上升、`C22.0` 肝細胞癌 |
| `Z23` 來院接受疫苗接種 | `J44.9` 慢性阻塞性肺病、`E11.9` 第二型糖尿病，未伴有併發症、`N18.5` 第五期慢性腎臟疾病、`K74.60` 肝硬化、`Z90.81` 脾臟後天性缺損、`B20` 人類免疫不全病毒疾病、`R50.83` 疫苗接種後發燒、`T88.1XXA` 免疫接種後其他併發症，他處未歸類之初期照護 |
| `Z28.9` 因未明示原因而未執行疫苗接種 | `Z23` 來院接受疫苗接種、`Z28.03` 因病患之免疫功能不全而未執行疫苗接種、`Z28.04` 因病患對疫苗或成份過敏而未執行疫苗接種、`J44.9` 慢性阻塞性肺病、`E11.9` 第二型糖尿病，未伴有併發症、`B20` 人類免疫不全病毒疾病 |
| `Z45.2` 來院接受血管導管裝置之調整及處理 | `T80.211D` 中心靜脈導管所致血流感染之後續照護、`Z79.2` 長期（現在之）服用抗生素、`I33.0` 急性及亞急性感染性心內膜炎、`M86.9` 骨髓炎、`A41.9` 敗血症，未明示病原體、`Z51.81` 來院接受治療性藥物值監測 |
| `Z47.2` 來院接受移除內固定裝置 | `Z47.89` 來院接受其他骨科之術後療養、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查、`Z48.02` 來院接受拆線 |
| `Z47.89` 來院接受其他骨科之術後療養 | `Z47.2` 來院接受移除內固定裝置、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查、`Z48.01` 來院接受更換或移除手術傷口敷料、`Z48.02` 來院接受拆線 |
| `Z48.00` 來院接受更換或移除非手術傷口敷料 | `Z48.01` 來院接受更換或移除手術傷口敷料、`L97.509` 未明示側性足部其他部位非壓迫性慢性潰瘍，未明示嚴重程度、`L98.499` 其他部位的皮膚非壓迫性慢性潰瘍，未明示嚴重程度、`T24.209D` 未明示側性下肢（踝部及足部除外）未明示部位二度燒傷之後續照護、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 |
| `Z48.01` 來院接受更換或移除手術傷口敷料 | `Z48.02` 來院接受拆線、`Z48.00` 來院接受更換或移除非手術傷口敷料、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查、`T81.41XA` 手術切口表淺部位之處置後感染初期照護、`T81.41XD` 手術切口表淺部位之處置後感染後續照護 |
| `Z48.02` 來院接受拆線 | `Z48.01` 來院接受更換或移除手術傷口敷料、`Z09` 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查、`T81.41XD` 手術切口表淺部位之處置後感染後續照護、`T81.31XD` 手術傷口外部破裂，他處未歸類之後續照護 |
| `Z51.81` 來院接受治療性藥物值監測 | `Z79.2` 長期（現在之）服用抗生素、`I33.0` 急性及亞急性感染性心內膜炎、`M86.9` 骨髓炎、`M00.9` 化膿性關節炎、`Z16.24` 多種抗生素之抗藥性、`Z45.2` 來院接受血管導管裝置之調整及處理 |
| `Z71.7` 後天免疫缺乏病毒疾病之諮詢 | `Z11.4` 來院接受人類免疫缺乏病毒[HIV]之篩檢、`B20` 人類免疫不全病毒疾病、`Z21` 無症狀之人類免疫不全病毒感染狀態、`R75` 後天免疫不全病毒檢驗結果未確定、`A53.9` 梅毒 |
| `Z79.2` 長期（現在之）服用抗生素 | `I33.0` 急性及亞急性感染性心內膜炎、`M86.9` 骨髓炎、`M00.9` 化膿性關節炎、`A41.9` 敗血症，未明示病原體、`Z45.2` 來院接受血管導管裝置之調整及處理、`Z51.81` 來院接受治療性藥物值監測、`Z16.24` 多種抗生素之抗藥性、`T84.50XD` 未明示部位內人工關節所致之感染症及發炎性反應之後續照護 |
| `Z79.899` 長期 （現在之）藥物治療 | `B20` 人類免疫不全病毒疾病、`Z21` 無症狀之人類免疫不全病毒感染狀態、`B59` 肺囊蟲病、`B37.0` 念珠菌性口炎、`B25.9` 巨細胞病毒疾病、`A15.9` 呼吸道結核病、`B45.1` 腦隱球菌病 |
| `Z86.11` 結核病之個人史 | `A15.0` 肺結核、`A15.9` 呼吸道結核病、`Z22.7` 潛伏結核病、`R91.8` 肺部其他非特定性異常發現 |
| `Z96.649` 存有人工髖關節 | `T84.50XD` 未明示部位內人工關節所致之感染症及發炎性反應之後續照護、`M00.9` 化膿性關節炎、`M86.9` 骨髓炎 |

---

面板與快選代碼位置合計 2516 筆。
