import { IAppConfig } from './app.type';
import { IDatabaseConfig } from './database.type';
import { IJwtConfig } from './jwt.type';
import { IOpenAIConfig } from './openai.type';
import { ISupabaseConfig } from './supabase.type';
import { IWebSocketConfig } from './websocket.type';

export * from './app.type';

type ConfigDto = IAppConfig &
  IDatabaseConfig &
  IJwtConfig &
  IOpenAIConfig &
  ISupabaseConfig &
  IWebSocketConfig;
export default ConfigDto;
