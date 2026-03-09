export const formatDate = (date: Date): string => {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatMonth = (date: Date): string => {
  const d = date instanceof Date ? date : new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}`;
};

export const formatMonthLabel = (yearMonth: string): string => {
  const [year, month] = yearMonth.split('-');
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2).replace('.', ',')} \u20AC`;
};

export const formatDateTime = (date: Date): string => {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const formatDateISO = (date: Date): string => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const isFutureDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = date instanceof Date ? date : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d > today;
};
