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
| `A49.9` | 細菌感染 | 細菌感染 | Bacterial infection, unspecified |
| `B34.9` | 病毒感染 | 病毒感染 | Viral infection, unspecified |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `J11.1` | 流感 | 未確認流感病毒所致流行性感冒併其他呼吸道表徵 | Influenza due to unidentified influenza virus with other respiratory manifestations |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `A90` | 登革熱 | 登革熱[典型登革熱] | Dengue fever [classical dengue] |
| `A75.3` | 恙蟲病 | 恙蟲立克次體所致之斑疹傷寒熱 | Typhus fever due to Rickettsia tsutsugamushi |
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
| `I95.1` | 姿勢性低血壓 | 直立性低血壓 | Orthostatic hypotension |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `E27.40` | 腎上腺功能不全 | 腎上腺皮質功能不足 | Unspecified adrenocortical insufficiency |
| **優先排除（紅旗）** | | | |
| `R65.21` | 敗血性休克（附加碼） | 伴有敗血性休克的嚴重敗血症 | Severe sepsis with septic shock |
| `R57.0` | 心因性休克 | 心因性休克 | Cardiogenic shock |
| `R57.1` | 低血容性休克 | 低血容性休克 | Hypovolemic shock |
| `T78.2XXA` | 過敏性休克 | 過敏性休克之初期照護 | Anaphylactic shock, unspecified, initial encounter |
| `I26.99` | 肺栓塞 | 其他肺栓塞未伴有急性肺性心臟病 | Other pulmonary embolism without acute cor pulmonale |
| `I31.4` | 心包填塞 | 心包膜填塞 | Cardiac tamponade |
| `E27.2` | 艾迪森氏危象（腎上腺危象） | 艾迪森氏危象 | Addisonian crisis |

### 神經／頭頸

#### 頭痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R51.9` | 頭痛 | 頭痛 | Headache, unspecified |
| **常見疾病** | | | |
| `G43.909` | 偏頭痛 | 偏頭痛，未明確定義型態，非頑固性，未伴有偏頭痛重積狀態 | Migraine, unspecified, not intractable, without status migrainosus |
| `G44.209` | 緊縮型頭痛 | 緊縮型頭痛，未明確定義型態，非頑固性 | Tension-type headache, unspecified, not intractable |
| `I10` | 高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| **優先排除（紅旗）** | | | |
| `G03.9` | 腦膜炎 | 腦膜炎 | Meningitis, unspecified |
| `I60.9` | 蜘蛛膜下腔出血 | 非創傷性蜘蛛網膜下腔出血 | Nontraumatic subarachnoid hemorrhage, unspecified |
| `I61.9` | 腦出血 | 非創傷性腦出血 | Nontraumatic intracerebral hemorrhage, unspecified |
| `G04.90` | 腦炎／腦脊髓炎 | 腦炎及腦脊髓炎 | Encephalitis and encephalomyelitis, unspecified |
| `G06.0` | 顱內膿瘍 | 顱內膿瘍及肉芽腫 | Intracranial abscess and granuloma |
| `H40.219` | 急性隅角閉鎖性青光眼 | 未明示側性急性隅角閉鎖性青光眼 | Acute angle-closure glaucoma, unspecified eye |
| `T58.91XA` | 一氧化碳中毒 | 未明示來源一氧化碳意外毒性作用之初期照護 | Toxic effect of carbon monoxide from unspecified source, accidental (unintentional), initial encounter |

#### 頭暈／眩暈

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R42` | 頭暈及目眩 | 頭暈及目眩 | Dizziness and giddiness |
| **常見疾病** | | | |
| `H81.10` | 良性陣發性眩暈 | 未明示側性之良性陣發性眩暈 | Benign paroxysmal vertigo, unspecified ear |
| `H81.20` | 前庭神經元炎 | 未明示側性之前庭神經元炎 | Vestibular neuronitis, unspecified ear |
| `I95.1` | 姿勢性低血壓 | 直立性低血壓 | Orthostatic hypotension |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |
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
| `G93.40` | 腦病變 | 腦病變 | Encephalopathy, unspecified |
| `E87.1` | 低血鈉 | 低滲壓及低血鈉 | Hypo-osmolality and hyponatremia |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `K72.90` | 肝衰竭（肝性腦病變） | 肝衰竭未伴有昏迷 | Hepatic failure, unspecified without coma |
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
| `G45.9` | 暫時性腦缺血 TIA | 短暫性大腦缺血發作 | Transient cerebral ischemic attack, unspecified |
| `G51.0` | 貝爾氏麻痺 | Bell 氏麻痺 | Bell's palsy |
| `G35` | 多發性硬化症 | 多發性硬化症 | Multiple sclerosis |
| `M62.81` | 肌肉無力（廣泛性） | 肌無力 | Muscle weakness (generalized) |
| `G70.00` | 重症肌無力 | 重症肌無力未伴有急性惡化 | Myasthenia gravis without (acute) exacerbation |
| `G62.9` | 多發神經病變 | 多發神經病變 | Polyneuropathy, unspecified |
| `R53.1` | 虛弱 | 虛弱 | Weakness |
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
| `J02.0` | 鏈球菌性咽炎 | 鏈球菌性咽炎 | Streptococcal pharyngitis |
| `J03.90` | 急性扁桃腺炎 | 急性扁桃腺炎 | Acute tonsillitis, unspecified |
| `J04.0` | 急性喉炎 | 急性喉炎 | Acute laryngitis |
| `B27.90` | 傳染性單核球增多症 | 傳染性單核球過多症，未伴有併發症 | Infectious mononucleosis, unspecified without complication |
| `L04.0` | 頭頸部急性淋巴腺炎 | 臉、頭及頸部急性淋巴腺炎 | Acute lymphadenitis of face, head and neck |
| `J05.10` | 急性會厭炎（未伴阻塞） | 急性會厭炎，未伴有阻塞 | Acute epiglottitis without obstruction |
| **優先排除（紅旗）** | | | |
| `J36` | 扁桃腺周圍膿瘍 | 扁桃腺周圍膿瘍 | Peritonsillar abscess |
| `J39.0` | 咽後／咽旁膿瘍 | 後咽、咽旁膿瘍 | Retropharyngeal and parapharyngeal abscess |
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
| `K21.9` | 胃食道逆流 GERD | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `I10` | 高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| `I49.9` | 心律不整 | 心臟節律不整 | Cardiac arrhythmia, unspecified |
| `I30.9` | 急性心包膜炎 | 急性心包膜炎 | Acute pericarditis, unspecified |
| **優先排除（紅旗）** | | | |
| `I21.9` | 急性心肌梗塞 | 急性心肌梗塞 | Acute myocardial infarction, unspecified |
| `I26.99` | 肺栓塞 | 其他肺栓塞未伴有急性肺性心臟病 | Other pulmonary embolism without acute cor pulmonale |
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
| `J69.0` | 吸入性肺炎 | 吸入食物或嘔吐物所致之肺炎 | Pneumonitis due to inhalation of food and vomit |
| `J84.9` | 間質性肺疾病 | 間質性肺疾病 | Interstitial pulmonary disease, unspecified |
| **優先排除（紅旗）** | | | |
| `I26.99` | 肺栓塞 | 其他肺栓塞未伴有急性肺性心臟病 | Other pulmonary embolism without acute cor pulmonale |
| `I21.9` | 急性心肌梗塞 | 急性心肌梗塞 | Acute myocardial infarction, unspecified |
| `T78.2XXA` | 過敏性休克 | 過敏性休克之初期照護 | Anaphylactic shock, unspecified, initial encounter |
| `T78.3XXA` | 血管性水腫 | 血管神經性水腫之初期照護 | Angioneurotic edema, initial encounter |
| `J93.0` | 張力性氣胸（自發性） | 自發性壓力性氣胸 | Spontaneous tension pneumothorax |
| `I50.1` | 左心衰竭／急性肺水腫 | 左心衰竭 | Left ventricular failure, unspecified |
| `E11.10` | 糖尿病酮酸中毒 DKA（第二型） | 第二型糖尿病，伴有酮酸中毒，未伴有昏迷 | Type 2 diabetes mellitus with ketoacidosis without coma |

#### 暈厥

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R55` | 暈厥及虛脫 | 暈厥及虛脫 | Syncope and collapse |
| **常見疾病** | | | |
| `I95.1` | 姿勢性低血壓 | 直立性低血壓 | Orthostatic hypotension |
| `I95.9` | 低血壓 | 低血壓 | Hypotension, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `I49.9` | 心律不整 | 心臟節律不整 | Cardiac arrhythmia, unspecified |
| `R00.1` | 心搏過緩 | 心博過慢 | Bradycardia, unspecified |
| **優先排除（紅旗）** | | | |
| `I21.9` | 急性心肌梗塞 | 急性心肌梗塞 | Acute myocardial infarction, unspecified |
| `I26.99` | 肺栓塞 | 其他肺栓塞未伴有急性肺性心臟病 | Other pulmonary embolism without acute cor pulmonale |
| `I71.00` | 主動脈剝離 | 未明示部位之主動脈瘤剝離 | Dissection of unspecified site of aorta |
| `K92.2` | 胃腸道出血 | 胃腸道出血 | Gastrointestinal hemorrhage, unspecified |
| `E16.2` | 低血糖 | 低血糖 | Hypoglycemia, unspecified |
| `I44.2` | 完全房室傳導阻斷 | 完全性房室傳導阻滯 | Atrioventricular block, complete |
| `I35.0` | 主動脈瓣狹窄 | 非風濕性主動脈瓣狹窄 | Nonrheumatic aortic (valve) stenosis |

