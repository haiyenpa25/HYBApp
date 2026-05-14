/**
 * Controller to expose APIs for Frontend
 */

function getCurrentUser() {
  const user = Session.getActiveUser();
  return {
    email: user.getEmail() || 'Gắn thẻ ẩn danh',
    name: user.getEmail() ? user.getEmail().split('@')[0] : 'Khách'
  };
}

function getTaskCategories() {
  return CalendarService.getAllOwned();
}

function addTaskCategory(name) {
  return CalendarService.create(name);
}

function deleteTaskCategory(id) {
  return CalendarService.delete(id);
}

function getTasks() {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Tasks');
  // New Schema: [id, title, status, date, calendarEventId, calendarId, priority, subtasks]
  return data.map(row => ({
    id: row[0],
    title: row[1],
    status: row[2],
    date: row[3],
    eventId: row[4],
    calendarId: row[5] || 'default',
    priority: row[6] || 'P3',
    subtasks: row[7] ? JSON.parse(row[7]) : [],
    noteId: row[8] || null
  }));
}

function addTask(title, dateString, calendarId = 'default', priority = 'P3') {
  const repo = new SheetRepository();
  const calendar = new CalendarService(calendarId);
  
  const id = Utilities.getUuid();
  const date = new Date(dateString);
  const eventId = calendar.createTaskEvent(title, date);
  
  const success = repo.safeWrite('Tasks', [[id, title, 'TODO', dateString, eventId, calendarId, priority, '[]', '']]);
  if (success) {
    repo.clearCache('Tasks');
    addExp(10); // Gamification
  }
  return success;
}

function updateTaskStatus(id, newStatus) {
  const repo = new SheetRepository();
  const tasks = repo.cachedRead('Tasks');
  const task = tasks.find(r => r[0] === id);
  if (!task) return false;
  
  const calendarId = task[5] || 'default';
  const calendar = new CalendarService(calendarId);
  
  // Update status (column index 2)
  const row = repo.updateRow('Tasks', 0, id, 2, newStatus);
  if (row) {
    repo.clearCache('Tasks');
    const eventId = row[4];
    // If done, set color to green (10), otherwise default (empty or 9/blue)
    const colorId = newStatus === 'DONE' ? '10' : (newStatus === 'IN_PROGRESS' ? '5' : '9');
    calendar.updateEventColor(eventId, colorId);
    if (newStatus === 'DONE') addExp(30); // Gamification
    return true;
  }
  return false;
}

function updateTaskDetails(id, priority, subtasksJson, noteId, calendarId) {
  const repo = new SheetRepository();
  repo.updateRow('Tasks', 0, id, 6, priority);
  if (noteId !== undefined) {
    repo.updateRow('Tasks', 0, id, 8, noteId);
  }
  if (calendarId !== undefined) {
    repo.updateRow('Tasks', 0, id, 5, calendarId);
  }
  const row = repo.updateRow('Tasks', 0, id, 7, subtasksJson);
  if (row) {
    repo.clearCache('Tasks');
    return true;
  }
  return false;
}

function deleteTask(id) {
  const repo = new SheetRepository();
  const tasks = repo.cachedRead('Tasks');
  const task = tasks.find(r => r[0] === id);
  if (!task) return false;

  const eventId = task[4];
  const calendarId = task[5] || 'default';
  
  if (eventId) {
    const calendar = new CalendarService(calendarId);
    calendar.deleteTaskEvent(eventId);
  }

  const success = repo.deleteRow('Tasks', 0, id);
  if (success) {
    repo.clearCache('Tasks');
  }
  return success;
}

function updateTaskCore(id, title, dateString, newCalendarId) {
  const repo = new SheetRepository();
  const tasks = repo.cachedRead('Tasks');
  const task = tasks.find(r => r[0] === id);
  if (!task) return false;

  const oldCalendarId = task[5] || 'default';
  let eventId = task[4];

  if (oldCalendarId !== newCalendarId) {
    const oldCal = new CalendarService(oldCalendarId);
    if (eventId) oldCal.deleteTaskEvent(eventId);

    const newCal = new CalendarService(newCalendarId);
    eventId = newCal.createTaskEvent(title, new Date(dateString));
    repo.updateRow('Tasks', 0, id, 5, newCalendarId);
    repo.updateRow('Tasks', 0, id, 4, eventId);
  } else {
    if (eventId) {
      const cal = new CalendarService(oldCalendarId);
      cal.updateTaskEvent(eventId, title, dateString);
    }
  }

  repo.updateRow('Tasks', 0, id, 1, title);
  const row = repo.updateRow('Tasks', 0, id, 3, dateString);
  
  if (row) {
    repo.clearCache('Tasks');
    return true;
  }
  return false;
}

// --- MONEY LOVER CLONE (PHASE 2) ---

function getWallets() {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Wallets'); 
  return data.map(row => ({ id: row[0], name: row[1], type: row[2], balance: row[3] }));
}

function addWallet(name, type, initialBalance) {
  const repo = new SheetRepository();
  const id = Utilities.getUuid();
  const success = repo.safeWrite('Wallets', [[id, name, type, initialBalance]]);
  if (success) repo.clearCache('Wallets');
  return success;
}

function updateWallet(id, name, type) {
  const repo = new SheetRepository();
  const wallets = repo.cachedRead('Wallets');
  const existing = wallets.find(r => r[0] === id);
  if (!existing) return false;
  
  // Do NOT update balance here, preserve existing balance to enforce audit logs
  const success = repo.updateFullRow('Wallets', 0, id, [id, name, type, existing[3]]);
  if (success) repo.clearCache('Wallets');
  return success;
}

function reconcileWallet(id, actualBalance, note) {
  const repo = new SheetRepository();
  const wallets = repo.cachedRead('Wallets');
  const wallet = wallets.find(row => row[0] === id);
  if (!wallet) return false;
  
  const currentBalance = Number(wallet[3]) || 0;
  const diff = actualBalance - currentBalance;
  
  if (diff === 0) return true; // Nothing to do
  
  // 1. Create an adjustment transaction
  const txId = Utilities.getUuid();
  const date = new Date().toISOString().split('T')[0];
  const txType = diff > 0 ? 'Income' : 'Expense';
  const txNote = note || `Kiểm kê số dư (${diff > 0 ? '+' : ''}${diff})`;
  
  repo.safeWrite('Transactions', [[txId, id, '', Math.abs(diff), txType, date, txNote, '', '']]);
  repo.clearCache('Transactions');
  
  // 2. Update wallet balance
  const success = repo.updateFullRow('Wallets', 0, id, [id, wallet[1], wallet[2], actualBalance]);
  if (success) repo.clearCache('Wallets');
  return success;
}

function deleteWallet(id) {
  const repo = new SheetRepository();
  const success = repo.deleteRow('Wallets', 0, id);
  if (success) repo.clearCache('Wallets');
  return success;
}

function getCategories() {
  const repo = new SheetRepository();
  let data = repo.cachedRead('Categories');
  if (data.length === 0) {
    const defaults = [
      [Utilities.getUuid(), 'Ăn uống', 'Expense', '🍔', '#f43f5e', ''],
      [Utilities.getUuid(), 'Di chuyển', 'Expense', '🚗', '#3b82f6', ''],
      [Utilities.getUuid(), 'Mua sắm', 'Expense', '🛍️', '#ec4899', ''],
      [Utilities.getUuid(), 'Hóa đơn', 'Expense', '🧾', '#eab308', ''],
      [Utilities.getUuid(), 'Lương', 'Income', '💰', '#22c55e', ''],
      [Utilities.getUuid(), 'Thưởng', 'Income', '🎁', '#10b981', '']
    ];
    repo.safeWrite('Categories', defaults);
    data = defaults;
  }
  return data.map(row => ({ id: row[0], name: row[1], type: row[2], icon: row[3], color: row[4], parentId: row[5] || '' }));
}

function addCategory(name, type, icon, color, parentId) {
  const repo = new SheetRepository();
  const id = Utilities.getUuid();
  const success = repo.safeWrite('Categories', [[id, name, type, icon, color, parentId || '']]);
  if (success) repo.clearCache('Categories');
  return success;
}

