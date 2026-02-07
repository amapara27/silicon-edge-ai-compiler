'use client';

import { MemoryStick, HardDrive, Cpu } from 'lucide-react';

interface MetricBarProps {
    label: string;
    icon: React.ReactNode;
    used: number;
    total: number;
    unit: string;
    color: 'violet' | 'emerald' | 'amber';
}

function formatBytes(bytes: number): string {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${bytes}B`;
}

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

function MetricBar({ label, icon, used, total, unit, color }: MetricBarProps) {
    const percentage = Math.min((used / total) * 100, 100);
    const isWarning = percentage > 75;
    const isCritical = percentage > 90;

    const barColor = isCritical
        ? 'bg-red-500'
        : isWarning
            ? 'bg-amber-500'
            : color === 'violet'
                ? 'bg-violet-500'
                : color === 'emerald'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500';

    const textColor = isCritical
        ? 'text-red-400'
        : isWarning
            ? 'text-amber-400'
            : color === 'violet'
                ? 'text-violet-400'
                : color === 'emerald'
                    ? 'text-emerald-400'
                    : 'text-amber-400';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={textColor}>{icon}</span>
                    <span className="text-xs font-medium text-zinc-300">{label}</span>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                    {unit === 'bytes'
                        ? `${formatBytes(used)} / ${formatBytes(total)}`
                        : `${formatNumber(used)}`
                    }
                </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="flex justify-end">
                <span className={`text-[10px] font-medium ${textColor}`}>
                    {percentage.toFixed(1)}%
                </span>
            </div>
        </div>
    );
}

interface ProfileMetricsProps {
    ramUsed: number;
    ramTotal: number;
    flashUsed: number;
    flashTotal: number;
    totalFlops: number;
}

export function ProfileMetrics({
    ramUsed,
    ramTotal,
    flashUsed,
    flashTotal,
    totalFlops
}: ProfileMetricsProps) {
    return (
        <div className="space-y-4">
            <MetricBar
                label="RAM Usage"
                icon={<MemoryStick className="w-3.5 h-3.5" />}
                used={ramUsed}
                total={ramTotal}
                unit="bytes"
                color="violet"
            />
            <MetricBar
                label="Flash Usage"
                icon={<HardDrive className="w-3.5 h-3.5" />}
                used={flashUsed}
                total={flashTotal}
                unit="bytes"
                color="emerald"
            />
            <div className="flex items-center justify-between py-2 px-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <div className="flex items-center gap-2">
                    <span className="text-amber-400"><Cpu className="w-3.5 h-3.5" /></span>
                    <span className="text-xs font-medium text-zinc-300">FLOPs</span>
                </div>
                <span className="text-sm font-mono text-amber-400">
                    {formatNumber(totalFlops)}
                </span>
            </div>
        </div>
    );
}
