import { useState, useCallback, useRef } from 'react'
import { getItem, setItem } from '../../utils/storage'
import { ScrollText, Save, FileText, Shield, BookOpen } from 'lucide-react'

/* ── 타입 ── */
type TermsTab = 'tos' | 'privacy' | 'post'
const TABS: { key: TermsTab; label: string; icon: any }[] = [
  { key: 'tos', label: '홈페이지 이용약관', icon: FileText },
  { key: 'privacy', label: '개인정보처리방침', icon: Shield },
  { key: 'post', label: '게시물 게재 원칙', icon: BookOpen },
]

const STORAGE_KEY = 'hp_terms'

/* ── 기본 약관 내용 ── */
const DEFAULT_TOS = `<h2 style="font-size:20px;font-weight:800;border-bottom:2px solid #6366f1;padding-bottom:10px;margin-bottom:6px">홈페이지 이용약관</h2>
<p style="font-size:12px;color:#888;margin-bottom:24px">시행일자 : 2025년 1월 1일 | 최종 개정일 : 2025년 4월 1일</p>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제1장 총칙</h3>
<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px">제1조 (목적)</h4>
<p style="font-size:13.5px;color:#555;line-height:1.8">이 약관은 <strong>(주)윈테리어핏</strong>(이하 "회사"라 합니다)이 운영하는 홈페이지(이하 "사이트"라 합니다)에서 제공하는 인터넷 관련 서비스(이하 "서비스"라 합니다)를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px">제2조 (용어의 정의)</h4>
<ol style="padding-left:20px;font-size:13.5px;line-height:2;color:#555">
  <li>"사이트"란 회사가 서비스를 이용자에게 제공하기 위하여 설정한 가상의 영업장(winteriorfit.com)을 말합니다.</li>
  <li>"이용자"란 사이트에 접속하여 이 약관에 따라 서비스를 받는 회원 및 비회원을 말합니다.</li>
  <li>"회원"이란 개인정보를 제공하여 회원등록을 한 자로서, 사이트의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
  <li>"비회원"이란 회원에 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
</ol>
<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px">제3조 (약관의 게시 및 개정)</h4>
<ol style="padding-left:20px;font-size:13.5px;line-height:2;color:#555">
  <li>회사는 이 약관의 내용과 상호, 영업소 소재지, 대표자의 성명, 사업자등록번호, 연락처 등을 이용자가 알 수 있도록 사이트 초기화면에 게시합니다.</li>
  <li>회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
  <li>회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행 약관과 함께 사이트에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
</ol>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제2장 서비스 이용계약</h3>
<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px">제4조 (회원가입)</h4>
<ol style="padding-left:20px;font-size:13.5px;line-height:2;color:#555">
  <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</li>
  <li>회사는 전항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각호에 해당하지 않는 한 회원으로 등록합니다: (1) 가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우 (2) 등록 내용에 허위, 기재누락, 오기가 있는 경우 (3) 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
</ol>
<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px">제5조 (회원 탈퇴 및 자격 상실)</h4>
<ol style="padding-left:20px;font-size:13.5px;line-height:2;color:#555">
  <li>회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.</li>
  <li>회원이 다음 각호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다: (1) 가입 신청 시 허위 내용을 등록한 경우 (2) 다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 경우 (3) 서비스를 이용하여 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
</ol>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제3장 서비스 이용</h3>
<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px">제6조 (서비스의 제공 및 변경)</h4>
<p style="font-size:13.5px;color:#555;line-height:1.8">회사는 다음과 같은 업무를 수행합니다: (1) 인테리어 제품(블라인드, 커튼 등)에 대한 정보 제공 (2) 온라인 견적 요청 및 상담 서비스 (3) 가맹점 정보 및 시공 사례 제공 (4) 커뮤니티 및 고객 소통 서비스 (5) 기타 회사가 정하는 업무</p>
<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px">제7조 (서비스의 중단)</h4>
<p style="font-size:13.5px;color:#555;line-height:1.8">회사는 컴퓨터 등 정보통신설비의 보수점검·교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있으며, 새로운 서비스로의 전환을 위하여 필요하다고 판단되는 경우 현재 제공되는 서비스의 전부 또는 일부를 변경할 수 있습니다.</p>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제4장 의무 및 책임</h3>
<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px">제8조 (회사의 의무)</h4>
<ol style="padding-left:20px;font-size:13.5px;line-height:2;color:#555">
  <li>회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 계속적이고 안정적으로 서비스를 제공하기 위하여 최선을 다합니다.</li>
  <li>회사는 이용자가 안전하게 서비스를 이용할 수 있도록 이용자의 개인정보(신용정보 포함) 보호를 위한 보안 시스템을 갖추어야 합니다.</li>
</ol>
<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px">제9조 (이용자의 의무)</h4>
<p style="font-size:13.5px;color:#555;line-height:1.8">이용자는 다음 행위를 하여서는 안 됩니다: (1) 신청 또는 변경 시 허위내용의 등록 (2) 타인의 정보 도용 (3) 회사에 게시된 정보의 변경 (4) 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 송신 또는 게시 (5) 회사 기타 제3자의 저작권 등 지적재산권에 대한 침해 (6) 회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위 (7) 외설 또는 폭력적인 메시지, 화상, 음성 기타 공서양속에 반하는 정보를 사이트에 공개 또는 게시하는 행위</p>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제5장 기타</h3>
<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px">제10조 (분쟁해결)</h4>
<ol style="padding-left:20px;font-size:13.5px;line-height:2;color:#555">
  <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 고객지원센터를 설치·운영합니다.</li>
  <li>회사와 이용자 간에 발생한 전자상거래 분쟁과 관련하여 이용자의 피해구제 신청이 있는 경우에는 공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.</li>
  <li>이 약관에 명시되지 않은 사항은 전자상거래 등에서의 소비자보호에 관한 법률, 약관의 규제에 관한 법률, 공정거래위원회가 정하는 전자상거래 등에서의 소비자보호지침 및 관계법령에 따릅니다.</li>
</ol>
<hr style="border:none;border-top:1px solid #ddd;margin:24px 0">
<p style="font-size:12px;color:#888;text-align:center">본 약관은 2025년 1월 1일부터 시행됩니다.</p>
<p style="font-size:12px;color:#888;text-align:center">(주)윈테리어핏 | 사업자등록번호 000-00-00000 | 대표이사 홍길동</p>
<p style="font-size:12px;color:#888;text-align:center">주소: 서울특별시 강남구 테헤란로 123, 10층 | 고객센터: 02-1234-5678</p>`