function updateCategory(id, name, type, icon, color, parentId) {
  const repo = new SheetRepository();
  const success = repo.updateFullRow('Categories', 0, id, [id, name, type, icon, color, parentId || '']);
  if (success) repo.clearCache('Categories');
  return success;
}

function deleteCategory(id) {
  const repo = new SheetRepository();
  const success = repo.deleteRow('Categories', 0, id);
  if (success) {
    // Optionally delete subcategories
    const data = repo.cachedRead('Categories');
    for (const row of data) {
      if (row[5] === id) {
        repo.deleteRow('Categories', 0, row[0]);
      }
    }
    repo.clearCache('Categories');
  }
  return success;
}

// ─── SEED CATEGORIES ─────────────────────────────────────────────────────────
// Chạy hàm này 1 lần từ Apps Script Editor để tạo đầy đủ danh mục
// MODE: 'safe' = chỉ thêm mới, không xóa cũ | 'reset' = xóa hết rồi tạo lại
function seedCategories(mode) {
  if (mode === undefined) mode = 'safe';
  const repo = new SheetRepository();
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Categories');

  if (mode === 'reset' && sheet) {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
    repo.clearCache('Categories');
  }

  // Helper tạo ID duy nhất
  const uid = () => Utilities.getUuid();

  // ── EXPENSE PARENTS ──────────────────────────────────────
  const p_nha       = uid(); // Nhà & Sinh hoạt
  const p_an        = uid(); // Ăn uống
  const p_xe        = uid(); // Di chuyển & Xe cộ
  const p_suckhoe   = uid(); // Sức khỏe & Y tế
  const p_giaoduc   = uid(); // Giáo dục
  const p_giaitri   = uid(); // Giải trí & Mua sắm
  const p_nhaTho    = uid(); // Nhà Thờ & Tín ngưỡng
  const p_giadinhChi= uid(); // Gia đình & Biếu tặng
  const p_taichinh  = uid(); // Tài chính & Vay nợ
  const p_congviec  = uid(); // Công việc & Kinh doanh

  // ── INCOME PARENTS ───────────────────────────────────────
  const p_luong     = uid(); // Lương & Công việc
  const p_phuthu    = uid(); // Thu nhập phụ / Thụ động
  const p_batNgo    = uid(); // Thu nhập bất thường

  const rows = [
    // ════════════════════════════════════════════════════════
    // CHI TIÊU — PARENTS
    // ════════════════════════════════════════════════════════
    [p_nha,       'Nhà & Sinh hoạt',       'Expense', '🏠', '#6366f1', ''],
    [p_an,        'Ăn uống',               'Expense', '🍔', '#f43f5e', ''],
    [p_xe,        'Di chuyển & Xe cộ',     'Expense', '🚗', '#3b82f6', ''],
    [p_suckhoe,   'Sức khỏe & Y tế',       'Expense', '🏥', '#ec4899', ''],
    [p_giaoduc,   'Giáo dục & Phát triển', 'Expense', '📚', '#8b5cf6', ''],
    [p_giaitri,   'Giải trí & Mua sắm',    'Expense', '🎮', '#f59e0b', ''],
    [p_nhaTho,    'Nhà Thờ & Tín ngưỡng',  'Expense', '⛪', '#a855f7', ''],
    [p_giadinhChi,'Gia đình & Biếu tặng',  'Expense', '👨‍👩‍👧', '#14b8a6', ''],
    [p_taichinh,  'Tài chính & Vay nợ',    'Expense', '💳', '#64748b', ''],
    [p_congviec,  'Công việc & Kinh doanh','Expense', '💼', '#0ea5e9', ''],

    // ── 1. Nhà & Sinh hoạt ───────────────────────────────
    [uid(), 'Tiền thuê nhà',          'Expense', '🏠', '#6366f1', p_nha],
    [uid(), 'Tiền điện (EVN)',         'Expense', '⚡', '#6366f1', p_nha],
    [uid(), 'Tiền nước',              'Expense', '💧', '#6366f1', p_nha],
    [uid(), 'Internet / Cáp quang',   'Expense', '🌐', '#6366f1', p_nha],
    [uid(), 'Tiền điện thoại',        'Expense', '📞', '#6366f1', p_nha],
    [uid(), 'Gas / Nhiên liệu bếp',   'Expense', '🔥', '#6366f1', p_nha],
    [uid(), 'Phí chung cư / Dịch vụ', 'Expense', '🏢', '#6366f1', p_nha],
    [uid(), 'Sửa chữa / Bảo trì nhà', 'Expense', '🔧', '#6366f1', p_nha],
    [uid(), 'Đồ dùng gia đình',       'Expense', '🛋️', '#6366f1', p_nha],
    [uid(), 'Vệ sinh / Giặt giũ',     'Expense', '🧹', '#6366f1', p_nha],
    [uid(), 'Đèn / Bóng điện / Phụ kiện điện', 'Expense', '💡', '#6366f1', p_nha],
    [uid(), 'Bình nước / Lọc nước',   'Expense', '🫙', '#6366f1', p_nha],
    [uid(), 'Thuê kho / Nhà kho',     'Expense', '📦', '#6366f1', p_nha],

    // ── 2. Ăn uống ───────────────────────────────────────
    [uid(), 'Đi chợ / Siêu thị',      'Expense', '🛒', '#f43f5e', p_an],
    [uid(), 'Ăn ngoài / Nhà hàng',    'Expense', '🍽️', '#f43f5e', p_an],
    [uid(), 'Cà phê / Trà / Nước uống','Expense', '☕', '#f43f5e', p_an],
    [uid(), 'Đặt đồ ăn online',       'Expense', '📱', '#f43f5e', p_an],
    [uid(), 'Ăn vặt / Bánh kẹo',      'Expense', '🍿', '#f43f5e', p_an],
    [uid(), 'Nấu ăn tại nhà',         'Expense', '👨‍🍳', '#f43f5e', p_an],
    [uid(), 'Tiệc / Ăn uống nhóm',    'Expense', '🥂', '#f43f5e', p_an],

    // ── 3. Di chuyển & Xe cộ ─────────────────────────────
    [uid(), 'Xăng xe',                'Expense', '⛽', '#3b82f6', p_xe],
    [uid(), 'Sửa xe / Bảo dưỡng',    'Expense', '🔩', '#3b82f6', p_xe],
    [uid(), 'Giữ xe / Phí đỗ xe',    'Expense', '🅿️', '#3b82f6', p_xe],
    [uid(), 'Grab / Taxi / Xe ôm',    'Expense', '🛵', '#3b82f6', p_xe],
    [uid(), 'Xe buýt / Tàu xe / Vé', 'Expense', '🚌', '#3b82f6', p_xe],
    [uid(), 'Bảo hiểm xe',           'Expense', '📄', '#3b82f6', p_xe],
    [uid(), 'Mua xe / Trả góp xe',   'Expense', '🚗', '#3b82f6', p_xe],
    [uid(), 'Rửa xe / Vệ sinh xe',   'Expense', '🧽', '#3b82f6', p_xe],
    [uid(), 'Phí cầu đường / ETC',   'Expense', '🛣️', '#3b82f6', p_xe],

    // ── 4. Sức khỏe & Y tế ───────────────────────────────
    [uid(), 'Khám bệnh / Viện phí',  'Expense', '🏥', '#ec4899', p_suckhoe],
    [uid(), 'Thuốc / Vitamin',        'Expense', '💊', '#ec4899', p_suckhoe],
    [uid(), 'Nha khoa / Răng miệng', 'Expense', '🦷', '#ec4899', p_suckhoe],
    [uid(), 'Mắt / Kính',            'Expense', '👓', '#ec4899', p_suckhoe],
    [uid(), 'Bảo hiểm y tế',         'Expense', '🛡️', '#ec4899', p_suckhoe],
    [uid(), 'Gym / Thể dục thể thao','Expense', '💪', '#ec4899', p_suckhoe],
    [uid(), 'Spa / Massage / Thẩm mỹ','Expense', '💆', '#ec4899', p_suckhoe],
    [uid(), 'Sức khỏe tâm lý / Tư vấn','Expense', '🧠', '#ec4899', p_suckhoe],
    [uid(), 'Sản phẩm chăm sóc sức khỏe','Expense', '🧴', '#ec4899', p_suckhoe],

    // ── 5. Giáo dục & Phát triển ─────────────────────────
    [uid(), 'Học phí con',            'Expense', '🎒', '#8b5cf6', p_giaoduc],
    [uid(), 'Học phí bản thân',       'Expense', '📚', '#8b5cf6', p_giaoduc],
    [uid(), 'Khóa học online',        'Expense', '💻', '#8b5cf6', p_giaoduc],
    [uid(), 'Tiếng Anh / Ngoại ngữ', 'Expense', '🌍', '#8b5cf6', p_giaoduc],
    [uid(), 'Sách / Tài liệu',        'Expense', '📖', '#8b5cf6', p_giaoduc],
    [uid(), 'Văn phòng phẩm',         'Expense', '✏️', '#8b5cf6', p_giaoduc],
    [uid(), 'Dụng cụ học tập con',    'Expense', '📐', '#8b5cf6', p_giaoduc],

    // ── 6. Giải trí & Mua sắm ────────────────────────────
    [uid(), 'Quần áo / Giày dép',     'Expense', '👕', '#f59e0b', p_giaitri],
    [uid(), 'Phụ kiện / Trang sức',   'Expense', '💍', '#f59e0b', p_giaitri],
    [uid(), 'Điện thoại / Thiết bị',  'Expense', '📱', '#f59e0b', p_giaitri],
    [uid(), 'Đồ điện tử / Laptop',    'Expense', '💻', '#f59e0b', p_giaitri],
    [uid(), 'Phim ảnh / Rạp chiếu',   'Expense', '🎬', '#f59e0b', p_giaitri],
    [uid(), 'Du lịch / Nghỉ dưỡng',   'Expense', '✈️', '#f59e0b', p_giaitri],
    [uid(), 'Khách sạn / Nhà nghỉ',   'Expense', '🏨', '#f59e0b', p_giaitri],
    [uid(), 'Streaming (Netflix/Spotify)','Expense', '🎵', '#f59e0b', p_giaitri],
    [uid(), 'Game / Ứng dụng',         'Expense', '🎮', '#f59e0b', p_giaitri],
    [uid(), 'Đồ chơi con',             'Expense', '🧸', '#f59e0b', p_giaitri],
    [uid(), 'Thú cưng',                'Expense', '🐾', '#f59e0b', p_giaitri],
    [uid(), 'Mỹ phẩm / Làm đẹp',      'Expense', '💄', '#f59e0b', p_giaitri],

    // ── 7. Nhà Thờ & Tín ngưỡng ──────────────────────────
    [uid(), 'Tiền dâng / Dâng lễ',       'Expense', '🙏', '#a855f7', p_nhaTho],
    [uid(), 'Tiền phần mười (Thập phân)','Expense', '✝️', '#a855f7', p_nhaTho],
    [uid(), 'Công tác xã hội / Từ thiện','Expense', '❤️', '#a855f7', p_nhaTho],
    [uid(), 'Đóng góp xây dựng nhà thờ','Expense', '🏛️', '#a855f7', p_nhaTho],
    [uid(), 'Hội đoàn / Nhóm sinh hoạt', 'Expense', '👥', '#a855f7', p_nhaTho],
    [uid(), 'Giáo lý / Học Kinh Thánh',  'Expense', '📿', '#a855f7', p_nhaTho],
    [uid(), 'Lễ đặc biệt / Nghi lễ',     'Expense', '🕯️', '#a855f7', p_nhaTho],
    [uid(), 'Sách / Tài liệu tôn giáo',  'Expense', '📖', '#a855f7', p_nhaTho],

    // ── 8. Gia đình & Biếu tặng ──────────────────────────
    [uid(), 'Gia đình chồng',            'Expense', '👨‍👩‍👧', '#14b8a6', p_giadinhChi],
    [uid(), 'Gia đình vợ',               'Expense', '👩‍👧', '#14b8a6', p_giadinhChi],
    [uid(), 'Nuôi dưỡng cha mẹ',         'Expense', '👴', '#14b8a6', p_giadinhChi],
    [uid(), 'Anh chị em ruột',           'Expense', '👨‍👧‍👦', '#14b8a6', p_giadinhChi],
    [uid(), 'Sinh nhật / Quà tặng',      'Expense', '🎁', '#14b8a6', p_giadinhChi],
    [uid(), 'Đám cưới / Đám tiệc',       'Expense', '💒', '#14b8a6', p_giadinhChi],
    [uid(), 'Lì xì / Phong bì',          'Expense', '🧧', '#14b8a6', p_giadinhChi],
    [uid(), 'Đám tang / Phúng điếu',     'Expense', '🌸', '#14b8a6', p_giadinhChi],
    [uid(), 'Đồ chơi / Chi trẻ em',      'Expense', '👶', '#14b8a6', p_giadinhChi],
    [uid(), 'Hiếu hỷ / Giỗ chạp',        'Expense', '🍱', '#14b8a6', p_giadinhChi],

    // ── 9. Tài chính & Vay nợ ────────────────────────────
    [uid(), 'Trả nợ ngân hàng',          'Expense', '🏦', '#64748b', p_taichinh],
    [uid(), 'Trả góp / Installment',     'Expense', '💳', '#64748b', p_taichinh],
    [uid(), 'Phí ngân hàng / ATM',       'Expense', '🏧', '#64748b', p_taichinh],
    [uid(), 'Bảo hiểm nhân thọ',         'Expense', '🛡️', '#64748b', p_taichinh],
    [uid(), 'Bảo hiểm xe máy / ô tô',    'Expense', '🚗', '#64748b', p_taichinh],
    [uid(), 'Đầu tư / Chứng khoán',      'Expense', '📈', '#64748b', p_taichinh],
    [uid(), 'Cho bạn bè vay',            'Expense', '🤝', '#64748b', p_taichinh],
    [uid(), 'Phí dịch vụ khác',          'Expense', '📋', '#64748b', p_taichinh],

    // ── 10. Công việc & Kinh doanh ───────────────────────
    [uid(), 'Dụng cụ / Thiết bị làm việc','Expense', '🔨', '#0ea5e9', p_congviec],
    [uid(), 'Phí văn phòng',             'Expense', '🏢', '#0ea5e9', p_congviec],
    [uid(), 'Chi phí marketing',          'Expense', '📣', '#0ea5e9', p_congviec],
    [uid(), 'Phí phần mềm / Subscription','Expense', '💿', '#0ea5e9', p_congviec],
    [uid(), 'Chi phí đi công tác',        'Expense', '✈️', '#0ea5e9', p_congviec],
    [uid(), 'Ăn uống công việc / Tiếp khách','Expense', '🍱', '#0ea5e9', p_congviec],
    [uid(), 'Đào tạo nhân viên',          'Expense', '👨‍💼', '#0ea5e9', p_congviec],

    // ════════════════════════════════════════════════════════
    // THU NHẬP — PARENTS
    // ════════════════════════════════════════════════════════
    [p_luong,   'Lương & Công việc chính', 'Income', '💼', '#22c55e', ''],
    [p_phuthu,  'Thu nhập phụ / Thụ động', 'Income', '💹', '#10b981', ''],
    [p_batNgo,  'Thu nhập bất thường',     'Income', '🎁', '#06b6d4', ''],

    // ── 11. Lương & Công việc chính ──────────────────────
    [uid(), 'Lương tháng (cứng)',        'Income', '💰', '#22c55e', p_luong],
    [uid(), 'Thưởng / Bonus',            'Income', '🏆', '#22c55e', p_luong],
    [uid(), 'Phụ cấp xăng xe',          'Income', '⛽', '#22c55e', p_luong],
    [uid(), 'Phụ cấp ăn uống / Cơm',    'Income', '🍱', '#22c55e', p_luong],
    [uid(), 'Phụ cấp điện thoại',        'Income', '📞', '#22c55e', p_luong],
    [uid(), 'Thưởng dự án',              'Income', '🎯', '#22c55e', p_luong],
    [uid(), 'Tăng ca / Overtime',        'Income', '⏰', '#22c55e', p_luong],
    [uid(), 'Hoa hồng / Commission',     'Income', '💲', '#22c55e', p_luong],

    // ── 12. Thu nhập phụ / Thụ động ──────────────────────
    [uid(), 'Freelance / Làm thêm',      'Income', '💻', '#10b981', p_phuthu],
    [uid(), 'Kinh doanh phụ / Online',   'Income', '🏪', '#10b981', p_phuthu],
    [uid(), 'Cho thuê nhà / phòng',      'Income', '🏠', '#10b981', p_phuthu],
    [uid(), 'Lãi ngân hàng / Tiết kiệm','Income', '🏦', '#10b981', p_phuthu],
    [uid(), 'Cổ tức / Chứng khoán',      'Income', '📈', '#10b981', p_phuthu],
    [uid(), 'Thu nhập từ YouTube/Blog',  'Income', '📺', '#10b981', p_phuthu],
    [uid(), 'Dạy học / Gia sư',          'Income', '👨‍🏫', '#10b981', p_phuthu],

    // ── 13. Thu nhập bất thường ──────────────────────────
    [uid(), 'Quà tặng / Nhận lì xì',    'Income', '🎁', '#06b6d4', p_batNgo],
    [uid(), 'Bán đồ cũ / Thanh lý',     'Income', '♻️', '#06b6d4', p_batNgo],
    [uid(), 'Hoàn tiền / Cashback',      'Income', '💸', '#06b6d4', p_batNgo],
    [uid(), 'Tiền bảo hiểm bồi thường',  'Income', '📋', '#06b6d4', p_batNgo],
    [uid(), 'Ba mẹ / Gia đình hỗ trợ',  'Income', '👨‍👩‍👧', '#06b6d4', p_batNgo],
    [uid(), 'Hỗ trợ từ nhà thờ',         'Income', '⛪', '#06b6d4', p_batNgo],
    [uid(), 'Học bổng',                   'Income', '🎓', '#06b6d4', p_batNgo],
    [uid(), 'Tiền thắng / Giải thưởng',  'Income', '🏅', '#06b6d4', p_batNgo],
  ];

  const successCount = repo.safeWrite('Categories', rows);
  repo.clearCache('Categories');
  Logger.log(`✅ Seeded ${rows.length} categories (mode: ${mode}). Success: ${successCount}`);
  return `Đã tạo ${rows.length} danh mục thành công.`;
}


