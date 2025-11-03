export interface LeadOwnerDetails {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface ZohoLeadDetails {
  id?: string;
  first_name?: string;
  last_name?: string;
  mobile?: string;
  email?: string;
  status?: string;
  lead_disposition?: string;
  lead_source?: string;
  country?: string;
  state?: string;
  city?: string;
  street?: string;
  description?: string;
}

export interface LeadWithOwnerDetails {
  id: number;
  organisation_id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  source?: string | null;
  status?: string | null;
  is_indian: number;
  additional_info?: any;
  logs?: any;
  follow_ups: number;
  created_at: Date;
  updated_at: Date;
  next_follow_up?: Date | null;
  in_process: number;
  
  // Lead Owner Details (structured)
  lead_owner?: LeadOwnerDetails;
  
  // Zoho Lead Details (structured)
  zoho_lead?: ZohoLeadDetails;
  
  // Related entities
  organisation?: {
    id: number;
    name: string;
    slug: string;
  };
  
  agents?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  
  conversations?: Array<{
    id: number;
    name: string;
    type: string;
    created_at: Date;
  }>;
}