const DEFAULT_PRIVACY = `<h2 style="font-size:20px;font-weight:800;border-bottom:2px solid #6366f1;padding-bottom:10px">개인정보처리방침</h2>
<p style="font-size:12px;color:#888;margin-bottom:24px">시행일자 : 2025년 1월 1일 | 최종 개정일 : 2025년 4월 1일</p>
<p style="font-size:13.5px;color:#555;line-height:1.8;margin-bottom:16px"><strong>(주)윈테리어핏</strong>(이하 "회사"라 합니다)은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.</p>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제1조 (개인정보의 수집 항목 및 수집 방법)</h3>
<p style="font-size:13.5px;color:#555;line-height:1.8">회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다.</p>
<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px"><thead><tr style="background:#f8f9fa"><th style="border:1px solid #ddd;padding:8px 12px;text-align:left">구분</th><th style="border:1px solid #ddd;padding:8px 12px;text-align:left">수집 항목</th></tr></thead><tbody><tr><td style="border:1px solid #ddd;padding:8px 12px">필수항목</td><td style="border:1px solid #ddd;padding:8px 12px">이름, 연락처(휴대전화번호), 이메일 주소, 비밀번호</td></tr><tr><td style="border:1px solid #ddd;padding:8px 12px">선택항목</td><td style="border:1px solid #ddd;padding:8px 12px">주소, 생년월일, 관심 제품분야</td></tr><tr><td style="border:1px solid #ddd;padding:8px 12px">자동수집</td><td style="border:1px solid #ddd;padding:8px 12px">IP주소, 쿠키, 접속로그, 서비스 이용기록, 기기정보</td></tr></tbody></table>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제2조 (개인정보의 수집 및 이용 목적)</h3>
<ul style="padding-left:20px;font-size:13.5px;line-height:2;color:#555">
  <li><strong>회원관리:</strong> 회원 가입의사 확인, 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지</li>
  <li><strong>서비스 제공:</strong> 견적 요청 처리, 시공 상담, 제품 정보 안내, 맞춤 서비스 제공</li>
  <li><strong>마케팅 활용:</strong> 신규 서비스 안내, 이벤트 정보 제공, 접속빈도 파악, 서비스 이용 통계</li>
  <li><strong>가맹점 관리:</strong> 가맹 문의 접수 및 상담, 계약 관련 연락, 사후 관리</li>
</ul>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제3조 (개인정보의 보유 및 이용 기간)</h3>
<p style="font-size:13.5px;color:#555;line-height:1.8">회사는 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관련 법령에 의하여 보존할 필요가 있는 경우 아래와 같이 관련 법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.</p>
<ul style="padding-left:20px;font-size:13.5px;line-height:2;color:#555">
  <li>계약 또는 청약 철회 등에 관한 기록: <strong>5년</strong> (전자상거래법)</li>
  <li>대금결제 및 재화 등의 공급에 관한 기록: <strong>5년</strong> (전자상거래법)</li>
  <li>소비자 불만 또는 분쟁처리에 관한 기록: <strong>3년</strong> (전자상거래법)</li>
  <li>웹사이트 방문기록: <strong>3개월</strong> (통신비밀보호법)</li>
</ul>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제4조 (개인정보의 제3자 제공)</h3>
<p style="font-size:13.5px;color:#555;line-height:1.8">회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 다음의 경우에는 예외로 합니다: (1) 이용자가 사전에 동의한 경우 (2) 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</p>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제5조 (개인정보의 파기 절차 및 방법)</h3>
<p style="font-size:13.5px;color:#555;line-height:1.8">회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 파기절차 및 방법은 다음과 같습니다.</p>
<ul style="padding-left:20px;font-size:13.5px;line-height:2;color:#555">
  <li><strong>파기절차:</strong> 회원이 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.</li>
  <li><strong>파기방법:</strong> 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
</ul>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제6조 (이용자 및 법정대리인의 권리와 행사방법)</h3>
<p style="font-size:13.5px;color:#555;line-height:1.8">이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원탈퇴를 통해 개인정보 이용에 대한 동의를 철회할 수 있습니다. 개인정보의 오류에 대한 정정 요청 시 정정을 완료하기 전까지 해당 개인정보를 이용 또는 제공하지 않습니다.</p>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제7조 (개인정보의 안전성 확보 조치)</h3>
<p style="font-size:13.5px;color:#555;line-height:1.8">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다: (1) 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 (2) 기술적 조치: 개인정보처리시스템 접근권한 관리, 접근통제시스템 설치, 고유식별정보 암호화, 보안프로그램 설치 (3) 물리적 조치: 전산실, 자료보관실 등의 접근 통제</p>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제8조 (개인정보 보호책임자)</h3>
<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px"><tbody><tr><td style="border:1px solid #ddd;padding:8px 12px;background:#f8f9fa;font-weight:700;width:120px">성 명</td><td style="border:1px solid #ddd;padding:8px 12px">김보안</td></tr><tr><td style="border:1px solid #ddd;padding:8px 12px;background:#f8f9fa;font-weight:700">직 책</td><td style="border:1px solid #ddd;padding:8px 12px">정보보안팀장</td></tr><tr><td style="border:1px solid #ddd;padding:8px 12px;background:#f8f9fa;font-weight:700">연락처</td><td style="border:1px solid #ddd;padding:8px 12px">02-1234-5679 / privacy@winteriorfit.com</td></tr></tbody></table>
<hr style="border:none;border-top:1px solid #ddd;margin:24px 0">
<p style="font-size:12px;color:#888;text-align:center">본 방침은 2025년 1월 1일부터 시행됩니다. | (주)윈테리어핏</p>`

