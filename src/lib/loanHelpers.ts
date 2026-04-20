export const formatCurrency = (amount: number) => {
  return '₹' + amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return { bg: '#fef3c7', color: '#92400e' };
    case 'active':
      return { bg: '#dbeafe', color: '#1e40af' };
    case 'completed':
      return { bg: '#d1fae5', color: '#065f46' };
    case 'rejected':
      return { bg: '#fee2e2', color: '#991b1b' };
    case 'overdue':
      return { bg: '#fee2e2', color: '#991b1b', fontWeight: '600' };
    default:
      return { bg: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' };
  }
};

export const calculateDaysOverdue = (dueDate: string) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};
