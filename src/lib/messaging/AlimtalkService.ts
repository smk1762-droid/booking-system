import "server-only";

import { SolapiMessageService } from "solapi";
import type {
  MessagingConfig,
  AlimtalkMessage,
  SendOptions,
  SendResult,
  SolapiSendRequest,
  SolapiSingleResponse,
  SolapiBulkResponse,
} from "./types";
import { validateKakaoConfig } from "./config";
import { validatePhoneNumber, sanitizePhoneNumber } from "./validator";

type BulkSendOptions = {
  scheduledDate?: string;
  allowDuplicates?: boolean;
};

export class AlimtalkService {
  private client: SolapiMessageService;
  private config: MessagingConfig;

  constructor(config: MessagingConfig) {
    this.config = config;
    this.client = new SolapiMessageService(config.apiKey, config.apiSecret);
  }

  /**
   * 단일 알림톡 발송 (즉시 발송).
   * `disableSms=false`일 때 알림톡 실패 시 Solapi가 자동으로 SMS 폴백한다.
   * 예약 발송은 `sendBulk`에서 `options.scheduledDate`로만 지원한다.
   */
  async send(message: AlimtalkMessage): Promise<SendResult> {
    validateKakaoConfig(this.config.kakao);

    const request = this.buildRequest(message);

    try {
      const response = (await this.client.sendOne(request)) as SolapiSingleResponse;
      return this.parseResponse(response, message.to);
    } catch (error) {
      return this.handleError(error, message.to);
    }
  }

  /**
   * 대량 알림톡 발송 (최대 10,000건)
   */
  async sendBulk(
    messages: AlimtalkMessage[],
    options?: SendOptions,
  ): Promise<SendResult[]> {
    if (messages.length === 0) {
      return [];
    }

    if (messages.length > 10000) {
      throw new Error("Maximum 10,000 messages per request");
    }

    validateKakaoConfig(this.config.kakao);

    const requests = messages.map((msg) => this.buildRequest(msg));

    try {
      const sendOptions: BulkSendOptions = {};
      if (options?.scheduledDate) sendOptions.scheduledDate = options.scheduledDate;
      if (options?.allowDuplicates) sendOptions.allowDuplicates = options.allowDuplicates;

      const response = (await this.client.send(
        requests,
        Object.keys(sendOptions).length > 0 ? sendOptions : undefined,
      )) as SolapiBulkResponse;

      return this.parseBulkResponse(response, messages);
    } catch (error) {
      return messages.map((msg) => this.handleError(error, msg.to));
    }
  }

  private buildRequest(message: AlimtalkMessage): SolapiSendRequest {
    const to = validatePhoneNumber(message.to, "to");
    const from = message.from
      ? validatePhoneNumber(message.from, "from")
      : sanitizePhoneNumber(this.config.defaultSender);

    if (!message.templateId) {
      throw new Error("templateId is required for Alimtalk");
    }

    if (!this.config.kakao) {
      throw new Error("Kakao configuration is missing");
    }

    const templateId = this.config.kakao.templatePrefix
      ? `${this.config.kakao.templatePrefix}${message.templateId}`
      : message.templateId;

    const request: SolapiSendRequest = {
      to,
      from,
      kakaoOptions: {
        pfId: this.config.kakao.pfId,
        templateId,
        variables: message.variables,
        disableSms: message.disableSms,
      },
    };

    return request;
  }

  private parseResponse(response: SolapiSingleResponse, to: string): SendResult {
    return {
      success: true,
      messageId: response.messageId,
      groupId: response.groupId,
      to: sanitizePhoneNumber(to),
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
    };
  }

  private parseBulkResponse(
    response: SolapiBulkResponse,
    messages: AlimtalkMessage[],
  ): SendResult[] {
    if (response.failedMessageList && response.failedMessageList.length > 0) {
      const failedMap = new Map(
        response.failedMessageList.map((f) => [f.to, f] as const),
      );

      return messages.map((msg) => {
        const to = sanitizePhoneNumber(msg.to);
        const failed = failedMap.get(to);

        if (failed) {
          return {
            success: false,
            to,
            statusCode: failed.statusCode,
            statusMessage: failed.statusMessage,
          };
        }

        return {
          success: true,
          groupId: response.groupId,
          to,
        };
      });
    }

    return messages.map((msg) => ({
      success: true,
      groupId: response.groupId,
      to: sanitizePhoneNumber(msg.to),
    }));
  }

  private handleError(error: unknown, to: string): SendResult {
    // statusMessage는 BookingNotification.error 컬럼(1000자 슬라이스)로도 들어가지만,
    // Solapi SDK가 요청 URL이나 헤더를 메시지에 포함할 가능성을 차단하기 위해
    // 여기서 한 번 더 200자 상한을 둔다.
    const raw = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      to: sanitizePhoneNumber(to),
      statusCode: "ERROR",
      statusMessage: raw.slice(0, 200),
    };
  }
}
