const ICONS = ['💼','💰','⚡','🏠','🚗','📱','🏥','🎓','🛒','💊','🎵','✈️','🍔','☕','🎮','💻']


interface FormState {
  name: string; type: 'Income' | 'Expense'
  categoryId: string; walletId: string; fundId: string
  defaultAmount: string; dayOfMonth: string
  budgetMonthOffset: string; icon: string; color: string
}
interface Props {
  form: FormState
  setForm: (updater: (prev: FormState) => FormState) => void
  categories: any[]; wallets: any[]; funds: any[]
  isEdit: boolean
}

export default function TemplateForm({ form, setForm, categories, wallets, funds, isEdit }: Props) {
  const filteredCats = categories.filter(c => c.type === form.type && !c.parentId)
  const f = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="p-5 space-y-4 overflow-y-auto flex-1">
      {!isEdit && (
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(['Income', 'Expense'] as const).map(t => (
            <button key={t} onClick={() => f('type', t)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${form.type === t ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-500'} ${t === 'Income' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {t === 'Income' ? '💰 Thu nhập' : '💸 Chi tiêu'}
            </button>
          ))}
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tên mẫu</label>
        <input autoFocus type="text" value={form.name} onChange={e => f('name', e.target.value)}
          placeholder={form.type === 'Income' ? 'VD: Lương Grand Daisy' : 'VD: Tiền điện EVN'}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm" />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số tiền mặc định</label>
          <input type="number" value={form.defaultAmount} onChange={e => f('defaultAmount', e.target.value)}
            placeholder="0" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold dark:text-white text-sm" />
        </div>
        <div className="w-24">
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ngày T</label>
          <input type="number" min={1} max={31} value={form.dayOfMonth} onChange={e => f('dayOfMonth', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-center font-bold dark:text-white text-sm" />
        </div>
      </div>

      {!isEdit && (
        <>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Danh mục</label>
            <select value={form.categoryId} onChange={e => f('categoryId', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm">
              <option value="">-- Chọn danh mục --</option>
              {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ví</label>
            <select value={form.walletId} onChange={e => f('walletId', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm">
              <option value="">-- Chọn ví --</option>
              {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          {form.type === 'Expense' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Quỹ (tùy chọn)</label>
              <select value={form.fundId} onChange={e => f('fundId', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm">
                <option value="">-- Không chọn --</option>
                {funds.map(fd => <option key={fd.id} value={fd.id}>{fd.icon} {fd.name}</option>)}
              </select>
            </div>
          )}
        </>
      )}

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tính vào ngân sách</label>
        <div className="flex gap-2">
          {[{ val: '0', label: 'Tháng này' }, { val: '1', label: 'Tháng sau (+1)' }].map(opt => (
            <button key={opt.val} onClick={() => f('budgetMonthOffset', opt.val)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${form.budgetMonthOffset === opt.val ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        {form.budgetMonthOffset === '1' && (
          <p className="text-xs text-indigo-500 mt-1.5 font-medium">ℹ️ Ghi ngày thực tế, NS tính vào tháng sau. Phù hợp cho lương cuối tháng.</p>
        )}
      </div>

      {!isEdit && (
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(ic => (
              <button key={ic} onClick={() => f('icon', ic)}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${form.icon === ic ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 scale-110' : 'bg-slate-100 dark:bg-slate-800 hover:scale-105'}`}>
                {ic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
