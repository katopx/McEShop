// ==================== READ FUNCTIONS ====================

// READ - โหลดข้อมูล นักศึกษา , กลุ่มเรียน

function loadStudentsData() {
  try {
    const students = sheetToJson(SHEETS.registeredUsers);
    const studyGroups = sheetToJson(SHEETS.studyGroups);

    return { students, studyGroups };
  } catch (error) {
    console.error("Error loading students data:", error);
    return { students: [], studyGroups: [] };
  }
}

// ==================== CRUD FUNCTIONS STUDENT ====================


// 1. CREATE - เพิ่มนักศึกษาใหม่
function createStudent(studentData) {
  const sheet = getSheet(SHEETS.registeredUsers);

  const newId = generateUniqueId('STU');
  studentData.id = newId;
  studentData.registrationDate = new Date().toISOString();

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => studentData[h] || '')

  sheet.appendRow(row);
  return studentData;
}

// 2. UPDATE - แก้ไขข้อมูลนักศึกษา
function updateStudent(studentData) {
  const sheet = getSheet(SHEETS.registeredUsers);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const idIndex = headers.indexOf("id");
  if (idIndex === -1) throw new Error("ไม่พบคอลัมน์ id");

  const rowIndex = data.findIndex((row, i) => i > 0 && row[idIndex] === studentData.id);
  if (rowIndex === -1) throw new Error("ไม่พบนักศึกษาที่จะแก้ไข");

  // 🔍 เก็บค่า registrationDate เดิมไว้ ถ้าไม่ได้ส่งมา
  const registrationDateIndex = headers.indexOf("registrationDate");
  if (registrationDateIndex !== -1 && !studentData.registrationDate) {
    studentData.registrationDate = data[rowIndex][registrationDateIndex];
  }

  // เตรียมข้อมูลแถวใหม่
  const newRow = headers.map(h => studentData[h] || '');

  // อัปเดตแถว
  sheet.getRange(rowIndex + 1, 1, 1, newRow.length).setValues([newRow]);

  return true;
}

// 3. DELETE - ลบนักศึกษา
function deleteStudent(studentId) {
  const sheet = getSheet(SHEETS.registeredUsers);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const idIndex = headers.indexOf("id");
  if (idIndex === -1) throw new Error("ไม่พบคอลัมน์ id");

  const rowIndex = data.findIndex((row, i) => i > 0 && row[idIndex] === studentId);
  if (rowIndex === -1) throw new Error("ไม่พบนักศึกษาที่จะลบ");

  sheet.deleteRow(rowIndex + 1);
  return true;
}

// ==================== CRUD FUNCTIONS STUDYGROUP ====================

// 1. CREATE - เพิ่มกลุ่มเรียนใหม่
function createStudyGroup(data) {
  const sheet = getSheet(SHEETS.studyGroups);
  const newId = generateUniqueId('GRP');
  data.id = newId;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const row = headers.map(h => data[h] || '')

  sheet.appendRow(row);
  return newId;
}

// 2. DELETE - ลบกลุ่มเรียน
function deleteStudyGroup(groupId) {
  const sheet = getSheet(SHEETS.studyGroups);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const idIndex = headers.indexOf("id");
  if (idIndex === -1) throw new Error("ไม่พบคอลัมน์ id");

  const rowIndex = data.findIndex((row, i) => i > 0 && row[idIndex] === groupId);
  if (rowIndex === -1) throw new Error("ไม่พบนักศึกษาที่จะลบ");

  sheet.deleteRow(rowIndex + 1);
  return true;
}

// 4. ฟังก์ชันเสริม: ดึงรายชื่อกลุ่มเรียนที่มีอยู่
function getExistingStudyGroups() {
  try {
    const sheet = getStudentsSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return { success: true, data: [] };
    }

    // ดึงกลุ่มเรียนที่ไม่ซ้ำกัน (column index 5 = studyGroup)
    const studyGroups = new Set();
    for (let i = 1; i < data.length; i++) {
      if (data[i][5]) {
        studyGroups.add(data[i][5]);
      }
    }

    return {
      success: true,
      data: Array.from(studyGroups).sort(),
    };
  } catch (error) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาด: " + error.toString(),
      data: [],
    };
  }
}