const DEFAULT_POST = `<h2 style="font-size:20px;font-weight:800;border-bottom:2px solid #6366f1;padding-bottom:10px">게시물 게재 원칙</h2>
<p style="font-size:12px;color:#888;margin-bottom:24px">시행일자 : 2025년 1월 1일 | 최종 개정일 : 2025년 4월 1일</p>
<p style="font-size:13.5px;color:#555;line-height:1.8;margin-bottom:16px">(주)윈테리어핏(이하 "회사")은 건전한 커뮤니티 운영을 위하여 아래와 같은 게시물 게재 원칙을 수립하여 운영합니다. 본 원칙은 회사가 운영하는 모든 게시판, 리뷰, 댓글, Q&A 등에 적용됩니다.</p>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제1조 (목적)</h3>
<p style="font-size:13.5px;color:#555;line-height:1.8">본 원칙은 사이트 내 게시물의 게시 및 관리에 관한 기본적인 사항을 규정하여, 건전하고 유익한 정보 교류 환경을 조성하는 것을 목적으로 합니다.</p>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제2조 (금지 게시물)</h3>
<p style="font-size:13.5px;color:#555;line-height:1.8">다음 각 호에 해당하는 게시물은 사전 통지 없이 삭제되거나 비공개 처리될 수 있으며, 해당 이용자는 서비스 이용이 제한될 수 있습니다.</p>
<ol style="padding-left:20px;font-size:13.5px;line-height:2;color:#555">
  <li>음란물, 성인 콘텐츠 및 미풍양속에 반하는 게시물</li>
  <li>타인에 대한 명예훼손, 모욕, 욕설, 비방, 협박 등의 게시물</li>
  <li>허위사실 유포, 사기, 기만 행위와 관련된 게시물</li>
  <li>저작권, 상표권 등 지적재산권을 침해하는 게시물</li>
  <li>개인정보(전화번호, 주소, 주민등록번호 등)가 포함된 게시물</li>
  <li>특정 상품 또는 서비스에 대한 광고성·스팸성 게시물</li>
  <li>악성코드, 바이러스 등이 포함된 파일이 첨부된 게시물</li>
  <li>정치적·종교적 편향이 심하여 다른 이용자에게 불쾌감을 주는 게시물</li>
</ol>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제3조 (게시물의 권리 및 책임)</h3>
<ol style="padding-left:20px;font-size:13.5px;line-height:2;color:#555">
  <li>게시물에 대한 저작권 및 법적 책임은 작성자에게 있습니다.</li>
  <li>이용자는 서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리 목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</li>
  <li>회사는 게시물이 관련 법령에 위반된다고 판단되는 경우 해당 게시물에 대해 삭제, 이동, 등록 거부 등의 조치를 취할 수 있습니다.</li>
</ol>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제4조 (게시물 관리 기준)</h3>
<ul style="padding-left:20px;font-size:13.5px;line-height:2;color:#555">
  <li><strong>신고 접수:</strong> 다른 이용자로부터 신고가 접수된 게시물은 내부 검토를 거쳐 24시간 이내에 처리됩니다.</li>
  <li><strong>임시 조치:</strong> 명예훼손 등 권리침해를 이유로 임시조치 요청이 있는 경우, 「정보통신망법」에 따라 해당 게시물의 접근을 30일간 차단할 수 있습니다.</li>
  <li><strong>이의신청:</strong> 게시물 삭제 또는 제한에 대해 이의가 있는 경우, 고객센터를 통해 이의신청을 할 수 있습니다.</li>
</ul>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제5조 (이용 제한)</h3>
<p style="font-size:13.5px;color:#555;line-height:1.8">본 원칙을 반복적으로 위반하는 이용자에 대해서는 아래와 같은 단계적 제재를 적용합니다.</p>
<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px"><thead><tr style="background:#f8f9fa"><th style="border:1px solid #ddd;padding:8px 12px">단 계</th><th style="border:1px solid #ddd;padding:8px 12px">조 치</th></tr></thead><tbody><tr><td style="border:1px solid #ddd;padding:8px 12px;text-align:center">1차</td><td style="border:1px solid #ddd;padding:8px 12px">경고 및 해당 게시물 삭제</td></tr><tr><td style="border:1px solid #ddd;padding:8px 12px;text-align:center">2차</td><td style="border:1px solid #ddd;padding:8px 12px">7일간 게시물 작성 제한</td></tr><tr><td style="border:1px solid #ddd;padding:8px 12px;text-align:center">3차</td><td style="border:1px solid #ddd;padding:8px 12px">30일간 서비스 이용 정지</td></tr><tr><td style="border:1px solid #ddd;padding:8px 12px;text-align:center">4차 이상</td><td style="border:1px solid #ddd;padding:8px 12px">영구 이용 정지 및 회원 자격 박탈</td></tr></tbody></table>

<h3 style="font-size:15px;font-weight:700;color:#6366f1;margin:24px 0 10px">제6조 (기타)</h3>
<p style="font-size:13.5px;color:#555;line-height:1.8">본 원칙에 명시되지 않은 사항은 관련 법령 및 회사의 이용약관에 따릅니다. 회사는 필요한 경우 본 원칙을 변경할 수 있으며, 변경 시 사이트를 통해 공지합니다.</p>
<hr style="border:none;border-top:1px solid #ddd;margin:24px 0">
<p style="font-size:12px;color:#888;text-align:center">본 원칙은 2025년 1월 1일부터 시행됩니다. | (주)윈테리어핏</p>`