function getTransactions() {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Transactions');
  return data.map(row => ({
    id: row[0], walletId: row[1], categoryId: row[2], amount: row[3], type: row[4], date: row[5], note: row[6], fundId: row[7] || '', debtId: row[8] || ''
  }));
}

function addTransaction(walletId, categoryId, amount, type, dateString, note, fundId, debtId) {
  if (fundId === undefined) fundId = '';
  if (debtId === undefined) debtId = '';
  const repo = new SheetRepository();
  const id = Utilities.getUuid();
  const success = repo.safeWrite('Transactions', [[id, walletId, categoryId, amount, type, dateString, note, fundId, debtId]]);
  if (success) {
    repo.clearCache('Transactions');
    const wallets = repo.cachedRead('Wallets');
    const wallet = wallets.find(row => row[0] === walletId);
    if (wallet) {
      const currentBalance = Number(wallet[3]) || 0;
      const newBalance = type === 'Income' ? currentBalance + Number(amount) : currentBalance - Number(amount);
      repo.updateRow('Wallets', 0, walletId, 3, newBalance);
      repo.clearCache('Wallets');
    }
    if (fundId) {
      const funds = repo.cachedRead('Funds');
      const fund = funds.find(row => row[0] === fundId);
      if (fund) {
        const currentFundBalance = Number(fund[3]) || 0;
        const newFundBalance = type === 'Income' ? currentFundBalance + Number(amount) : currentFundBalance - Number(amount);
        repo.updateRow('Funds', 0, fundId, 3, newFundBalance);
        repo.clearCache('Funds');
      }
    }
    addExp(5);
  }
  return success;
}

