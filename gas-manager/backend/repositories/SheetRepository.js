/**
 * Repository Pattern for Google Sheets
 * Uses Batch Operations, LockService and CacheService
 */
class SheetRepository {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  /**
   * Safe write operation using LockService to prevent race conditions
   */
  safeWrite(sheetName, data) {
    const lock = LockService.getScriptLock();
    try {
      // Wait for up to 5 seconds for other processes to finish
      lock.waitLock(5000);
      const sheet = this.ss.getSheetByName(sheetName) || this.ss.insertSheet(sheetName);
      if (data.length > 0) {
        // Batch operation: Write all data at once
        sheet.getRange(sheet.getLastRow() + 1, 1, data.length, data[0].length).setValues(data);
      }
      return true;
    } catch (e) {
      console.error('Lock failed or write error:', e);
      return false;
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Cached read operation using CacheService and Batch Operations
   */
  cachedRead(sheetName) {
    const cache = CacheService.getScriptCache();
    const cacheKey = `data_${sheetName}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) return [];

    // Batch operation: Read all data at once
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Remove header row
    if (values.length > 0) values.shift();

    cache.put(cacheKey, JSON.stringify(values), 300); // Cache for 5 mins
    return values;
  }
  
  clearCache(sheetName) {
    const cache = CacheService.getScriptCache();
    cache.remove(`data_${sheetName}`);
  }

  updateRow(sheetName, idColumnIndex, idValue, columnIndexToUpdate, newValue) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(5000);
      const sheet = this.ss.getSheetByName(sheetName);
      if (!sheet) return null;
      
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][idColumnIndex] === idValue) {
          // Row is i + 1 (1-indexed)
          sheet.getRange(i + 1, columnIndexToUpdate + 1).setValue(newValue);
          return data[i]; // Return the row data
        }
      }
      return null;
    } catch (e) {
      console.error('Update failed:', e);
      return null;
    } finally {
      lock.releaseLock();
    }
  }

  updateFullRow(sheetName, idColumnIndex, idValue, newRowData) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(5000);
      const sheet = this.ss.getSheetByName(sheetName);
      if (!sheet) return false;
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][idColumnIndex] === idValue) {
          sheet.getRange(i + 1, 1, 1, newRowData.length).setValues([newRowData]);
          return true;
        }
      }
      return false;
    } catch(e) {
      console.error('Full update failed:', e);
      return false;
    } finally {
      lock.releaseLock();
    }
  }

  deleteRow(sheetName, idColumnIndex, idValue) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(5000);
      const sheet = this.ss.getSheetByName(sheetName);
      if (!sheet) return false;
      
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][idColumnIndex] === idValue) {
          sheet.deleteRow(i + 1);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Delete failed:', e);
      return false;
    } finally {
      lock.releaseLock();
    }
  }
}