### 腹部／消化

#### 腹痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R10.9` | 腹痛 | 腹痛 | Unspecified abdominal pain |
| `R10.13` | 心窩部痛 | 心窩部痛 | Epigastric pain |
| `R10.84` | 全腹痛 | 全腹痛 | Generalized abdominal pain |
| **常見疾病** | | | |
| `K29.70` | 胃炎 | 胃炎未伴有出血 | Gastritis, unspecified, without bleeding |
| `K21.9` | 胃食道逆流 GERD | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K80.20` | 膽囊結石（未伴膽囊炎） | 膽囊結石未伴有膽囊炎未伴有阻塞 | Calculus of gallbladder without cholecystitis without obstruction |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `K85.90` | 急性胰臟炎 | 急性胰臟炎未伴有壞死或感染 | Acute pancreatitis without necrosis or infection, unspecified |
| `K92.2` | 胃腸道出血 | 胃腸道出血 | Gastrointestinal hemorrhage, unspecified |
| `K58.9` | 腸躁症 | 激躁性腸症候群未伴有腹瀉 | Irritable bowel syndrome without diarrhea |
| `K57.32` | 大腸憩室炎 | 大腸憩室炎未伴有穿孔或膿瘍無出血 | Diverticulitis of large intestine without perforation or abscess without bleeding |
| `N23` | 腎絞痛 | 腎絞痛 | Unspecified renal colic |
| **優先排除（紅旗）** | | | |
| `K35.80` | 急性闌尾炎 | 急性闌尾炎 | Unspecified acute appendicitis |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |
| `K55.069` | 腸繫膜梗塞 | 急性腸部分梗塞，未明示程度 | Acute infarction of intestine, part and extent unspecified |
| `I71.30` | 腹主動脈瘤破裂 | 腹主動脈瘤，已破裂 | Abdominal aortic aneurysm, ruptured, unspecified |
| `K63.1` | 腸穿孔 | 腸穿孔(非創傷性) | Perforation of intestine (nontraumatic) |
| `O00.90` | 子宮外孕 | 子宮外孕未伴有子宮內妊娠 | Unspecified ectopic pregnancy without intrauterine pregnancy |
| `K83.09` | 急性膽管炎 | 其他膽管炎 | Other cholangitis |

#### 噁心嘔吐

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R11.2` | 噁心伴嘔吐 | 噁心伴有嘔吐 | Nausea with vomiting, unspecified |
| `R11.10` | 嘔吐 | 嘔吐 | Vomiting, unspecified |
| **常見疾病** | | | |
| `K21.9` | 胃食道逆流 GERD | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K29.70` | 胃炎 | 胃炎未伴有出血 | Gastritis, unspecified, without bleeding |
| `K52.9` | 非感染性腸胃炎 | 非傳染性胃腸炎及結腸炎 | Noninfective gastroenteritis and colitis, unspecified |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `K85.90` | 急性胰臟炎 | 急性胰臟炎未伴有壞死或感染 | Acute pancreatitis without necrosis or infection, unspecified |
| **優先排除（紅旗）** | | | |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |
| `K92.2` | 胃腸道出血 | 胃腸道出血 | Gastrointestinal hemorrhage, unspecified |
| `E11.10` | 糖尿病酮酸中毒 DKA（第二型） | 第二型糖尿病，伴有酮酸中毒，未伴有昏迷 | Type 2 diabetes mellitus with ketoacidosis without coma |
| `E10.10` | 糖尿病酮酸中毒 DKA（第一型） | 第一型糖尿病，伴有酮酸中毒，未伴有昏迷 | Type 1 diabetes mellitus with ketoacidosis without coma |
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
| `K52.9` | 非感染性腸胃炎 | 非傳染性胃腸炎及結腸炎 | Noninfective gastroenteritis and colitis, unspecified |
| `A08.4` | 病毒性腸炎 | 病毒性腸道病毒感染 | Viral intestinal infection, unspecified |
| `K58.0` | 腸躁症伴腹瀉 | 激躁性腸症候群併腹瀉 | Irritable bowel syndrome with diarrhea |
| `A02.0` | 沙門氏菌腸炎 | 沙門桿菌腸炎 | Salmonella enteritis |
| `A03.9` | 志賀桿菌痢疾 | 志賀桿菌病 | Shigellosis, unspecified |
| `A06.0` | 急性阿米巴痢疾 | 急性阿米巴性痢疾 | Acute amebic dysentery |
| **優先排除（紅旗）** | | | |
| `A04.72` | 艱難梭菌腸道感染 CDI | 艱難梭菌所致腸道感染，未明示為復發型 | Enterocolitis due to Clostridium difficile, not specified as recurrent |
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
| `K25.4` | 胃潰瘍伴出血 | 慢性或未明示胃潰瘍併出血 | Chronic or unspecified gastric ulcer with hemorrhage |
| `K26.4` | 十二指腸潰瘍伴出血 | 慢性或未明示十二指腸潰瘍併出血 | Chronic or unspecified duodenal ulcer with hemorrhage |
| `K29.01` | 急性胃炎伴出血 | 急性胃炎併出血 | Acute gastritis with bleeding |
| `K22.6` | Mallory-Weiss 撕裂傷 | 胃、食道接合部裂傷出血徵候群 | Gastro-esophageal laceration-hemorrhage syndrome |
| **優先排除（紅旗）** | | | |
| `I85.01` | 食道靜脈曲張出血（原發） | 食道靜脈曲張伴有出血 | Esophageal varices with bleeding |
| `I85.11` | 食道靜脈曲張出血（續發於肝硬化） | 續發性食道靜脈曲張伴有出血 | Secondary esophageal varices with bleeding |
| `R57.1` | 低血容性休克 | 低血容性休克 | Hypovolemic shock |
| `D62` | 急性失血性貧血 | 急性出血後貧血 | Acute posthemorrhagic anemia |
| `K25.1` | 胃潰瘍穿孔 | 急性胃潰瘍併穿孔 | Acute gastric ulcer with perforation |
| `K26.1` | 急性十二指腸潰瘍穿孔 | 急性十二指腸潰瘍併穿孔 | Acute duodenal ulcer with perforation |
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
| `N40.1` | 攝護腺增生伴下泌尿道症狀 BPH | 良性攝護腺增生伴有下泌尿道症狀 | Benign prostatic hyperplasia with lower urinary tract symptoms |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `N18.9` | 慢性腎臟疾病 | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `N41.0` | 急性攝護腺炎 | 急性攝護腺炎 | Acute prostatitis |
| **優先排除（紅旗）** | | | |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `R33.9` | 尿滯留 | 尿滯留 | Retention of urine, unspecified |
| `N13.6` | 腎盂蓄膿 | 腎盂蓄膿 | Pyonephrosis |
| `A41.9` | 敗血症 | 敗血症，未明示病原體 | Sepsis, unspecified organism |
| `N17.9` | 急性腎損傷（AKI） | 急性腎衰竭 | Acute kidney failure, unspecified |
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
| `N30.01` | 急性膀胱炎伴血尿 | 急性膀胱炎伴有血尿 | Acute cystitis with hematuria |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `N18.9` | 慢性腎臟疾病 | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `N40.1` | 攝護腺增生伴下泌尿道症狀 BPH | 良性攝護腺增生伴有下泌尿道症狀 | Benign prostatic hyperplasia with lower urinary tract symptoms |
| **優先排除（紅旗）** | | | |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `C67.9` | 膀胱惡性腫瘤 | 膀胱惡性腫瘤 | Malignant neoplasm of bladder, unspecified |
| `C64.9` | 腎惡性腫瘤 | 未明示側性腎惡性腫瘤，腎盂除外 | Malignant neoplasm of unspecified kidney, except renal pelvis |
| `N05.9` | 腎炎症候群 | 非特異性的腎炎症候群伴有非特異性的組織形態改變 | Unspecified nephritic syndrome with unspecified morphologic changes |
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
| `B02.9` | 帶狀疱疹 | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `L27.0` | 全身性藥物疹 | 內服藥所致之全身性皮疹 | Generalized skin eruption due to drugs and medicaments taken internally |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
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
| `T78.40XA` | 過敏反應 | 過敏之初期照護 | Allergy, unspecified, initial encounter |
| **常見疾病** | | | |
| `L50.9` | 蕁麻疹 | 蕁麻疹 | Urticaria, unspecified |
| `L50.0` | 過敏性蕁麻疹 | 過敏性蕁麻疹 | Allergic urticaria |
| `T78.1XXA` | 食物不良反應 | 其他有害食物反應，他處未歸類之初期照護 | Other adverse food reactions, not elsewhere classified, initial encounter |
| `T88.7XXA` | 藥物不良反應 | 藥物或藥劑未明示之不良作用之初期照護 | Unspecified adverse effect of drug or medicament, initial encounter |
| `L27.0` | 全身性藥物疹 | 內服藥所致之全身性皮疹 | Generalized skin eruption due to drugs and medicaments taken internally |
| `J30.9` | 過敏性鼻炎 | 過敏性鼻炎 | Allergic rhinitis, unspecified |
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
| `M54.16` | 腰椎神經根病變 | 腰椎神經根病變 | Radiculopathy, lumbar region |
| `M51.26` | 腰椎椎間盤移位 | 其他腰椎椎間盤移位 | Other intervertebral disc displacement, lumbar region |
| `M47.816` | 腰椎退化性脊椎炎 | 腰椎退化性脊椎炎未伴有脊髓病變或神經根病變 | Spondylosis without myelopathy or radiculopathy, lumbar region |
| `M48.061` | 腰椎脊椎狹窄（未伴神經性跛行） | 腰椎脊椎狹窄症未伴有神經源性跛行 | Spinal stenosis, lumbar region without neurogenic claudication |
| `M48.062` | 腰椎脊椎狹窄（伴神經性跛行） | 腰椎脊椎狹窄症伴有神經源性跛行 | Spinal stenosis, lumbar region with neurogenic claudication |
| `M19.90` | 骨關節炎 | 未明示部位骨關節炎 | Unspecified osteoarthritis, unspecified site |
| **優先排除（紅旗）** | | | |
| `G06.1` | 脊椎管內膿瘍 | 脊椎管內膿瘍及肉芽腫 | Intraspinal abscess and granuloma |
| `G83.4` | 馬尾症候群 | 馬尾症候群 | Cauda equina syndrome |
| `M46.26` | 腰椎脊椎骨髓炎 | 腰椎脊椎骨髓炎 | Osteomyelitis of vertebra, lumbar region |
| `I71.00` | 主動脈剝離 | 未明示部位之主動脈瘤剝離 | Dissection of unspecified site of aorta |
| `I71.30` | 腹主動脈瘤破裂 | 腹主動脈瘤，已破裂 | Abdominal aortic aneurysm, ruptured, unspecified |
| `C79.51` | 骨骼轉移 | 骨骼續發性惡性腫瘤 | Secondary malignant neoplasm of bone |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |

#### 關節痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `M25.50` | 關節痛 | 關節痛 | Pain in unspecified joint |
| **常見疾病** | | | |
| `M10.9` | 痛風 | 痛風 | Gout, unspecified |
| `M06.9` | 類風濕性關節炎 | 類風濕性關節炎 | Rheumatoid arthritis, unspecified |
| `M19.90` | 骨關節炎 | 未明示部位骨關節炎 | Unspecified osteoarthritis, unspecified site |
| `M17.9` | 膝部骨關節炎 | 膝部骨關節炎 | Osteoarthritis of knee, unspecified |
| `M11.20` | 其他軟骨鈣化症 | 未明示部位其他軟骨鈣化症 | Other chondrocalcinosis, unspecified site |
| **優先排除（紅旗）** | | | |
| `M00.9` | 化膿性關節炎 | 化膿性關節炎 | Pyogenic arthritis, unspecified |
| `I82.409` | 下肢深部靜脈栓塞 DVT | 未明示側性下肢未明示深部靜脈急性栓塞及血栓 | Acute embolism and thrombosis of unspecified deep veins of unspecified lower extremity |
| `M86.9` | 骨髓炎 | 骨髓炎 | Osteomyelitis, unspecified |
| `M72.6` | 壞死性筋膜炎 | 壞死性筋膜炎 | Necrotizing fasciitis |

## 內科門診（10 個部位群組 / 37 張面板）

### 全身／感染

#### 發燒／寒顫

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R50.9` | 發燒 | 發燒 | Fever, unspecified |
| `R68.83` | 寒顫（未伴發燒） | 寒顫(未伴有發燒) | Chills (without fever) |
| **常見疾病** | | | |
| `A49.9` | 細菌感染 | 細菌感染 | Bacterial infection, unspecified |
| `B34.9` | 病毒感染 | 病毒感染 | Viral infection, unspecified |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `J11.1` | 流感 | 未確認流感病毒所致流行性感冒併其他呼吸道表徵 | Influenza due to unidentified influenza virus with other respiratory manifestations |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |

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
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `E11.9` | 第二型糖尿病 | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `N18.9` | 慢性腎臟疾病 | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `F32.A` | 憂鬱症 | 非特定性的鬱症 | Depression, unspecified |
| `C80.1` | 惡性腫瘤未明示部位 | 未明示惡性腫瘤（原發性） | Malignant (primary) neoplasm, unspecified |

