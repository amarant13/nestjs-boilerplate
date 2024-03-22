import { INTERNAL_ERROR_CODE as e } from './internal-error-code.constants';

export const INTERNAL_ERROR_CODE_DESC = {
  // SESSION
  [e.SESSION_NOT_FOUND]: '유효하지 않은 세션 정보',
  [e.SESSION_RE_LOGIN]: '다른 기기에서 재 로그인',
  [e.SESSION_NOT_EXIST_USER_ID_IN_HEADER]:
    '세션 정보가 헤더에 포함 되어 있지 않음',

  // USER
  [e.USER_NOT_FOUND]: '유저 정보를 찾을 수 없음',
  [e.USER_ALREADY_CREATED]: '이미 생성 된 유저',

  // USER DETAIL
  [e.USER_DETAIL_NOT_FOUND]: '유저 상세 정보를 찾을 수 없음',

  // CURRENCY
  [e.CURRENCY_NOT_FOUND]: '통화 정보를 찾을 수 없음',
  [e.CURRENCY_UNKNOWN_TYPE]: '통화 타입 찾을 수 없음',
  [e.CURRENCY_CASH_NOT_ENOUGH]: '통화 캐시 부족',
  [e.CURRENCY_GOLD_NOT_ENOUGH]: '통화 골드 부족',

  // CHARACTER
  [e.CHARACTER_NOT_FOUND]: '캐릭터 정보를 찾을 수 없음',

  // EQUIPMENT
  [e.EQUIPMENT_NOT_FOUND]: '장비 정보를 찾을 수 없음',

  // ITEM
  [e.ITEM_NOT_FOUND]: '아이템 정보를 찾을 수 없음',
  [e.ITEM_CONSUME_NOT_ENOUGH]: '소모 아이템 부족',

  // DATA
  [e.DATA_INVALID]: '유효하지 않는 데이터',

  // ADMIN
  [e.ADMIN_USER_CONFLICT_EMAIL]: '관리자 가입 시 이메일 중독',

  // Database
  [e.DB_USER_LEVEL_LOCK_NOT_RELEASE]: 'db user level lock 미 해제',
  [e.DB_UPDATE_FAILED]: 'db 얻데이트 실패',
} as const;