// ─── UPDATE TRANSACTION ────────────────────────────────────
// Điều chỉnh wallet + fund balance theo delta (old vs new)
function updateTransaction(id, newAmount, newCategoryId, newNote, newDate) {
  const repo = new SheetRepository();
  const transactions = repo.cachedRead('Transactions');
  const tx = transactions.find(r => r[0] === id);
  if (!tx) return false;

  const oldAmount   = Number(tx[3]);
  const type        = tx[4]; // Income / Expense
  const walletId    = tx[1];
  const fundId      = tx[7] || '';

  // Delta for wallet
  const amountDiff = Number(newAmount) - oldAmount;
  if (amountDiff !== 0) {
    const wallets = repo.cachedRead('Wallets');
    const wallet  = wallets.find(r => r[0] === walletId);
    if (wallet) {
      const adj = type === 'Income' ? amountDiff : -amountDiff;
      repo.updateRow('Wallets', 0, walletId, 3, Number(wallet[3]) + adj);
      repo.clearCache('Wallets');
    }
    // Delta for fund
    if (fundId) {
      const funds = repo.cachedRead('Funds');
      const fund  = funds.find(r => r[0] === fundId);
      if (fund) {
        const fadj = type === 'Income' ? amountDiff : -amountDiff;
        repo.updateRow('Funds', 0, fundId, 3, Number(fund[3]) + fadj);
        repo.clearCache('Funds');
      }
    }
  }

  // Update transaction row
  const sheet = repo.ss.getSheetByName('Transactions');
  const allData = sheet.getDataRange().getValues();
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === id) {
      sheet.getRange(i + 1, 4).setValue(Number(newAmount));
      sheet.getRange(i + 1, 3).setValue(newCategoryId || tx[2]);
      sheet.getRange(i + 1, 7).setValue(newNote !== undefined ? newNote : tx[6]);
      sheet.getRange(i + 1, 6).setValue(newDate || tx[5]);
      break;
    }
  }
  repo.clearCache('Transactions');
  return true;
}

function deleteTransaction(id) {
  const repo = new SheetRepository();
  const transactions = repo.cachedRead('Transactions');
  const tx = transactions.find(r => r[0] === id);
  if (!tx) return false;

  // Reverse wallet balance
  const walletId = tx[1];
  const amount   = Number(tx[3]);
  const type     = tx[4];
  const fundId   = tx[7] || '';

  const wallets = repo.cachedRead('Wallets');
  const wallet  = wallets.find(r => r[0] === walletId);
  if (wallet) {
    const adj = type === 'Income' ? -amount : amount;
    repo.updateRow('Wallets', 0, walletId, 3, Number(wallet[3]) + adj);
    repo.clearCache('Wallets');
  }

  if (fundId) {
    const funds = repo.cachedRead('Funds');
    const fund  = funds.find(r => r[0] === fundId);
    if (fund) {
      const fadj = type === 'Income' ? -amount : amount;
      repo.updateRow('Funds', 0, fundId, 3, Number(fund[3]) + fadj);
      repo.clearCache('Funds');
    }
  }

  const success = repo.deleteRow('Transactions', 0, id);
  if (success) repo.clearCache('Transactions');
  return success;
}


// --- PHASE 17: FUNDS (JARS) ---
function getFunds() {
  const repo = new SheetRepository();
  let data = repo.cachedRead('Funds');
  if (data.length === 0) {
    const defaults = [
      ['f_chung', 'Quỹ Chung', 0, 0, '💰', '#3b82f6'],
      [Utilities.getUuid(), 'Sinh hoạt', 55, 0, '🏠', '#f43f5e'],
      [Utilities.getUuid(), 'Tiết kiệm', 10, 0, '🐷', '#22c55e'],
      [Utilities.getUuid(), 'Giáo dục', 10, 0, '📚', '#8b5cf6'],
      [Utilities.getUuid(), 'Hưởng thụ', 10, 0, '🏖️', '#ec4899'],
      [Utilities.getUuid(), 'Đầu tư', 10, 0, '📈', '#f59e0b'],
      [Utilities.getUuid(), 'Từ thiện', 5, 0, '❤️', '#14b8a6']
    ];
    repo.safeWrite('Funds', defaults);
    data = defaults;
  }
  return data.map(row => ({ id: row[0], name: row[1], defaultPercentage: row[2], balance: row[3], icon: row[4], color: row[5], targetAmount: Number(row[6]) || 0 }));
}

