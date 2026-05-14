// =============================================================
// GAS API RUNNER — Generic wrapper cho google.script.run
// Tính đa hình: 1 hàm xử lý MỌI loại API call
// Open/Closed: Thêm API mới không cần sửa runner này
// =============================================================

declare var google: any

const isLocal = typeof google === 'undefined' || typeof google.script === 'undefined'

/**
 * Generic GAS runner — áp dụng tính đa hình qua generics
 * Thay thế boilerplate lặp lại trong mỗi API method
 */
export function gasRun<T>(
  fnName: string,
  args: unknown[] = [],
  localMock?: T | (() => T),
  mockDelay = 400
): Promise<T> {
  if (isLocal) {
    return new Promise(resolve =>
      setTimeout(() => {
        const mock = typeof localMock === 'function'
          ? (localMock as () => T)()
          : (localMock as T)
        resolve(mock ?? (true as unknown as T))
      }, mockDelay)
    )
  }
  return new Promise((resolve, reject) => {
    const runner = google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
    runner[fnName](...args)
  })
}
