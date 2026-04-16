/** 사용자 */
export interface User {
  id: string | number
  name: string
  email?: string
  dept?: string
  rank?: string
  position?: string
  phone?: string
  avatar?: string
  color?: string
  status?: string
  role?: 'admin' | 'user'
}

/** 로그인 세션 */
export interface AuthSession {
  user: User
  checkedInAt?: string
}