function addFund(name, defaultPercentage, icon, color) {
  const repo = new SheetRepository();
  const id = Utilities.getUuid();
  const success = repo.safeWrite('Funds', [[id, name, defaultPercentage, 0, icon, color]]);
  if (success) repo.clearCache('Funds');
  return success;
}

function updateFund(id, name, defaultPercentage, balance, icon, color) {
  const repo = new SheetRepository();
  const success = repo.updateFullRow('Funds', 0, id, [id, name, defaultPercentage, balance, icon, color]);
  if (success) repo.clearCache('Funds');
  return success;
}

function deleteFund(id) {
  const repo = new SheetRepository();
  const success = repo.deleteRow('Funds', 0, id);
  if (success) repo.clearCache('Funds');
  return success;
}

function updateFundBalance(id, newBalance) {
  const repo = new SheetRepository();
  const success = repo.updateRow('Funds', 0, id, 3, newBalance);
  if (success) repo.clearCache('Funds');
  return !!success;
}

// Set target amount for a fund (stored in col index 6)
function setFundTarget(id, targetAmount) {
  const repo = new SheetRepository();
  const sheet = repo.ss.getSheetByName('Funds');
  if (!sheet) return false;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      // Col 7 (index 6) = TargetAmount — extend row if needed
      sheet.getRange(i + 1, 7).setValue(Number(targetAmount));
      repo.clearCache('Funds');
      return true;
    }
  }
  return false;
}

// Deposit directly into a fund (from external source, not Quỹ Chung)
function depositToFund(fundId, amount, walletId, note, date) {
  const repo = new SheetRepository();
  // Add a transaction of type Income assigned to this fund
  return addTransaction(walletId || '', 'cat_deposit', Number(amount), 'Income', date || new Date().toISOString().split('T')[0], note || 'Nạp quỹ', fundId);
}


// --- PHASE 17: DEBTS ---
function getDebts() {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Debts');
  return data.map(row => ({
    id: row[0], personName: row[1], type: row[2], principalAmount: row[3], interestRate: row[4], paidAmount: row[5], date: row[6], dueDate: row[7], status: row[8]
  }));
}

function addDebt(personName, type, principalAmount, interestRate, date, dueDate) {
  const repo = new SheetRepository();
  const id = Utilities.getUuid();
  const success = repo.safeWrite('Debts', [[id, personName, type, principalAmount, interestRate, 0, date, dueDate, 'PENDING']]);
  if (success) repo.clearCache('Debts');
  return success;
}

function updateDebtPaidAmount(id, newPaidAmount, newStatus) {
  const repo = new SheetRepository();
  repo.updateRow('Debts', 0, id, 5, newPaidAmount);
  const success = repo.updateRow('Debts', 0, id, 8, newStatus);
  if (success) repo.clearCache('Debts');
  return !!success;
}

function payDebt(debtId, amount, walletId, date, note) {
  const repo = new SheetRepository();
  const debts = repo.cachedRead('Debts');
  const debt = debts.find(r => r[0] === debtId);
  if (!debt) return false;

  const currentPaid = Number(debt[5]) || 0;
  const newPaid = currentPaid + Number(amount);
  
  // Simplify interest calculation for now: Principal + (Principal * Interest / 100)
  const totalDue = Number(debt[3]) + (Number(debt[3]) * Number(debt[4]) / 100);
  const newStatus = newPaid >= totalDue ? 'PAID' : 'PENDING';

  repo.updateRow('Debts', 0, debtId, 5, newPaid);
  repo.updateRow('Debts', 0, debtId, 8, newStatus);
  repo.clearCache('Debts');

  const txType = debt[2] === 'BORROW' ? 'Expense' : 'Income';
  const person = debt[1];
  const txNote = note || (debt[2] === 'BORROW' ? `Trả nợ cho ${person}` : `Thu nợ từ ${person}`);

  return addTransaction(walletId, '', amount, txType, date, txNote, '', debtId);
}

// --- PHASE 7: SUPER APP (GOALS & HABITS) ---
// Note: Goals moved to Phase 26

function getHabits() {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Habits');
  // [id, title, icon, color, streak, lastCheckedDate]
  return data.map(row => ({
    id: row[0], title: row[1], icon: row[2], color: row[3], streak: row[4] || 0, lastCheckedDate: row[5] || '', history: row[6] ? JSON.parse(row[6]) : []
  }));
}

function addHabit(title, icon, color) {
  const repo = new SheetRepository();
  const id = Utilities.getUuid();
  const success = repo.safeWrite('Habits', [[id, title, icon, color, 0, '', '[]']]);
  if (success) {
    repo.clearCache('Habits');
    addExp(10); // Gamification
  }
  return success;
}

function checkHabit(id, dateString) {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Habits');
  const habit = data.find(row => row[0] === id);
  if (!habit) return false;
  
  let newStreak = Number(habit[4]);
  const lastChecked = habit[5];
  const history = habit[6] ? JSON.parse(habit[6]) : [];
  
  // Already checked today: do nothing
  if (lastChecked === dateString) return true;
  
  // Bug #2 Fix: Proper streak reset logic
  // Check if lastChecked was yesterday; if not, reset streak to 1
  const yesterday = new Date(dateString);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (lastChecked === yesterdayStr || lastChecked === '') {
    newStreak += 1; // Consecutive day: extend streak
  } else {
    newStreak = 1; // Missed a day: reset streak
  }
  
  history.push(dateString);
  
  repo.updateRow('Habits', 0, id, 4, newStreak);
  repo.updateRow('Habits', 0, id, 5, dateString);
  repo.updateRow('Habits', 0, id, 6, JSON.stringify(history));
  repo.clearCache('Habits');
  addExp(20); // Gamification
  return true;
}

function updateHabit(id, title, icon, color) {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Habits');
  const habit = data.find(row => row[0] === id);
  if (!habit) return false;
  repo.updateRow('Habits', 0, id, 1, title);
  repo.updateRow('Habits', 0, id, 2, icon);
  const row = repo.updateRow('Habits', 0, id, 3, color);
  if (row) repo.clearCache('Habits');
  return !!row;
}

function deleteHabit(id) {
  const repo = new SheetRepository();
  const success = repo.deleteRow('Habits', 0, id);
  if (success) repo.clearCache('Habits');
  return success;
}

function freezeHabitStreak(id) {
  // Streak Freeze: Mark today as checked WITHOUT incrementing streak
  // Protects streak from breaking for 1 missed day
  const repo = new SheetRepository();
  const data = repo.cachedRead('Habits');
  const habit = data.find(row => row[0] === id);
  if (!habit) return false;
  
  const today = new Date().toISOString().split('T')[0];
  if (habit[5] === today) return true; // Already checked/frozen today
  
  const history = habit[6] ? JSON.parse(habit[6]) : [];
  history.push(today + '_frozen');
  
  // Keep streak intact, just update lastCheckedDate so streak doesn't break tomorrow
  repo.updateRow('Habits', 0, id, 5, today);
  repo.updateRow('Habits', 0, id, 6, JSON.stringify(history));
  repo.clearCache('Habits');
  return true;
}

