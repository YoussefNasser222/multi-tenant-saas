import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@common/decorators';
import { AssistantService } from './assistant.service';
import { AssistantChatDto } from './dto/assistant-chat.dto';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 15 } })
  async chat(@Body() dto: AssistantChatDto) {
    const result = await this.assistantService.chat(dto.message, dto.role);
    return {
      message: 'ok',
      success: true,
      data: result,
    };
  }
}
