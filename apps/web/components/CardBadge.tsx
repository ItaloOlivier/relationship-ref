interface CardBadgeProps {
  type: 'GREEN' | 'YELLOW' | 'RED';
  count: number;
  size?: 'sm' | 'md';
}

export default function CardBadge({ type, count, size = 'md' }: CardBadgeProps) {
  const colors = {
    GREEN: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
    YELLOW: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
    RED: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
  };

  const sizeClasses = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2';

  return (
    <div className={`flex items-center gap-2 border rounded-lg ${colors[type]} ${sizeClasses}`}>
      <span className="font-semibold">{type}</span>
      <span className="text-2xl font-bold">{count}</span>
    </div>
  );
}
