import { IsOptional, IsString, IsDateString } from 'class-validator';
import { CONVERSATION_TYPE } from '@prisma/client';

export class GetAnalyticsDto {
  @IsOptional()
  @IsString()
  agent?: string; // agent_slug_or_id

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  type?: CONVERSATION_TYPE; // CHAT or CALL

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface ProcessedAnalyticsFilters {
  agent_slug_or_id?: string;
  source?: string;
  type?: CONVERSATION_TYPE;
  startDate?: Date;
  endDate?: Date;
}

// Core analytics metrics
export interface ConversationAnalytics {
  totalConversations: number;
  totalCalls: number;
  averageConversationLength: number; // Average number of messages per conversation
  averageCallLength: number; // Average call duration in minutes
  totalLeadsGenerated: number;
  leadsWithFollowUp: number; // Count of leads that have a next_follow_up value
}

// Daily breakdown for analytics
export interface DailyAnalyticsBreakdown {
  date: string; // YYYY-MM-DD format
  conversations: number;
  calls: number;
  leads: number;
}

// Main analytics response interface
export interface AnalyticsResponse {
  creditsPlan: string;
  remainingConversationCredits: number;
  remainingCallCredits: number;
  usedConversationCredits: number;
  usedCallCredits: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  conversationAnalytics: ConversationAnalytics;
  dailyBreakdown: DailyAnalyticsBreakdown[];
  filters: {
    agent?: string;
    source?: string;
    type?: CONVERSATION_TYPE;
  };
  types: Array<{ label: string; value: string }>;
  sources: Array<{ label: string; value: string }>;
  agents: Array<{ label: string; value: string }>;
}
