import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { SendContactDto } from './dto/send-contact.dto';

@Controller('contact')
@UseGuards(ThrottlerGuard)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  // 3 requests per 10 minutes (600 s) per IP
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async sendContact(@Body() dto: SendContactDto) {
    await this.contactService.handleContact(dto);
    return { message: 'Повідомлення відправлено!' };
  }
}
