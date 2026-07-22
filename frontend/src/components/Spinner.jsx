import React from 'react';

const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin ${className}`} />
  );
};

export const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-64">
    <Spinner size="lg" />
  </div>
);

export default Spinner;
