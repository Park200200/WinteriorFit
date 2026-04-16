import { useState, useMemo } from 'react'
import { cn } from '../../utils/cn'
import { getItem } from '../../utils/storage'
import { formatNumber } from '../../utils/format'
import { EmptyState } from '../common/EmptyState'
import {
  Scale, TrendingUp, Table, Banknote, Building2,
  Printer, CheckCircle,
} from 'lucide-react'

interface Account {
  code: string; name: string; type: string; group?: string
}
interface Voucher {
  id: string | number; type?: string; date?: string; description?: string
  counterpart?: string; paymentMethod?: string
  entries?: { side: string; amount: number; accountCode: string }[]
}
interface OpeningBalance {
  year: number; accountCode: string; amount: number
}

const REPORT_TABS = [
  { key: 'bs', label: '대차대조표', icon: Scale },
  { key: 'is', label: '손익계산서', icon: TrendingUp },
  { key: 'tb', label: '합계잔액시산표', icon: Table },
  { key: 'cb', label: '현금출납장', icon: Banknote },
  { key: 'al', label: '거래처원장', icon: Building2 },
]

function calcEndBalance(code: string, type: string, vouchers: Voucher[], balances: OpeningBalance[]) {
  const ob = balances.find(b => b.accountCode === code)
  const opening = ob ? ob.amount || 0 : 0
  let debitSum = 0, creditSum = 0
  vouchers.forEach(v => {
    ;(v.entries || []).forEach(e => {
      if (e.accountCode === code) {
        if (e.side === 'debit') debitSum += e.amount
        else creditSum += e.amount
      }
    })
  })
  if (type === 'asset' || type === 'expense') return opening + debitSum - creditSum
  return opening + creditSum - debitSum
}

export function AcctReports({ year }: { year: number }) {
  const [activeTab, setActiveTab] = useState('bs')

  const accounts = useMemo(() => getItem<Account[]>('acct_accounts', []), [])
  const vouchers = useMemo(() => {
    const all = getItem<Voucher[]>('acct_vouchers', [])
    return all.filter(v => v.date && parseInt(v.date.substring(0, 4)) === year)
  }, [year])
  const balances = useMemo(() => {
    return getItem<OpeningBalance[]>('acct_opening_balances', []).filter(b => b.year === year)
  }, [year])

  return (
    <div className="space-y-4">
      {/* ── 헤더 ── */}
      <div>
        <div className="text-base font-extrabold text-[var(--text-primary)]">회계현황보기</div>
        <div className="text-[11px] text-[var(--text-muted)]">{year}년도 재무제표 및 장부를 조회합니다</div>
      </div>

      {/* ── 탭바 ── */}
      <div className="w-full overflow-hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' as any, scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
          {REPORT_TABS.map(t => {
            const Icon = t.icon
            const active = activeTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap cursor-pointer transition-all border shrink-0',
                  active
                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                    : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]',
                )}
              >
                <Icon size={13} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 본문 ── */}
      {activeTab === 'bs' && <BalanceSheet accounts={accounts} vouchers={vouchers} balances={balances} year={year} />}
      {activeTab === 'is' && <IncomeStatement accounts={accounts} vouchers={vouchers} year={year} />}
      {activeTab === 'tb' && <TrialBalance accounts={accounts} vouchers={vouchers} balances={balances} year={year} />}
      {activeTab === 'cb' && <CashBook vouchers={vouchers} balances={balances} year={year} />}
      {activeTab === 'al' && <AccountLedger vouchers={vouchers} year={year} />}
    </div>
  )
}

/* ═══════════════════════════════════════════
   1. 대차대조표
   ═══════════════════════════════════════════ */