#### 淋巴結腫大

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R59.0` | 局部淋巴結腫大 | 局部性淋巴結腫大 | Localized enlarged lymph nodes |
| `R59.1` | 全身淋巴結腫大 | 全身性淋巴結腫大 | Generalized enlarged lymph nodes |
| `R59.9` | 淋巴結腫大 | 淋巴結腫大 | Enlarged lymph nodes, unspecified |
| **常見疾病** | | | |
| `A49.9` | 細菌感染 | 細菌感染 | Bacterial infection, unspecified |
| `B34.9` | 病毒感染 | 病毒感染 | Viral infection, unspecified |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `B27.90` | 傳染性單核球增多症 | 傳染性單核球過多症，未伴有併發症 | Infectious mononucleosis, unspecified without complication |
| `C81.90` | 霍奇金淋巴瘤 | 未明示部位之何杰金淋巴瘤 | Hodgkin lymphoma, unspecified, unspecified site |
| `C85.90` | 非霍奇金淋巴瘤 | 未明示部位之非何杰金(氏)淋巴瘤 | Non-Hodgkin lymphoma, unspecified, unspecified site |

### 感染科追蹤

#### HIV 感染追蹤

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `Z21` | 無症狀 HIV 感染狀態 | 無症狀之人類免疫不全病毒感染狀態 | Asymptomatic human immunodeficiency virus [HIV] infection status |
| `Z79.899` | 長期藥物治療（抗病毒） | 長期 （現在之）藥物治療 | Other long term (current) drug therapy |
| `Z11.4` | HIV 篩檢 | 來院接受人類免疫缺乏病毒[HIV]之篩檢 | Encounter for screening for human immunodeficiency virus [HIV] |
| `Z20.6` | HIV 接觸暴露 | 人類免疫不全病毒之接觸和疑似曝露 | Contact with and (suspected) exposure to human immunodeficiency virus [HIV] |
| `Z71.7` | HIV 諮詢 | 後天免疫缺乏病毒疾病之諮詢 | Human immunodeficiency virus [HIV] counseling |
| **常見疾病** | | | |
| `B20` | HIV 疾病 | 人類免疫不全病毒疾病 | Human immunodeficiency virus [HIV] disease |
| `R75` | HIV 檢驗結果未確定 | 後天免疫不全病毒檢驗結果未確定 | Inconclusive laboratory evidence of human immunodeficiency virus [HIV] |
| `B59` | 肺囊蟲病 | 肺囊蟲病 | Pneumocystosis |
| `B37.0` | 念珠菌性口炎 | 念珠菌性口炎 | Candidal stomatitis |
| `B58.9` | 弓漿蟲病 | 弓漿蟲病 | Toxoplasmosis, unspecified |
| `B45.1` | 腦隱球菌病 | 腦隱球菌病 | Cerebral cryptococcosis |
| `B25.9` | 巨細胞病毒疾病 | 巨細胞病毒疾病 | Cytomegaloviral disease, unspecified |
| `A15.9` | 呼吸道結核病 | 呼吸道結核病 | Respiratory tuberculosis unspecified |
| `A53.9` | 梅毒 | 梅毒 | Syphilis, unspecified |
| `A53.0` | 潛伏性梅毒 | 未明示早期或晚期的潛伏性梅毒 | Latent syphilis, unspecified as early or late |
| `A63.0` | 肛門生殖器疣 | 肛門生殖器疣 | Anogenital (venereal) warts |
| `C46.9` | 卡波西氏肉瘤 | 卡波西氏肉瘤 | Kaposi's sarcoma, unspecified |

#### 慢性 B／C 型肝炎追蹤

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `B18.1` | 慢性 B 型肝炎 | 慢性病毒性B型肝炎未伴有D 型肝炎病毒 | Chronic viral hepatitis B without delta-agent |
| `B18.2` | 慢性 C 型肝炎 | 慢性病毒性C型肝炎 | Chronic viral hepatitis C |
| `R74.01` | 肝指數上升 | 轉胺基脢含量上升 | Elevation of levels of liver transaminase levels |
| `Z22.8` | 其他感染性疾病帶菌者 | 其他感染性疾病之帶菌者 | Carrier of other infectious diseases |
| `Z12.89` | 其他部位腫瘤篩檢 | 來院接受其他部位惡性腫瘤之篩檢 | Encounter for screening for malignant neoplasm of other sites |
| **常見疾病** | | | |
| `K74.60` | 肝硬化 | 肝硬化 | Unspecified cirrhosis of liver |
| `C22.0` | 肝細胞癌 | 肝細胞癌 | Liver cell carcinoma |
| `K72.10` | 慢性肝衰竭 | 慢性肝衰竭未伴有昏迷 | Chronic hepatic failure without coma |
| `I85.10` | 續發性食道靜脈曲張未伴出血 | 續發性食道靜脈曲張未伴有出血 | Secondary esophageal varices without bleeding |
| `R18.8` | 腹水 | 其他腹水 | Other ascites |
| `K76.0` | 脂肪肝 | 脂肪肝(變化)，他處未歸類者 | Fatty (change of) liver, not elsewhere classified |
| `B18.0` | 慢性 B 型肝炎伴 D 型肝炎 | 慢性病毒性B型肝炎伴有D 型肝炎病毒 | Chronic viral hepatitis B with delta-agent |
| `B16.9` | 急性 B 型肝炎 | 急性B型病毒性肝炎未併D 型肝炎病毒未伴有肝昏迷 | Acute hepatitis B without delta-agent and without hepatic coma |
| `B17.10` | 急性 C 型肝炎 | 急性C型病毒性肝炎未伴有肝昏迷 | Acute hepatitis C without hepatic coma |

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
| `A15.6` | 結核性肋膜炎 | 結核性肋膜炎 | Tuberculous pleurisy |
| `A15.4` | 胸腔內淋巴結結核 | 胸腔內淋巴結結核 | Tuberculosis of intrathoracic lymph nodes |
| `A18.2` | 結核性周邊淋巴腺病變 | 結核性周邊淋巴腺病變 | Tuberculous peripheral lymphadenopathy |
| `A18.01` | 脊椎結核 | 脊椎結核病 | Tuberculosis of spine |
| `A19.9` | 粟粒性結核 | 粟粒狀結核 | Miliary tuberculosis, unspecified |
| `A31.0` | 肺部非結核分枝桿菌感染 NTM | 肺分枝桿菌感染 | Pulmonary mycobacterial infection |
| `Z86.11` | 結核病個人史 | 結核病之個人史 | Personal history of tuberculosis |
| `R91.8` | 肺部影像異常 | 肺部其他非特定性異常發現 | Other nonspecific abnormal finding of lung field |
| `R74.01` | 肝指數上升（藥物肝毒性監測） | 轉胺基脢含量上升 | Elevation of levels of liver transaminase levels |
| `K71.9` | 藥物性肝損傷 | 毒性肝疾病 | Toxic liver disease, unspecified |

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
| `M86.9` | 骨髓炎 | 骨髓炎 | Osteomyelitis, unspecified |
| `M00.9` | 化膿性關節炎 | 化膿性關節炎 | Pyogenic arthritis, unspecified |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `A41.9` | 敗血症 | 敗血症，未明示病原體 | Sepsis, unspecified organism |
| `K75.0` | 肝膿瘍 | 肝膿瘍 | Abscess of liver |
| `T80.211A` | 中心靜脈導管血流感染（初期照護） | 中心靜脈導管所致血流感染之初期照護 | Bloodstream infection due to central venous catheter, initial encounter |
| `T80.211D` | 中心靜脈導管血流感染（後續照護） | 中心靜脈導管所致血流感染之後續照護 | Bloodstream infection due to central venous catheter, subsequent encounter |
| `T84.50XA` | 人工關節感染（初期照護） | 未明示部位內人工關節所致之感染症及發炎性反應之初期照護 | Infection and inflammatory reaction due to unspecified internal joint prosthesis, initial encounter |
| `T84.50XD` | 人工關節感染（後續照護） | 未明示部位內人工關節所致之感染症及發炎性反應之後續照護 | Infection and inflammatory reaction due to unspecified internal joint prosthesis, subsequent encounter |
| `Z16.24` | 多重抗生素抗藥性（附加碼） | 多種抗生素之抗藥性 | Resistance to multiple antibiotics |
| `Z16.11` | 青黴素抗藥性（附加碼） | 青黴素之抗藥性 | Resistance to penicillins |
| `Z22.322` | MRSA 帶菌者 | 金黃色葡萄球菌青黴素抗藥性之帶菌者或疑似帶菌者 | Carrier or suspected carrier of Methicillin resistant Staphylococcus aureus |

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
| `T84.50XA` | 人工關節感染（初期照護） | 未明示部位內人工關節所致之感染症及發炎性反應之初期照護 | Infection and inflammatory reaction due to unspecified internal joint prosthesis, initial encounter |
| `T84.50XD` | 人工關節感染（後續照護） | 未明示部位內人工關節所致之感染症及發炎性反應之後續照護 | Infection and inflammatory reaction due to unspecified internal joint prosthesis, subsequent encounter |
| `M00.9` | 化膿性關節炎 | 化膿性關節炎 | Pyogenic arthritis, unspecified |
| `M00.00` | 葡萄球菌性關節炎 | 未明示側性關節葡萄球菌性關節炎 | Staphylococcal arthritis, unspecified joint |
| `M46.20` | 脊椎骨髓炎 | 未明示部位脊椎骨髓炎 | Osteomyelitis of vertebra, site unspecified |
| `M46.40` | 椎間盤炎 | 未明示部位椎間盤炎 | Discitis, unspecified, site unspecified |
| `A18.01` | 脊椎結核 | 脊椎結核病 | Tuberculosis of spine |
| `E11.621` | 第二型糖尿病伴足部潰瘍 | 第二型糖尿病，伴有足部潰瘍 | Type 2 diabetes mellitus with foot ulcer |
| `L97.509` | 足部慢性潰瘍 | 未明示側性足部其他部位非壓迫性慢性潰瘍，未明示嚴重程度 | Non-pressure chronic ulcer of other part of unspecified foot with unspecified severity |
| `M10.9` | 痛風 | 痛風 | Gout, unspecified |
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
| `R50.83` | 疫苗接種後發燒 | 疫苗接種後發燒 | Postvaccination fever |
| `T88.1XXA` | 疫苗接種後其他併發症（初期照護） | 免疫接種後其他併發症，他處未歸類之初期照護 | Other complications following immunization, not elsewhere classified, initial encounter |
| `T80.52XA` | 疫苗接種後過敏性休克（初期照護） | 接種疫苗所致過敏性休克反應之初期照護 | Anaphylactic reaction due to vaccination, initial encounter |
| `Z28.03` | 因免疫功能不全未接種 | 因病患之免疫功能不全而未執行疫苗接種 | Immunization not carried out because of immune compromised state of patient |
| `Z28.04` | 因對疫苗成分過敏未接種 | 因病患對疫苗或成份過敏而未執行疫苗接種 | Immunization not carried out because of patient allergy to vaccine or component |
| `J44.9` | 慢性阻塞性肺病 COPD | 慢性阻塞性肺病 | Chronic obstructive pulmonary disease, unspecified |
| `E11.9` | 第二型糖尿病 | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `N18.5` | 第五期慢性腎臟疾病 | 第五期慢性腎臟疾病 | Chronic kidney disease, stage 5 |
| `K74.60` | 肝硬化 | 肝硬化 | Unspecified cirrhosis of liver |
| `Z90.81` | 無脾（脾臟切除後） | 脾臟後天性缺損 | Acquired absence of spleen |
| `B20` | HIV 疾病 | 人類免疫不全病毒疾病 | Human immunodeficiency virus [HIV] disease |
| `A53.9` | 梅毒 | 梅毒 | Syphilis, unspecified |
| `A63.0` | 肛門生殖器疣 | 肛門生殖器疣 | Anogenital (venereal) warts |
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
| `A92.0` | 屈公病 | 奇孔古尼亞病毒疾病 | Chikungunya virus disease |
| `A27.9` | 鉤端螺旋體病 | 細鉤端螺旋體病 | Leptospirosis, unspecified |
| `A92.5` | 茲卡病毒感染 | 茲卡病毒疾病 | Zika virus disease |
| `A01.00` | 傷寒 | 傷寒 | Typhoid fever, unspecified |
| `A75.9` | 斑疹傷寒 | 斑疹傷寒熱 | Typhus fever, unspecified |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `B05.9` | 麻疹（未伴併發症） | 麻疹未伴有併發症 | Measles without complication |

### 神經／精神

#### 頭痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R51.9` | 頭痛 | 頭痛 | Headache, unspecified |
| **常見疾病** | | | |
| `G43.909` | 偏頭痛 | 偏頭痛，未明確定義型態，非頑固性，未伴有偏頭痛重積狀態 | Migraine, unspecified, not intractable, without status migrainosus |
| `G44.209` | 緊縮型頭痛 | 緊縮型頭痛，未明確定義型態，非頑固性 | Tension-type headache, unspecified, not intractable |
| `I10` | 高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |

