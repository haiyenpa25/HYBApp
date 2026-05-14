const TELEGRAM_TOKEN = '8754044143:AAEa6ruqx0iWeiH0wToGNwhdvgBmLKIIHHc';

// BƯỚC 1: Dán đường liên kết Ứng dụng Web của bạn vào đây.
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbylU9Z3zzj2iSMx-xi-K9yxmShVzgGLMM1FgloYlq6mDq2yShzOWPhHfSKDIXx88djU/exec';

/**
 * Chạy hàm này bằng tay trong trình soạn thảo GAS để liên kết Bot với Web App
 */
function setWebhook() {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${encodeURIComponent(WEB_APP_URL)}`;
  const response = UrlFetchApp.fetch(url);
  Logger.log("✅ KẾT QUẢ TỪ TELEGRAM: " + response.getContentText());
}

function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const options = {
    method: 'post',
    payload: {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    }
  };
  UrlFetchApp.fetch(url, options);
}

function handleTelegramMessage(text) {
  if (!text) return "Tôi không hiểu tin nhắn này.";
  text = text.trim();
  
  // 1. Phân tích lệnh Tạo Task: /task Mua đồ ăn 2026-05-10
  if (text.startsWith('/task ')) {
    const parts = text.substring(6).split(' ');
    let dateStr = new Date().toISOString().split('T')[0]; // Mặc định hôm nay
    let title = text.substring(6);
    
    // Tìm ngày ở cuối câu
    const lastWord = parts[parts.length - 1];
    if (lastWord.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateStr = lastWord;
      title = parts.slice(0, -1).join(' ');
    }
    
    const success = addTask(title, dateStr);
    return success ? `✅ <b>Đã thêm công việc:</b>\n${title}\n<i>Deadline: ${dateStr}</i>` : `❌ Lỗi khi thêm công việc.`;
  }
  
  // 2. Thử dùng Gemini AI nếu có cấu hình API Key
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (apiKey && !text.startsWith('/')) {
    const aiResult = processWithGemini(text, apiKey);
    if (aiResult && aiResult.intent !== "UNKNOWN" && aiResult.amount) {
      const type = aiResult.intent === 'INCOME' ? 'Income' : 'Expense';
      const amount = aiResult.amount;
      const note = aiResult.note || text;
      
      const categories = getCategories();
      let detectedCategory = categories[0];
      if (aiResult.category_keyword) {
        const kw = aiResult.category_keyword.toLowerCase();
        for (let c of categories) {
          if (c.type === type && c.name.toLowerCase().includes(kw)) {
            detectedCategory = c;
            break;
          }
        }
      }
      
      const wallets = getWallets();
      if (wallets.length === 0) addWallet('Ví tiền mặt', 'Cash', 0);
      const defaultWallet = getWallets()[0].id;
      const today = new Date().toISOString().split('T')[0];
      
      const success = addTransaction(defaultWallet, detectedCategory.id, amount, type, today, note);
      if (success) {
        const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        return `✨ <b>AI đã xử lý:</b>\n💸 <b>Ghi sổ:</b> ${type==='Income'?'+':'-'}${formattedAmount}\n📁 <b>Danh mục:</b> ${detectedCategory.icon} ${detectedCategory.name}\n📝 <b>Ghi chú:</b> ${note}`;
      }
    }
  }

  // 3. Phân tích Thu Chi bằng Regex (Dự phòng)
  const expenseRegex = /^([-+]?)(\d+)(k|m|tr|)\s+(.+)$/i;
  const match = text.match(expenseRegex);
  
  if (match) {
    const sign = match[1] === '+' ? 1 : -1;
    let amountRaw = parseInt(match[2], 10);
    const unit = match[3].toLowerCase();
    
    if (unit === 'k') amountRaw *= 1000;
    else if (unit === 'm' || unit === 'tr') amountRaw *= 1000000;
    
    const amount = amountRaw; 
    const note = match[4].trim();
    
    const categories = getCategories();
    let detectedCategory = categories[0]; 
    let isIncome = sign === 1; 
    const lowerNote = note.toLowerCase();
    
    if (!match[1]) { 
      if (lowerNote.includes('lương') || lowerNote.includes('thưởng')) {
        isIncome = true;
      } else {
        isIncome = false; 
      }
    }
    
    const type = isIncome ? 'Income' : 'Expense';
    
    for (let c of categories) {
      if (c.type === type && lowerNote.includes(c.name.toLowerCase())) {
        detectedCategory = c;
        break;
      }
    }
    
    const wallets = getWallets();
    if (wallets.length === 0) addWallet('Ví tiền mặt', 'Cash', 0);
    const defaultWallet = getWallets()[0].id;
    const today = new Date().toISOString().split('T')[0];
    
    const success = addTransaction(defaultWallet, detectedCategory.id, amount, type, today, note);
    
    if (success) {
      const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
      return `💸 <b>Đã ghi sổ:</b> ${sign === 1 || isIncome ? '+' : '-'}${formattedAmount}\n📁 <b>Danh mục:</b> ${detectedCategory.icon} ${detectedCategory.name}\n📝 <b>Ghi chú:</b> ${note}`;
    } else {
      return `❌ Lỗi khi ghi sổ.`;
    }
  }

  // Help menu
  return `🤖 <b>Lệnh không hợp lệ.</b>\nHướng dẫn sử dụng:\n\n📌 <b>1. Quản lý công việc:</b>\n/task [Nội dung] [YYYY-MM-DD]\n<i>VD: /task Nộp báo cáo 2026-05-10</i>\n\n💸 <b>2. Quản lý chi tiêu (AI hỗ trợ):</b>\nChỉ cần chat tự nhiên: <i>Hôm nay mời crush đi lẩu hết 500 cành</i>\nHoặc dùng cú pháp gốc: <i>-50k ăn sáng phở</i>`;
}

function processWithGemini(text, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const prompt = `
Bạn là trợ lý tài chính. Người dùng nhắn: "${text}".
Hãy phân tích và trả về ĐÚNG 1 CHUỖI JSON DUY NHẤT, không có markdown, không bọc bởi \`\`\`json, không có chữ nào khác ngoài JSON:
{
  "intent": "EXPENSE" hoặc "INCOME" hoặc "UNKNOWN",
  "amount": số tiền thực tế (chỉ ghi số, vd: 50k là 50000, 1 củ/tr là 1000000),
  "note": "ghi chú ngắn gọn",
  "category_keyword": "từ khóa phân loại ngắn (vd: ăn uống, mua sắm, lương)"
}
  `;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    if (!result.candidates) return null;
    let aiText = result.candidates[0].content.parts[0].text;
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(aiText);
  } catch (e) {
    Logger.log("Gemini Error: " + e);
    return null;
  }
}

