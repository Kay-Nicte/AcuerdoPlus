// Tipos de usuario
export interface User {
  uid: string;
  email: string;
  displayName: string; // Nombre visible (Carmen, Álex, etc.)
  relationToMinor?: string; // madre, padre, tutor, etc.
  showRelation: boolean; // Si mostrar la relación junto al nombre
  deactivatedAt?: Date; // Si la cuenta fue desactivada
  createdAt: Date;
}

// Tipos de acuerdo
// Tipos de acuerdo
export interface Agreement {
  id: string;
  createdBy: string;
  members: string[];
  createdAt: Date;
  economicModel: "fixed" | "shared" | "mixed";
  custodyType?: "shared" | "majority" | "exclusive"; // Nuevo campo
  majorityCustodian?: string; // UID del custodio mayoritario (si aplica)
  exclusiveCustodian?: string; // UID del custodio exclusivo (si aplica)
  approvalMode: boolean;
}

// Tipos de menor
export interface Minor {
  id: string;
  agreementId: string;
  name: string;
  birthDate?: Date;
  isActive: boolean; // Nunca se elimina, solo se marca inactivo
  addedBy: string; // UID del adulto que lo añadió
  createdAt: Date;
}

// Tipos de manutención
export interface Maintenance {
  id: string;
  agreementId: string;
  minorId: string;
  month: string; // formato: YYYY-MM
  amount: number;
  payerUid: string; // UID del que paga
  status: "pending" | "paid";
  proofUrl?: string; // URL del comprobante en Storage
  paidAt?: Date;
  createdAt: Date;
}

// Tipos de gastos
export interface Expense {
  id: string;
  agreementId: string;
  minorId: string;
  type: "ordinary" | "extraordinary";
  description: string;
  amount: number;
  paidBy: string; // UID del que pagó
  splitPercentage: { [uid: string]: number }; // Porcentaje de cada uno
  receiptUrl?: string;
  date: Date;
  createdAt: Date;
  correctedBy?: string; // Si fue corregido, ID del gasto original
}

// Tipos de evento de calendario
export interface CalendarEvent {
  id: string;
  agreementId: string;
  minorId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  assignedTo: string; // UID del adulto asignado
  isPattern?: boolean; // Si es patrón automático (premium)
  patternRule?: string; // Regla de repetición
  requiresApproval: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  approvalExpiresAt?: Date; // Fecha de caducidad de la solicitud
  approvedBy?: string;
  rejectionReason?: string; // Motivo opcional de rechazo
  createdBy: string;
  createdAt: Date;
}

// Tipos de autorización (Premium)
export interface Authorization {
  id: string;
  agreementId: string;
  minorId: string;
  activity: string;
  description: string;
  documentUrls: string[];
  authorizations: { [uid: string]: boolean | null }; // true=autoriza, false=no autoriza, null=pendiente
  status: "pending" | "approved" | "rejected";
  revokedAt?: Date;
  revocationRequestedBy?: string; // UID del que pidió revocar
  addedToCalendar: boolean;
  calendarEventId?: string;
  createdBy: string;
  createdAt: Date;
}

// Tipos de mensaje de chat
export interface ChatMessage {
  id: string;
  agreementId: string;
  senderUid: string;
  senderName: string;
  message: string;
  timestamp: Date;
  hiddenFor: string[]; // UIDs que ocultaron el mensaje
}

// Tipos de entrada de histórico
export interface HistoryEntry {
  id: string;
  agreementId: string;
  action: string; // Descripción de la acción
  performedBy: string; // UID y nombre del que realizó la acción
  performedByName: string;
  entityType:
    | "expense"
    | "maintenance"
    | "calendar"
    | "authorization"
    | "chat"
    | "minor"
    | "agreement";
  entityId: string;
  timestamp: Date;
  details?: any; // Detalles adicionales de la acción
}

// Tipos de patrón de custodia recurrente
export interface PatternRule {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  alternating: boolean;
  assignments: [string, string]; // parent UIDs that alternate
  durationDays: number; // days per turn (7 = one week)
  endDate?: string; // ISO date, optional end boundary
}

// Tipos de suscripción
export interface Subscription {
  agreementId: string;
  paidByUid: string; // Quién realiza el pago
  plan: "free" | "premium";
  startDate?: Date;
  endDate?: Date;
  autoRenew: boolean;
}
