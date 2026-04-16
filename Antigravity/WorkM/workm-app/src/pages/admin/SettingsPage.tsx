import { useState, useRef } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { useSettingsStore } from '../../stores/settingsStore'
import { useToastStore } from '../../stores/toastStore'
import { cn } from '../../utils/cn'
import { getItem } from '../../utils/storage'
import {
  Building2, Medal, Briefcase, ListChecks, FileText, Layers,
  Plus, Pencil, Trash2, GripVertical, Calculator, Wallet, CreditCard,
} from 'lucide-react'
import { ICON_MAP, renderIcon } from '../../utils/iconMap'

const ICON_COLORS = [
  '#22c55e','#06b6d4','#9747ff','#ef4444','#f59e0b','#4f6ef7',
  '#8b5cf6','#ec4899','#6b7280','#14b8a6','#3b82f6','#dc2626',
  '#0ea5e9','#f43f5e','#a855f7','#10b981','#6366f1','#0284c7',
  '#ea580c','#16a34a',
]
const ICON_KEYS = Object.keys(ICON_MAP)

/* ── 탭 정의 ── */
interface Tab {
  key: string
  label: string
  icon: React.ElementType
  color: string
}

const tabs: Tab[] = [
  { key: 'dept',       label: '부서',                icon: Building2,  color: '#4f6ef7' },
  { key: 'rank',       label: '직급',                icon: Medal,      color: '#9747ff' },
  { key: 'position',   label: '직책',                icon: Briefcase,  color: '#f59e0b' },
  { key: 'result',     label: '예상결과물', icon: ListChecks, color: '#22c55e' },
  { key: 'reportType', label: '진행절차',        icon: FileText,   color: '#8b5cf6' },
  { key: 'detailTask', label: '상세업무',             icon: Layers,     color: '#4f6ef7' },
  { key: 'importance', label: '중요도',          icon: Building2,  color: '#ef4444' },
  { key: 'taskStatus', label: '진행상태',             icon: Layers,     color: '#06b6d4' },
  { key: 'accounts',   label: '계정과목',             icon: Calculator, color: '#0ea5e9' },
  { key: 'budgetItems',label: '예산목',               icon: Wallet,     color: '#f97316' },
  { key: 'payMethods', label: '지출수단',             icon: CreditCard, color: '#ec4899' },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('dept')
  const tabRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

  const onPointerDown = (e: React.PointerEvent) => {
    const el = tabRef.current; if (!el) return
    // 버튼 클릭은 드래그로 처리하지 않음
    if ((e.target as HTMLElement).closest('button')) return
    dragState.current = { isDown: true, startX: e.clientX, scrollLeft: el.scrollLeft }
    el.setPointerCapture(e.pointerId)
    el.style.cursor = 'grabbing'
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.isDown) return
    const el = tabRef.current; if (!el) return
    const dx = e.clientX - dragState.current.startX
    el.scrollLeft = dragState.current.scrollLeft - dx
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragState.current.isDown) return
    dragState.current.isDown = false
    const el = tabRef.current; if (!el) return
    el.releasePointerCapture(e.pointerId)
    el.style.cursor = 'grab'
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader title="기타설정" subtitle="직급관리 및 기타 관리 항목을 설정합니다" />

      {/* 탭 바 — 모바일: 드래그 스크롤, 데스크탑: 래핑 */}
      <div
        ref={tabRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="flex gap-1.5 mb-5 overflow-x-auto pb-2 -mx-1 px-1 md:flex-wrap select-none scrollbar-hide"
        style={{ cursor: 'grab', WebkitOverflowScrolling: 'touch' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap',
                'transition-all duration-150 cursor-pointer shrink-0',
                isActive
                  ? 'bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)]',
              )}
            >
              <Icon size={15} style={isActive ? { color: tab.color } : undefined} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'dept'       && <DeptPanel />}
      {activeTab === 'rank'       && <RankPanel />}
      {activeTab === 'position'   && <PositionPanel />}
      {activeTab === 'result'     && <ResultPanel />}
      {activeTab === 'reportType' && <ReportTypePanel />}
      {activeTab === 'detailTask' && <DetailTaskPanel />}
      {activeTab === 'importance' && <ImportancePanel />}
      {activeTab === 'taskStatus' && <TaskStatusPanel />}
      {activeTab === 'accounts' && <AccountPanel />}
      {activeTab === 'budgetItems' && <BudgetItemPanel />}
      {activeTab === 'payMethods' && <PaymentMethodPanel />}
    </div>
  )
}

