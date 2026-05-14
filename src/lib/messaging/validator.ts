/**
 * 전화번호 / 메시지 본문 유효성 검사
 */

/**
 * 전화번호에서 특수문자 제거
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/**
 * 한국 전화번호 유효성 검사
 */
export function isValidKoreanPhone(phone: string): boolean {
  const sanitized = sanitizePhoneNumber(phone);

  // 휴대폰: 010, 011, 016, 017, 018, 019
  const mobilePattern = /^01[0-9]{8,9}$/;

  // 일반 전화: 02 (서울), 031-064 (지역번호)
  const landlinePattern = /^0[2-6][0-9]{7,8}$/;

  // 대표번호: 1588, 1544, 1600 등
  const tollFreePattern = /^1[5-8][0-9]{6}$/;

  return (
    mobilePattern.test(sanitized) ||
    landlinePattern.test(sanitized) ||
    tollFreePattern.test(sanitized)
  );
}

/**
 * 전화번호 검증 (실패 시 throw)
 */
export function validatePhoneNumber(phone: string, fieldName: string = "phone"): string {
  const sanitized = sanitizePhoneNumber(phone);

  if (!sanitized) {
    throw new Error(`${fieldName} is required`);
  }

  if (!isValidKoreanPhone(sanitized)) {
    throw new Error(`Invalid ${fieldName}: ${phone}`);
  }

  return sanitized;
}

/**
 * 여러 전화번호 검증
 */
export function validatePhoneNumbers(phones: string[]): string[] {
  return phones.map((phone, index) => validatePhoneNumber(phone, `phone[${index}]`));
}

/**
 * SMS 메시지 길이 검사 (한글 45자, 영문 90자 초과시 LMS)
 */
export function getMessageType(text: string): "SMS" | "LMS" {
  // 한글 1자 = 2바이트, 영문 1자 = 1바이트, SMS 한도 90바이트
  let byteLength = 0;
  for (const char of text) {
    byteLength += char.charCodeAt(0) > 127 ? 2 : 1;
  }
  return byteLength > 90 ? "LMS" : "SMS";
}

/**
 * 메시지 본문 검증 (필수 / 길이 상한 2000바이트)
 */
export function validateMessageText(text: string): void {
  if (!text || text.trim() === "") {
    throw new Error("Message text is required");
  }

  let byteLength = 0;
  for (const char of text) {
    byteLength += char.charCodeAt(0) > 127 ? 2 : 1;
  }

  if (byteLength > 2000) {
    throw new Error("Message text exceeds maximum length (2000 bytes)");
  }
}
