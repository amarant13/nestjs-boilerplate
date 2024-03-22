export const INTERNAL_ERROR_CODE = {
  // SESSION : 1 ~ 20,
  SESSION_NOT_FOUND: 1, // 유효하지 않은 세션 정보
  SESSION_RE_LOGIN: 2, // 다른 기기에서 재 로그인
  SESSION_NOT_EXIST_USER_ID_IN_HEADER: 3, // 세션 정보가 헤더에 포함 되어 있지 않음

  // USER : 20 ~ 50
  USER_NOT_FOUND: 21, // 유저 정보를 찾을 수 없음
  USER_ALREADY_CREATED: 23, // 이미 생성 된 유저
  USER_NICK_NAME_CONFLICT: 24, // 유저 닉네임 중복
  USER_NICK_NAME_UPDATE_SAME: 25, // 같은 닉네임으로 변경

  // USER DETAIL : 51 ~ 100
  USER_DETAIL_NOT_FOUND: 51, // 유저 상세 정보를 찾을 수 없음

  // CURRENCY : 101 ~ 150
  CURRENCY_NOT_FOUND: 101, // 통화 정보를 찾을 수 없음
  CURRENCY_UNKNOWN_TYPE: 102, // 통화 타입 찾을 수 없음
  CURRENCY_CASH_NOT_ENOUGH: 103, // 통화 캐시 부족
  CURRENCY_GOLD_NOT_ENOUGH: 104, // 통화 골드 부족

  // CHARACTER : 151 ~ 200
  CHARACTER_NOT_FOUND: 251, // 캐릭터 찾을 수 없음

  // EQUIPMENT : 201 ~ 250
  EQUIPMENT_NOT_FOUND: 201, // 장비 찾을 수 없음

  // ITEM : 251 ~ 300
  ITEM_NOT_FOUND: 151, // 아이템 정보 찾을 수 없음
  ITEM_CONSUME_NOT_ENOUGH: 152, // 소모 아이템 부족

  // DATA : 8000 ~ 8050
  DATA_INVALID: 8000, // 유효하지 않는 데이터

  // ADMIN: 9000 ~ 9100
  ADMIN_USER_CONFLICT_EMAIL: 9001, // 관리자 가입 시 이메일 중복

  // Database
  DB_USER_LEVEL_LOCK_NOT_RELEASE: 9998, // db user level lock
  DB_UPDATE_FAILED: 9999, // db 업데이트 실패
} as const;

export type InternalErrorCode =
  (typeof INTERNAL_ERROR_CODE)[keyof typeof INTERNAL_ERROR_CODE];