/* ══════════════════════════════════════════════
   부서 패널
   ══════════════════════════════════════════════ */
function DeptPanel() {
  const { departments, addDept, updateDept, deleteDept, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="부서"
      items={departments.map(d => ({ id: d.id, name: d.name }))}
      onAdd={(name) => addDept(name)}
      onUpdate={(id, name) => updateDept(id, name)}
      onDelete={deleteDept}
      onReorder={(ids) => reorderItems('departments', ids)}
      placeholder="새 부서명 입력"
      color="#4f6ef7"
    />
  )
}

function RankPanel() {
  const { ranks, addRank, updateRank, deleteRank, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="직급"
      items={ranks.map(r => ({ id: r.id, name: r.name }))}
      onAdd={(name) => addRank(name)}
      onUpdate={(id, name) => updateRank(id, name)}
      onDelete={deleteRank}
      onReorder={(ids) => reorderItems('ranks', ids)}
      placeholder="새 직급명 입력"
      color="#f59e0b"
    />
  )
}

function PositionPanel() {
  const { positions, addPos, updatePos, deletePos, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="직책"
      items={positions.map(p => ({ id: p.id, name: p.name }))}
      onAdd={(name) => addPos(name)}
      onUpdate={(id, name) => updatePos(id, name)}
      onDelete={deletePos}
      onReorder={(ids) => reorderItems('positions', ids)}
      placeholder="새 직책명 입력"
      color="#22c55e"
    />
  )
}

function ResultPanel() {
  const { taskResults, addResult, updateResult, deleteResult, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="예상결과물"
      items={taskResults.map(r => ({ id: r.id, name: r.name, icon: r.icon }))}
      onAdd={(name, icon) => addResult(name, icon)}
      onUpdate={(id, name, icon) => updateResult(id, name, icon)}
      onDelete={deleteResult}
      onReorder={(ids) => reorderItems('taskResults', ids)}
      placeholder="새 예상결과물 입력"
      color="#9747ff"
      showIcon
    />
  )
}

function ReportTypePanel() {
  const { reportTypes, addReportType, updateReportType, deleteReportType, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="진행절차"
      items={reportTypes.map(r => ({ id: r.id, name: r.label, icon: r.icon }))}
      onAdd={(name, icon) => addReportType(name, icon || 'circle', '#4f6ef7')}
      onUpdate={(id, name, icon) => updateReportType(id, name, icon || 'circle', '#4f6ef7')}
      onDelete={deleteReportType}
      onReorder={(ids) => reorderItems('reportTypes', ids)}
      placeholder="새 진행절차 입력"
      color="#06b6d4"
      showIcon
    />
  )
}

function DetailTaskPanel() {
  const { detailTasks, addDetailTask, updateDetailTask, deleteDetailTask, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="상세업무"
      items={detailTasks.map(d => ({ id: d.id, name: d.name }))}
      onAdd={(name) => addDetailTask(name)}
      onUpdate={(id, name) => updateDetailTask(id, name)}
      onDelete={deleteDetailTask}
      onReorder={(ids) => reorderItems('detailTasks', ids)}
      placeholder="새 상세업무 입력"
      color="#4f6ef7"
    />
  )
}

function ImportancePanel() {
  const { instrImportances, addImportance, updateImportance, deleteImportance, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="중요도"
      items={instrImportances.map(i => ({ id: i.id, name: i.name, icon: i.icon }))}
      onAdd={(name, icon) => addImportance(name, icon)}
      onUpdate={(id, name, icon) => updateImportance(id, name, icon)}
      onDelete={deleteImportance}
      onReorder={(ids) => reorderItems('instrImportances', ids)}
      placeholder="새 중요도 입력"
      color="#ef4444"
      showIcon
    />
  )
}