#### 頭暈／眩暈

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R42` | 頭暈及目眩 | 頭暈及目眩 | Dizziness and giddiness |
| **常見疾病** | | | |
| `H81.10` | 良性陣發性眩暈 | 未明示側性之良性陣發性眩暈 | Benign paroxysmal vertigo, unspecified ear |
| `H81.20` | 前庭神經元炎 | 未明示側性之前庭神經元炎 | Vestibular neuronitis, unspecified ear |
| `I95.1` | 姿勢性低血壓 | 直立性低血壓 | Orthostatic hypotension |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |

#### 失眠／情緒

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `G47.00` | 失眠 | 非特定的失眠症 | Insomnia, unspecified |
| `R45.0` | 神經過敏 | 神經過敏 | Nervousness |
| **常見疾病** | | | |
| `F32.A` | 憂鬱症 | 非特定性的鬱症 | Depression, unspecified |
| `G47.33` | 阻塞型睡眠呼吸中止症 | 阻塞性睡眠呼吸中止 (成人) (小兒) | Obstructive sleep apnea (adult) (pediatric) |
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `F51.01` | 原發性失眠 | 原發性失眠症 | Primary insomnia |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |

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
| `H10.10` | 過敏性結膜炎 | 未明示側性之急性過敏性結膜炎 | Acute atopic conjunctivitis, unspecified eye |
| `H10.409` | 慢性結膜炎 | 未明示側性之慢性結膜炎 | Unspecified chronic conjunctivitis, unspecified eye |
| `B30.9` | 病毒性結膜炎 | 病毒性結膜炎 | Viral conjunctivitis, unspecified |
| `H16.9` | 角膜炎 | 角膜炎 | Unspecified keratitis |
| `H04.129` | 乾眼症 | 未明示側性之淚腺乾眼症 | Dry eye syndrome of unspecified lacrimal gland |
| `B02.30` | 帶狀疱疹眼病 | 帶狀疱疹眼病 | Zoster ocular disease, unspecified |

#### 耳痛／耳鳴

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `H92.09` | 耳痛 | 未明示側性之耳痛 | Otalgia, unspecified ear |
| `H93.19` | 耳鳴 | 未明示側性之耳鳴 | Tinnitus, unspecified ear |
| `H92.10` | 耳漏 | 未明示側性之耳漏 | Otorrhea, unspecified ear |
| `H91.90` | 聽力障礙 | 未明示側性之聽障 | Unspecified hearing loss, unspecified ear |
| **常見疾病** | | | |
| `H66.90` | 中耳炎 | 未明示側性中耳炎 | Otitis media, unspecified, unspecified ear |
| `H60.90` | 外耳炎 | 未明示側性外耳炎 | Unspecified otitis externa, unspecified ear |
| `H61.20` | 耳垢嵌塞 | 未明示側性耳垢嵌塞 | Impacted cerumen, unspecified ear |
| `H69.80` | 耳咽管功能障礙 | 未明示側性其他特定之耳咽管疾患 | Other specified disorders of Eustachian tube, unspecified ear |
| `B02.21` | 疱疹後膝狀神經節炎 | 疱疹後膝狀神經節炎 | Postherpetic geniculate ganglionitis |

#### 鼻塞／鼻竇

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R09.81` | 鼻塞 | 鼻塞 | Nasal congestion |
| `R04.0` | 鼻出血 | 鼻出血 | Epistaxis |
| `R43.0` | 嗅覺喪失 | 嗅覺喪失 | Anosmia |
| **常見疾病** | | | |
| `J01.90` | 急性鼻竇炎 | 急性鼻竇炎 | Acute sinusitis, unspecified |
| `J32.9` | 慢性鼻竇炎 | 慢性鼻竇炎 | Chronic sinusitis, unspecified |
| `J30.9` | 過敏性鼻炎 | 過敏性鼻炎 | Allergic rhinitis, unspecified |
| `J31.0` | 慢性鼻炎 | 慢性鼻炎 | Chronic rhinitis |
| `J00` | 感冒 | 急性鼻咽炎（感冒） | Acute nasopharyngitis [common cold] |
| `J34.2` | 鼻中隔彎曲 | 鼻中隔彎曲 | Deviated nasal septum |
| `U07.1` | COVID-19 | 嚴重特殊傳染性肺炎 | COVID-19 |

