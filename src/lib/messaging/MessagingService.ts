import "server-only";

import { SolapiMessageService } from "solapi";
import type {
  MessagingConfig,
  SmsMessage,
  AlimtalkMessage,
  SendOptions,
  SendResult,
  QueryOptions,
  MessageLog,
  SolapiMessageItem,
} from "./types";
import { validateConfig } from "./config";
import { SmsService } from "./SmsService";
import { AlimtalkService } from "./AlimtalkService";

interface GetMessagesParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface GetBalanceResponse {
  balance?: number;
}

/**
 * 통합 메시징 서비스
 *
 * @example
 * ```ts
 * import { getMessaging } from "@/lib/messaging";
 * const messaging = getMessaging();
 * if (!messaging) return; // 환경변수 미설정 — 알림 비활성
 *
 * await messaging.sendAlimtalk({
 *   to: "01098765432",
 *   templateId: "BOOKING_CREATED",
 *   variables: { "#{이름}": "홍길동" },
 * });
 * ```
 */
export class MessagingService {
  private client: SolapiMessageService;
  private config: MessagingConfig;
  private smsService: SmsService;
  private alimtalkService: AlimtalkService;

  constructor(config: MessagingConfig) {
    validateConfig(config);

    this.config = config;
    this.client = new SolapiMessageService(config.apiKey, config.apiSecret);
    this.smsService = new SmsService(config);
    this.alimtalkService = new AlimtalkService(config);
  }

  // ==================== SMS/LMS ====================

  async sendSms(message: SmsMessage): Promise<SendResult> {
    return this.smsService.send(message);
  }

  async sendSmsBulk(
    messages: SmsMessage[],
    options?: SendOptions,
  ): Promise<SendResult[]> {
    return this.smsService.sendBulk(messages, options);
  }

  // ==================== 알림톡 ====================

  async sendAlimtalk(message: AlimtalkMessage): Promise<SendResult> {
    return this.alimtalkService.send(message);
  }

  async sendAlimtalkBulk(
    messages: AlimtalkMessage[],
    options?: SendOptions,
  ): Promise<SendResult[]> {
    return this.alimtalkService.sendBulk(messages, options);
  }

  // ==================== 유틸리티 ====================

  /**
   * 잔액 조회
   */
  async getBalance(): Promise<number> {
    try {
      const response = (await this.client.getBalance()) as GetBalanceResponse;
      return response.balance ?? 0;
    } catch (error) {
      throw new Error(
        `Failed to get balance: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 메시지 발송 내역 조회.
   *
   * Solapi v5의 `getMessages`는 `messageList`를 `Record<string, Message>` (객체 맵)으로 반환한다.
   * 우리는 배열 형태(`MessageLog[]`)로 평탄화해서 돌려준다.
   */
  async getMessages(options?: QueryOptions): Promise<MessageLog[]> {
    try {
      const params: GetMessagesParams = {};
      if (options?.startDate) params.startDate = options.startDate;
      if (options?.endDate) params.endDate = options.endDate;
      if (options?.limit !== undefined) params.limit = options.limit;
      if (options?.offset !== undefined) params.offset = options.offset;

      const raw = (await this.client.getMessages(params)) as unknown as {
        messageList?: Record<string, SolapiMessageItem> | SolapiMessageItem[];
      };

      const list = raw.messageList ?? {};
      const items: SolapiMessageItem[] = Array.isArray(list)
        ? list
        : Object.values(list);

      return items.map((msg) => ({
        messageId: msg.messageId,
        to: msg.to,
        from: msg.from,
        type: msg.type,
        status: msg.statusCode,
        statusMessage: msg.statusMessage,
        sentAt: msg.sentAt,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get messages: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 설정 정보 반환 (디버깅용 — apiKey/apiSecret 제외)
   */
  getConfig(): Omit<MessagingConfig, "apiKey" | "apiSecret"> {
    return {
      defaultSender: this.config.defaultSender,
      kakao: this.config.kakao,
    };
  }
}
