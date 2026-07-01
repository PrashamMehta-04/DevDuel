import React from 'react';
import { Shield, Medal, Trophy, Star, Crown, Zap } from 'lucide-react';

export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Grandmaster';

export const getRankFromElo = (elo: number): { tier: RankTier, color: string, bg: string, icon: React.FC<any> } => {
  if (elo < 1200) return { tier: 'Bronze', color: 'text-amber-700', bg: 'from-amber-900/40 to-amber-700/20', icon: Shield };
  if (elo < 1400) return { tier: 'Silver', color: 'text-gray-300', bg: 'from-gray-700/40 to-gray-400/20', icon: Medal };
  if (elo < 1600) return { tier: 'Gold', color: 'text-yellow-400', bg: 'from-yellow-700/40 to-yellow-500/20', icon: Trophy };
  if (elo < 1800) return { tier: 'Platinum', color: 'text-cyan-400', bg: 'from-cyan-700/40 to-cyan-500/20', icon: Star };
  if (elo < 2000) return { tier: 'Diamond', color: 'text-purple-400', bg: 'from-purple-700/40 to-purple-500/20', icon: Zap };
  return { tier: 'Grandmaster', color: 'text-red-500', bg: 'from-red-700/40 to-red-500/20', icon: Crown };
};

interface RankBadgeProps {
  elo: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ elo, size = 'md', showLabel = true }) => {
  const { tier, color, bg, icon: Icon } = getRankFromElo(elo);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${bg} border border-white/10 ${sizeClasses[size]}`} title={`${elo} Elo`}>
      <Icon size={iconSizes[size]} className={`${color} drop-shadow-[0_0_8px_currentColor]`} />
      {showLabel && <span className={`font-black tracking-wider uppercase ${color}`}>{tier}</span>}
      {!showLabel && <span className={`font-black ${color}`}>{elo}</span>}
    </div>
  );
};
