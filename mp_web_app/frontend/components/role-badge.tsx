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

const USER_ROLE_BADGE_CONFIGS: Record<string, BadgeConfig> = {
  regular: {letter: "О", tooltip: "Обикновен", className: "border-gray-400 text-gray-500"},
  board: {letter: "У", tooltip: "Управителен съвет", className: "border-gray-400 text-gray-500"},
  control: {letter: "К", tooltip: "Контролен съвет", className: "border-gray-400 text-gray-500"},
  accountant: {letter: "С", tooltip: "Счетоводител", className: "border-gray-400 text-gray-500"},
  admin: {letter: "А", tooltip: "Администратор", className: "border-gray-400 text-gray-500"},
};

function Badge({cfg}: {cfg: BadgeConfig}) {
  return (
    <span
      title={cfg.tooltip}
      className={`inline-flex items-center justify-center w-5 h-5 rounded-sm border-2 font-bold text-[10px] leading-none select-none cursor-default ${cfg.className}`}
    >
      {cfg.letter}
    </span>
  );
}

export function RoleBadge({proxy, board, control}: RoleBadgeProps) {
  const active = [proxy, board, control];
  const badges = BADGE_CONFIGS.filter((_, i) => active[i]);

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {badges.map((badge) => (
        <Badge key={badge.letter} cfg={badge} />
      ))}
    </div>
  );
}

export function UserRoleBadge({role}: {role?: string}) {
  if (!role) return <span className="text-muted-foreground">-</span>;
  const cfg = USER_ROLE_BADGE_CONFIGS[role];
  if (!cfg) return <span>{role}</span>;
  return (
    <div className="flex items-center gap-1">
      <Badge cfg={cfg} />
    </div>
  );
}
