interface TraitGaugeProps {
  label: string;
  value: number;
  description?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export default function TraitGauge({ label, value, description, color = 'blue' }: TraitGaugeProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const bgColorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900',
    green: 'bg-green-100 dark:bg-green-900',
    yellow: 'bg-yellow-100 dark:bg-yellow-900',
    red: 'bg-red-100 dark:bg-red-900',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="font-semibold">{label}</div>
          {description && (
            <div className="text-xs text-gray-600 dark:text-gray-400">{description}</div>
          )}
        </div>
        <div className="text-lg font-bold">{value}%</div>
      </div>
      <div className={`w-full h-3 ${bgColorClasses[color]} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