#### 喉嚨痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R07.0` | 喉嚨痛 | 喉嚨痛 | Pain in throat |
| **常見疾病** | | | |
| `J02.9` | 急性咽炎 | 急性咽炎 | Acute pharyngitis, unspecified |
| `J02.0` | 鏈球菌性咽炎 | 鏈球菌性咽炎 | Streptococcal pharyngitis |
| `J03.90` | 急性扁桃腺炎 | 急性扁桃腺炎 | Acute tonsillitis, unspecified |
| `J04.0` | 急性喉炎 | 急性喉炎 | Acute laryngitis |

### 胸肺／心臟

#### 咳嗽／感冒

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R05.9` | 咳嗽 | 咳嗽 | Cough, unspecified |
| `R05.1` | 急性咳嗽 | 急性咳嗽 | Acute cough |
| `R05.3` | 慢性咳嗽 | 慢性咳嗽 | Chronic cough |
| **常見疾病** | | | |
| `J00` | 感冒 | 急性鼻咽炎（感冒） | Acute nasopharyngitis [common cold] |
| `J06.9` | 急性上呼吸道感染 URI | 急性上呼吸道感染 | Acute upper respiratory infection, unspecified |
| `J20.9` | 急性支氣管炎 | 急性支氣管炎 | Acute bronchitis, unspecified |
| `J18.9` | 肺炎 | 肺炎，未明示病原體 | Pneumonia, unspecified organism |
| `J44.1` | COPD 急性惡化 | 慢性阻塞性肺病伴有(急性)發作 | Chronic obstructive pulmonary disease with (acute) exacerbation |
| `J45.901` | 氣喘急性發作 | 氣喘併(急性)發作 | Unspecified asthma with (acute) exacerbation |
| `J30.9` | 過敏性鼻炎 | 過敏性鼻炎 | Allergic rhinitis, unspecified |
| `K21.9` | 胃食道逆流 GERD | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |

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
| `J69.0` | 吸入性肺炎 | 吸入食物或嘔吐物所致之肺炎 | Pneumonitis due to inhalation of food and vomit |
| `J84.9` | 間質性肺疾病 | 間質性肺疾病 | Interstitial pulmonary disease, unspecified |

#### 胸痛／心悸

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R07.9` | 胸痛 | 胸痛 | Chest pain, unspecified |
| `R00.2` | 心悸 | 心悸 | Palpitations |
| `R00.0` | 心搏過速 | 心搏過速 | Tachycardia, unspecified |
| **常見疾病** | | | |
| `I20.9` | 心絞痛 | 心絞痛 | Angina pectoris, unspecified |
| `K21.9` | 胃食道逆流 GERD | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `I10` | 高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `F41.9` | 焦慮症 | 非特定的焦慮症 | Anxiety disorder, unspecified |
| `I49.9` | 心律不整 | 心臟節律不整 | Cardiac arrhythmia, unspecified |

#### 水腫

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R60.0` | 局部性水腫 | 局部性水腫 | Localized edema |
| `R60.9` | 水腫 | 水腫 | Edema, unspecified |
| **常見疾病** | | | |
| `I50.9` | 心臟衰竭 HF | 心臟衰竭 | Heart failure, unspecified |
| `I87.2` | 慢性靜脈功能不足 | 靜脈功能不足（慢性）（周邊） | Venous insufficiency (chronic) (peripheral) |
| `N18.9` | 慢性腎臟疾病 | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `I10` | 高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `E11.9` | 第二型糖尿病 | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |

### 腹部／消化

#### 腹痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R10.9` | 腹痛 | 腹痛 | Unspecified abdominal pain |
| `R10.13` | 心窩部痛 | 心窩部痛 | Epigastric pain |
| `R10.84` | 全腹痛 | 全腹痛 | Generalized abdominal pain |
| **常見疾病** | | | |
| `K29.70` | 胃炎 | 胃炎未伴有出血 | Gastritis, unspecified, without bleeding |
| `K21.9` | 胃食道逆流 GERD | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K80.20` | 膽囊結石（未伴膽囊炎） | 膽囊結石未伴有膽囊炎未伴有阻塞 | Calculus of gallbladder without cholecystitis without obstruction |
| `K35.80` | 急性闌尾炎 | 急性闌尾炎 | Unspecified acute appendicitis |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `K85.90` | 急性胰臟炎 | 急性胰臟炎未伴有壞死或感染 | Acute pancreatitis without necrosis or infection, unspecified |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |
| `K92.2` | 胃腸道出血 | 胃腸道出血 | Gastrointestinal hemorrhage, unspecified |

#### 腹瀉

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R19.7` | 腹瀉 | 腹瀉 | Diarrhea, unspecified |
| **常見疾病** | | | |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `K52.9` | 非感染性腸胃炎 | 非傳染性胃腸炎及結腸炎 | Noninfective gastroenteritis and colitis, unspecified |
| `A08.4` | 病毒性腸炎 | 病毒性腸道病毒感染 | Viral intestinal infection, unspecified |
| `K58.0` | 腸躁症伴腹瀉 | 激躁性腸症候群併腹瀉 | Irritable bowel syndrome with diarrhea |
| `A04.72` | 艱難梭菌腸道感染 CDI | 艱難梭菌所致腸道感染，未明示為復發型 | Enterocolitis due to Clostridium difficile, not specified as recurrent |
| `E86.0` | 脫水 | 脫水 | Dehydration |

