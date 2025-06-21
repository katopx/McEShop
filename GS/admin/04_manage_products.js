// ==================== HELPER FUNCTIONS ====================

// ฟังก์ชันสำหรับแปลงข้อมูลก่อนบันทึกลง Google Sheets
function serializeProductData(productData, headers) {
  return headers.map(header => {
    const value = productData[header];

    // ถ้าเป็น undefined หรือ null ให้เป็น empty string
    if (value === undefined || value === null) {
      return '';
    }

    // ถ้าเป็น array หรือ object ให้แปลงเป็น JSON string
    if (Array.isArray(value) || typeof value === 'object') {
      return JSON.stringify(value);
    }

    // ถ้าเป็น boolean ให้แปลงเป็น string
    if (typeof value === 'boolean') {
      return value.toString().toUpperCase();
    }

    // ถ้าเป็น number ให้แปลงเป็น string
    if (typeof value === 'number') {
      return value.toString();
    }

    // ถ้าเป็น string ให้คืนค่าเดิม
    return value.toString();
  });
}

// ฟังก์ชันสำหรับแปลงข้อมูลจาก Google Sheets กลับมาเป็น JavaScript object
function deserializeProductData(rowData, headers) {
  const productData = {};

  headers.forEach((header, index) => {
    const value = rowData[index];

    if (value === '' || value === undefined || value === null) {
      productData[header] = '';
      return;
    }

    // พยายามแปลง JSON string กลับเป็น object/array
    if (typeof value === 'string') {
      // ตรวจสอบว่าเป็น JSON string หรือไม่
      if ((value.startsWith('[') && value.endsWith(']')) ||
        (value.startsWith('{') && value.endsWith('}'))) {
        try {
          productData[header] = JSON.parse(value);
        } catch (error) {
          productData[header] = value;
        }
      }
      // ตรวจสอบ boolean values
      else if (value.toUpperCase() === 'TRUE' || value.toUpperCase() === 'FALSE') {
        productData[header] = value.toUpperCase() === 'TRUE';
      }
      // ตรวจสอบ numeric values
      else if (!isNaN(value) && value !== '') {
        productData[header] = parseFloat(value);
      }
      else {
        productData[header] = value;
      }
    } else {
      productData[header] = value;
    }
  });

  return productData;
}

// ==================== READ FUNCTIONS ====================

// READ - โหลดข้อมูลสินค้า (แก้ไขให้ deserialize ข้อมูลอย่างถูกต้อง)
function loadProductsData() {
  try {
    const sheet = getSheet(SHEETS.siteProducts);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length);
    const data = dataRange.getValues();

    const siteProducts = data.map(row => deserializeProductData(row, headers));

    return { siteProducts };
  } catch (error) {
    console.error("Error loading siteProducts data:", error);
    return { siteProducts: [] };
  }
}

// ==================== CRUD FUNCTIONS ====================

// 1. CREATE - เพิ่มสินค้าใหม่
function createProduct(productData) {
  try {
    const sheet = getSheet(SHEETS.siteProducts);

    // สร้าง ID ใหม่
    const newId = generateUniqueId('PROD');
    productData.id = newId;

    // เพิ่ม timestamp
    productData.createdAt = new Date().toISOString();
    productData.updatedAt = new Date().toISOString();

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // แปลงข้อมูลก่อนบันทึก
    const row = serializeProductData(productData, headers);

    sheet.appendRow(row);

    return productData;
  } catch (error) {
    console.error("Error creating product:", error);
    throw new Error("ไม่สามารถเพิ่มสินค้าได้: " + error.message);
  }
}

// 2. READ - อ่านข้อมูลสินค้าตาม ID
function getProductById(productId) {
  try {
    const sheet = getSheet(SHEETS.siteProducts);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idColumnIndex = headers.indexOf('id') + 1;

    if (idColumnIndex === 0) {
      throw new Error("ไม่พบคอลัมน์ id");
    }

    const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length);
    const data = dataRange.getValues();

    for (let i = 0; i < data.length; i++) {
      if (data[i][idColumnIndex - 1] === productId) {
        return deserializeProductData(data[i], headers);
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting product by ID:", error);
    throw new Error("ไม่สามารถดึงข้อมูลสินค้าได้: " + error.message);
  }
}

// 3. UPDATE - อัปเดตข้อมูลสินค้า
function updateProduct(productData) {
  try {
    const sheet = getSheet(SHEETS.siteProducts);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idColumnIndex = headers.indexOf('id') + 1;

    if (idColumnIndex === 0) {
      throw new Error("ไม่พบคอลัมน์ id");
    }

    const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length);
    const data = dataRange.getValues();

    // หาแถวที่ต้องการอัปเดต
    for (let i = 0; i < data.length; i++) {
      if (data[i][idColumnIndex - 1] === productData.id) {
        // เพิ่ม timestamp สำหรับการอัปเดต
        productData.updatedAt = new Date().toISOString();

        // แปลงข้อมูลก่อนบันทึก
        const updatedRow = serializeProductData(productData, headers);

        // อัปเดตแถวในชีต
        sheet.getRange(i + 2, 1, 1, headers.length).setValues([updatedRow]);

        return productData;
      }
    }

    throw new Error("ไม่พบสินค้าที่ต้องการอัปเดต");
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error("ไม่สามารถอัปเดตสินค้าได้: " + error.message);
  }
}

// 4. DELETE - ลบสินค้า
function deleteProduct(productId) {
  try {
    const sheet = getSheet(SHEETS.siteProducts);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idColumnIndex = headers.indexOf('id') + 1;

    if (idColumnIndex === 0) {
      throw new Error("ไม่พบคอลัมน์ id");
    }

    const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length);
    const data = dataRange.getValues();

    // หาแถวที่ต้องการลบ
    for (let i = 0; i < data.length; i++) {
      if (data[i][idColumnIndex - 1] === productId) {
        // ลบแถว
        sheet.deleteRow(i + 2);
        return { success: true, message: "ลบสินค้าเรียบร้อยแล้ว" };
      }
    }

    throw new Error("ไม่พบสินค้าที่ต้องการลบ");
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("ไม่สามารถลบสินค้าได้: " + error.message);
  }
}

// 5. TOGGLE STATUS - เปิด/ปิดสถานะสินค้า
function toggleProductStatus(productId) {
  try {
    const product = getProductById(productId);
    if (!product) {
      throw new Error("ไม่พบสินค้าที่ต้องการเปลี่ยนสถานะ");
    }

    product.isAvailable = !product.isAvailable;
    product.updatedAt = new Date().toISOString();

    return updateProduct(product);
  } catch (error) {
    console.error("Error toggling product status:", error);
    throw new Error("ไม่สามารถเปลี่ยนสถานะสินค้าได้: " + error.message);
  }
}