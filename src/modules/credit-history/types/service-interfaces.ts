export interface CreditHistoryFilterParams {
    page: number;
    limit: number;
    org?: string;
    change_type?: string;
    change_field?: string;
    start_date?: string;
    end_date?: string;
}

export interface CreditHistoryEntry {
    change_amount: number;
    change_type: string;
    change_field: string;
    prev_value: number;
    new_value: number;
    reason: string;
}

export interface BulkCreditHistoryData {
    org: string;
    entries: CreditHistoryEntry[];
}