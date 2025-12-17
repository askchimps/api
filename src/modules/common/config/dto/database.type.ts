export type IDatabaseConfig = {
  PUBLIC_DATABASE_URL: string;
  PUBLIC_DIRECT_URL?: string;
  MAGPIE_DATABASE_URL: string;
  MAGPIE_DIRECT_URL?: string;
  SUNROOF_DATABASE_URL: string;
  SUNROOF_DIRECT_URL?: string;
  // Legacy support
  DATABASE_URL?: string;
};