function BalanceSheet({ accounts, vouchers, balances, year }: { accounts: Account[]; vouchers: Voucher[]; balances: OpeningBalance[]; year: number }) {
  const sections = [
    { label: '자산', color: '#4f6ef7', type: 'asset' },
    { label: '부채', color: '#ef4444', type: 'liability' },
    { label: '자본', color: '#8b5cf6', type: 'equity' },
  ]

  // 당기순이익
  const revAccts = accounts.filter(a => a.type === 'revenue')
  const expAccts = accounts.filter(a => a.type === 'expense')
  let netIncome = 0
  revAccts.forEach(a => { netIncome += calcEndBalance(a.code, 'revenue', vouchers, []) })
  expAccts.forEach(a => { netIncome -= calcEndBalance(a.code, 'expense', vouchers, []) })

  const totals: Record<string, number> = {}

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-primary-500" />
          <span className="text-sm font-extrabold text-[var(--text-primary)]">대차대조표</span>
          <span className="text-[12px] text-[var(--text-muted)]">{year}.12.31 기준</span>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-muted)] hover:border-primary-400 cursor-pointer">
          <Printer size={12} /> 인쇄
        </button>
      </div>

      {sections.map(s => {
        const accts = accounts.filter(a => a.type === s.type)
        let sectionTotal = 0
        const rows = accts.map(a => {
          let bal = calcEndBalance(a.code, s.type, vouchers, balances)
          if (a.code === '3020') bal += netIncome
          if (bal === 0) return null
          sectionTotal += bal
          return (
            <tr key={a.code} className="border-b border-[var(--border-default)] last:border-0">
              <td className="py-2 px-3.5 text-[13px] text-[var(--text-muted)]">{a.code}</td>
              <td className="py-2 px-3.5 text-[13px] font-semibold text-[var(--text-primary)]">{a.name}</td>
              <td className="py-2 px-3.5 text-[13px] font-semibold text-right">{formatNumber(bal)}원</td>
            </tr>
          )
        }).filter(Boolean)
        totals[s.type] = sectionTotal

        return (
          <div key={s.type}>
            <div className="flex items-center gap-1.5 px-3.5 py-1 text-[13px] font-extrabold" style={{ color: s.color }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: s.color }} />
              {s.label}
            </div>
            <table className="w-full">
              <colgroup><col className="w-[90px]" /><col /><col className="w-[150px]" /></colgroup>
              <tbody>
                {rows}
                <tr style={{ borderTop: `2px solid ${s.color}` }}>
                  <td colSpan={2} className="py-2 px-3.5 text-[13px] font-extrabold text-right">{s.label} 합계</td>
                  <td className="py-2 px-3.5 text-[14px] font-extrabold text-right" style={{ color: s.color }}>{formatNumber(sectionTotal)}원</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      })}

      {/* 균형 확인 */}
      {(() => {
        const assetT = totals.asset || 0
        const liabEqT = (totals.liability || 0) + (totals.equity || 0)
        const ok = assetT === liabEqT
        return (
          <div className={cn(
            'flex items-center justify-between p-3 rounded-xl border',
            ok ? 'bg-[rgba(34,197,94,.06)] border-[rgba(34,197,94,.2)]' : 'bg-[rgba(239,68,68,.06)] border-[rgba(239,68,68,.2)]',
          )}>
            <div className="flex items-center gap-4">
              <span className="text-[13px] font-bold">자산: {formatNumber(assetT)}원</span>
              <span className="text-[var(--text-muted)]">=</span>
              <span className="text-[13px] font-bold">부채+자본: {formatNumber(liabEqT)}원</span>
            </div>
            <span className="text-[12px] font-bold" style={{ color: ok ? '#22c55e' : '#ef4444' }}>
              {ok ? '✅ 균형' : '❌ 불균형'}
            </span>
          </div>
        )
      })()}
    </div>
  )
}

/* ═══════════════════════════════════════════
   2. 손익계산서
   ═══════════════════════════════════════════ */
