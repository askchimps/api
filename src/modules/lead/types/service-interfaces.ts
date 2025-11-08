import { ChatSource } from './enums';

export interface GetLeadsFilters {
    page?: number;
    limit?: number;
    status?: string;
    source?: string;
    is_indian?: number;
    start_date?: string;
    end_date?: string;
}

export interface CreateZohoLeadOwnerData {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
}

export interface CreateZohoLeadData {
    id?: string;
    lead_owner_id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    status?: string;
    source?: string;
    disposition?: string;
    country?: string;
    state?: string;
    city?: string;
    requires_human_action?: number;
    is_handled_by_human?: number;
}

export interface CreateLeadData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number: string;
    source?: string;
    status?: string;
    is_indian?: number;
    follow_up_count?: number;
    reschedule_count?: number;
    last_follow_up?: Date | string;
    next_follow_up?: Date | string;
    remove_follow_up?: number;
    call_active?: number;
    organisations?: string[];
    zoho_lead_owner?: CreateZohoLeadOwnerData;
    zoho_lead?: CreateZohoLeadData;
}

export interface UpdateZohoLeadOwnerData {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
}

export interface UpdateZohoLeadData {
    id?: string;
    lead_owner_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    status?: string;
    source?: string;
    disposition?: string;
    country?: string;
    state?: string;
    city?: string;
    requires_human_action?: number;
    is_handled_by_human?: number;
}

export interface UpdateLeadData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    source?: string;
    status?: string;
    is_indian?: number;
    follow_up_count?: number;
    reschedule_count?: number;
    last_follow_up?: Date | string;
    next_follow_up?: Date | string;
    remove_follow_up?: number;
    call_active?: number;
    organisations?: string[];
    zoho_lead_owner?: UpdateZohoLeadOwnerData;
    zoho_lead?: UpdateZohoLeadData;
}

export interface GetLeadCallsFilters {
    page?: number;
    limit?: number;
    status?: string;
    direction?: string;
}

export interface GetLeadChatsFilters {
    page?: number;
    limit?: number;
    status?: string;
    source?: ChatSource;
}