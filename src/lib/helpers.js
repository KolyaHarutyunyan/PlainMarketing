export const formatDollars = ({ value, digits = 2 }) => {
  return `$ ${(value || 0.0).toFixed(digits)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
