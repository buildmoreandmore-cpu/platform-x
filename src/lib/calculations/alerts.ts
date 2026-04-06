import { ContractExtraction, Alert, AlertType, AlertSeverity } from '@/types/vantage'
import { SavingsResult } from './savings'

export function generateAlertsFromContract(
  contractId: string,
  extraction: ContractExtraction
): Omit<Alert, 'id' | 'created_at'>[] {
  const alerts: Omit<Alert, 'id' | 'created_at'>[] = []

  if (extraction.dscr_requirement && extraction.dscr_requirement <= 1.05) {
    alerts.push({
      contract_id: contractId,
      ecm_id: undefined,
      alert_type: 'dscr_watch',
      severity: 'warning',
      title: 'DSCR Near Minimum Threshold',
      description: `DSCR requirement is ${extraction.dscr_requirement}. Any savings shortfall could breach debt service coverage.`,
      triggered_value: extraction.dscr_requirement,
      threshold_value: 1.0,
      status: 'active',
      acknowledged: false,
      resolved_at: null,
    })
  }

  const ecmsWithoutMV = extraction.ecms?.filter(e => !e.mv_option) || []
  if (ecmsWithoutMV.length > 0) {
    alerts.push({
      contract_id: contractId,
      ecm_id: undefined,
      alert_type: 'mv_due',
      severity: 'info',
      title: `${ecmsWithoutMV.length} ECM(s) Missing M&V Methodology`,
      description: `The following ECMs have no specified M&V option: ${ecmsWithoutMV.map(e => e.name).join(', ')}. Request clarification from ESCO.`,
      triggered_value: ecmsWithoutMV.length,
      threshold_value: 0,
      status: 'active',
      acknowledged: false,
      resolved_at: null,
    })
  }

  return alerts
}

export function checkDriftAlerts(
  contractId: string,
  ecms: any[],
  savings: SavingsResult
): Omit<Alert, 'id' | 'created_at'>[] {
  const alerts: Omit<Alert, 'id' | 'created_at'>[] = []

  if (savings.performance_pct < 80) {
    alerts.push({
      contract_id: contractId,
      ecm_id: undefined,
      alert_type: 'drift',
      severity: savings.performance_pct < 60 ? 'critical' : 'warning',
      title: 'Savings Performance Below Threshold',
      description: `Verified savings are ${savings.performance_pct.toFixed(1)}% of guaranteed baseline. Review ECM performance immediately.`,
      triggered_value: savings.performance_pct,
      threshold_value: 90,
      status: 'active',
      acknowledged: false,
      resolved_at: null,
    })
  }

  return alerts
}