// --- UNIFIED DASHBOARD SUMMARY (Performance: 6 API calls → 1) ---
function getDashboardSummary() {
  const repo = new SheetRepository();
  
  const transactions = repo.cachedRead('Transactions').map(row => ({
    id: row[0], walletId: row[1], categoryId: row[2], amount: Number(row[3]) || 0,
    type: row[4], date: row[5], note: row[6], fundId: row[7], debtId: row[8]
  }));
  
  const categories = repo.cachedRead('Categories').map(row => ({
    id: row[0], name: row[1], type: row[2], icon: row[3], color: row[4], parentId: row[5] || ''
  }));
  
  const tasks = repo.cachedRead('Tasks').map(row => ({
    id: row[0], title: row[1], status: row[2], date: row[3],
    eventId: row[4], calendarId: row[5] || 'default', priority: row[6] || 'P3',
    subtasks: row[7] ? JSON.parse(row[7]) : [], noteId: row[8] || null
  }));
  
  const habits = repo.cachedRead('Habits').map(row => ({
    id: row[0], title: row[1], icon: row[2], color: row[3],
    streak: row[4] || 0, lastCheckedDate: row[5] || '',
    history: row[6] ? JSON.parse(row[6]) : []
  }));
  
  const wallets = repo.cachedRead('Wallets').map(row => ({
    id: row[0], name: row[1], type: row[2], balance: Number(row[3]) || 0
  }));
  
  const goals = repo.cachedRead('Goals').map(row => ({
    id: row[0], name: row[1], targetAmount: Number(row[2]) || 0,
    savedAmount: Number(row[3]) || 0, deadline: row[4],
    icon: row[5] || '🎯', color: row[6] || '#f43f5e'
  }));
  
  const userStats = getUserStats();
  
  return {
    transactions: transactions.slice(-200), // Last 200 for performance
    categories,
    tasks,
    habits,
    wallets,
    goals,
    userStats,
    generatedAt: new Date().toISOString()
  };
}

// --- PHASE 8: GAMIFICATION ---

const DEFAULT_GAMIFICATION_CONFIG = {
  expPerLevel: 100,
  expPerAction: 20,
  titles: [
    { level: 1, name: 'Thực Tập Sinh' },
    { level: 5, name: 'Chuyên Viên' },
    { level: 15, name: 'Quản Lý' },
    { level: 30, name: 'Kẻ Hủy Diệt Deadline' },
    { level: 50, name: 'Triệu Phú' }
  ]
};

function getGamificationConfig() {
  const props = PropertiesService.getUserProperties();
  const configStr = props.getProperty('GAMIFICATION_CONFIG');
  if (!configStr) return DEFAULT_GAMIFICATION_CONFIG;
  try {
    return JSON.parse(configStr);
  } catch(e) {
    return DEFAULT_GAMIFICATION_CONFIG;
  }
}

function updateGamificationConfig(config) {
  const props = PropertiesService.getUserProperties();
  props.setProperty('GAMIFICATION_CONFIG', JSON.stringify(config));
  return true;
}

function getUserStats() {
  const props = PropertiesService.getUserProperties();
  const expStr = props.getProperty('GAMIFICATION_EXP') || '0';
  const exp = parseInt(expStr, 10);
  const config = getGamificationConfig();
  
  // Calculate Level
  const expPerLevel = Number(config.expPerLevel) || 100;
  const level = Math.floor(exp / expPerLevel) + 1;
  const currentLevelExp = exp % expPerLevel;
  
  let title = 'Tân Binh';
  if (config.titles && config.titles.length > 0) {
    const sortedTitles = config.titles.sort((a, b) => a.level - b.level);
    for (let i = 0; i < sortedTitles.length; i++) {
      if (level >= sortedTitles[i].level) {
        title = sortedTitles[i].name;
      }
    }
  }
  
  // Return the progress percentage
  const currentLevelExpPercent = Math.floor((currentLevelExp / expPerLevel) * 100);

  return { exp, level, currentLevelExp, currentLevelExpPercent, title, expPerLevel };
}

function addExp(points) {
  const props = PropertiesService.getUserProperties();
  const expStr = props.getProperty('GAMIFICATION_EXP') || '0';
  const newExp = parseInt(expStr, 10) + points;
  props.setProperty('GAMIFICATION_EXP', newExp.toString());
}

// --- PHASE 8: VAULT (NOTES) ---

function getNotes() {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Notes');
  // [id, title, content, lastEdited]
  return data.map(row => ({
    id: row[0], title: row[1], content: row[2], lastEdited: row[3]
  }));
}

function saveNote(id, title, content) {
  const repo = new SheetRepository();
  const date = new Date().toISOString();
  
  if (id) {
    repo.updateRow('Notes', 0, id, 1, title);
    repo.updateRow('Notes', 0, id, 2, content);
    repo.updateRow('Notes', 0, id, 3, date);
    repo.clearCache('Notes');
    addExp(5); // Gamification
    return id;
  } else {
    const newId = Utilities.getUuid();
    const success = repo.safeWrite('Notes', [[newId, title, content, date]]);
    if (success) {
      repo.clearCache('Notes');
      addExp(15); // Gamification
      return newId;
    }
  }
  return false;
}

// --- PHASE 26: GOALS ---

function getGoals() {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Goals');
  // ['ID', 'Name', 'TargetAmount', 'SavedAmount', 'Deadline', 'Icon', 'Color']
  return data.map(row => ({
    id: row[0],
    name: row[1],
    targetAmount: Number(row[2]) || 0,
    savedAmount: Number(row[3]) || 0,
    deadline: row[4],
    icon: row[5] || '🎯',
    color: row[6] || '#f43f5e'
  }));
}

function addGoal(name, targetAmount, deadline, icon, color) {
  const repo = new SheetRepository();
  const id = Utilities.getUuid();
  const success = repo.safeWrite('Goals', [[id, name, targetAmount, 0, deadline, icon, color]]);
  if (success) {
    repo.clearCache('Goals');
    return true;
  }
  return false;
}

function updateGoal(id, name, targetAmount, deadline, icon, color) {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Goals');
  const existing = data.find(r => r[0] === id);
  if (existing) {
    repo.updateFullRow('Goals', 0, id, [id, name, targetAmount, existing[3], deadline, icon, color]);
    repo.clearCache('Goals');
    return true;
  }
  return false;
}

function deleteGoal(id) {
  const repo = new SheetRepository();
  const success = repo.deleteRow('Goals', 0, id);
  if (success) {
    repo.clearCache('Goals');
    return true;
  }
  return false;
}

function addMoneyToGoal(goalId, amount, sourceWalletId) {
  const repo = new SheetRepository();
  const goals = repo.cachedRead('Goals');
  const goalIdx = goals.findIndex(r => r[0] === goalId);
  if (goalIdx === -1) return false;
  
  const currentSaved = Number(goals[goalIdx][3]) || 0;
  const targetAmount = Number(goals[goalIdx][2]) || 0;
  const newSaved = currentSaved + Number(amount);
  const goalName = goals[goalIdx][1];
  
  // Update Goal savedAmount
  repo.updateRow('Goals', 0, goalId, 3, newSaved);
  repo.clearCache('Goals');
  
  const today = new Date().toISOString().split('T')[0];
  
  // Find a 'Tiết kiệm' category to link the expense transaction
  const cats = repo.cachedRead('Categories');
  let catId = '';
  const savingCat = cats.find(c => c[1].toLowerCase().includes('tiết kiệm') || c[1].toLowerCase().includes('mục tiêu'));
  if (savingCat) catId = savingCat[0];
  
  // Bug #1 Fix: Correct column order: [id, walletId, categoryId, amount, type, date, note, fundId, debtId]
  const txId = Utilities.getUuid();
  repo.safeWrite('Transactions', [[txId, sourceWalletId, catId, Number(amount), 'Expense', today, `Nạp tiền vào Mục tiêu: ${goalName}`, '', '']]);
  repo.clearCache('Transactions');
  
  // Decrease wallet balance
  const wallets = repo.cachedRead('Wallets');
  const wIdx = wallets.findIndex(w => w[0] === sourceWalletId);
  if (wIdx !== -1) {
    const currentBal = Number(wallets[wIdx][3]) || 0;
    repo.updateRow('Wallets', 0, sourceWalletId, 3, currentBal - Number(amount));
    repo.clearCache('Wallets');
  }
  
  // Bug #12 Fix: EXP for depositing to goal
  addExp(30);
  if (newSaved >= targetAmount) {
    addExp(200); // Bonus for completing a goal!
  }
  
  return true;
}

// --- PHASE 26 EXTENDED: Delete Transaction (with wallet/fund reversal) ---

