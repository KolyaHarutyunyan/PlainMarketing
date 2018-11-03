export const formatDollars = ({ value, digits = 2, space = true }) => {
  return `$${space ? ' ' : ''}${(value || 0.0).toFixed(digits)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