// --- BÁO CÁO TỰ ĐỘNG ---

function sendWeeklyReport() {
  const chatId = PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID');
  if (!chatId) return;

  const wallets = getWallets();
  const transactions = getTransactions();
  
  // Calculate Date Range (Last 7 days)
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  
  const todayStr = today.toISOString().split('T')[0];
  const lastWeekStr = lastWeek.toISOString().split('T')[0];

  const recentTx = transactions.filter(t => t.date >= lastWeekStr && t.date <= todayStr);
  
  const income = recentTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = recentTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const netFlow = income - expense;

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

  const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  let message = `📊 <b>BÁO CÁO TÀI CHÍNH TUẦN</b> 📊\n`;
  message += `<i>Từ ${lastWeekStr} đến ${todayStr}</i>\n\n`;
  message += `📈 <b>Thu nhập:</b> +${formatMoney(income)}\n`;
  message += `📉 <b>Chi tiêu:</b> -${formatMoney(expense)}\n`;
  message += `⚖️ <b>Dòng tiền thuần:</b> ${netFlow >= 0 ? '+' : ''}${formatMoney(netFlow)}\n\n`;
  message += `💰 <b>Tổng số dư hiện tại:</b> ${formatMoney(totalBalance)}\n`;
  
  // Optional: add wallet breakdown
  if (wallets.length > 0) {
    message += `\n<i>Chi tiết các Ví:</i>\n`;
    wallets.forEach(w => {
      message += `- ${w.name}: ${formatMoney(w.balance || 0)}\n`;
    });
  }

  message += `\nChúc bạn một tuần mới tràn đầy năng lượng! 🚀`;

  sendTelegramMessage(chatId, message);
}

function toggleWeeklyReport(enabled) {
  // First, delete existing triggers named 'sendWeeklyReport'
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendWeeklyReport') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  if (enabled) {
    // Create new trigger: Run every week on Sunday at 20:00 (8 PM)
    ScriptApp.newTrigger('sendWeeklyReport')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.SUNDAY)
      .atHour(20)
      .create();
    
    // Save status
    PropertiesService.getScriptProperties().setProperty('WEEKLY_REPORT_ENABLED', 'true');
  } else {
    PropertiesService.getScriptProperties().setProperty('WEEKLY_REPORT_ENABLED', 'false');
  }

  return true;
}

function getWeeklyReportStatus() {
  return PropertiesService.getScriptProperties().getProperty('WEEKLY_REPORT_ENABLED') === 'true';
}
