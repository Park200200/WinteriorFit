import { useState, useMemo, useRef } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { Modal, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { EmptyState } from '../../components/common/EmptyState'
import { useStaffStore, type Staff } from '../../stores/staffStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useToastStore } from '../../stores/toastStore'
import { formatPhone } from '../../utils/format'
import {
  Plus, Search, UserPlus, Phone, MapPin,
  Pencil, Trash2, PhoneCall, Map, Briefcase, Camera, Eye, EyeOff, PenTool,
} from 'lucide-react'

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  '근무': 'success', '근무(휴가)': 'info', '근무(출장)': 'warning',
  '근무(조퇴)': 'warning', '근무(퇴근)': 'info', '휴직': 'danger', '퇴사': 'default',
}

export function StaffPage() {
  const { staff, add, update, remove } = useStaffStore()
  const { departments, ranks, positions } = useSettingsStore()
  const addToast = useToastStore((s) => s.add)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Staff | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)
  const [showPw, setShowPw] = useState(false)
  const photoFileRef = useRef<HTMLInputElement>(null)
  const sealFileRef = useRef<HTMLInputElement>(null)

  // 폼 상태
  const [form, setForm] = useState<Partial<Staff>>({})

  const filteredStaff = useMemo(() => {
    let list = staff
    if (filterDept !== 'all') list = list.filter(s => s.dept === filterDept)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.dept || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q)
      )
    }
    return list
  }, [staff, filterDept, search])

  const openAdd = () => {
    setEditTarget(null)
    setForm({ status: '근무', color: '#4f6ef7', approverType: 'requester' })
    setShowPw(false)
    setModalOpen(true)
  }

  const openEdit = (s: Staff) => {
    setEditTarget(s)
    setForm({ ...s })
    setShowPw(false)
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name?.trim()) { addToast('error', '이름을 입력해주세요'); return }
    if (editTarget) {
      update(editTarget.id, form)
      addToast('success', '직원 정보가 수정되었습니다')
    } else {
      add(form as Omit<Staff, 'id'>)
      addToast('success', `${form.name}님이 등록되었습니다`)
    }
    setModalOpen(false)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    remove(deleteTarget.id)
    addToast('warning', `${deleteTarget.name}님이 삭제되었습니다`)
    setDeleteTarget(null)
  }

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => setForm(prev => ({ ...prev, photo: e.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const handleSealUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => setForm(prev => ({ ...prev, sealImg: e.target?.result as string }))
    reader.readAsDataURL(file)
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader title="직원관리" subtitle="명부 등록 및 인사 정보 관리">
        <Button onClick={openAdd} icon={<UserPlus size={15} />} size="sm">
          <span className="hidden sm:inline">등록+</span>
          <span className="sm:hidden">등록+</span>
        </Button>
      </PageHeader>

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1">
          <Input icon={<Search size={16} />} placeholder="이름, 부서, 연락처 검색..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] cursor-pointer"
        >
          <option value="all">전체 부서</option>
          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
      </div>

      {filteredStaff.length === 0 ? (
        <Card>
          <EmptyState emoji="👤" title="직원이 없습니다"
            description={search ? '검색 결과가 없습니다.' : '첫 번째 직원을 등록해보세요!'}
            action={!search ? <Button onClick={openAdd} size="sm" icon={<Plus size={14} />}>등록+</Button> : undefined}
          />
        </Card>
      ) : (
        <>
          {/* ── 데스크탑: 테이블 (기존과 동일 7열) ── */}
          <div className="hidden md:block">
            <Card className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--bg-muted)]">
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase">이름</th>
                      <th className="text-left px-3 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase">직급</th>
                      <th className="text-left px-3 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase">직책</th>
                      <th className="text-left px-3 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase">전화번호</th>
                      <th className="text-left px-3 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase">주소</th>
                      <th className="text-left px-3 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase">상태</th>
                      <th className="text-center px-3 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase w-24">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map(s => (
                      <tr key={s.id} className="border-b border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer" onClick={() => openEdit(s)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={s.name} color={s.color} size="sm" />
                            <div>
                              <div className="font-bold text-[13px] text-[var(--text-primary)]">{s.name}</div>
                              <div className="text-[11px] text-[var(--text-muted)]">{s.dept || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[13px] font-semibold text-[var(--text-primary)]">{s.rank || s.role || '-'}</td>
                        <td className="px-3 py-3 text-[13px] font-medium text-primary-500">{s.position || '-'}</td>
                        <td className="px-3 py-3 text-[12.5px] text-[var(--text-secondary)]">{s.phone || '-'}</td>
                        <td className="px-3 py-3"><div className="text-[12px] text-[var(--text-muted)] max-w-[200px] truncate" title={s.address || ''}>{s.address || '-'}</div></td>
                        <td className="px-3 py-3"><Badge variant={statusVariant[s.status || '근무'] || 'default'} className="!text-[10px]">{s.status || '근무'}</Badge></td>
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => openEdit(s)} className="p-1.5 rounded-md text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer" title="상세/수정"><Pencil size={14} /></button>
                            <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-md text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer" title="삭제"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* ── 모바일: 카드 ── */}
          <div className="md:hidden space-y-3">
            {filteredStaff.map(s => {
              const sc = (s.status || '').includes('휴직') ? '#f59e0b' : s.status === '퇴사' ? '#6b7280' : (s.status || '').includes('퇴근') ? '#4f6ef7' : '#22c55e'
              return (
                <Card key={s.id} className="!p-0 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={s.name} color={s.color} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold text-[var(--text-primary)]">{s.name}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{s.rank || s.role || '-'}{s.dept ? ` · ${s.dept}` : ''}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1" style={{ color: sc, background: `${sc}12`, borderColor: `${sc}40` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc }} />
                      {s.status || '근무'}
                    </span>
                  </div>
                  {s.position && <div className="flex items-center gap-1.5 px-4 py-1 text-[11px] text-[var(--text-muted)]"><Briefcase size={12} className="opacity-50" /><span>{s.position}</span></div>}
                  <div className="px-4 py-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-[12px]">
                      <Phone size={13} className="text-[var(--text-muted)] shrink-0" />
                      <span className="text-[var(--text-primary)] flex-1">{s.phone || '-'}</span>
                      {s.phone && <a href={`tel:${s.phone.replace(/[^0-9+]/g, '')}`} className="p-1.5 rounded-md bg-green-50 dark:bg-green-900/20 text-green-500" onClick={e => e.stopPropagation()}><PhoneCall size={13} /></a>}
                    </div>
                    <div className="flex items-center gap-2 text-[12px]">
                      <MapPin size={13} className="text-[var(--text-muted)] shrink-0" />
                      <span className="text-[var(--text-primary)] flex-1 truncate">{s.address || '-'}</span>
                      {s.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(s.address)}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-500" onClick={e => e.stopPropagation()}><Map size={13} /></a>}
                    </div>
                  </div>
                  <div className="flex border-t border-[var(--border-default)]">
                    <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-bold text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors cursor-pointer"><Pencil size={13} /> 정보 수정</button>
                    <div className="w-px bg-[var(--border-default)]" />
                    <button onClick={() => setDeleteTarget(s)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-bold text-danger hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer"><Trash2 size={13} /> 삭제</button>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* ══════════ 등록/수정 모달 (기존과 동일한 4섹션) ══════════ */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? '직원 정보 상세' : '직원 등록'} maxWidth="max-w-2xl">
        <ModalBody className="space-y-5">
          {/* ── 섹션: 기본 정보 ── */}
          <div>
            <div className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">기본 정보</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* 프로필 사진 */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">프로필 사진</label>
                <div
                  onClick={() => photoFileRef.current?.click()}
                  className="h-[42px] bg-[var(--bg-muted)] border-2 border-dashed border-[var(--border-default)] rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:border-primary-400 transition-colors overflow-hidden"
                  style={form.photo ? { backgroundImage: `url(${form.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                  {!form.photo && <><Camera size={16} className="text-[var(--text-muted)]" /><span className="text-[11px] font-semibold text-[var(--text-muted)]">사진 등록</span></>}
                </div>
                <input ref={photoFileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
              </div>
              {/* 이름 */}
              <Input label="이름 *" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="이름을 입력하세요" />
              {/* 부서 */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">부서 *</label>
                <select value={form.dept || ''} onChange={e => setForm({ ...form, dept: e.target.value })} className="w-full h-[42px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
                  <option value="">선택</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              {/* 직급 */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">직급 *</label>
                <select value={form.rank || form.role || ''} onChange={e => setForm({ ...form, rank: e.target.value, role: e.target.value })} className="w-full h-[42px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
                  <option value="">선택</option>
                  {ranks.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
              {/* 직책 */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">직책 *</label>
                <select value={form.position || ''} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full h-[42px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
                  <option value="">선택</option>
                  {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              {/* 상태 */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">상태</label>
                <select value={form.status || '근무'} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-[42px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
                  <option>근무</option>
                  <option>근무(휴가)</option>
                  <option>근무(출장)</option>
                  <option>근무(조퇴)</option>
                  <option>근무(퇴근)</option>
                  <option>휴직</option>
                  <option>퇴사</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── 섹션: 연락처 및 일정 ── */}
          <div>
            <div className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">연락처 및 일정</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Input label="전화번호 *" value={form.phone || ''} onChange={e => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="010-0000-0000" />
              <Input label="이메일" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@workm.kr" />
              <Input label="생년월일" type="date" value={form.birthday || ''} onChange={e => setForm({ ...form, birthday: e.target.value })} />
              <Input label="입사일" type="date" value={form.hiredAt || ''} onChange={e => setForm({ ...form, hiredAt: e.target.value })} />
              <Input label="퇴사일" type="date" value={form.resignedAt || ''} onChange={e => setForm({ ...form, resignedAt: e.target.value })} />
              <div className="col-span-2 md:col-span-3">
                <Input label="주소" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="주소 입력" />
              </div>
            </div>
          </div>

          {/* ── 섹션: 시스템 계정 정보 ── */}
          <div>
            <div className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">시스템 계정 정보</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Input label="아이디" value={form.loginId || ''} onChange={e => setForm({ ...form, loginId: e.target.value })} />
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">비밀번호</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.pw || ''}
                    onChange={e => setForm({ ...form, pw: e.target.value })}
                    className="w-full h-[42px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 pr-10 text-sm text-[var(--text-primary)] outline-none focus:border-primary-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] cursor-pointer"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <Input label="아바타 (2글자)" value={form.avatar || ''} onChange={e => setForm({ ...form, avatar: e.target.value.slice(0, 2) })} />
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">전용 색상</label>
                <input type="color" value={form.color || '#4f6ef7'} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full h-[42px] rounded-lg border border-[var(--border-default)] p-1 cursor-pointer" />
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">비고</label>
                <textarea
                  value={form.note || ''}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  className="w-full h-[42px] min-h-[42px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none resize-y focus:border-primary-400"
                />
              </div>
            </div>
          </div>

          {/* ── 섹션: 품의서 결재 설정 ── */}
          <div>
            <div className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">품의서 결재 설정</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">승인자 구분</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, approverType: 'requester' })}
                    className={`flex-1 h-[38px] rounded-lg border text-[12px] font-bold transition-all cursor-pointer ${form.approverType === 'requester' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'}`}
                  >
                    품의자
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, approverType: 'approver' })}
                    className={`flex-1 h-[38px] rounded-lg border text-[12px] font-bold transition-all cursor-pointer ${form.approverType === 'approver' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'}`}
                  >
                    승인자
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">도장/사인 등록</label>
                <div
                  onClick={() => sealFileRef.current?.click()}
                  className="h-[38px] bg-[var(--bg-muted)] border-2 border-dashed border-[var(--border-default)] rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:border-primary-400 transition-colors overflow-hidden"
                  style={form.sealImg ? { backgroundImage: `url(${form.sealImg})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : {}}
                >
                  {!form.sealImg && <><PenTool size={16} className="text-[var(--text-muted)]" /><span className="text-[11px] font-semibold text-[var(--text-muted)]">이미지 등록</span></>}
                </div>
                <input ref={sealFileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleSealUpload(e.target.files[0])} />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>취소</Button>
          <Button onClick={handleSave}>저장</Button>
        </ModalFooter>
      </Modal>

      {/* 삭제 확인 */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="직원 삭제">
        <ModalBody>
          <p className="text-sm text-[var(--text-secondary)]"><strong>{deleteTarget?.name}</strong>님을 삭제하시겠습니까?</p>
          <p className="text-xs text-danger mt-2">관련된 업무 배정이 해제됩니다.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>취소</Button>
          <Button variant="danger" onClick={handleDelete}>삭제</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
