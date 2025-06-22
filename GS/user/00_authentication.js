// ======================================================================
// Authentication Functions
// ======================================================================

/**
 * ตรวจสอบการเข้าสู่ระบบ Student
 */
function verifyStudentLogin(fullname, phone) {
  const registeredStudents = getRegisteredStudents(); // [{ id , prefix , firstName , lastName , nickname , studyGroup , phone , email , registrationDate }]

  const foundStudent = registeredStudents.find(student => {
    const studentFullName = `${student.firstName} ${student.lastName}`.trim();
    return studentFullName === fullname && student.phone === phone;
  });

  if (foundStudent) {
    return {
      success: true,
      user: {
        id: foundStudent.id,
        fullname: `${foundStudent.prefix}${foundStudent.firstName} ${foundStudent.lastName}`,
        nickname: foundStudent.nickname,
        studyGroup: foundStudent.studyGroup,
        phone: foundStudent.phone,
        email: foundStudent.email,
      }
    };
  }

  return {
    success: false,
    message: "ไม่พบนักศึกษาหรือข้อมูลไม่ถูกต้อง"
  };
}

function getRegisteredStudents() {
  const students = sheetToJson(SHEETS.registeredStudents);
  return students;
}