export function formatCLP(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function getDateInputValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function formatRole(role: string) {
  return role
    .toLowerCase()
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

export function appointmentStatusLabel(status: string) {
  return {
    PENDING_PAYMENT: 'Pendiente pago',
    CONFIRMED: 'Confirmada',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Completada',
    NO_SHOW: 'No asistió'
  }[status] ?? status;
}

export function paymentStatusLabel(status: string) {
  return {
    PENDING: 'Pendiente',
    VALIDATED: 'Pagado',
    REJECTED: 'Rechazado',
    REFUNDED: 'Devuelto'
  }[status] ?? status;
}

export function reservationStatusLabel(status: string) {
  return {
    PENDING_PAYMENT: 'Pendiente pago',
    VOUCHER_RECEIVED: 'Comprobante recibido',
    CONFIRMED: 'Confirmada',
    EXPIRED: 'Vencida',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Completada'
  }[status] ?? status;
}