function TaskStatusPanel() {
  const { taskStatuses, addTaskStatus, updateTaskStatus, deleteTaskStatus, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="진행상태"
      items={taskStatuses.map(t => ({ id: t.id, name: t.name, icon: t.icon }))}
      onAdd={(name, icon) => addTaskStatus(name, icon || 'activity', '#06b6d4')}
      onUpdate={(id, name, icon) => updateTaskStatus(id, name, icon || 'activity', '#06b6d4')}
      onDelete={deleteTaskStatus}
      onReorder={(ids) => reorderItems('taskStatuses', ids)}
      placeholder="새 진행상태 입력 (예: 진행중)"
      color="#06b6d4"
      showIcon
    />
  )
}

/* ══════════════════════════════════════════════
   재사용 가능한 CRUD 리스트
   ══════════════════════════════════════════════ */
interface CrudItem { id: number; name: string; icon?: string; color?: string }

interface CrudListPanelProps {
  title: string
  items: CrudItem[]
  onAdd: (name: string, icon?: string) => void
  onUpdate: (id: number, name: string, icon?: string) => void
  onDelete: (id: number) => void
  onReorder?: (ids: number[]) => void
  placeholder: string
  color: string
  showIcon?: boolean
}

function CrudListPanel({ title, items, onAdd, onUpdate, onDelete, onReorder, placeholder, color, showIcon }: CrudListPanelProps) {
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<CrudItem | null>(null)
  const addToast = useToastStore((s) => s.add)
  const inputRef = useRef<HTMLInputElement>(null)

  // 드래그 상태
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd(newName.trim(), showIcon ? newIcon || undefined : undefined)
    setNewName('')
    setNewIcon('')
    addToast('success', `"${newName.trim()}" 추가 완료`)
    inputRef.current?.focus()
  }

  const handleUpdate = () => {
    if (editId === null || !editName.trim()) return
    onUpdate(editId, editName.trim(), showIcon ? editIcon || undefined : undefined)
    setEditId(null)
    setEditName('')
    setEditIcon('')
    addToast('info', '항목이 수정되었습니다')
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    onDelete(deleteTarget.id)
    setDeleteTarget(null)
    addToast('warning', `"${deleteTarget.name}" 삭제 완료`)
  }

  const handleDragStart = (idx: number) => {
    setDragIdx(idx)
  }
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setOverIdx(idx)
  }
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx || !onReorder) return
    const reordered = [...items]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(idx, 0, moved)
    onReorder(reordered.map(i => i.id))
    setDragIdx(null)
    setOverIdx(null)
  }
  const handleDragEnd = () => {
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <>
      <Card>
        {/* 추가 폼 */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            {showIcon && (
              <div
                className="w-[42px] h-[42px] shrink-0 rounded-xl border border-[var(--border-default)] flex items-center justify-center cursor-default"
                style={{ background: newIcon ? `${ICON_COLORS[ICON_KEYS.indexOf(newIcon) % ICON_COLORS.length]}20` : 'var(--bg-muted)', color: newIcon ? ICON_COLORS[ICON_KEYS.indexOf(newIcon) % ICON_COLORS.length] : 'var(--text-muted)' }}
                title="아래에서 아이콘을 선택하세요"
              >
                {renderIcon(newIcon, 18)}
              </div>
            )}
            <div className="flex-1">
              <Input
                ref={inputRef}
                placeholder={placeholder}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <Button onClick={handleAdd} icon={<Plus size={15} />} size="md" className="shrink-0">
              <span className="hidden sm:inline">추가</span>
            </Button>
          </div>

          {/* 아이콘 빠른 선택 */}
          {showIcon && (
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">빠른 아이콘 선택</span>
              <div className="flex flex-wrap gap-1.5">
                {ICON_KEYS.map((key, i) => {
                  const c = ICON_COLORS[i % ICON_COLORS.length]
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewIcon(key)}
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all',
                        newIcon === key
                          ? 'ring-2 ring-primary-500 ring-offset-1 shadow-md scale-110'
                          : 'hover:scale-105 hover:shadow-sm',
                      )}
                      style={{ background: `${c}20`, color: c }}
                      title={key}
                    >
                      {renderIcon(key, 16)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-default)]">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {title} 목록
          </span>
          <span className="text-[11px] font-bold" style={{ color }}>
            {items.length}건
          </span>
        </div>

        {/* 리스트 */}
        {items.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--text-muted)]">
            등록된 {title}이 없습니다
          </div>
        ) : (
          <div className="space-y-0.5">
            {items.map((item, idx) => (
              <div
                key={item.id}
                draggable={!!onReorder}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-muted)] transition-all group',
                  dragIdx === idx && 'opacity-40 scale-95',
                  overIdx === idx && dragIdx !== idx && 'ring-2 ring-primary-300 bg-primary-50/50 dark:bg-primary-900/10',
                )}
              >
                {/* 드래그 핸들 */}
                {onReorder && (
                  <span className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0">
                    <GripVertical size={14} />
                  </span>
                )}

                {/* 순서 번호 */}
                <span className="text-[11px] font-bold text-[var(--text-muted)] w-5 text-center shrink-0">
                  {idx + 1}
                </span>

                {/* 아이콘 */}
                {showIcon && (
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${ICON_COLORS[ICON_KEYS.indexOf(item.icon || '') % ICON_COLORS.length] || '#6b7280'}20`, color: ICON_COLORS[ICON_KEYS.indexOf(item.icon || '') % ICON_COLORS.length] || '#6b7280' }}
                  >
                    {renderIcon(item.icon, 14)}
                  </span>
                )}

                {/* 이름 */}
                <span className="text-sm font-semibold text-[var(--text-primary)] flex-1 truncate">
                  {item.name}
                </span>

                {/* 액션 (데스크탑: hover) */}
                <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditId(item.id); setEditName(item.name); setEditIcon(item.icon || '') }}
                    className="p-1.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500 cursor-pointer transition-colors"
                    title="수정"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* 모바일: 항상 보이는 액션 */}
                <div className="flex items-center gap-1 md:hidden">
                  <button
                    onClick={() => { setEditId(item.id); setEditName(item.name); setEditIcon(item.icon || '') }}
                    className="p-1.5 rounded-md text-[var(--text-muted)] cursor-pointer"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded-md text-danger/60 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 수정 모달 */}
      <Modal
        open={editId !== null}
        onClose={() => setEditId(null)}
        title={`${title} 수정`}
      >
        <ModalBody className="space-y-3">
          <Input
            label={`${title}명`}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            autoFocus
          />
          {showIcon && (
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">아이콘 선택</span>
              <div className="flex flex-wrap gap-1.5">
                {ICON_KEYS.map((key, i) => {
                  const c = ICON_COLORS[i % ICON_COLORS.length]
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditIcon(key)}
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all',
                        editIcon === key
                          ? 'ring-2 ring-primary-500 ring-offset-1 shadow-md scale-110'
                          : 'hover:scale-105 hover:shadow-sm',
                      )}
                      style={{ background: `${c}20`, color: c }}
                      title={key}
                    >
                      {renderIcon(key, 16)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setEditId(null)}>취소</Button>
          <Button onClick={handleUpdate}>저장</Button>
        </ModalFooter>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="삭제 확인"
      >
        <ModalBody>
          <p className="text-sm text-[var(--text-secondary)]">
            <strong>"{deleteTarget?.name}"</strong>을(를) 삭제하시겠습니까?
          </p>
          <p className="text-xs text-danger mt-2">이 작업은 되돌릴 수 없습니다.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>취소</Button>
          <Button variant="danger" onClick={handleDelete}>삭제</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

/* ══════════════════════════════════════════════
   계정과목 관리 패널
   ══════════════════════════════════════════════ */
interface AcctAccount { code: string; name: string; type: string; group: string }

const DEFAULT_ACCOUNTS: AcctAccount[] = [
  { code: '1010', name: '현금', type: 'asset', group: '유동자산' },
  { code: '1020', name: '보통예금', type: 'asset', group: '유동자산' },
  { code: '1030', name: '미수금', type: 'asset', group: '유동자산' },
  { code: '1040', name: '선급금', type: 'asset', group: '유동자산' },
  { code: '1050', name: '재고자산', type: 'asset', group: '유동자산' },
  { code: '1510', name: '건물', type: 'asset', group: '비유동자산' },
  { code: '1520', name: '차량운반구', type: 'asset', group: '비유동자산' },
  { code: '1530', name: '비품', type: 'asset', group: '비유동자산' },
  { code: '1540', name: '임차보증금', type: 'asset', group: '비유동자산' },
  { code: '2010', name: '미지급금', type: 'liability', group: '유동부채' },
  { code: '2020', name: '선수금', type: 'liability', group: '유동부채' },
  { code: '2030', name: '예수금', type: 'liability', group: '유동부채' },
  { code: '2510', name: '장기차입금', type: 'liability', group: '비유동부채' },
  { code: '3010', name: '자본금', type: 'equity', group: '자본' },
  { code: '3020', name: '이익잉여금', type: 'equity', group: '자본' },
  { code: '4010', name: '매출', type: 'revenue', group: '매출' },
  { code: '4020', name: '이자수익', type: 'revenue', group: '영업외수익' },
  { code: '4030', name: '기타수익', type: 'revenue', group: '영업외수익' },
  { code: '5010', name: '급여', type: 'expense', group: '인건비' },
  { code: '5020', name: '복리후생비', type: 'expense', group: '인건비' },
  { code: '5030', name: '임차료', type: 'expense', group: '임차료' },
  { code: '5040', name: '통신비', type: 'expense', group: '경비' },
  { code: '5050', name: '수도광열비', type: 'expense', group: '경비' },
  { code: '5060', name: '소모품비', type: 'expense', group: '경비' },
  { code: '5070', name: '운반비', type: 'expense', group: '경비' },
  { code: '5080', name: '접대비', type: 'expense', group: '경비' },
  { code: '5090', name: '광고선전비', type: 'expense', group: '경비' },
  { code: '5100', name: '여비교통비', type: 'expense', group: '경비' },
  { code: '5110', name: '세금과공과', type: 'expense', group: '경비' },
  { code: '5120', name: '보험료', type: 'expense', group: '경비' },
  { code: '5130', name: '감가상각비', type: 'expense', group: '경비' },
  { code: '5140', name: '수선비', type: 'expense', group: '경비' },
  { code: '5150', name: '도서인쇄비', type: 'expense', group: '경비' },
  { code: '5160', name: '교육훈련비', type: 'expense', group: '경비' },
  { code: '5170', name: '차량유지비', type: 'expense', group: '경비' },
  { code: '5180', name: '외주용역비', type: 'expense', group: '경비' },
  { code: '5190', name: '잡비', type: 'expense', group: '경비' },
]

function initAcctAccounts() {
  const existing: AcctAccount[] = getItem('acct_accounts', [])
  if (existing.length > 0) return
  localStorage.setItem('acct_accounts', JSON.stringify(DEFAULT_ACCOUNTS))
}

const ACCT_TYPES = [
  { value: 'asset', label: '자산', color: '#4f6ef7' },
  { value: 'liability', label: '부채', color: '#ef4444' },
  { value: 'equity', label: '자본', color: '#8b5cf6' },
  { value: 'revenue', label: '수익', color: '#22c55e' },
  { value: 'expense', label: '비용', color: '#f59e0b' },
]

function AccountPanel() {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCode, setEditCode] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', name: '', type: 'expense', group: '' })
  const addToast = useToastStore((s) => s.add)

  // 초기화 (기본 계정과목 시딩)
  initAcctAccounts()

  const accounts: AcctAccount[] = getItem('acct_accounts', [])
  void refresh // trigger re-read

  const grouped = ACCT_TYPES.map(t => ({
    ...t,
    items: accounts.filter(a => a.type === t.value),
  }))

  const openModal = (code?: string) => {
    if (code) {
      const a = accounts.find(x => x.code === code)
      if (a) {
        setEditCode(code)
        setForm({ code: a.code, name: a.name, type: a.type, group: a.group })
      }
    } else {
      setEditCode(null)
      setForm({ code: '', name: '', type: 'expense', group: '' })
    }
    setModalOpen(true)
  }

  const save = () => {
    if (!form.code.trim() || !form.name.trim()) {
      addToast('error', '코드와 이름을 모두 입력하세요')
      return
    }
    let all: AcctAccount[] = getItem('acct_accounts', [])
    if (editCode) {
      all = all.map(a => a.code === editCode ? { ...a, ...form } : a)
      addToast('info', '계정과목이 수정되었습니다')
    } else {
      if (all.some(a => a.code === form.code.trim())) {
        addToast('error', '이미 존재하는 코드입니다')
        return
      }
      all.push({ code: form.code.trim(), name: form.name.trim(), type: form.type, group: form.group.trim() })
      addToast('success', `계정과목 "${form.name}" 추가 완료`)
    }
    localStorage.setItem('acct_accounts', JSON.stringify(all))
    setModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteAcct = (code: string) => {
    if (!confirm('이 계정과목을 삭제하시겠습니까?')) return
    const all: AcctAccount[] = getItem('acct_accounts', [])
    localStorage.setItem('acct_accounts', JSON.stringify(all.filter(a => a.code !== code)))
    addToast('warning', '계정과목이 삭제되었습니다')
    setRefresh(r => r + 1)
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-extrabold text-[var(--text-primary)]">계정과목 관리</div>
            <div className="text-[11px] text-[var(--text-muted)]">자산/부채/자본/수익/비용 계정과목을 관리합니다</div>
          </div>
          <Button onClick={() => openModal()} icon={<Plus size={15} />} size="md">
            <span className="hidden sm:inline">추가</span>
          </Button>
        </div>

        {grouped.map(g => (
          <div key={g.value} className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: g.color }}>{g.label}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{g.items.length}건</span>
            </div>
            {g.items.length === 0 ? (
              <div className="py-3 text-center text-[11px] text-[var(--text-muted)]">등록된 {g.label} 계정이 없습니다</div>
            ) : (
              <div className="space-y-0.5">
                {g.items.map(a => (
                  <div key={a.code} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-muted)] transition-all group">
                    <span className="text-xs font-mono font-bold w-12 shrink-0" style={{ color: g.color }}>{a.code}</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] flex-1 truncate">{a.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{a.group}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(a.code)} className="p-1.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500 cursor-pointer"><Pencil size={13} /></button>
                      <button onClick={() => deleteAcct(a.code)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* 추가/수정 모달 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCode ? '계정과목 수정' : '계정과목 추가'}>
        <ModalBody className="space-y-3">
          <Input label="계정코드 *" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="예) 5200" disabled={!!editCode} autoFocus />
          <Input label="계정명 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예) 퇴직급여" />
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">유형 *</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none"
            >
              {ACCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input label="그룹" value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} placeholder="예) 인건비, 경비" />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>취소</Button>
          <Button onClick={save}>저장</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

/* ══════════════════════════════════════════════
   예산목 관리 패널
   ══════════════════════════════════════════════ */
function BudgetItemPanel() {
  const [refresh, setRefresh] = useState(0)
  const [newName, setNewName] = useState('')
  const addToast = useToastStore((s) => s.add)
  const inputRef = useRef<HTMLInputElement>(null)

  // 예산 데이터에서 사용된 예산목 + 히스토리
  const budgets: { itemName: string }[] = getItem('acct_budgets', [])
  const hist: string[] = getItem('acct_itemName_history', [])
  void refresh

  const allNames = Array.from(new Set([
    ...budgets.map(b => b.itemName).filter(Boolean),
    ...hist.filter(Boolean),
  ])).sort()

  const handleAdd = () => {
    if (!newName.trim()) return
    if (allNames.includes(newName.trim())) {
      addToast('error', '이미 존재하는 예산목입니다')
      return
    }
    const updated = [...hist, newName.trim()]
    localStorage.setItem('acct_itemName_history', JSON.stringify(updated))
    addToast('success', `예산목 "${newName.trim()}" 추가 완료`)
    setNewName('')
    setRefresh(r => r + 1)
    inputRef.current?.focus()
  }

  const handleDelete = (name: string) => {
    if (!confirm(`"${name}" 예산목을 삭제하시겠습니까?`)) return
    // hist에서만 삭제 (실제 예산 데이터의 예산목은 유지)
    const updated = hist.filter(h => h !== name)
    localStorage.setItem('acct_itemName_history', JSON.stringify(updated))
    addToast('warning', `예산목 "${name}" 삭제 완료`)
    setRefresh(r => r + 1)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-extrabold text-[var(--text-primary)]">예산목 관리</div>
          <div className="text-[11px] text-[var(--text-muted)]">예산 등록 시 자동완성에 표시되는 예산목 목록입니다</div>
        </div>
      </div>

      {/* 추가 폼 */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <Input
            ref={inputRef}
            placeholder="새 예산목 입력 (예: 인건비, 소모품비)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <Button onClick={handleAdd} icon={<Plus size={15} />} size="md" className="shrink-0">
          <span className="hidden sm:inline">추가</span>
        </Button>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-default)]">
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">예산목 목록</span>
        <span className="text-[11px] font-bold text-[#f97316]">{allNames.length}건</span>
      </div>

      {allNames.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--text-muted)]">등록된 예산목이 없습니다</div>
      ) : (
        <div className="space-y-0.5">
          {allNames.map((name, idx) => {
            const inBudget = budgets.some(b => b.itemName === name)
            return (
              <div key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-muted)] transition-all group">
                <span className="text-[11px] font-bold text-[var(--text-muted)] w-5 text-center shrink-0">{idx + 1}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] flex-1 truncate">{name}</span>
                {inBudget && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600">사용중</span>
                )}
                <button
                  onClick={() => handleDelete(name)}
                  className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

/* ══════════════════════════════════════════════
   지출수단 관리 패널
   ══════════════════════════════════════════════ */
const DEFAULT_PAY_METHODS = ['계좌이체', '현금', '카드', '법인카드', '기타']

function PaymentMethodPanel() {
  const [refresh, setRefresh] = useState(0)
  const [newName, setNewName] = useState('')
  const addToast = useToastStore((s) => s.add)
  const inputRef = useRef<HTMLInputElement>(null)

  // 초기화: 기본 지출수단 시딩
  const stored: string[] = getItem('acct_payment_methods', [])
  if (stored.length === 0) {
    localStorage.setItem('acct_payment_methods', JSON.stringify(DEFAULT_PAY_METHODS))
  }
  void refresh

  const methods: string[] = getItem('acct_payment_methods', DEFAULT_PAY_METHODS)

  const handleAdd = () => {
    if (!newName.trim()) return
    if (methods.includes(newName.trim())) {
      addToast('error', '이미 존재하는 지출수단입니다')
      return
    }
    const updated = [...methods, newName.trim()]
    localStorage.setItem('acct_payment_methods', JSON.stringify(updated))
    addToast('success', `지출수단 "${newName.trim()}" 추가 완료`)
    setNewName('')
    setRefresh(r => r + 1)
    inputRef.current?.focus()
  }

  const handleDelete = (name: string) => {
    if (!confirm(`"${name}" 지출수단을 삭제하시겠습니까?`)) return
    const updated = methods.filter(m => m !== name)
    localStorage.setItem('acct_payment_methods', JSON.stringify(updated))
    addToast('warning', `지출수단 "${name}" 삭제 완료`)
    setRefresh(r => r + 1)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-extrabold text-[var(--text-primary)]">지출수단 관리</div>
          <div className="text-[11px] text-[var(--text-muted)]">지출/입금 등록 시 선택 가능한 지출수단 목록입니다</div>
        </div>
      </div>

      {/* 추가 폼 */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <Input
            ref={inputRef}
            placeholder="새 지출수단 입력 (예: 간편결제, 상품권)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <Button onClick={handleAdd} icon={<Plus size={15} />} size="md" className="shrink-0">
          <span className="hidden sm:inline">추가</span>
        </Button>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-default)]">
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">지출수단 목록</span>
        <span className="text-[11px] font-bold text-[#ec4899]">{methods.length}건</span>
      </div>

      {methods.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--text-muted)]">등록된 지출수단이 없습니다</div>
      ) : (
        <div className="space-y-0.5">
          {methods.map((name, idx) => (
            <div key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-muted)] transition-all group">
              <span className="text-[11px] font-bold text-[var(--text-muted)] w-5 text-center shrink-0">{idx + 1}</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] flex-1 truncate">{name}</span>
              {DEFAULT_PAY_METHODS.includes(name) && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600">기본</span>
              )}
              <button
                onClick={() => handleDelete(name)}
                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
