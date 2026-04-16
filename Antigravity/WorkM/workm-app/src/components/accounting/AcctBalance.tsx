import { useState, useMemo } from 'react'
import { cn } from '../../utils/cn'
import { getItem, setItem } from '../../utils/storage'
import { formatNumber } from '../../utils/format'
import {
  Building2, CreditCard, Landmark, Copy, Save,
  CheckCircle, AlertCircle, ChevronDown, RotateCcw,
} from 'lucide-react'

interface Account {
  code: string
  name: string
  type: string
  group?: string
}

interface OpeningBalance {
  year: number
  accountCode: string
  amount: number
}

const GROUPS = [
  { key: 'asset', label: '자산', sublabel: 'Assets', icon: Building2, color: '#4f6ef7', gradient: 'from-[#4f6ef7] to-[#6366f1]' },
  { key: 'liability', label: '부채', sublabel: 'Liabilities', icon: CreditCard, color: '#ef4444', gradient: 'from-[#ef4444] to-[#dc2626]' },
  { key: 'equity', label: '자본', sublabel: 'Equity', icon: Landmark, color: '#8b5cf6', gradient: 'from-[#8b5cf6] to-[#7c3aed]' },
]

export function AcctBalance({ year }: { year: number }) {
  const [refresh, setRefresh] = useState(0)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    asset: true, liability: true, equity: true,
  })

  const accounts = useMemo(
    () => getItem<Account[]>('acct_accounts', []),
    [refresh],
  )
  const balances = useMemo(
    () => getItem<OpeningBalance[]>('acct_opening_balances', []).filter(b => b.year === year),
    [year, refresh],
  )

  const [localAmounts, setLocalAmounts] = useState<Record<string, string>>({})

  const getDisplayAmt = (code: string) => {
    if (localAmounts[code] !== undefined) return localAmounts[code]
    const bal = balances.find(b => b.accountCode === code)
    return bal && bal.amount > 0 ? formatNumber(bal.amount) : ''
  }

  const getNumericAmt = (code: string) => {
    const display = getDisplayAmt(code)
    return parseInt((display || '0').replace(/,/g, '')) || 0
  }

  const handleInput = (code: string, val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setLocalAmounts(prev => ({
      ...prev,
      [code]: digits ? Number(digits).toLocaleString('ko-KR') : '',
    }))
  }

  const calcGroupTotal = (type: string) => {
    return accounts.filter(a => a.type === type).reduce((sum, a) => sum + getNumericAmt(a.code), 0)
  }

  const assetTotal = calcGroupTotal('asset')
  const liabilityTotal = calcGroupTotal('liability')
  const equityTotal = calcGroupTotal('equity')
  const balanced = assetTotal === (liabilityTotal + equityTotal)
  const diff = assetTotal - liabilityTotal - equityTotal

  const saveAll = () => {
    const others = getItem<OpeningBalance[]>('acct_opening_balances', []).filter(b => b.year !== year)
    const newBalances: OpeningBalance[] = []
    accounts.forEach(a => {
      if (!['asset', 'liability', 'equity'].includes(a.type)) return
      const amt = getNumericAmt(a.code)
      if (amt > 0) newBalances.push({ year, accountCode: a.code, amount: amt })
    })
    setItem('acct_opening_balances', [...others, ...newBalances])
    setLocalAmounts({})
    setRefresh(r => r + 1)
    alert(`${year}년도 기초잔액이 저장되었습니다`)
  }

  const copyPrevYear = () => {
    const prevBalances = getItem<OpeningBalance[]>('acct_opening_balances', []).filter(b => b.year === year - 1)
    if (prevBalances.length === 0) {
      alert(`${year - 1}년도 기초잔액 데이터가 없습니다`)
      return
    }
    const newLocal: Record<string, string> = {}
    prevBalances.forEach(pb => {
      if (pb.amount > 0) newLocal[pb.accountCode] = formatNumber(pb.amount)
    })
    setLocalAmounts(newLocal)
    alert(`${year - 1}년도 잔액이 복사되었습니다. 저장 버튼을 눌러 확정하세요.`)
  }

  const resetAll = () => {
    if (!confirm('입력한 모든 금액을 초기화하시겠습니까?')) return
    setLocalAmounts({})
  }

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-5">
      {/* ── 헤더 ── */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-lg font-extrabold">기초잔액 설정</div>
            <div className="text-[12px] opacity-80 mt-0.5">
              {year}년도 회계연도 시작 시 전기이월 잔액을 설정합니다
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 border border-white/30 text-[12px] font-bold hover:bg-white/25 transition-all cursor-pointer"
            >
              <RotateCcw size={12} /> 초기화
            </button>
            <button
              onClick={copyPrevYear}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 border border-white/30 text-[12px] font-bold hover:bg-white/25 transition-all cursor-pointer"
            >
              <Copy size={12} /> {year - 1}년 복사
            </button>
            <button
              onClick={saveAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#4f6ef7] text-[12px] font-extrabold hover:bg-white/90 transition-all cursor-pointer shadow-md"
            >
              <Save size={13} /> 저장
            </button>
          </div>
        </div>

        {/* ── 대차균형 ── */}
        <div className="mt-4 bg-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 md:gap-6 flex-wrap">
              <div>
                <div className="text-[10px] font-semibold opacity-70 mb-0.5">자산 합계</div>
                <div className="text-xl font-extrabold">{formatNumber(assetTotal)}<span className="text-sm ml-0.5">원</span></div>
              </div>
              <div className="text-2xl font-light opacity-50">=</div>
              <div>
                <div className="text-[10px] font-semibold opacity-70 mb-0.5">부채 합계</div>
                <div className="text-xl font-extrabold">{formatNumber(liabilityTotal)}<span className="text-sm ml-0.5">원</span></div>
              </div>
              <div className="text-2xl font-light opacity-50">+</div>
              <div>
                <div className="text-[10px] font-semibold opacity-70 mb-0.5">자본 합계</div>
                <div className="text-xl font-extrabold">{formatNumber(equityTotal)}<span className="text-sm ml-0.5">원</span></div>
              </div>
            </div>
            <div
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold',
                balanced
                  ? 'bg-[rgba(34,197,94,.25)] border border-[rgba(34,197,94,.4)]'
                  : 'bg-[rgba(239,68,68,.25)] border border-[rgba(239,68,68,.4)]',
              )}
            >
              {balanced ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {balanced
                ? '대차 균형 일치'
                : `불균형 ${diff > 0 ? '+' : ''}${formatNumber(diff)}원`}
            </div>
          </div>
        </div>
      </div>

      {/* ── 그룹별 테이블 ── */}
      {accounts.filter(a => ['asset', 'liability', 'equity'].includes(a.type)).length === 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-10 text-center">
          <div className="text-3xl mb-2">🏦</div>
          <div className="text-sm font-bold text-[var(--text-primary)] mb-1">등록된 계정과목이 없습니다</div>
          <div className="text-[12px] text-[var(--text-muted)]">
            설정 {'>'} 계정과목 관리에서 먼저 계정과목을 등록해주세요
          </div>
        </div>
      )}
      {GROUPS.map(g => {
        const groupAccts = accounts.filter(a => a.type === g.key)
        if (groupAccts.length === 0) return null
        const groupTotal = groupAccts.reduce((sum, a) => sum + getNumericAmt(a.code), 0)
        const Icon = g.icon
        const expanded = expandedGroups[g.key]

        // group 기준 소분류
        const subGroups: Record<string, Account[]> = {}
        groupAccts.forEach(a => {
          const sg = a.group || '기타'
          if (!subGroups[sg]) subGroups[sg] = []
          subGroups[sg].push(a)
        })

        return (
          <div key={g.key} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            {/* 그룹 헤더 */}
            <button
              onClick={() => toggleGroup(g.key)}
              className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-[var(--bg-muted)] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${g.gradient} flex items-center justify-center shadow-sm`}
                >
                  <Icon size={16} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-extrabold text-[var(--text-primary)]">{g.label}</span>
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">{g.sublabel}</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">{groupAccts.length}개 계정</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[16px] font-extrabold" style={{ color: g.color }}>
                  {formatNumber(groupTotal)}<span className="text-[12px] ml-0.5">원</span>
                </span>
                <ChevronDown
                  size={18}
                  className={cn(
                    'text-[var(--text-muted)] transition-transform duration-200',
                    expanded ? 'rotate-180' : '',
                  )}
                />
              </div>
            </button>

            {/* 그룹 본문 */}
            {expanded && (
              <div className="border-t border-[var(--border-default)]">
                {Object.entries(subGroups).map(([sgName, sgAccts]) => (
                  <div key={sgName}>
                    {/* 소분류 헤더 */}
                    {Object.keys(subGroups).length > 1 && (
                      <div className="px-5 py-1.5 bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                        <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wide">{sgName}</span>
                      </div>
                    )}
                    {/* 계정 행 */}
                    {sgAccts.map((a, idx) => {
                      const amt = getNumericAmt(a.code)
                      return (
                        <div
                          key={a.code}
                          className={cn(
                            'flex items-center px-5 py-2.5 hover:bg-[var(--bg-muted)] transition-colors',
                            idx < sgAccts.length - 1 ? 'border-b border-[var(--border-default)]' : '',
                          )}
                        >
                          {/* 코드 */}
                          <div className="w-[70px] shrink-0">
                            <span className="text-[12px] font-mono font-semibold text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded">
                              {a.code}
                            </span>
                          </div>
                          {/* 과목명 */}
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-bold text-[var(--text-primary)]">{a.name}</span>
                          </div>
                          {/* 금액 입력 */}
                          <div className="w-[160px] shrink-0">
                            <div className="relative">
                              <input
                                type="text"
                                value={getDisplayAmt(a.code)}
                                onChange={e => handleInput(a.code, e.target.value)}
                                className={cn(
                                  'w-full text-right text-[13px] font-bold py-2 pl-3 pr-8 rounded-lg border bg-[var(--bg-surface)] outline-none transition-all',
                                  amt > 0
                                    ? 'border-[var(--border-strong)] text-[var(--text-primary)]'
                                    : 'border-[var(--border-default)] text-[var(--text-muted)]',
                                  'focus:border-primary-500 focus:ring-1 focus:ring-primary-200',
                                )}
                                placeholder="0"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-muted)] font-medium pointer-events-none">
                                원
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
                {/* 소계 */}
                <div className="flex items-center justify-end px-5 py-3 border-t-2" style={{ borderColor: g.color }}>
                  <span className="text-[12px] font-bold text-[var(--text-muted)] mr-3">{g.label} 소계</span>
                  <span className="text-[15px] font-extrabold" style={{ color: g.color }}>
                    {formatNumber(groupTotal)}<span className="text-[11px] ml-0.5">원</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