function deleteTransaction(id) {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Transactions');
  const tx = data.find(row => row[0] === id);
  if (!tx) return false;
  
  const walletId = tx[1];
  const amount = Number(tx[3]) || 0;
  const type = tx[4];
  const fundId = tx[7] || '';
  
  // Reverse the wallet balance change
  const wallets = repo.cachedRead('Wallets');
  const wallet = wallets.find(w => w[0] === walletId);
  if (wallet) {
    const currentBal = Number(wallet[3]) || 0;
    // If it was an Expense, refund by adding back. If Income, subtract.
    const newBal = type === 'Expense' ? currentBal + amount : currentBal - amount;
    repo.updateRow('Wallets', 0, walletId, 3, newBal);
    repo.clearCache('Wallets');
  }
  
  // Reverse the fund balance change (if applicable)
  if (fundId) {
    const funds = repo.cachedRead('Funds');
    const fund = funds.find(f => f[0] === fundId);
    if (fund) {
      const currentFundBal = Number(fund[3]) || 0;
      const newFundBal = type === 'Expense' ? currentFundBal + amount : currentFundBal - amount;
      repo.updateRow('Funds', 0, fundId, 3, newFundBal);
      repo.clearCache('Funds');
    }
  }
  
  // Delete the row
  const success = repo.deleteRow('Transactions', 0, id);
  if (success) repo.clearCache('Transactions');
  return !!success;
}

// --- PHASE 27: INTERNAL TRANSFER ---

function transferBetweenWallets(fromWalletId, toWalletId, amount, note, date) {
  const repo = new SheetRepository();
  const wallets = repo.cachedRead('Wallets');
  
  const fromWallet = wallets.find(w => w[0] === fromWalletId);
  const toWallet = wallets.find(w => w[0] === toWalletId);
  if (!fromWallet || !toWallet) return false;
  if (fromWalletId === toWalletId) return false;
  
  const amt = Number(amount);
  const today = date || new Date().toISOString().split('T')[0];
  const transferNote = note || `Chuyển tiền: ${fromWallet[1]} → ${toWallet[1]}`;
  const transferGroupId = Utilities.getUuid(); // Links the two transactions together
  
  // 1. Deduct from source wallet
  const fromBal = Number(fromWallet[3]) || 0;
  repo.updateRow('Wallets', 0, fromWalletId, 3, fromBal - amt);
  
  // 2. Add to destination wallet
  const toBal = Number(toWallet[3]) || 0;
  repo.updateRow('Wallets', 0, toWalletId, 3, toBal + amt);
  repo.clearCache('Wallets');
  
  // 3. Record two linked transactions (type = 'Transfer') 
  // We use the note field to store the groupId for future reference
  const txId1 = Utilities.getUuid();
  const txId2 = Utilities.getUuid();
  repo.safeWrite('Transactions', [
    [txId1, fromWalletId, '', amt, 'Transfer', today, `[Chuyển đi] ${transferNote}`, '', transferGroupId],
    [txId2, toWalletId,   '', amt, 'Transfer', today, `[Chuyển đến] ${transferNote}`, '', transferGroupId]
  ]);
  repo.clearCache('Transactions');
  
  return true;
}

function deleteNote(id) {
  // Simple delete using SheetRepository doesn't exist yet, so we just clear title/content
  const repo = new SheetRepository();
  repo.updateRow('Notes', 0, id, 1, '[Đã xóa]');
  repo.updateRow('Notes', 0, id, 2, '');
  repo.clearCache('Notes');
  return true;
}

// --- PHASE 11: SMART BUDGETING ---

function getBudgets(month) {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Budgets');
  // [id, categoryId, amount, month]
  return data
    .filter(row => row[3] === month)
    .map(row => ({
      id: row[0], categoryId: row[1], amount: row[2], month: row[3]
    }));
}

function setBudget(categoryId, amount, month) {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Budgets');
  const existing = data.find(row => row[1] === categoryId && row[3] === month);
  
  if (existing) {
    const id = existing[0];
    const success = repo.updateRow('Budgets', 0, id, 2, amount);
    if (success) repo.clearCache('Budgets');
    return !!success;
  } else {
    const id = Utilities.getUuid();
    const success = repo.safeWrite('Budgets', [[id, categoryId, amount, month]]);
    if (success) repo.clearCache('Budgets');
    return success;
  }
}

// --- PHASE 19: STOCK PORTFOLIO (WEALTH) ---

function getStocks() {
  const repo = new SheetRepository();
  const data = repo.cachedRead('Stocks');
  // [Ticker, Quantity, AveragePrice, CurrentPrice, LastUpdated]
  return data.map(row => ({
    ticker: row[0],
    quantity: Number(row[1]) || 0,
    averagePrice: Number(row[2]) || 0,
    currentPrice: Number(row[3]) || 0,
    lastUpdated: row[4]
  }));
}

function getStockTransactions() {
  const repo = new SheetRepository();
  const data = repo.cachedRead('StockTransactions');
  // ['ID', 'Ticker', 'Type', 'Quantity', 'Price', 'Fee', 'Tax', 'Date', 'WalletID', 'FundID', 'Note']
  return data.map(row => ({
    id: row[0],
    ticker: row[1],
    type: row[2], // BUY, SELL, DIVIDEND_CASH, DIVIDEND_STOCK
    quantity: Number(row[3]) || 0,
    price: Number(row[4]) || 0,
    fee: Number(row[5]) || 0,
    tax: Number(row[6]) || 0,
    date: row[7],
    walletId: row[8],
    fundId: row[9],
    note: row[10]
  }));
}

function addStockTransaction(ticker, type, quantity, price, fee, tax, date, walletId, fundId, note) {
  const repo = new SheetRepository();
  const id = Utilities.getUuid();
  
  // 1. Record the transaction
  const txSuccess = repo.safeWrite('StockTransactions', [[id, ticker, type, quantity, price, fee, tax, date, walletId, fundId, note]]);
  
  if (txSuccess) {
    repo.clearCache('StockTransactions');
    
    // 2. Update Stocks portfolio holding
    const stocks = repo.cachedRead('Stocks');
    const existingIdx = stocks.findIndex(r => r[0] === ticker);
    
    if (existingIdx !== -1) {
      const currentQty = Number(stocks[existingIdx][1]) || 0;
      const currentAvgPrice = Number(stocks[existingIdx][2]) || 0;
      let newQty = currentQty;
      let newAvgPrice = currentAvgPrice;
      
      if (type === 'BUY') {
        newQty = currentQty + quantity;
        newAvgPrice = ((currentQty * currentAvgPrice) + (quantity * price)) / newQty;
      } else if (type === 'SELL') {
        newQty = currentQty - quantity;
        if (newQty < 0) newQty = 0; // Prevent negative
        // Average price remains same on SELL
      } else if (type === 'DIVIDEND_STOCK') {
        newQty = currentQty + quantity;
        // Average price dilutes
        newAvgPrice = (currentQty * currentAvgPrice) / newQty;
      }
      
      repo.updateFullRow('Stocks', 0, ticker, [
        ticker, newQty, newAvgPrice, stocks[existingIdx][3], new Date().toISOString()
      ]);
    } else {
      // New stock
      if (type === 'BUY' || type === 'DIVIDEND_STOCK') {
        repo.safeWrite('Stocks', [[ticker, quantity, price, price, new Date().toISOString()]]);
      }
    }
    repo.clearCache('Stocks');
    return true;
  }
  return false;
}

