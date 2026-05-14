import { useState, useEffect } from 'react'
import { server } from '../utils/gas'
import { TrendingUp, TrendingDown, Plus, X, Activity } from 'lucide-react'

export default function WealthDashboard({ reloadData, isPrivacyMode }: { reloadData: () => void, isPrivacyMode: boolean }) {
  const [loading, setLoading] = useState(false)
  const [wallets, setWallets] = useState<any[]>([])
  const [debts, setDebts] = useState<any[]>([])
  const [stocks, setStocks] = useState<any[]>([])
  
  const [showStockModal, setShowStockModal] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [selectedTicker, setSelectedTicker] = useState('')
  const [stockForm, setStockForm] = useState({
    ticker: '', type: 'BUY', quantity: 0, price: 0, fee: 0, tax: 0, date: new Date().toISOString().split('T')[0], walletId: '', fundId: '', note: ''
  })

  const loadData = async () => {
    setLoading(true)
    const [w, d, s] = await Promise.all([
      server.getWallets(),
      server.getDebts(),
      server.getStocks()
    ])
    setWallets(w)
    setDebts(d)
    setStocks(s)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatMoney = (val: number) => {
    if (isPrivacyMode) return '***,*** ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Calculate Net Worth
  const totalWallets = wallets.reduce((acc, w) => acc + Number(w.balance), 0)
  
  // Debts: type LEND is receivable (people owe us), type BORROW is payable (we owe people)
  // Bug #3 Fix: status is 'PAID' not 'DONE'
  const totalReceivables = debts.filter(d => d.type === 'LEND' && d.status !== 'PAID')
    .reduce((acc, d) => acc + (Number(d.principalAmount) - Number(d.paidAmount)), 0)
    
  const totalPayables = debts.filter(d => d.type === 'BORROW' && d.status !== 'PAID')
    .reduce((acc, d) => acc + (Number(d.principalAmount) - Number(d.paidAmount)), 0)

  // Stocks Value
  const totalStocksValue = stocks.reduce((acc, s) => acc + (Number(s.quantity) * Number(s.currentPrice)), 0)
  const totalStocksCost = stocks.reduce((acc, s) => acc + (Number(s.quantity) * Number(s.averagePrice)), 0)
  const stockPL = totalStocksValue - totalStocksCost

  const netWorth = totalWallets + totalReceivables + totalStocksValue - totalPayables

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { ticker, type, quantity, price, fee, tax, date, walletId, fundId, note } = stockForm
    await server.addStockTransaction(ticker.toUpperCase(), type, Number(quantity), Number(price), Number(fee), Number(tax), date, walletId, fundId, note)
    setShowStockModal(false)
    setStockForm({ ticker: '', type: 'BUY', quantity: 0, price: 0, fee: 0, tax: 0, date: new Date().toISOString().split('T')[0], walletId: '', fundId: '', note: '' })
    await loadData()
    reloadData()
  }

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const newPrice = Number((e.target as any).newPrice.value)
    await server.updateStockPrice(selectedTicker, newPrice)
    setShowPriceModal(false)
    await loadData()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      )}

      {/* Net Worth Summary */}
      <div className="glass-panel p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h2 className="text-white/80 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
            <TrendingUp size={16} /> Tài sản ròng (Net Worth)
          </h2>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-4xl md:text-5xl font-black tracking-tight">{formatMoney(netWorth)}</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
            <div>
              <p className="text-white/60 text-xs font-semibold mb-1 uppercase tracking-wider">Tiền mặt & Ví</p>
              <p className="font-bold text-lg">{formatMoney(totalWallets)}</p>
            </div>
            <div>
              <p className="text-emerald-400/80 text-xs font-semibold mb-1 uppercase tracking-wider">Người ta nợ</p>
              <p className="font-bold text-lg text-emerald-400">+{formatMoney(totalReceivables)}</p>
            </div>
            <div>
              <p className="text-rose-400/80 text-xs font-semibold mb-1 uppercase tracking-wider">Nợ phải trả</p>
              <p className="font-bold text-lg text-rose-400">-{formatMoney(totalPayables)}</p>
            </div>
            <div>
              <p className="text-blue-400/80 text-xs font-semibold mb-1 uppercase tracking-wider">Chứng khoán</p>
              <p className="font-bold text-lg text-blue-400">{formatMoney(totalStocksValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Portfolio */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
            <Activity size={20} className="text-primary-500" /> Danh mục Chứng khoán
          </h3>
          <button onClick={() => setShowStockModal(true)} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            <Plus size={16} /> Thêm Giao dịch
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-full mb-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng P/L</div>
            <div className={`text-xl font-black ${stockPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stockPL >= 0 ? '+' : ''}{formatMoney(stockPL)}
            </div>
          </div>

          {stocks.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400">
              <p>Chưa có cổ phiếu nào trong danh mục.</p>
            </div>
          ) : stocks.filter(s => Number(s.quantity) > 0).map(stock => {
            const val = Number(stock.quantity) * Number(stock.currentPrice);
            const cost = Number(stock.quantity) * Number(stock.averagePrice);
            const pl = val - cost;
            const plPercent = cost > 0 ? (pl / cost) * 100 : 0;
            const isProfit = pl >= 0;

            return (
              <div key={stock.ticker} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-2xl text-slate-800 dark:text-white">{stock.ticker}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stock.quantity} cổ phiếu</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${isProfit ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                    {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(plPercent).toFixed(2)}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Giá vốn</span>
                    <span className="font-semibold dark:text-slate-200">{formatMoney(stock.averagePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500 dark:text-slate-400">Giá thị trường</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary-600 dark:text-primary-400">{formatMoney(stock.currentPrice)}</span>
                      <button onClick={() => { setSelectedTicker(stock.ticker); setShowPriceModal(true); }} className="text-[10px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-300 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Cập nhật</button>
                    </div>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Đánh giá</span>
                    <span className={`font-black ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isProfit ? '+' : ''}{formatMoney(pl)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stock Transaction Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h2 className="text-xl font-bold dark:text-white">Ghi nhận Giao dịch Chứng khoán</h2>
              <button onClick={() => setShowStockModal(false)} className="hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-xl transition-colors dark:text-slate-400"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Mã CP (Ticker)</label>
                  <input required type="text" value={stockForm.ticker} onChange={e=>setStockForm({...stockForm, ticker: e.target.value.toUpperCase()})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-primary-500 dark:text-white uppercase font-black" placeholder="VD: HPG" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Loại Giao dịch</label>
                  <select value={stockForm.type} onChange={e=>setStockForm({...stockForm, type: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white font-bold">
                    <option value="BUY">Mua</option>
                    <option value="SELL">Bán</option>
                    <option value="DIVIDEND_CASH">Cổ tức (Tiền)</option>
                    <option value="DIVIDEND_STOCK">Cổ tức (Cổ phiếu)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Khối lượng</label>
                  <input required type="number" min="1" value={stockForm.quantity || ''} onChange={e=>setStockForm({...stockForm, quantity: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Đơn giá (VND)</label>
                  <input required={stockForm.type !== 'DIVIDEND_STOCK'} type="number" value={stockForm.price || ''} onChange={e=>setStockForm({...stockForm, price: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Phí GD (VND)</label>
                  <input type="number" value={stockForm.fee || ''} onChange={e=>setStockForm({...stockForm, fee: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Thuế (VND)</label>
                  <input type="number" value={stockForm.tax || ''} onChange={e=>setStockForm({...stockForm, tax: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                <p className="text-xs text-slate-500 mb-2 font-semibold">Tùy chọn ghi nhận dòng tiền (Sẽ được xử lý thủ công qua màn Hình Chi Tiêu nếu cần)</p>
                {/* Normally we'd auto-deduct from Wallet here, but for simplicity we just note it or let user manually enter an Expense transaction later, OR we can build the logic here if needed. We'll leave it as a Note for now. */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ghi chú</label>
                  <input type="text" value={stockForm.note} onChange={e=>setStockForm({...stockForm, note: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" placeholder="VD: Trừ tiền từ thẻ VCB..." />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-xl font-black text-lg transition-colors">Lưu Giao dịch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Price Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[110] flex items-center justify-center backdrop-blur-sm">
          <form onSubmit={handleUpdatePrice} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-[90%] max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-4 dark:text-white">Cập nhật giá {selectedTicker}</h3>
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Giá thị trường mới (VND)</label>
              <input required name="newPrice" type="number" defaultValue={stocks.find(s => s.ticker === selectedTicker)?.currentPrice || 0} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white font-bold text-lg" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowPriceModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Hủy</button>
              <button type="submit" className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-bold">Lưu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
