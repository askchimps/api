import { Injectable } from '@nestjs/common';
import { SignInDTO } from './dto/signin.dto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';

@Injectable()
export class AuthService {
  private supabaseClient: SupabaseClient;
  constructor(private readonly logger: PinoLoggerService) {
    this.supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );
  }

  async signIn(data: SignInDTO) {
    const methodName = 'signIn';
    this.logger.log(
      JSON.stringify({ title: `${methodName} - start`, data }),
      methodName,
    );

    const res = await this.supabaseClient.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    this.logger.log(
      JSON.stringify({ title: `${methodName} - end`, data: res }),
      methodName,
    );

    return res;
  }
}