function updateStockPrice(ticker, newPrice) {
  const repo = new SheetRepository();
  const stocks = repo.cachedRead('Stocks');
  const existingIdx = stocks.findIndex(r => r[0] === ticker);
  if (existingIdx !== -1) {
    repo.updateFullRow('Stocks', 0, ticker, [
      ticker, stocks[existingIdx][1], stocks[existingIdx][2], newPrice, new Date().toISOString()
    ]);
    repo.clearCache('Stocks');
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════
// MONTHLY BUDGET CYCLE APIs
// Sheet: MonthlyBudgets
// Cols: month | carryover_in | total_income | total_expense
//       | surplus | sent_to_savings | sent_to_emergency
//       | carryover_out | closed_at | note
// ═══════════════════════════════════════════════════════════════

function getMonthlyBudget(month) {
  const repo = new SheetRepository();

  // Get or create record for this month
  const records = repo.cachedRead('MonthlyBudgets');
  const existing = records.find(r => r[0] === month);

  // Get real income/expense from transactions
  const transactions = repo.cachedRead('Transactions');
  const monthTxs = transactions.filter(r => String(r[3]).startsWith(month));
  const totalIncome  = monthTxs.filter(r => r[4] === 'Income').reduce((s, r) => s + Number(r[2]), 0);
  const totalExpense = monthTxs.filter(r => r[4] === 'Expense').reduce((s, r) => s + Number(r[2]), 0);

  // Carryover from previous month
  const prevMonth = getPrevMonth_(month);
  const prevRecords = records.find(r => r[0] === prevMonth);
  const carryoverIn = prevRecords ? Number(prevRecords[7]) : 0; // carryover_out of prev month

  const surplus = carryoverIn + totalIncome - totalExpense;

  if (existing) {
    return {
      month:          existing[0],
      carryoverIn:    Number(existing[1]),
      totalIncome:    totalIncome,
      totalExpense:   totalExpense,
      surplus:        surplus,
      sentToSavings:  Number(existing[5]),
      sentToEmergency: Number(existing[6]),
      carryoverOut:   Number(existing[7]),
      closedAt:       existing[8],
      note:           existing[9],
      isClosed:       !!existing[8]
    };
  }

  return {
    month, carryoverIn, totalIncome, totalExpense,
    surplus, sentToSavings: 0, sentToEmergency: 0,
    carryoverOut: 0, closedAt: null, note: '', isClosed: false
  };
}

function closeMonth(month, sentToSavings, sentToEmergency, note) {
  const repo = new SheetRepository();
  const budget = getMonthlyBudget(month);
  const carryoverOut = Math.max(0, budget.surplus - sentToSavings - sentToEmergency);
  const now = new Date().toISOString();

  // Delete existing record for this month if any
  const sheet = repo.ss.getSheetByName('MonthlyBudgets') || repo.ss.insertSheet('MonthlyBudgets');
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === month) { sheet.deleteRow(i + 1); break; }
  }

  // Write updated record
  const success = repo.safeWrite('MonthlyBudgets', [[
    month, budget.carryoverIn, budget.totalIncome, budget.totalExpense,
    budget.surplus, sentToSavings, sentToEmergency, carryoverOut, now, note || ''
  ]]);

  if (success) {
    repo.clearCache('MonthlyBudgets');
    // Update fund balances for savings + emergency
    if (sentToSavings > 0) {
      const funds = repo.cachedRead('Funds');
      const savFund = funds.find(r => r[0] === 'f_savings');
      if (savFund) {
        repo.updateRow('Funds', 0, 'f_savings', 4, Number(savFund[4]) + sentToSavings);
        repo.clearCache('Funds');
      }
    }
    if (sentToEmergency > 0) {
      const funds = repo.cachedRead('Funds');
      const emgFund = funds.find(r => r[0] === 'f_emergency');
      if (emgFund) {
        repo.updateRow('Funds', 0, 'f_emergency', 4, Number(emgFund[4]) + sentToEmergency);
        repo.clearCache('Funds');
      }
    }
    return { success: true, carryoverOut };
  }
  return { success: false };
}

function getMonthlyHistory() {
  const repo = new SheetRepository();
  const records = repo.cachedRead('MonthlyBudgets');
  return records.map(r => ({
    month:          r[0],
    carryoverIn:    Number(r[1]),
    totalIncome:    Number(r[2]),
    totalExpense:   Number(r[3]),
    surplus:        Number(r[4]),
    sentToSavings:  Number(r[5]),
    sentToEmergency: Number(r[6]),
    carryoverOut:   Number(r[7]),
    closedAt:       r[8],
    note:           r[9]
  })).sort((a, b) => b.month.localeCompare(a.month));
}

function getCurrentCarryover() {
  const repo = new SheetRepository();
  const prevMonth = getPrevMonth_(new Date().toISOString().substring(0, 7));
  const records = repo.cachedRead('MonthlyBudgets');
  const prev = records.find(r => r[0] === prevMonth);
  return prev ? Number(prev[7]) : 0;
}

function getPrevMonth_(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return d.toISOString().substring(0, 7);
}

// ═══════════════════════════════════════════════════════════════
// RECURRING TEMPLATES APIs
// Sheet: RecurringTemplates
// Cols: id | name | type | categoryId | walletId | fundId
//       | defaultAmount | dayOfMonth | budgetMonthOffset
//       | icon | color | isActive | lastAppliedMonth
// ═══════════════════════════════════════════════════════════════

function getRecurringTemplates() {
  const repo = new SheetRepository();
  const data = repo.cachedRead('RecurringTemplates');
  return data.map(r => ({
    id:                 r[0],
    name:               r[1],
    type:               r[2],
    categoryId:         r[3],
    walletId:           r[4],
    fundId:             r[5],
    defaultAmount:      Number(r[6]),
    dayOfMonth:         Number(r[7]),
    budgetMonthOffset:  Number(r[8] || 0),
    icon:               r[9],
    color:              r[10],
    isActive:           r[11] !== false && r[11] !== 'false',
    lastAppliedMonth:   r[12] || ''
  }));
}

function addRecurringTemplate(name, type, categoryId, walletId, fundId,
                               defaultAmount, dayOfMonth, budgetMonthOffset,
                               icon, color) {
  const repo = new SheetRepository();
  const id = 'rt_' + Utilities.getUuid().replace(/-/g, '').substring(0, 8);
  const success = repo.safeWrite('RecurringTemplates', [[
    id, name, type, categoryId, walletId, fundId || '',
    Number(defaultAmount), Number(dayOfMonth), Number(budgetMonthOffset || 0),
    icon || '📋', color || '#6366f1', true, ''
  ]]);
  if (success) repo.clearCache('RecurringTemplates');
  return success ? id : null;
}

function updateRecurringTemplate(id, name, defaultAmount, dayOfMonth, budgetMonthOffset, isActive) {
  const repo = new SheetRepository();
  const data = repo.cachedRead('RecurringTemplates');
  const idx = data.findIndex(r => r[0] === id);
  if (idx === -1) return false;

  const row = data[idx];
  const sheet = repo.ss.getSheetByName('RecurringTemplates');
  const sheetRow = idx + 2; // +1 header, +1 1-indexed

  if (name !== undefined)               sheet.getRange(sheetRow, 2).setValue(name);
  if (defaultAmount !== undefined)      sheet.getRange(sheetRow, 7).setValue(Number(defaultAmount));
  if (dayOfMonth !== undefined)         sheet.getRange(sheetRow, 8).setValue(Number(dayOfMonth));
  if (budgetMonthOffset !== undefined)  sheet.getRange(sheetRow, 9).setValue(Number(budgetMonthOffset));
  if (isActive !== undefined)           sheet.getRange(sheetRow, 12).setValue(isActive);

  repo.clearCache('RecurringTemplates');
  return true;
}

function deleteRecurringTemplate(id) {
  const repo = new SheetRepository();
  const sheet = repo.ss.getSheetByName('RecurringTemplates');
  if (!sheet) return false;
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === id) { sheet.deleteRow(i + 1); break; }
  }
  repo.clearCache('RecurringTemplates');
  return true;
}

function applyTemplate(templateId, amount, date, note) {
  const repo = new SheetRepository();
  const templates = repo.cachedRead('RecurringTemplates');
  const tmpl = templates.find(r => r[0] === templateId);
  if (!tmpl) return false;

  const name       = tmpl[1];
  const type       = tmpl[2];
  const categoryId = tmpl[3];
  const walletId   = tmpl[4];
  const fundId     = tmpl[5] || (type === 'Income' ? 'f_chung' : '');
  const appliedNote = note || name;

  // Create actual transaction
  const txResult = addTransaction(walletId, categoryId, Number(amount), type, date, appliedNote, fundId);

  if (txResult) {
    // Mark template as applied this month
    const currentMonth = date.substring(0, 7);
    const sheet = repo.ss.getSheetByName('RecurringTemplates');
    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === templateId) {
        sheet.getRange(i + 1, 13).setValue(currentMonth);
        break;
      }
    }
    repo.clearCache('RecurringTemplates');
    return true;
  }
  return false;
}

