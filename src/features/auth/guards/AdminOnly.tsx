/**
 * AdminOnly - 어드민 전용 선언적 가드 컴포넌트
 *
 * 어드민 권한이 있는 사용자에게만 children을 렌더링합니다.
 * 권한이 없으면 fallback을 렌더링합니다 (기본값: null).
 *
 * @example
 * // 기본 사용
 * <AdminOnly>
 *   <AdminButton />
 * </AdminOnly>
 *
 * // fallback 사용
 * <AdminOnly fallback={<Text>권한이 없습니다</Text>}>
 *   <AdminPanel />
 * </AdminOnly>
 */

import { type ReactNode } from 'react';
import { useAuth } from '../providers';

interface AdminOnlyProps {
  /** 어드민일 때 렌더링할 컨텐츠 */
  readonly children: ReactNode;
  /** 어드민이 아닐 때 렌더링할 컨텐츠 (기본값: null) */
  readonly fallback?: ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps): ReactNode {
  const { isAdmin } = useAuth();

  if (!isAdmin) return fallback;
  return children;
}