function IncomeStatement({ accounts, vouchers, year }: { accounts: Account[]; vouchers: Voucher[]; year: number }) {
  const render = (type: string, label: string, color: string) => {
    const accts = accounts.filter(a => a.type === type)
    let total = 0
    const rows = accts.map(a => {
      const amt = calcEndBalance(a.code, type, vouchers, [])
      if (amt === 0) return null
      total += amt
      return (
        <tr key={a.code} className="border-b border-[var(--border-default)] last:border-0">
          <td className="py-2 px-3.5 text-[13px] text-[var(--text-muted)]">{a.code}</td>
          <td className="py-2 px-3.5 text-[13px] font-semibold">{a.name}</td>
          <td className="py-2 px-3.5 text-[13px] font-semibold text-right" style={{ color }}>{formatNumber(amt)}원</td>
        </tr>
      )
    }).filter(Boolean)

    return { rows, total }
  }

  const rev = render('revenue', '수익', '#22c55e')
  const exp = render('expense', '비용', '#ef4444')
  const netIncome = rev.total - exp.total
  const isProfit = netIncome >= 0

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-primary-500" />
          <span className="text-sm font-extrabold">손익계산서</span>
          <span className="text-[12px] text-[var(--text-muted)]">{year}.01.01 ~ {year}.12.31</span>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-muted)] cursor-pointer">
          <Printer size={12} /> 인쇄
        </button>
      </div>

      {/* 수익 */}
      <div className="flex items-center gap-1.5 px-3.5 text-[13px] font-extrabold text-[#22c55e]">
        <span className="w-2 h-2 rounded-full bg-[#22c55e]" /> 수익
      </div>
      <table className="w-full">
        <colgroup><col className="w-[90px]" /><col /><col className="w-[150px]" /></colgroup>
        <tbody>
          {rev.rows}
          <tr style={{ borderTop: '2px solid #22c55e' }}>
            <td colSpan={2} className="py-2 px-3.5 text-[13px] font-extrabold text-right">수익 합계</td>
            <td className="py-2 px-3.5 text-[14px] font-extrabold text-right text-[#22c55e]">{formatNumber(rev.total)}원</td>
          </tr>
        </tbody>
      </table>

      {/* 비용 */}
      <div className="flex items-center gap-1.5 px-3.5 text-[13px] font-extrabold text-[#ef4444]">
        <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> 비용
      </div>
      <table className="w-full">
        <colgroup><col className="w-[90px]" /><col /><col className="w-[150px]" /></colgroup>
        <tbody>
          {exp.rows}
          <tr style={{ borderTop: '2px solid #ef4444' }}>
            <td colSpan={2} className="py-2 px-3.5 text-[13px] font-extrabold text-right">비용 합계</td>
            <td className="py-2 px-3.5 text-[14px] font-extrabold text-right text-[#ef4444]">{formatNumber(exp.total)}원</td>
          </tr>
        </tbody>
      </table>

      {/* 당기순이익 */}
      <div className={cn(
        'flex items-center justify-between p-3.5 rounded-xl border',
        isProfit ? 'bg-[rgba(34,197,94,.06)] border-[rgba(34,197,94,.2)]' : 'bg-[rgba(239,68,68,.06)] border-[rgba(239,68,68,.2)]',
      )}>
        <span className="text-[14px] font-extrabold">당기순{isProfit ? '이익' : '손실'}</span>
        <span className="text-[18px] font-extrabold" style={{ color: isProfit ? '#22c55e' : '#ef4444' }}>
          {formatNumber(Math.abs(netIncome))}원
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   3. 합계잔액시산표
   ═══════════════════════════════════════════ */
