interface BankChangeIndicatorProps {
  change: number;
}

export default function BankChangeIndicator({ change }: BankChangeIndicatorProps) {
  const isPositive = change >= 0;
  const color = isPositive ? 'text-green-600' : 'text-red-600';
  const bgColor = isPositive ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900';
  const icon = isPositive ? '⬆️' : '⬇️';

  return (
    <div className={`text-center py-4 rounded-lg ${bgColor}`}>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Emotional Bank Account</div>
      <div className={`text-3xl font-bold ${color} flex items-center justify-center gap-2`}>
        <span>{icon}</span>
        <span>
          {isPositive ? '+' : ''}
          {change}
        </span>
      </div>
    </div>
  );
}
