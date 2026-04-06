export type DocumentType = 'espc_contract' | 'utility_bill' | 'mv_report'
export type ProcessingStatus = 'pending' | 'processing' | 'complete' | 'error'
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertType = 'drift' | 'shortfall' | 'dscr_watch' | 'outperform' | 'mv_due'
export type MVOption = 'A' | 'B' | 'C' | 'D'
export type UtilityType = 'electricity' | 'gas' | 'water'

export interface Contract {
  id: string
  created_at: string
  client_name: string
  building_name: string
  building_address: string
  esco_name: string
  contract_value: number
  contract_term_years: number
  performance_period_start: string
  performance_period_end: string
  current_year: number
  financing_type: string
  guaranteed_savings_annual: number
  dscr_requirement: number
  shortfall_remedy_clause: string
  status: string
  raw_extraction: ContractExtraction
  document_path: string
  document_name: string
}

export interface ContractExtraction {
  esco_name: string
  contract_value: number
  contract_term_years: number
  performance_period_start: string
  financing_type: string
  guaranteed_savings_annual: number
  dscr_requirement: number
  shortfall_remedy_clause: string
  ecms: ECMExtraction[]
  raw_text_summary: string
  confidence_score: number
  extraction_notes: string[]
}

export interface ECMExtraction {
  name: string
  measure_type: string
  description: string
  guaranteed_savings_annual: number
  baseline_value: number
  baseline_unit: string
  mv_methodology: string
  mv_option: MVOption
  measurement_boundary: string
}

export interface ECM {
  id: string
  contract_id: string
  name: string
  measure_type: string
  description: string
  guaranteed_savings_annual: number
  baseline_value: number
  baseline_unit: string
  mv_methodology: string
  mv_option: MVOption
  verified_savings_ytd: number
  performance_percentage: number
  status: string
  drift_threshold_pct: number
  alert_active: boolean
}

export interface UtilityReading {
  id: string
  contract_id: string
  billing_period_start: string
  billing_period_end: string
  billing_year: number
  billing_month: number
  utility_type: UtilityType
  consumption_value: number
  consumption_unit: string
  demand_kw: number
  total_cost: number
  rate_schedule: string
  account_number: string
  baseline_consumption: number
  avoided_consumption: number
  verified_savings_dollars: number
  raw_extraction: UtilityExtraction
}

export interface UtilityExtraction {
  account_number: string
  utility_type: UtilityType
  billing_period_start: string
  billing_period_end: string
  consumption_value: number
  consumption_unit: string
  demand_kw: number
  total_cost: number
  rate_schedule: string
  confidence_score: number
  extraction_notes: string[]
}

export interface MVReportExtraction {
  report_period_start: string
  report_period_end: string
  report_year: number
  esco_reported_savings: number
  ecm_savings: { ecm_name: string; reported_savings: number }[]
  baseline_adjustments: string[]
  methodology_notes: string
  confidence_score: number
  extraction_notes: string[]
}

export interface Alert {
  id: string
  created_at: string
  resolved_at: string | null
  contract_id: string
  ecm_id?: string
  alert_type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  triggered_value: number
  threshold_value: number
  status: string
  acknowledged: boolean
}

export interface VantageDocument {
  id: string
  created_at: string
  contract_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  document_type: DocumentType
  processing_status: ProcessingStatus
  processed_at: string | null
  extraction_id: string | null
  error_message: string | null
}

export interface UploadResult {
  success: boolean
  document_id: string
  document_type: DocumentType
  extraction: ContractExtraction | UtilityExtraction | MVReportExtraction
  records_created: string[]
  alerts_triggered: Alert[]
  error?: string
}