function TrialBalance({ accounts, vouchers, balances, year }: { accounts: Account[]; vouchers: Voucher[]; balances: OpeningBalance[]; year: number }) {
  const TYPE_COLORS: Record<string, string> = { asset: '#4f6ef7', liability: '#ef4444', equity: '#8b5cf6', expense: '#f59e0b', revenue: '#22c55e' }

  const tbRows: { code: string; name: string; type: string; dr: number; cr: number; bDr: number; bCr: number }[] = []
  let totalDr = 0, totalCr = 0, balDr = 0, balCr = 0

  accounts.forEach(a => {
    let dr = 0, cr = 0
    const ob = balances.find(b => b.accountCode === a.code)
    if (ob) {
      if (a.type === 'asset' || a.type === 'expense') dr += ob.amount || 0
      else cr += ob.amount || 0
    }
    vouchers.forEach(v => {
      ;(v.entries || []).forEach(e => {
        if (e.accountCode === a.code) {
          if (e.side === 'debit') dr += e.amount; else cr += e.amount
        }
      })
    })
    if (dr === 0 && cr === 0) return
    totalDr += dr; totalCr += cr
    const diff = dr - cr
    const bD = diff > 0 ? diff : 0
    const bC = diff < 0 ? -diff : 0
    balDr += bD; balCr += bC
    tbRows.push({ code: a.code, name: a.name, type: a.type, dr, cr, bDr: bD, bCr: bC })
  })

  const ok = totalDr === totalCr

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table size={16} className="text-primary-500" />
          <span className="text-sm font-extrabold">합계잔액시산표</span>
          <span className="text-[12px] text-[var(--text-muted)]">{year}년도</span>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-muted)] cursor-pointer">
          <Printer size={12} /> 인쇄
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-[var(--bg-muted)] border-b-2 border-[var(--border-default)]">
              <th className="py-2.5 px-2.5 text-left text-[12px] font-semibold text-[var(--text-muted)]" rowSpan={2}>코드</th>
              <th className="py-2.5 px-2.5 text-left text-[12px] font-semibold text-[var(--text-muted)]" rowSpan={2}>계정과목</th>
              <th colSpan={2} className="py-1.5 px-2.5 text-center text-[12px] font-semibold text-[var(--text-muted)] border-b border-[var(--border-default)]">합계</th>
              <th colSpan={2} className="py-1.5 px-2.5 text-center text-[12px] font-semibold text-[var(--text-muted)] border-b border-[var(--border-default)]">잔액</th>
            </tr>
            <tr className="bg-[var(--bg-muted)]">
              <th className="py-1.5 px-2.5 text-right text-[11px]">차변</th>
              <th className="py-1.5 px-2.5 text-right text-[11px]">대변</th>
              <th className="py-1.5 px-2.5 text-right text-[11px]">차변</th>
              <th className="py-1.5 px-2.5 text-right text-[11px]">대변</th>
            </tr>
          </thead>
          <tbody>
            {tbRows.map(r => (
              <tr key={r.code} className="border-b border-[var(--border-default)]">
                <td className="py-2 px-2.5 text-[12px] text-[var(--text-muted)]">{r.code}</td>
                <td className="py-2 px-2.5 text-[12.5px] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TYPE_COLORS[r.type] || '#64748b' }} />
                    {r.name}
                  </span>
                </td>
                <td className="py-2 px-2.5 text-right text-[12.5px] whitespace-nowrap">{r.dr ? formatNumber(r.dr) + '원' : ''}</td>
                <td className="py-2 px-2.5 text-right text-[12.5px] whitespace-nowrap">{r.cr ? formatNumber(r.cr) + '원' : ''}</td>
                <td className="py-2 px-2.5 text-right text-[12.5px] font-semibold text-[#4f6ef7] whitespace-nowrap">{r.bDr ? formatNumber(r.bDr) + '원' : ''}</td>
                <td className="py-2 px-2.5 text-right text-[12.5px] font-semibold text-[#ef4444] whitespace-nowrap">{r.bCr ? formatNumber(r.bCr) + '원' : ''}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-[var(--text-primary)] bg-[var(--bg-muted)]">
              <td colSpan={2} className="py-2.5 px-2.5 text-center text-[13px] font-extrabold">합 계</td>
              <td className="py-2.5 px-2.5 text-right text-[13px] font-extrabold whitespace-nowrap">{formatNumber(totalDr)}원</td>
              <td className="py-2.5 px-2.5 text-right text-[13px] font-extrabold whitespace-nowrap">{formatNumber(totalCr)}원</td>
              <td className="py-2.5 px-2.5 text-right text-[13px] font-extrabold text-[#4f6ef7] whitespace-nowrap">{formatNumber(balDr)}원</td>
              <td className="py-2.5 px-2.5 text-right text-[13px] font-extrabold text-[#ef4444] whitespace-nowrap">{formatNumber(balCr)}원</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={cn(
        'text-center py-2 rounded-lg text-[12px] font-bold border',
        ok ? 'bg-[rgba(34,197,94,.06)] text-[#22c55e] border-[rgba(34,197,94,.2)]' : 'bg-[rgba(239,68,68,.06)] text-[#ef4444] border-[rgba(239,68,68,.2)]',
      )}>
        {ok ? '✅ 차변합계 = 대변합계 (균형)' : `❌ 불균형 (차액: ${formatNumber(totalDr - totalCr)}원)`}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   4. 현금출납장
   ═══════════════════════════════════════════ */
function CashBook({ vouchers, balances, year }: { vouchers: Voucher[]; balances: OpeningBalance[]; year: number }) {
  const ob = balances.find(b => b.accountCode === '1010')
  const openBal = ob ? ob.amount : 0
  let runBal = openBal

  const cashTxns: { date: string; desc: string; side: string; amount: number }[] = []
  vouchers.forEach(v => {
    ;(v.entries || []).forEach(e => {
      if (e.accountCode === '1010') {
        cashTxns.push({ date: v.date || '', desc: v.description || '', side: e.side, amount: e.amount })
      }
    })
  })
  cashTxns.sort((a, b) => a.date.localeCompare(b.date))

  let totalIn = 0, totalOut = 0

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote size={16} className="text-primary-500" />
          <span className="text-sm font-extrabold">현금출납장</span>
          <span className="text-[12px] text-[var(--text-muted)]">{year}년도</span>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-muted)] cursor-pointer">
          <Printer size={12} /> 인쇄
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[550px]">
          <thead>
            <tr className="bg-[var(--bg-muted)] border-b-2 border-[var(--border-default)]">
              {['날짜', '적요', '입금', '출금', '잔액'].map(h => (
                <th key={h} className={cn('py-2.5 px-2.5 text-[12px] font-semibold text-[var(--text-muted)]', h === '날짜' || h === '적요' ? 'text-left' : 'text-right')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 기초잔액 행 */}
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-muted)]">
              <td className="py-2 px-2.5 text-[12.5px] font-bold">{year}-01-01</td>
              <td className="py-2 px-2.5 text-[12.5px] font-bold text-[var(--text-muted)]">기초잔액</td>
              <td></td><td></td>
              <td className="py-2 px-2.5 text-right text-[12.5px] font-bold">{formatNumber(openBal)}원</td>
            </tr>
            {cashTxns.map((tx, i) => {
              const inAmt = tx.side === 'debit' ? tx.amount : 0
              const outAmt = tx.side === 'credit' ? tx.amount : 0
              totalIn += inAmt; totalOut += outAmt
              runBal += inAmt - outAmt
              return (
                <tr key={i} className="border-b border-[var(--border-default)]">
                  <td className="py-2 px-2.5 text-[12px] text-[var(--text-muted)]">{tx.date}</td>
                  <td className="py-2 px-2.5 text-[12.5px]">{tx.desc}</td>
                  <td className="py-2 px-2.5 text-right text-[12.5px] text-[#22c55e] font-semibold">{inAmt ? formatNumber(inAmt) + '원' : ''}</td>
                  <td className="py-2 px-2.5 text-right text-[12.5px] text-[#ef4444] font-semibold whitespace-nowrap">{outAmt ? formatNumber(outAmt) + '원' : ''}</td>
                  <td className="py-2 px-2.5 text-right text-[12.5px] font-bold">{formatNumber(runBal)}원</td>
                </tr>
              )
            })}
            <tr className="border-t-2 border-[var(--text-primary)] bg-[var(--bg-muted)]">
              <td colSpan={2} className="py-2.5 px-2.5 text-center text-[13px] font-extrabold">합계</td>
              <td className="py-2.5 px-2.5 text-right text-[13px] font-extrabold text-[#22c55e]">{formatNumber(totalIn)}원</td>
              <td className="py-2.5 px-2.5 text-right text-[13px] font-extrabold text-[#ef4444]">{formatNumber(totalOut)}원</td>
              <td className="py-2.5 px-2.5 text-right text-[14px] font-extrabold">{formatNumber(runBal)}원</td>
            </tr>
          </tbody>
        </table>
      </div>

      {cashTxns.length === 0 && (
        <EmptyState emoji="💰" title="현금 거래 내역이 없습니다" />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   5. 거래처원장
   ═══════════════════════════════════════════ */
function AccountLedger({ vouchers, year }: { vouchers: Voucher[]; year: number }) {
  const byCounterpart: Record<string, Voucher[]> = {}
  vouchers.forEach(v => {
    const cp = v.counterpart || '(미지정)'
    if (!byCounterpart[cp]) byCounterpart[cp] = []
    byCounterpart[cp].push(v)
  })

  const cpNames = Object.keys(byCounterpart).sort()

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-primary-500" />
          <span className="text-sm font-extrabold">거래처원장</span>
          <span className="text-[12px] text-[var(--text-muted)]">{year}년도</span>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-muted)] cursor-pointer">
          <Printer size={12} /> 인쇄
        </button>
      </div>

      {cpNames.length === 0 ? (
        <EmptyState emoji="🏢" title="거래처 데이터가 없습니다" />
      ) : (
        cpNames.map(cp => {
          const txns = byCounterpart[cp].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
          let cpDr = 0, cpCr = 0

          return (
            <div key={cp} className="border border-[var(--border-default)] rounded-xl overflow-hidden">
              {/* 거래처 헤더 */}
              <div className="bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-900/10 px-4 py-3 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary-500 text-white text-sm font-extrabold flex items-center justify-center">
                  {cp.charAt(0)}
                </span>
                <div>
                  <div className="text-[15px] font-extrabold text-[var(--text-primary)]">{cp}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{txns.length}건 거래</div>
                </div>
              </div>

              {/* 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                      {['날짜', '적요', '차변', '대변'].map(h => (
                        <th key={h} className={cn('py-2 px-2.5 text-[11px] font-semibold text-[var(--text-muted)]', h === '날짜' || h === '적요' ? 'text-left' : 'text-right')}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((v, i) => {
                      let dr = 0, cr = 0
                      ;(v.entries || []).forEach(e => {
                        if (e.side === 'debit') dr += e.amount; else cr += e.amount
                      })
                      cpDr += dr; cpCr += cr
                      return (
                        <tr key={i} className="border-b border-[var(--border-default)]">
                          <td className="py-2 px-2.5 text-[12px] text-[var(--text-muted)]">{v.date || ''}</td>
                          <td className="py-2 px-2.5 text-[12px]">{v.description || ''}</td>
                          <td className="py-2 px-2.5 text-right text-[12px] font-semibold text-[#4f6ef7]">{dr ? formatNumber(dr) + '원' : ''}</td>
                          <td className="py-2 px-2.5 text-right text-[12px] font-semibold text-[#ef4444]">{cr ? formatNumber(cr) + '원' : ''}</td>
                        </tr>
                      )
                    })}
                    <tr className="border-t-2 border-[var(--text-primary)] bg-[var(--bg-muted)]">
                      <td colSpan={2} className="py-2 px-2.5 text-right text-[12px] font-bold">소계</td>
                      <td className="py-2 px-2.5 text-right text-[12px] font-bold text-[#4f6ef7]">{formatNumber(cpDr)}원</td>
                      <td className="py-2 px-2.5 text-right text-[12px] font-bold text-[#ef4444]">{formatNumber(cpCr)}원</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
