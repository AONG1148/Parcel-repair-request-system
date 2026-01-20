
# คู่มือการติดตั้งและใช้งานระบบแจ้งซ่อมพัสดุ (ฉบับสมบูรณ์)

เพื่อให้ระบบทำงานได้อย่างสมบูรณ์ คุณครูต้องดำเนินการ 2 ส่วนหลัก คือ **ส่วนของ Google Sheets (Backend)** และ **ส่วนของไฟล์เว็บ (Frontend)** ดังนี้:

## ภาคที่ 1: การเตรียม Google Sheets (Backend)

### 1. ลำดับหัวตาราง (Sheet1)
จัดลำดับคอลัมน์ในแถวที่ 1 (A-K) ดังนี้:
`A: เวลาที่แจ้ง`, `B: ชื่อผู้แจ้ง`, `C: แผนก`, `D: เลขห้อง`, `E: รหัสพัสดุ`, `F: อาการเสีย`, `G: จำนวน`, `H: AI วิเคราะห์`, `I: สถานะ`, `J: ระยะเวลาซ่อม`, `K: กำหนดคืน`

### 2. การติดตั้ง Apps Script
1. ไปที่เมนู **ส่วนขยาย (Extensions)** > **Apps Script**
2. ลบโค้ดเก่าออกแล้ววางโค้ดจากหัวข้อ "Apps Script Code" ในไฟล์นี้แทน
3. กด **"แจ้งใช้งาน" (Deploy)** > **"การแจ้งใช้งานใหม่" (New Deployment)**
4. เลือกประเภท: **เว็บแอป (Web App)**
5. ผู้มีสิทธิ์เข้าถึง: **ทุกคน (Anyone)**
6. **คัดลอก URL ของเว็บแอป** ที่ได้มา (จะขึ้นต้นด้วย `https://script.google.com/...`)

---

## ภาคที่ 2: การเปิดใช้งานหน้าเว็บ (Frontend)

เนื่องจากระบบนี้ใช้เทคโนโลยี **React แบบ Modern ESM** (ไม่ต้องใช้ Build tools) คุณครูสามารถนำไฟล์ไปใช้งานได้ดังนี้:

### วิธีที่ 1: รันบนเครื่อง (Local)
1. บันทึกไฟล์ทั้งหมด (`index.html`, `App.tsx`, ฯลฯ) ไว้ในโฟลเดอร์เดียวกัน
2. **ห้ามเปิดไฟล์ HTML ตรงๆ** เพราะ Browser จะบล็อกโมดูล
3. ให้เปิดผ่าน **Local Server** เช่น:
   - ใช้ Extension **"Live Server"** ใน VS Code
   - หรือใช้คำสั่ง `npx serve` ใน Terminal

### วิธีที่ 2: ขึ้นเว็บจริง (Online) - แนะนำ
1. นำไฟล์ทั้งหมดอัปโหลดขึ้น **GitHub**
2. ใช้บริการ **Vercel** หรือ **Netlify** (ฟรี) โดยเลือกโฟลเดอร์ที่มีไฟล์ `index.html`
3. ระบบจะให้ URL มาใช้งานได้ทันที 24 ชั่วโมง

---

## ภาคที่ 3: โค้ด Apps Script

```javascript
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Sheet1") || ss.getSheets()[0];
  return sheet;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet();
    
    if (data.action === 'updateStatus') {
      sheet.getRange(data.rowIndex, 9).setValue(data.status);
      return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
    } else {
      sheet.appendRow([
        data.timestamp,
        data.reporterName,
        data.department,
        data.roomNumber,
        data.assetId,
        data.symptoms,
        data.parcelQuantity,
        data.aiDiagnosis || "-",
        data.status || "รออนุมัติ",
        data.estimatedDays || 3,
        data.returnDate || "-"
      ]);
      return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (f) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", message: f.toString()})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var sheet = getSheet();
    var data = sheet.getDataRange().getValues();
    var rows = [];
    for (var i = data.length - 1; i >= 1; i--) {
      var r = data[i];
      if (!r[1] && !r[4]) continue;
      rows.push({
        rowIndex: i + 1,
        timestamp: String(r[0] || "-"),
        reporterName: String(r[1] || "-"),
        department: String(r[2] || "-"),
        roomNumber: String(r[3] || "-"),
        assetId: String(r[4] || "-"),
        symptoms: String(r[5] || "-"),
        parcelQuantity: String(r[6] || "1"),
        aiDiagnosis: String(r[7] || "-"),
        status: String(r[8] || "รออนุมัติ"),
        estimatedDays: String(r[9] || "0"),
        returnDate: String(r[10] || "-")
      });
      if (rows.length >= 50) break; 
    }
    return ContentService.createTextOutput(JSON.stringify({result: "success", data: rows})).setMimeType(ContentService.MimeType.JSON);
  } catch (f) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", message: f.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
```
