import {
  formatDate,
  formatCurrency,
  formatDateTime,
  initials,
  isUpcomingSession,
  isPreviousSession,
  daysUntil,
  translateStatus,
  translateType,
  translateMethod,
  invoiceBalance
} from './portalUtils';

const arT = {
  statusActive: 'نشطة',
  closed: 'مغلقة',
  typeCivil: 'مدني',
  methodCash: 'نقدي'
};

describe('portalUtils', () => {
  describe('formatDate', () => {
    it('formats Arabic dates as dd/MM/yyyy', () => {
      expect(formatDate('2025-03-15', 'ar')).toBe('15/03/2025');
    });

    it('formats English dates as MMM d, yyyy', () => {
      expect(formatDate('2025-03-15', 'en')).toBe('Mar 15, 2025');
    });

    it('returns null for empty or invalid values', () => {
      expect(formatDate(null, 'ar')).toBeNull();
      expect(formatDate('', 'ar')).toBeNull();
      expect(formatDate('not-a-date', 'ar')).toBeNull();
    });
  });

  describe('formatDateTime', () => {
    it('includes time for valid date', () => {
      expect(formatDateTime('2025-03-15T09:30:00', 'en')).toMatch(/Mar 15, 2025 \d{2}:\d{2}/);
    });

    it('returns null for invalid date', () => {
      expect(formatDateTime(null, 'en')).toBeNull();
    });
  });

  describe('formatCurrency', () => {
    it('formats to 3 decimal places', () => {
      expect(formatCurrency('900')).toBe('900.000');
      expect(formatCurrency('450.5')).toBe('450.500');
      expect(formatCurrency(null)).toBe('0.000');
    });
  });

  describe('initials', () => {
    it('extracts initials from a name', () => {
      expect(initials('عبدالله يوسف')).toBe('عي');
      expect(initials('Ahmed Khalid')).toBe('AK');
    });

    it('falls back for empty names', () => {
      expect(initials('')).toBe('?');
      expect(initials(null)).toBe('?');
    });
  });

  describe('session classification', () => {
    const now = new Date('2025-06-01T12:00:00');

    it('classifies future sessions as upcoming', () => {
      expect(isUpcomingSession({ date: '2025-06-10T09:00:00' }, now)).toBe(true);
    });

    it('classifies same-day sessions as upcoming', () => {
      expect(isUpcomingSession({ date: '2025-06-01T08:00:00' }, now)).toBe(true);
    });

    it('classifies past sessions as previous', () => {
      expect(isUpcomingSession({ date: '2025-05-20T09:00:00' }, now)).toBe(false);
      expect(isPreviousSession({ date: '2025-05-20T09:00:00' }, now)).toBe(true);
    });

    it('handles invalid dates', () => {
      expect(isUpcomingSession({ date: 'nope' }, now)).toBe(false);
    });
  });

  describe('daysUntil', () => {
    it('computes calendar-day difference', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      expect(daysUntil(future.toISOString())).toBe(5);
    });

    it('returns null for invalid dates', () => {
      expect(daysUntil('nope')).toBeNull();
    });
  });

  describe('translation helpers', () => {
    it('maps statuses through t', () => {
      expect(translateStatus(arT, 'active')).toBe('نشطة');
      expect(translateStatus(arT, 'closed')).toBe('مغلقة');
    });

    it('falls back to a readable raw value for unknown statuses', () => {
      expect(translateStatus(arT, 'unknown_value')).toBe('unknown value');
    });

    it('maps types and methods', () => {
      expect(translateType(arT, 'civil')).toBe('مدني');
      expect(translateMethod(arT, 'cash')).toBe('نقدي');
      expect(translateType(arT, 'unknown')).toBe('unknown');
    });
  });

  describe('invoiceBalance', () => {
    it('computes remaining balance', () => {
      expect(invoiceBalance({ totalAmount: '900.000', paidAmount: '450.000' })).toBe(450);
    });
  });
});
