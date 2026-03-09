import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { expenseService } from './expenseService';
import { maintenanceService } from './maintenanceService';
import { calendarService } from './calendarService';
import { chatService } from './chatService';
import { minorService } from './minorService';
import { historyService } from './historyService';
import { formatDate, formatCurrency, formatMonthLabel } from '../utils/formatters';

type Section = 'minors' | 'maintenance' | 'expenses' | 'calendar' | 'chat' | 'history';

export const pdfExportService = {
  async generatePdfHtml(
    agreementId: string,
    sections: Section[],
    dateRange?: { start: Date; end: Date }
  ): Promise<string> {
    let html = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #A93D5C; border-bottom: 2px solid #A93D5C; padding-bottom: 8px; }
          h2 { color: #A93D5C; margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #A93D5C; color: white; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          .pending { background: #FFF3E0; color: #FF9800; }
          .paid, .approved { background: #E8F5E9; color: #4CAF50; }
          .rejected { background: #FFEBEE; color: #F44336; }
        </style>
      </head>
      <body>
      <h1>Acuerdo+ - Informe</h1>
      <p>Generado el ${formatDate(new Date())}</p>
      ${dateRange ? `<p>Período: ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}</p>` : ''}
    `;

    if (sections.includes('minors')) {
      const minors = await minorService.getMinors(agreementId);
      html += '<h2>Menores</h2>';
      html += '<table><tr><th>Nombre</th><th>Fecha nacimiento</th><th>Estado</th></tr>';
      for (const m of minors) {
        html += `<tr><td>${m.name}</td><td>${m.birthDate ? formatDate(m.birthDate) : '-'}</td><td>Activo</td></tr>`;
      }
      html += '</table>';
    }

    if (sections.includes('maintenance')) {
      let records = await maintenanceService.getMaintenanceRecords(agreementId);
      if (dateRange) {
        const startMonth = `${dateRange.start.getFullYear()}-${String(dateRange.start.getMonth() + 1).padStart(2, '0')}`;
        const endMonth = `${dateRange.end.getFullYear()}-${String(dateRange.end.getMonth() + 1).padStart(2, '0')}`;
        records = records.filter(r => r.month >= startMonth && r.month <= endMonth);
      }
      html += '<h2>Manutención</h2>';
      html += '<table><tr><th>Mes</th><th>Cantidad</th><th>Estado</th></tr>';
      for (const r of records) {
        html += `<tr><td>${formatMonthLabel(r.month)}</td><td>${formatCurrency(r.amount)}</td><td><span class="badge ${r.status}">${r.status === 'paid' ? 'Pagado' : 'Pendiente'}</span></td></tr>`;
      }
      html += '</table>';
    }

    if (sections.includes('expenses')) {
      let expenses = await expenseService.getExpenses(agreementId);
      if (dateRange) {
        expenses = expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end);
      }
      html += '<h2>Gastos</h2>';
      html += '<table><tr><th>Descripción</th><th>Tipo</th><th>Cantidad</th><th>Fecha</th></tr>';
      for (const e of expenses) {
        html += `<tr><td>${e.description}</td><td>${e.type === 'ordinary' ? 'Ordinario' : 'Extraordinario'}</td><td>${formatCurrency(e.amount)}</td><td>${formatDate(e.date)}</td></tr>`;
      }
      html += '</table>';
    }

    if (sections.includes('calendar')) {
      const events = await calendarService.getEvents(
        agreementId,
        dateRange?.start,
        dateRange?.end
      );
      html += '<h2>Calendario</h2>';
      html += '<table><tr><th>Título</th><th>Inicio</th><th>Fin</th><th>Estado</th></tr>';
      for (const ev of events) {
        const status = ev.approvalStatus || 'N/A';
        html += `<tr><td>${ev.title}</td><td>${formatDate(ev.startDate)}</td><td>${formatDate(ev.endDate)}</td><td>${status}</td></tr>`;
      }
      html += '</table>';
    }

    if (sections.includes('chat')) {
      let messages = await chatService.getMessages(agreementId);
      if (dateRange) {
        messages = messages.filter(m => m.timestamp >= dateRange.start && m.timestamp <= dateRange.end);
      }
      html += '<h2>Mensajes</h2>';
      html += '<table><tr><th>Remitente</th><th>Mensaje</th><th>Fecha</th></tr>';
      for (const msg of messages.reverse()) {
        html += `<tr><td>${msg.senderName}</td><td>${msg.message}</td><td>${formatDate(msg.timestamp)}</td></tr>`;
      }
      html += '</table>';
    }

    if (sections.includes('history')) {
      let entries = await historyService.getHistory(agreementId);
      if (dateRange) {
        entries = entries.filter(e => e.timestamp >= dateRange.start && e.timestamp <= dateRange.end);
      }
      html += '<h2>Histórico</h2>';
      html += '<table><tr><th>Acción</th><th>Realizado por</th><th>Fecha</th></tr>';
      for (const entry of entries) {
        html += `<tr><td>${entry.action}</td><td>${entry.performedByName}</td><td>${formatDate(entry.timestamp)}</td></tr>`;
      }
      html += '</table>';
    }

    html += '</body></html>';
    return html;
  },

  async exportPdf(
    agreementId: string,
    sections: Section[],
    dateRange?: { start: Date; end: Date }
  ): Promise<void> {
    const html = await this.generatePdfHtml(agreementId, sections, dateRange);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  },
};
