import { UtilityExtraction } from '@/types/vantage'

export interface SavingsResult {
  avoided_consumption: number
  verified_savings: number
  performance_pct: number
}

export function calculateVerifiedSavings(
  bill: UtilityExtraction,
  monthlyBaseline: number
): SavingsResult {
  if (!bill.consumption_value || !monthlyBaseline) {
    return { avoided_consumption: 0, verified_savings: 0, performance_pct: 0 }
  }

  const avoided = Math.max(0, monthlyBaseline - bill.consumption_value)
  const avgRate = bill.total_cost && bill.consumption_value > 0
    ? bill.total_cost / bill.consumption_value
    : 0.12

  const verifiedSavings = avoided * avgRate
  const performancePct = monthlyBaseline > 0
    ? (avoided / monthlyBaseline) * 100
    : 0

  return {
    avoided_consumption: avoided,
    verified_savings: verifiedSavings,
    performance_pct: performancePct,
  }
}

export function calculateDSCR(
  verifiedSavingsAnnual: number,
  annualDebtService: number
): number {
  if (annualDebtService <= 0) return 0
  return verifiedSavingsAnnual / annualDebtService
}

export function calculateShortfall(
  guaranteedAnnual: number,
  verifiedYTD: number,
  monthsElapsed: number
): number {
  const guaranteedYTD = (guaranteedAnnual / 12) * monthsElapsed
  return Math.max(0, guaranteedYTD - verifiedYTD)
}
