import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
let A;
try { A = require('../src/antimicrobial.js'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
const source = {id:'chapter10', title:'第十節 抗微生物劑', version:'115.07.23', checked:'2026-10-02', url:'https://www.nhi.gov.tw/'};
const guide = {sources:[source], cards:[
  {id:'10.8.3',title:'Linezolid',group:'antibacterial',aliases:['Zyvox','LZD'],summary:['MRSA 或 VRE，分支條件須核對'],text:['1.限下列條件之一使用：','(1)MRSA 肺炎且符合危險因子之一。'],refs:[{source:'chapter10',page:23}],effectiveFrom:'2019-04-01'},
  {id:'10.8.7',title:'Daptomycin',group:'antibacterial',aliases:[],summary:['MRSA'],text:['Linezolid 不作為此藥別名'],refs:[{source:'chapter10',page:24}]},
  {id:'10.6.1.1',title:'Fluconazole 口服',group:'antifungal',aliases:['Diflucan'],summary:['黴菌感染'],text:['全身黴菌感染'],refs:[{source:'chapter10',page:6}]},
  {id:'future',title:'Future',group:'antiviral',aliases:[],summary:['未生效'],text:['未生效'],refs:[{source:'chapter10',page:1}],effectiveFrom:'2027-01-01'},
]};
test('搜尋模組存在',()=>assert.ok(A));
test('藥名結果優先於內文提及',()=>assert.equal(A.search(guide,'linezolid','all','2026-10-02')[0].id,'10.8.3'));
test('學名、商品名、縮寫、條號搜尋',()=>{for(const q of ['Linezolid','zyvox','LZD','10.8.3']) assert.equal(A.search(guide,q,'all','2026-10-02')[0].id,'10.8.3');});
test('多個詞須同時符合並套用分類',()=>{assert.equal(A.search(guide,'LZD VRE','antibacterial','2026-10-02').length,1);assert.equal(A.search(guide,'LZD','antifungal','2026-10-02').length,0);});
test('有效日期含起始日、終止日為不含',()=>{assert.equal(A.status({effectiveFrom:'2026-10-02'},'2026-10-02'),'current'); assert.equal(A.status({effectiveTo:'2026-10-02'},'2026-10-02'),'expired');assert.equal(A.status(guide.cards[3],'2026-10-02'),'upcoming');});
test('未生效版顯示狀態，已失效版排除',()=>{const g={...guide,cards:[...guide.cards,{...guide.cards[0],id:'old',effectiveTo:'2026-01-01'}]};assert.equal(A.search(g,'','all','2026-10-02').length,4);});
test('複製含完整條件、摘要標示、來源頁碼、版本與查證日',()=>{const text=A.answerText(guide,guide.cards[0]);for(const s of ['給付重點','完整條文','(1)MRSA','第 23 頁','115.07.23','2026-10-02'])assert.ok(text.includes(s),s);});
test('未知藥物不得產生給付結論',()=>assert.deepEqual(A.search(guide,'不存在的藥物'),[]));
test('複方學名容許斜線與加號及有無空白',()=>{
  const g={...guide,cards:[{...guide.cards[0],title:'Ceftazidime / avibactam',aliases:['CAZ-AVI']}]};
  for(const q of ['ceftazidime/avibactam','ceftazidime + avibactam','Ceftazidime＋avibactam'])assert.equal(A.search(g,q).length,1,q);
});
test('本地日曆日期格式',()=>assert.match(A.today(),/^\d{4}-\d{2}-\d{2}$/));
test('PDF 上標展平後仍顯示正確的十次方',()=>assert.equal(A.displayLine('HBV DNA≧2×105 IU/mL; count(109/L)'), 'HBV DNA≧2×10⁵ IU/mL; count(10⁹/L)'));
test('給付面板與既有面板互斥',()=>{
  const S=require('../src/state.js');
  const store=S.createStore({storage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});
  store.setAmOpen(true); assert.equal(store.getState().amOpen,true);
  for(const open of [()=>store.setVacOpen(true),()=>store.setCcrOpen(true),()=>store.setLipidOpen(true),()=>store.setChronicTopic('dm'),()=>store.setSettingsOpen(true)]) {
    store.setAmOpen(true); open(); assert.equal(store.getState().amOpen,false);
  }
  store.setVacOpen(true); store.setAmOpen(true); assert.equal(store.getState().vacOpen,false);
});
