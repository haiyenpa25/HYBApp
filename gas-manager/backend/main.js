/**
 * Entry point for Web App
 */
function doGet(e) {
  // Admin trigger: ?action=seed  (xóa sau khi dùng)
  if (e && e.parameter && e.parameter.action === 'seed') {
    const result = seedCategories('reset');
    return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.TEXT);
  }

  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Manager - Tasks & Expenses')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Entry point for Web App POST requests (Telegram Webhook)
 */
function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    if (contents.message) {
      const chatId = contents.message.chat.id;
      const text = contents.message.text;
      
      // Save chat ID for cron jobs
      PropertiesService.getScriptProperties().setProperty('TELEGRAM_CHAT_ID', chatId.toString());
      
      const replyText = handleTelegramMessage(text);
      sendTelegramMessage(chatId, replyText);
    }
    return ContentService.createTextOutput('OK');
  } catch (error) {
    console.error(error);
    return ContentService.createTextOutput('Error');
  }
}

// --- PHASE 11: DATABASE SEEDER ---

function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const schema = {
    'Wallets': ['ID', 'Name', 'Type', 'Balance'],
    'Categories': ['ID', 'Name', 'Type', 'Icon', 'Color'],
    'Transactions': ['ID', 'WalletID', 'CategoryID', 'Amount', 'Type', 'Date', 'Note', 'FundID', 'DebtID'],
    'Tasks': ['ID', 'Title', 'Status', 'Date', 'EventID', 'CalendarID', 'Priority', 'Subtasks', 'NoteID'],
    'Goals': ['ID', 'Title', 'TargetAmount', 'CurrentAmount', 'Icon', 'Color'],
    'Habits': ['ID', 'Title', 'Icon', 'Color', 'Streak', 'LastCheckedDate', 'History'],
    'UserStats': ['ID', 'EXP', 'Level', 'Title'],
    'Notes': ['ID', 'Title', 'Content', 'LastEdited'],
    'Budgets': ['ID', 'CategoryID', 'Amount', 'Month'],
    'Funds': ['ID', 'Name', 'DefaultPercentage', 'Balance', 'Icon', 'Color'],
    'Debts': ['ID', 'PersonName', 'Type', 'PrincipalAmount', 'InterestRate', 'PaidAmount', 'Date', 'DueDate', 'Status'],
    'Stocks': ['Ticker', 'Quantity', 'AveragePrice', 'CurrentPrice', 'LastUpdated'],
    'StockTransactions': ['ID', 'Ticker', 'Type', 'Quantity', 'Price', 'Fee', 'Tax', 'Date', 'WalletID', 'FundID', 'Note']
  };

  for (const [sheetName, headers] of Object.entries(schema)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Set headers
    const range = sheet.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
    range.setFontWeight('bold');
    
    // Freeze top row
    sheet.setFrozenRows(1);
    
    Logger.log(`Initialized sheet: ${sheetName}`);
  }
  
  Logger.log("✅ Database initialized successfully!");
}

// --- PHASE 7: TỰ ĐỘNG HÓA (CRON JOBS) ---

function setupDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let t of triggers) {
    if (t.getHandlerFunction() === 'sendDailyReport') {
      ScriptApp.deleteTrigger(t);
    }
  }
  
  ScriptApp.newTrigger('sendDailyReport')
    .timeBased()
    .atHour(7)
    .everyDays(1)
    .create();
    
  Logger.log("✅ Đã cài đặt tự động gửi báo cáo 7h sáng!");
}

function sendDailyReport() {
  const chatId = PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID');
  if (!chatId) return;
  
  const tasks = getTasks();
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === today && t.status !== 'DONE');
  
  const habits = getHabits();
  
  let report = `☀️ <b>CHÀO BUỔI SÁNG CHỦ TỊCH!</b>\n\n`;
  if (todayTasks.length > 0) {
    report += `📌 <b>Bạn có ${todayTasks.length} công việc cần hoàn thành hôm nay:</b>\n`;
    todayTasks.forEach((t, idx) => report += `${idx+1}. ${t.title}\n`);
  } else {
    report += `📌 Hôm nay không có lịch trình công việc nào!\n`;
  }
  
  report += `\n🔄 <b>Đừng quên duy trì thói quen:</b>\n`;
  habits.forEach(h => {
    report += `${h.icon} ${h.title} (Chuỗi: ${h.streak} ngày)\n`;
  });
  
  report += `\n<i>Chúc bạn một ngày làm việc hiệu quả!</i>`;
  
  sendTelegramMessage(chatId, report);
}
