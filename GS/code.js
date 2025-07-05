/**
 * กำหนด Spreadsheet ID
 */
const SPREADSHEET_ID = "1g5YJdNwIIWc1qmD2cmAct88oVBHo5VGoHX8slqNa2VE";

/**
 * กำหนด Sheet Name
 */
const SHEETS = {
  adminUsers: 'adminUsers',
  roles: 'roles',
  registeredStudents: 'registeredStudents',
  studyGroups: 'studyGroups',
  siteProducts: 'siteProducts',
  studentOrders: 'studentOrders',
  systemSettings: 'systemSettings',
  discountCodes: 'discountCodes',
};


function doGet(e) {
  const page = e?.parameter?.page || "admin";
  const template = HtmlService.createTemplateFromFile(page);

  const html = template
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");

  if (page === "admin") {
    html.setTitle("แอดมิน");
  } else {
    html.setTitle("ผู้ใช้งาน");
  }

  return html;
}

/**
 * ฟังชั่นอ่าน URL ปัจจุบัน
 */
function getUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * ฟังชั่นเพื่อดึงเนื้อหา HTML จากไฟล์ในโปรเจกต์ มาแปะในหน้าเว็บหลัก
 */
function include(File) {
  return HtmlService.createHtmlOutputFromFile(File).getContent();
}

/**
 * ดึง Google Sheet ตาม SheetName
 */
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);

  // ถ้าไม่มี sheet ให้สร้างใหม่
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.clear();

    // กำหนด Header ตาม SheetType
    switch (sheetName) {
      case "roles":
        sheet
          .getRange(1, 1, 1, 3)
          .setValues([["role_name","role","permissions"]]);
        break;

      case "adminUsers":
        sheet
          .getRange(1, 1, 1, 5)
          .setValues([["username", "password","name","role"]]);
        break;

      case "studentOrders":
        sheet
          .getRange(1, 1, 1, 10)
          .setValues([
            [
              "orderId",
              "studentId",
              "items",
              "totalAmount",
              "status",
              "paymentSlip",
              "orderDate",
              "notes",
              "discountCode",
              "discountAmount",
            ],
          ]);
        break;

      case "siteProducts":
        sheet
          .getRange(1, 1, 1, 11)
          .setValues([
            [
              "id",
              "name",
              "basePrice",
              "description",
              "images",
              "stock",
              "maxQuantity",
              "nameSku",
              "variants",
              "options",
              "isAvailable",
            ],
          ]);
        break;

      case "registeredStudents":
        sheet
          .getRange(1, 1, 1, 9)
          .setValues([
            [
              "id",
              "prefix",
              "firstName",
              "lastName",
              "nickname",
              "studyGroup",
              "phone",
              "email",
              "registrationDate",
            ],
          ]);
        break;

      case "systemSettings":
        sheet.getRange(1, 1, 1, 2).setValues([["key", "value"]]);
        break;

      case "studyGroups":
        sheet.getRange(1, 1, 1, 2).setValues([["id", "groupName"]]);
        break;

      case "discountCodes":
        sheet
          .getRange(1, 1, 1, 15)
          .setValues([
            [
              "id",
              "code",
              "type",
              "value",
              "maxDiscount",
              "description",
              "minOrderAmount",
              "usageLimit",
              "usedCount",
              "validFrom",
              "validTo",
              "isActive",
              "applicableProducts",
              "createdDate",
              "createdBy",
            ],
          ]);
        break;
    }
  }

  return sheet;
}

/**
 * แปลง Sheet data เป็น JSON array
 */
function sheetToJson(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      let value = row[index];
      
      // แปลง JSON string กลับเป็น object/array
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // ถ้า parse ไม่ได้ให้ใช้ค่าเดิม
        }
      }
      
      obj[header] = value;
    });
    return obj;
  });
}

/**
 * บันทึกข้อมูล JSON array ลง Sheet
 */
function jsonToSheet(sheetName, data) {
  const sheet = getSheet(sheetName);
  
  // ลบข้อมูลเก่า (ยกเว้น header)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  
  if (data.length === 0) return;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const rows = data.map(item => {
    return headers.map(header => {
      let value = item[header];
      
      // แปลง object/array เป็น JSON string
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      return value || '';
    });
  });
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

// สร้าง ID ที่ไม่ซ้ำกัน
function generateUniqueId(prefix = 'ID') {
    const letters = Array(2).fill().map(() =>
        String.fromCharCode(Math.floor(Math.random() * 26) + 65)
    ).join('');

    const digits = Math.floor(1000 + Math.random() * 9000); // 4 หลัก เช่น 1023

    const timePart = Date.now().toString(36).slice(-4).toUpperCase(); // Base36 → UPPERCASE

    return `${prefix}_${letters}${digits}${timePart}`;
}