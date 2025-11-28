const numberFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const percentageFormatter = new Intl.NumberFormat('es-MX', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

export const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return numberFormatter.format(value)
}

export const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return currencyFormatter.format(value)
}

export const formatPercentage = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return percentageFormatter.format(value / 100)
}
