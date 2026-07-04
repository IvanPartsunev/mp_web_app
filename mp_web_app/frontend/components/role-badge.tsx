interface RoleBadgeProps {
  proxy?: boolean;
  board?: boolean;
  control?: boolean;
}

interface BadgeConfig {
  letter: string;
  tooltip: string;
  className: string;
}

const BADGE_CONFIGS: BadgeConfig[] = [
  {
    letter: "П",
    tooltip: "Пълномощник",
    className: "border-gray-400 text-gray-500",
  },
  {
    letter: "У",
    tooltip: "Управителен съвет",
    className: "border-gray-400 text-gray-500",
  },
  {
    letter: "К",
    tooltip: "Контролен съвет",
    className: "border-gray-400 text-gray-500",
  },
];

export function RoleBadge({proxy, board, control}: RoleBadgeProps) {
  const active = [proxy, board, control];
  const badges = BADGE_CONFIGS.filter((_, i) => active[i]);

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {badges.map((badge) => (
        <span
          key={badge.letter}
          title={badge.tooltip}
          className={`inline-flex items-center justify-center w-5 h-5 rounded-sm border-2 font-bold text-[10px] leading-none select-none cursor-default ${badge.className}`}
        >
          {badge.letter}
        </span>
      ))}
    </div>
  );
}
