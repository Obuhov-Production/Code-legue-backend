import {Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException} from '@nestjs/common';
import { AiService } from './ai.service';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

  @Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body('messages') messages: Message[]) {
    if (!messages || !Array.isArray(messages)) {
      throw new BadRequestException('Messages must be an array');
    }

    if (messages.length === 0) {
      throw new BadRequestException('Messages cannot be empty');
    }

    for (const msg of messages) {
      if (
          !msg ||
          (msg.role !== 'user' && msg.role !== 'assistant') ||
          !msg.content ||
          typeof msg.content !== 'string'
      ) {
        throw new BadRequestException('Invalid message format');
      }
    }

    const response = await this.aiService.chat(messages);

    if (!response) {
      throw new BadRequestException('Empty AI response');
    }

    return {
      message: response,
    };
  }
}