#### 噁心嘔吐

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R11.0` | 噁心 | 噁心 | Nausea |
| `R11.10` | 嘔吐 | 嘔吐 | Vomiting, unspecified |
| `R11.2` | 噁心伴嘔吐 | 噁心伴有嘔吐 | Nausea with vomiting, unspecified |
| **常見疾病** | | | |
| `K21.9` | 胃食道逆流 GERD | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K29.70` | 胃炎 | 胃炎未伴有出血 | Gastritis, unspecified, without bleeding |
| `K52.9` | 非感染性腸胃炎 | 非傳染性胃腸炎及結腸炎 | Noninfective gastroenteritis and colitis, unspecified |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |
| `K85.90` | 急性胰臟炎 | 急性胰臟炎未伴有壞死或感染 | Acute pancreatitis without necrosis or infection, unspecified |

#### 便秘／排便異常

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `K59.00` | 便秘 | 便秘 | Constipation, unspecified |
| `R19.4` | 排便習慣改變 | 排便習慣改變 | Change in bowel habit |
| **常見疾病** | | | |
| `K58.9` | 腸躁症 | 激躁性腸症候群未伴有腹瀉 | Irritable bowel syndrome without diarrhea |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |
| `K64.9` | 痔瘡 | 痔瘡 | Unspecified hemorrhoids |
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `K59.09` | 其他便秘 | 其他便秘 | Other constipation |

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
| `N40.1` | 攝護腺增生伴下泌尿道症狀 BPH | 良性攝護腺增生伴有下泌尿道症狀 | Benign prostatic hyperplasia with lower urinary tract symptoms |
| `N10` | 急性腎盂腎炎 APN | 急性腎盂腎炎 | Acute pyelonephritis |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `N18.9` | 慢性腎臟疾病 | 慢性腎臟疾病 | Chronic kidney disease, unspecified |

#### 血尿

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R31.9` | 血尿 | 血尿 | Hematuria, unspecified |
| `R31.0` | 肉眼可見性血尿 | 肉眼可見性血尿 | Gross hematuria |
| **常見疾病** | | | |
| `N20.0` | 腎結石 | 腎結石 | Calculus of kidney |
| `N30.01` | 急性膀胱炎伴血尿 | 急性膀胱炎伴有血尿 | Acute cystitis with hematuria |
| `N39.0` | 泌尿道感染 UTI | 未明示部位之泌尿道感染症 | Urinary tract infection, site not specified |
| `N18.9` | 慢性腎臟疾病 | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `N40.1` | 攝護腺增生伴下泌尿道症狀 BPH | 良性攝護腺增生伴有下泌尿道症狀 | Benign prostatic hyperplasia with lower urinary tract symptoms |

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
| `B02.9` | 帶狀疱疹 | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `A46` | 丹毒 | 丹毒 | Erysipelas |
| `L27.0` | 全身性藥物疹 | 內服藥所致之全身性皮疹 | Generalized skin eruption due to drugs and medicaments taken internally |
| `L23.9` | 過敏性接觸性皮膚炎 | 過敏性接觸性皮膚炎，未明示原因 | Allergic contact dermatitis, unspecified cause |

#### 蜂窩性組織炎／膿瘍

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R22.40` | 下肢局部腫脹 | 未明示側性下肢局部腫脹、腫塊及小腫塊 | Localized swelling, mass and lump, unspecified lower limb |
| `M79.609` | 肢體疼痛 | 肢體疼痛 | Pain in unspecified limb |
| `R22.9` | 局部腫脹／腫塊 | 未明示部位局部腫脹、腫塊及小腫塊 | Localized swelling, mass and lump, unspecified |
| **常見疾病** | | | |
| `L03.90` | 蜂窩組織炎 | 蜂窩組織炎 | Cellulitis, unspecified |
| `L03.115` | 右下肢蜂窩組織炎 | 右側下肢蜂窩組織炎 | Cellulitis of right lower limb |
| `L03.116` | 左下肢蜂窩組織炎 | 左側下肢蜂窩組織炎 | Cellulitis of left lower limb |
| `L02.91` | 皮膚膿瘍 | 皮膚膿瘍 | Cutaneous abscess, unspecified |
| `L02.419` | 肢體皮膚膿瘍 | 未明示肢體皮膚膿瘍 | Cutaneous abscess of limb, unspecified |
| `A46` | 丹毒 | 丹毒 | Erysipelas |
| `L08.9` | 皮膚及皮下組織局部感染 | 皮膚及皮下組織局部感染 | Local infection of the skin and subcutaneous tissue, unspecified |
| `I89.0` | 淋巴水腫 | 其他淋巴水腫，他處未歸類者 | Lymphedema, not elsewhere classified |
| `I87.2` | 慢性靜脈功能不足 | 靜脈功能不足（慢性）（周邊） | Venous insufficiency (chronic) (peripheral) |

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
| `B35.9` | 皮癬菌病 | 皮癬菌病 | Dermatophytosis, unspecified |
| `B36.0` | 汗斑 | 變色糠疹(汗斑) | Pityriasis versicolor |
| `B37.2` | 皮膚及指甲念珠菌病 | 皮膚及指(趾)甲念珠菌病 | Candidiasis of skin and nail |
| `B37.9` | 念珠菌病 | 念珠菌病 | Candidiasis, unspecified |
| `B37.0` | 念珠菌性口炎 | 念珠菌性口炎 | Candidal stomatitis |

#### 帶狀疱疹／後神經痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `M79.2` | 神經痛 | 神經痛及神經炎 | Neuralgia and neuritis, unspecified |
| `G89.29` | 其他慢性疼痛 | 其他慢性疼痛 | Other chronic pain |
| `R20.2` | 皮膚感覺異常 | 皮膚感覺異常 | Paresthesia of skin |
| **常見疾病** | | | |
| `B02.9` | 帶狀疱疹 | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `B02.29` | 疱疹後侵及其他神經系統 | 疱疹後侵及其他神經系統 | Other postherpetic nervous system involvement |
| `B02.23` | 疱疹後多發神經病變 | 疱疹後多發神經病變 | Postherpetic polyneuropathy |
| `B02.22` | 疱疹後三叉神經痛 | 疱疹後三叉神經痛 | Postherpetic trigeminal neuralgia |
| `B02.30` | 帶狀疱疹眼病 | 帶狀疱疹眼病 | Zoster ocular disease, unspecified |
| `B02.7` | 散播性帶狀疱疹 | 散播性帶狀疱疹 | Disseminated zoster |
| `B02.8` | 帶狀疱疹伴其他併發症 | 帶狀疱疹伴有其他併發症 | Zoster with other complications |
| `B00.1` | 疱疹病毒性水疱皮膚炎 | 疱疹病毒性囊泡狀皮膚炎 | Herpesviral vesicular dermatitis |
| `B02.21` | 疱疹後膝狀神經節炎 | 疱疹後膝狀神經節炎 | Postherpetic geniculate ganglionitis |

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
| `B88.9` | 侵染症 | 侵染(症) | Infestation, unspecified |
| `W57.XXXA` | 無毒昆蟲叮咬（外因附加碼） | 被無毒昆蟲或節肢動物叮咬（傷）或螯（傷）之初期照護 | Bitten or stung by nonvenomous insect and other nonvenomous arthropods, initial encounter |
| `T63.441A` | 蜜蜂螫傷（初期照護） | 蜜蜂之毒液意外毒性作用之初期照護 | Toxic effect of venom of bees, accidental (unintentional), initial encounter |

