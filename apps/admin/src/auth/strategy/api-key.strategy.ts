import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-headerapikey';
import { AuthService } from '../auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'apiKey') {
  constructor(private readonly authService: AuthService) {
    super({ header: 'X-API-KEY', prefix: '' }, true, (apiKey: string, done) => {
      return this.validate(apiKey, done);
    });
  }

  validate(
    apiKey: string,
    done: (error: Error, data: boolean) => unknown,
  ): void {
    if (this.authService.validateApiKey(apiKey)) {
      done(null, true);
    }

    done(new UnauthorizedException(), null);
  }
}
