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
    is_indian?: number;
    page: number;
    limit: number;
}