#### 糖尿病足／慢性傷口

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `Z48.00` | 非手術傷口換藥 | 來院接受更換或移除非手術傷口敷料 | Encounter for change or removal of nonsurgical wound dressing |
| `Z48.01` | 手術傷口換藥 | 來院接受更換或移除手術傷口敷料 | Encounter for change or removal of surgical wound dressing |
| `L97.509` | 足部慢性潰瘍 | 未明示側性足部其他部位非壓迫性慢性潰瘍，未明示嚴重程度 | Non-pressure chronic ulcer of other part of unspecified foot with unspecified severity |
| **常見疾病** | | | |
| `E11.621` | 第二型糖尿病伴足部潰瘍 | 第二型糖尿病，伴有足部潰瘍 | Type 2 diabetes mellitus with foot ulcer |
| `E11.40` | 第二型糖尿病伴神經病變 | 第二型糖尿病，伴有糖尿病的神經病變 | Type 2 diabetes mellitus with diabetic neuropathy, unspecified |
| `E11.51` | 第二型糖尿病伴周邊血管病變 | 第二型糖尿病，伴有糖尿病的周邊血管病變，未伴有壞疽 | Type 2 diabetes mellitus with diabetic peripheral angiopathy without gangrene |
| `L97.409` | 腳跟及足弓慢性潰瘍 | 未明示側性腳跟及足弓非壓迫性慢性潰瘍，未明示嚴重程度 | Non-pressure chronic ulcer of unspecified heel and midfoot with unspecified severity |
| `L98.499` | 其他部位皮膚慢性潰瘍 | 其他部位的皮膚非壓迫性慢性潰瘍，未明示嚴重程度 | Non-pressure chronic ulcer of skin of other sites with unspecified severity |
| `M86.9` | 骨髓炎 | 骨髓炎 | Osteomyelitis, unspecified |
| `L03.119` | 肢體蜂窩組織炎 | 肢體未明示部位蜂窩組織炎 | Cellulitis of unspecified part of limb |
| `L02.419` | 肢體皮膚膿瘍 | 未明示肢體皮膚膿瘍 | Cutaneous abscess of limb, unspecified |

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
| `M06.9` | 類風濕性關節炎 | 類風濕性關節炎 | Rheumatoid arthritis, unspecified |
| `M19.90` | 骨關節炎 | 未明示部位骨關節炎 | Unspecified osteoarthritis, unspecified site |
| `M17.9` | 膝部骨關節炎 | 膝部骨關節炎 | Osteoarthritis of knee, unspecified |
| `M11.20` | 其他軟骨鈣化症 | 未明示部位其他軟骨鈣化症 | Other chondrocalcinosis, unspecified site |

#### 背痛／頸痛

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `M54.50` | 下背痛 | 下背痛 | Low back pain, unspecified |
| `M54.2` | 頸椎痛 | 頸椎痛 | Cervicalgia |
| **常見疾病** | | | |
| `M54.16` | 腰椎神經根病變 | 腰椎神經根病變 | Radiculopathy, lumbar region |
| `M51.26` | 腰椎椎間盤移位 | 其他腰椎椎間盤移位 | Other intervertebral disc displacement, lumbar region |
| `M47.816` | 腰椎退化性脊椎炎 | 腰椎退化性脊椎炎未伴有脊髓病變或神經根病變 | Spondylosis without myelopathy or radiculopathy, lumbar region |
| `M48.061` | 腰椎脊椎狹窄（未伴神經性跛行） | 腰椎脊椎狹窄症未伴有神經源性跛行 | Spinal stenosis, lumbar region without neurogenic claudication |
| `M19.90` | 骨關節炎 | 未明示部位骨關節炎 | Unspecified osteoarthritis, unspecified site |

