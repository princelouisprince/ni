function DashboardCard({ title, value, icon: Icon, color = 'wood' }) {
  const colorClasses = {
    wood: 'bg-wood-50 border-wood-200 text-wood-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    stone: 'bg-stone-100 border-stone-200 text-stone-700',
  };

  return (
    <div className={`card border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-stone-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default DashboardCard;