const DEFAULTS: Record<TermsTab, string> = { tos: DEFAULT_TOS, privacy: DEFAULT_PRIVACY, post: DEFAULT_POST }

/* ── 툴바 버튼 ── */
const TB_STYLES = [
  { cmd:'bold', label:'B', style:{ fontWeight:800, fontSize:'14px' } },
  { cmd:'italic', label:'I', style:{ fontStyle:'italic', fontWeight:700, fontSize:'14px' } },
  { cmd:'underline', label:'U', style:{ textDecoration:'underline', fontWeight:700, fontSize:'13px' } },
  { cmd:'strikeThrough', label:'S', style:{ textDecoration:'line-through', fontSize:'13px' } },
]
const TB_ALIGN = [
  { cmd:'justifyLeft', label:'≡' },
  { cmd:'justifyCenter', label:'☰' },
  { cmd:'justifyRight', label:'≡' },
]

export function HpTermsMgmt() {
  const [tab, setTab] = useState<TermsTab>('tos')
  const [data, setData] = useState<Record<TermsTab, string>>(() => {
    const saved = getItem<Record<TermsTab, string>>(STORAGE_KEY, null)
    return saved || { ...DEFAULTS }
  })
  const editorRef = useRef<HTMLDivElement>(null)

  const switchTab = useCallback((t: TermsTab) => {
    // 현재 탭의 내용을 저장
    if (editorRef.current) {
      setData(prev => {
        const upd = { ...prev, [tab]: editorRef.current!.innerHTML }
        setItem(STORAGE_KEY, upd)
        return upd
      })
    }
    setTab(t)
  }, [tab])

  const execCmd = (cmd: string, val?: string) => { document.execCommand(cmd, false, val) }

  const doSave = () => {
    if (editorRef.current) {
      const upd = { ...data, [tab]: editorRef.current.innerHTML }
      setData(upd); setItem(STORAGE_KEY, upd)
      alert('저장되었습니다')
    }
  }

  const insertLink = () => {
    const url = prompt('링크 URL을 입력하세요:', 'https://')
    if (url) execCmd('createLink', url)
  }

  const tbBtnCls = "w-[30px] h-[30px] border border-[var(--border-default)] rounded-[7px] bg-[var(--bg-muted)] cursor-pointer flex items-center justify-center text-[var(--text-primary)]"

  return (
    <div className="animate-fadeIn">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <ScrollText size={18} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-[var(--text-primary)]">약관관리</div>
            <div className="text-[11.5px] text-[var(--text-muted)]">홈페이지 이용약관 · 개인정보처리방침 · 게시물 원칙</div>
          </div>
        </div>
        <button onClick={doSave}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[13px] font-bold cursor-pointer border-none"
          style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <Save size={14}/> 저장
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-[var(--border-default)] mb-0 mx-0">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => switchTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2.5 border-none bg-transparent cursor-pointer text-[13px] font-bold transition-colors rounded-t-lg"
              style={{ color: active ? '#6366f1' : 'var(--text-muted)', borderBottom: active ? '2.5px solid #6366f1' : '2.5px solid transparent', position:'relative', top:'1px' }}>
              <Icon size={13}/> {t.label}
            </button>
          )
        })}
      </div>

      {/* 툴바 */}
      <div className="flex flex-wrap gap-1 p-2.5 bg-[var(--bg-muted)] border border-[var(--border-default)] border-b-0 rounded-t-xl items-center mt-0">
        <select onChange={e => { execCmd('formatBlock', e.target.value); e.target.selectedIndex = 0 }}
          className="px-2 py-1 border border-[var(--border-default)] rounded-[7px] text-[12px] bg-[var(--bg-surface)] text-[var(--text-primary)] cursor-pointer font-semibold">
          <option value="">단락 스타일</option><option value="h1">제목 1</option><option value="h2">제목 2</option><option value="h3">제목 3</option>
          <option value="p">본문</option><option value="blockquote">인용문</option>
        </select>
        <div className="w-px h-5 bg-[var(--border-default)] mx-0.5" />
        <select onChange={e => { execCmd('fontSize', e.target.value); e.target.selectedIndex = 0 }}
          className="px-2 py-1 border border-[var(--border-default)] rounded-[7px] text-[12px] bg-[var(--bg-surface)] text-[var(--text-primary)] cursor-pointer font-semibold">
          <option value="">크기</option><option value="2">소(12px)</option><option value="3">중(14px)</option><option value="4">대(16px)</option><option value="5">특대(18px)</option>
        </select>
        <div className="w-px h-5 bg-[var(--border-default)] mx-0.5" />
        {TB_STYLES.map(b => (
          <button key={b.cmd} onClick={() => execCmd(b.cmd)} className={tbBtnCls} style={b.style as any}>{b.label}</button>
        ))}
        <div className="w-px h-5 bg-[var(--border-default)] mx-0.5" />
        {TB_ALIGN.map((b,i) => (
          <button key={i} onClick={() => execCmd(b.cmd)} className={tbBtnCls} style={{ fontSize:'13px' }}>{b.label}</button>
        ))}
        <div className="w-px h-5 bg-[var(--border-default)] mx-0.5" />
        <button onClick={() => execCmd('insertUnorderedList')} className={tbBtnCls} style={{ fontSize:'13px' }}>•</button>
        <button onClick={() => execCmd('insertOrderedList')} className={tbBtnCls} style={{ fontSize:'13px' }}>1.</button>
        <div className="w-px h-5 bg-[var(--border-default)] mx-0.5" />
        <label className="flex items-center gap-1 cursor-pointer text-[11px] text-[var(--text-muted)] font-semibold">
          A <input type="color" defaultValue="#6366f1" onChange={e => execCmd('foreColor', e.target.value)} className="w-5 h-5 border-none cursor-pointer rounded" />
        </label>
        <label className="flex items-center gap-1 cursor-pointer text-[11px] text-[var(--text-muted)] font-semibold">
          HL <input type="color" defaultValue="#fef08a" onChange={e => execCmd('hiliteColor', e.target.value)} className="w-5 h-5 border-none cursor-pointer rounded" />
        </label>
        <div className="w-px h-5 bg-[var(--border-default)] mx-0.5" />
        <button onClick={insertLink} className={tbBtnCls} style={{ fontSize:'13px' }}>🔗</button>
        <button onClick={() => execCmd('insertHorizontalRule')} className={tbBtnCls} style={{ fontSize:'12px' }}>—</button>
        <div className="ml-auto">
          <button onClick={doSave} className="px-3.5 py-1.5 rounded-lg text-white text-[12px] font-bold cursor-pointer border-none" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>저장</button>
        </div>
      </div>

      {/* 에디터 */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: data[tab] }}
        className="min-h-[520px] p-7 border border-[var(--border-default)] border-t-0 rounded-b-xl bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none leading-[1.8] text-sm overflow-y-auto"
      />
    </div>
  )
}