#### 肢體麻木

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R20.2` | 皮膚感覺異常 | 皮膚感覺異常 | Paresthesia of skin |
| **常見疾病** | | | |
| `G62.9` | 多發神經病變 | 多發神經病變 | Polyneuropathy, unspecified |
| `G56.00` | 腕隧道症候群 | 未明示側性腕隧道症候群 | Carpal tunnel syndrome, unspecified upper limb |
| `E11.9` | 第二型糖尿病 | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `M54.16` | 腰椎神經根病變 | 腰椎神經根病變 | Radiculopathy, lumbar region |
| `N18.9` | 慢性腎臟疾病 | 慢性腎臟疾病 | Chronic kidney disease, unspecified |

### 代謝／檢驗

#### 檢驗異常

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| **主訴** | | | |
| `R73.03` | 糖尿病前期 | 糖尿病前期 | Prediabetes |
| `R73.9` | 高血糖 | 高血糖 | Hyperglycemia, unspecified |
| `R74.01` | 肝指數上升 | 轉胺基脢含量上升 | Elevation of levels of liver transaminase levels |
| `R80.9` | 蛋白尿 | 蛋白尿 | Proteinuria, unspecified |
| `R79.89` | 其他檢驗異常 | 其他特定性血液化學異常發現 | Other specified abnormal findings of blood chemistry |
| **常見疾病** | | | |
| `E11.9` | 第二型糖尿病 | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `I10` | 高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `E79.0` | 高尿酸血症 | 高尿酸血症未伴有關節炎及痛風石 | Hyperuricemia without signs of inflammatory arthritis and tophaceous disease |
| `N18.9` | 慢性腎臟疾病 | 慢性腎臟疾病 | Chronic kidney disease, unspecified |
| `D64.9` | 貧血 | 貧血 | Anemia, unspecified |
| `K76.0` | 脂肪肝 | 脂肪肝(變化)，他處未歸類者 | Fatty (change of) liver, not elsewhere classified |

## 外科（9 張面板）

### 撕裂傷

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `S01.01XA` | 頭皮撕裂傷（初期照護） | 頭皮撕裂傷未伴有異物之初期照護 | Laceration without foreign body of scalp, initial encounter |
| `S01.81XA` | 頭部其他部位撕裂傷（初期照護） | 頭部其他部位撕裂傷未伴有異物之初期照護 | Laceration without foreign body of other part of head, initial encounter |
| `S01.511A` | 嘴唇撕裂傷（初期照護） | 唇撕裂傷未伴有異物之初期照護 | Laceration without foreign body of lip, initial encounter |
| `S61.419A` | 手部撕裂傷（初期照護） | 未明示側性手部撕裂傷未伴有異物之初期照護 | Laceration without foreign body of unspecified hand, initial encounter |
| `S51.819A` | 前臂撕裂傷（初期照護） | 未明示側性前臂撕裂傷未伴有異物之初期照護 | Laceration without foreign body of unspecified forearm, initial encounter |
| `S81.819A` | 小腿撕裂傷（初期照護） | 未明示側性小腿未伴有異物撕裂傷之初期照護 | Laceration without foreign body, unspecified lower leg, initial encounter |
| `S91.319A` | 足部撕裂傷（初期照護） | 未明示側性足部撕裂傷未伴有異物之初期照護 | Laceration without foreign body, unspecified foot, initial encounter |

### 挫傷／擦傷

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `S00.03XA` | 頭皮挫傷（初期照護） | 頭皮挫傷之初期照護 | Contusion of scalp, initial encounter |
| `S60.229A` | 手部挫傷（初期照護） | 未明示側性手部挫傷之初期照護 | Contusion of unspecified hand, initial encounter |
| `S80.11XA` | 右小腿挫傷（初期照護） | 右側小腿挫傷之初期照護 | Contusion of right lower leg, initial encounter |
| `S80.12XA` | 左小腿挫傷（初期照護） | 左側小腿挫傷之初期照護 | Contusion of left lower leg, initial encounter |
| `S60.519A` | 手部擦傷（初期照護） | 未明示側性手部擦傷之初期照護 | Abrasion of unspecified hand, initial encounter |
| `T14.90XA` | 未明示損傷（初期照護） | 損傷之初期照護 | Injury, unspecified, initial encounter |

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

### 後續照護（癒合期）

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `S01.01XD` | 頭皮撕裂傷（後續照護） | 頭皮撕裂傷未伴有異物之後續照護 | Laceration without foreign body of scalp, subsequent encounter |
| `S01.81XD` | 頭部其他部位撕裂傷（後續照護） | 頭部其他部位撕裂傷未伴有異物之後續照護 | Laceration without foreign body of other part of head, subsequent encounter |
| `S01.511D` | 嘴唇撕裂傷（後續照護） | 唇撕裂傷未伴有異物之後續照護 | Laceration without foreign body of lip, subsequent encounter |
| `S61.419D` | 手部撕裂傷（後續照護） | 未明示側性手部撕裂傷未伴有異物之後續照護 | Laceration without foreign body of unspecified hand, subsequent encounter |
| `S51.819D` | 前臂撕裂傷（後續照護） | 未明示側性前臂撕裂傷未伴有異物之後續照護 | Laceration without foreign body of unspecified forearm, subsequent encounter |
| `S81.819D` | 小腿撕裂傷（後續照護） | 未明示側性小腿未伴有異物撕裂傷之後遺症 | Laceration without foreign body, unspecified lower leg, subsequent encounter |
| `S91.319D` | 足部撕裂傷（後續照護） | 未明示側性足部撕裂傷未伴有異物之後續照護 | Laceration without foreign body, unspecified foot, subsequent encounter |
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

### 燒燙傷

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `T30.0` | 燙傷（部位與程度均未明示） | 未明示身體部位燒傷 | Burn of unspecified body region, unspecified degree |
| `T20.20XA` | 頭臉頸二度燙傷（初期照護） | 頭、臉及頸部未明示部位二度燒傷之初期照護 | Burn of second degree of head, face, and neck, unspecified site, initial encounter |
| `T23.209A` | 手部二度燙傷（初期照護） | 未明示側性手部未明示部位二度燒傷之初期照護 | Burn of second degree of unspecified hand, unspecified site, initial encounter |
| `T24.209A` | 下肢二度燙傷（初期照護） | 未明示側性下肢（踝部及足部除外）未明示部位二度燒傷之初期照護 | Burn of second degree of unspecified site of unspecified lower limb, except ankle and foot, initial encounter |

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

### 肛門疾患

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `K64.9` | 痔瘡 | 痔瘡 | Unspecified hemorrhoids |
| `K64.5` | 血栓性外痔 | 肛門周圍靜脈血栓 | Perianal venous thrombosis |
| `K60.2` | 肛裂 | 肛門裂 | Anal fissure, unspecified |
| `K61.0` | 肛門膿瘍 | 肛門膿瘍 | Anal abscess |
| `K60.3` | 肛門瘻管 | 肛門廔管 | Anal fistula |
| `K62.5` | 肛門直腸出血 | 肛門及直腸出血 | Hemorrhage of anus and rectum |

### 疝氣／腹部

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `K40.90` | 腹股溝疝氣 | 單側腹股溝疝氣，未伴有阻塞或壞疽，未明示為復發 | Unilateral inguinal hernia, without obstruction or gangrene, not specified as recurrent |
| `K42.9` | 臍疝氣 | 臍疝氣未伴有阻塞或壞疽 | Umbilical hernia without obstruction or gangrene |
| `K43.9` | 腹壁疝氣 | 腹壁疝氣未伴有阻塞或壞疽 | Ventral hernia without obstruction or gangrene |
| `K35.80` | 急性闌尾炎 | 急性闌尾炎 | Unspecified acute appendicitis |
| `K80.20` | 膽囊結石（未伴膽囊炎） | 膽囊結石未伴有膽囊炎未伴有阻塞 | Calculus of gallbladder without cholecystitis without obstruction |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `K56.609` | 腸阻塞 | 腸阻塞，未明示阻塞程度 | Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction |

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

## 快選清單

### 常用慢性病（39 碼）

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `I10` | 高血壓 | 本態性(原發性)高血壓 | Essential (primary) hypertension |
| `E11.9` | 第二型糖尿病 | 第二型糖尿病，未伴有併發症 | Type 2 diabetes mellitus without complications |
| `E11.65` | 糖尿病伴高血糖 | 第二型糖尿病，伴有高血糖 | Type 2 diabetes mellitus with hyperglycemia |
| `E78.5` | 高脂血症 | 高血脂症 | Hyperlipidemia, unspecified |
| `E78.00` | 高膽固醇血症 | 純高膽固醇血症 | Pure hypercholesterolemia, unspecified |
| `E78.2` | 混合型高脂血症 | 混合型高血脂症 | Mixed hyperlipidemia |
| `E79.0` | 高尿酸血症 | 高尿酸血症未伴有關節炎及痛風石 | Hyperuricemia without signs of inflammatory arthritis and tophaceous disease |
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
| `J45.909` | 氣喘 | 氣喘,無併發症 | Unspecified asthma, uncomplicated |
| `K21.9` | 胃食道逆流 GERD | 胃食道逆性疾病未伴有食道炎 | Gastro-esophageal reflux disease without esophagitis |
| `K29.50` | 慢性胃炎 | 慢性胃炎未伴有出血 | Unspecified chronic gastritis without bleeding |
| `B18.1` | 慢性 B 型肝炎 | 慢性病毒性B型肝炎未伴有D 型肝炎病毒 | Chronic viral hepatitis B without delta-agent |
| `B18.2` | 慢性 C 型肝炎 | 慢性病毒性C型肝炎 | Chronic viral hepatitis C |
| `K74.60` | 肝硬化 | 肝硬化 | Unspecified cirrhosis of liver |
| `K76.0` | 脂肪肝 | 脂肪肝(變化)，他處未歸類者 | Fatty (change of) liver, not elsewhere classified |
| `E03.9` | 甲狀腺功能低下 | 甲狀腺低下 | Hypothyroidism, unspecified |
| `E05.90` | 甲狀腺功能亢進 | 未明示之甲狀腺毒症，未伴有甲狀腺毒性危象或風暴 | Thyrotoxicosis, unspecified without thyrotoxic crisis or storm |
| `N40.0` | 攝護腺增生未伴下泌尿道症狀 BPH | 良性攝護腺增生未伴有下泌尿道症狀 | Benign prostatic hyperplasia without lower urinary tract symptoms |
| `N40.1` | 攝護腺增生伴下泌尿道症狀 BPH | 良性攝護腺增生伴有下泌尿道症狀 | Benign prostatic hyperplasia with lower urinary tract symptoms |
| `M81.0` | 骨質疏鬆 | 老年性骨質疏鬆症未伴有病理性骨折 | Age-related osteoporosis without current pathological fracture |
| `F03.90` | 失智症 | 非特定的失智症，未明示嚴重度，無行為、精神病症、情緒困擾及焦慮症狀 | Unspecified dementia, unspecified severity, without behavioral disturbance, psychotic disturbance, mood disturbance, and anxiety |
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
| `J11.1` | 流感 | 未確認流感病毒所致流行性感冒併其他呼吸道表徵 | Influenza due to unidentified influenza virus with other respiratory manifestations |
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
| `B02.9` | 帶狀疱疹 | 帶狀疱疹未伴有併發症 | Zoster without complications |
| `B00.9` | 單純疱疹 | 疱疹病毒感染 | Herpesviral infection, unspecified |
| `B35.1` | 甲癬 | 甲癬 | Tinea unguium |
| `B35.3` | 足癬 | 足癬 | Tinea pedis |
| `B37.9` | 念珠菌病 | 念珠菌病 | Candidiasis, unspecified |
| `B86` | 疥瘡 | 疥癬(疥瘡) | Scabies |
| `A09` | 感染性腸胃炎 | 感染性胃腸炎及大腸炎 | Infectious gastroenteritis and colitis, unspecified |
| `A08.4` | 病毒性腸炎 | 病毒性腸道病毒感染 | Viral intestinal infection, unspecified |
| `A02.0` | 沙門氏菌腸炎 | 沙門桿菌腸炎 | Salmonella enteritis |
| `A04.72` | 艱難梭菌腸道感染 CDI | 艱難梭菌所致腸道感染，未明示為復發型 | Enterocolitis due to Clostridium difficile, not specified as recurrent |
| `K75.0` | 肝膿瘍 | 肝膿瘍 | Abscess of liver |
| `K81.0` | 急性膽囊炎 | 急性膽囊炎 | Acute cholecystitis |
| `K83.09` | 急性膽管炎 | 其他膽管炎 | Other cholangitis |
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
| `N17.9` | 急性腎損傷（AKI） | 急性腎衰竭 | Acute kidney failure, unspecified |
| `E86.0` | 脫水 | 脫水 | Dehydration |
| `E87.1` | 低血鈉 | 低滲壓及低血鈉 | Hypo-osmolality and hyponatremia |
| `E87.5` | 高血鉀 | 高血鉀症 | Hyperkalemia |

### 外科快選（21 碼）

| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |
|---|---|---|---|
| `Z48.01` | 手術傷口換藥 | 來院接受更換或移除手術傷口敷料 | Encounter for change or removal of surgical wound dressing |
| `Z48.02` | 拆線 | 來院接受拆線 | Encounter for removal of sutures |
| `Z09` | 治療後追蹤檢查 | 來院接受惡性腫瘤以外病況完整治療後之追蹤檢查 | Encounter for follow-up examination after completed treatment for conditions other than malignant neoplasm |
| `T81.41XA` | 手術切口表淺感染 SSI（初期照護） | 手術切口表淺部位之處置後感染初期照護 | Infection following a procedure, superficial incisional surgical site, initial encounter |
| `T81.41XD` | 手術切口表淺感染 SSI（後續照護） | 手術切口表淺部位之處置後感染後續照護 | Infection following a procedure, superficial incisional surgical site, subsequent encounter |
| `T14.90XA` | 未明示損傷（初期照護） | 損傷之初期照護 | Injury, unspecified, initial encounter |
| `T14.90XD` | 未明示損傷（後續照護） | 損傷之後續照護 | Injury, unspecified, subsequent encounter |
| `S61.419A` | 手部撕裂傷（初期照護） | 未明示側性手部撕裂傷未伴有異物之初期照護 | Laceration without foreign body of unspecified hand, initial encounter |
| `S61.419D` | 手部撕裂傷（後續照護） | 未明示側性手部撕裂傷未伴有異物之後續照護 | Laceration without foreign body of unspecified hand, subsequent encounter |
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
| `K40.90` | 腹股溝疝氣 | 單側腹股溝疝氣，未伴有阻塞或壞疽，未明示為復發 | Unilateral inguinal hernia, without obstruction or gangrene, not specified as recurrent |
| `K35.80` | 急性闌尾炎 | 急性闌尾炎 | Unspecified acute appendicitis |

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

面板與快選代碼位置合計 895 筆。
