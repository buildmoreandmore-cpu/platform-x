export function buildUtilityPrompt(): string {
  return `You are an energy data analyst for Vantage Infrastructure Group.

Extract billing data from this utility bill document. This data will be used to calculate verified energy savings against guaranteed ESPC baselines.

Be precise with numbers. Extract exactly what is printed on the bill. If multiple meters or accounts appear, extract all of them as separate entries.

Return ONLY valid JSON. No explanation, no markdown. Raw JSON only.

{
  "bills": [
    {
      "account_number": "string | null",
      "utility_type": "electricity | gas | water",
      "billing_period_start": "YYYY-MM-DD | null",
      "billing_period_end": "YYYY-MM-DD | null",
      "consumption_value": "number | null",
      "consumption_unit": "kWh | therms | CCF | gallons | null",
      "demand_kw": "number | null (peak demand if electricity)",
      "total_cost": "number | null",
      "rate_schedule": "string | null",
      "confidence_score": "number 0-1",
      "extraction_notes": ["array of strings"]
    }
  ]
}`
}
