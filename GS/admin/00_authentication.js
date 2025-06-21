// ======================================================================
// Authentication Functions
// ======================================================================

/**
 * ตรวจสอบการเข้าสู่ระบบ Admin
 */
function verifyAdminLogin(username, password) {
  const adminUsers = getAdminUsers(); // [{ username, password, role, name }, ...]
  const roles = getRoles(); // [{ role_name, role, permissions }, ...]

  const foundAdmin = adminUsers.find(
    admin => admin.username === username && admin.password === password
  );

  if (foundAdmin) {
    // หาข้อมูล role จากตาราง roles
    const foundRole = roles.find(role => role.role === foundAdmin.role);

    return {
      success: true,
      user: {
        username: foundAdmin.username,
        role: foundAdmin.role,
        role_name: foundRole?.role_name || foundAdmin.role, // ถ้าไม่เจอ role ให้ใช้ค่า fallback
        permissions: foundRole?.permissions || [],
        name: foundAdmin.name
      }
    };
  }

  return {
    success: false,
    message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
  };
}

/**
 * ดึงข้อมูล Role
 */
function getRoles() {
  let roles = sheetToJson(SHEETS.roles);

  // ถ้าไม่มีข้อมูล ให้สร้าง role เริ่มต้น
  if (roles.length === 0) {
    roles = [{
      role_name: 'ผู้สร้าง',
      role: 'system_creator',
      permissions: ['manage_orders', 'manage_students', 'manage_products', 'control_system', 'manage_admins', 'manage_discounts']
    }];
    saveRoles(roles);
  }

  return roles;
}

/**
 * บันทึกข้อมูล Role
 */
function saveRoles(roles) {
  jsonToSheet(SHEETS.roles, roles);
  return true;
}

/**
 * ดึงข้อมูลผู้ดูแลระบบ
 */
function getAdminUsers() {
  let adminUsers = sheetToJson(SHEETS.adminUser);

  // ถ้าไม่มีข้อมูล ให้สร้าง admin เริ่มต้น
  if (adminUsers.length === 0) {
    adminUsers = [{
      username: 'a',
      password: 'a',
      name: 'a',
      role: 'system_creator',
    }];
    saveAdminUsers(adminUsers);
  }

  return adminUsers;
}

/**
 * บันทึกข้อมูลผู้ดูแลระบบ
 */
function saveAdminUsers(adminUsers) {
  jsonToSheet('adminUsers', adminUsers);
  return true;
}