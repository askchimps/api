export interface PaginationParams {
    page: number;
    limit: number;
}

export interface ChatsFilterParams {
    startDate?: string;
    endDate?: string;
    status?: string;
    source?: string;
    page: number;
    limit: number;
}

export interface CallsFilterParams {
    start_date?: string;
    end_date?: string;
    status?: string;
    direction?: string;
    source?: string;
    page: number;
    limit: number;
}

export interface LeadsFilterParams {
    start_date?: string;
    end_date?: string;
    status?: string;
    source?: string;
    zoho_status?: string;
    zoho_lead_owner?: string;
    is_indian?: number;
    search?: string;
    page: number;
    limit: number;
}