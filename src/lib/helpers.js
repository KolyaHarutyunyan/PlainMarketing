export const formatDollars = value => {
    return `$ ${(value || 0.0).toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};