export interface CallFilterParams {
    page: number;
    limit: number;
    status?: string;
    direction?: string;
    source?: string;
    start_date?: string;
    end_date?: string;
    organisation_id?: number;
    agent_id?: number;
    lead_id?: number;
}

export interface PaginationParams {
    page: number;
    limit: number;
}

export interface CreateMessageData {
    role: string;
    content: string;
    created_at?: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_cost?: number;
}

export interface UpdateMessageData {
    id?: number;
    role?: string;
    content?: string;
    created_at?: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_cost?: number;
    is_deleted?: number;
}

export interface CreateCostData {
    type: string;
    amount: number;
    summary?: string;
    message_id?: number;
}

export interface UpdateCostData {
    id?: number;
    type?: string;
    amount?: number;
    summary?: string;
    message_id?: number;
    is_deleted?: number;
}