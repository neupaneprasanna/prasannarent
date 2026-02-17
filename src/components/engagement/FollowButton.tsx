'use client';

import { useEffect, useState } from 'react';
import { useSocialStore } from '@/store/engagement-store';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

interface FollowButtonProps {
    hostId: string;
    className?: string;
    mini?: boolean; // If true, shows only icon
}

export default function FollowButton({ hostId, className, mini = false }: FollowButtonProps) {
    const { user } = useAuthStore();
    const { following, followHost, unfollowHost, checkFollowStatus } = useSocialStore();
    const [isHovered, setIsHovered] = useState(false);

    // Check if following this host
    const isFollowing = following[hostId] || false;
    const isSelf = user?.id === hostId;

    useEffect(() => {
        if (user && !isSelf) {
            checkFollowStatus(hostId);
        }
    }, [hostId, user, isSelf, checkFollowStatus]);

    if (!user || isSelf) return null;

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isFollowing) {
            await unfollowHost(hostId);
        } else {
            await followHost(hostId);
        }
    };

    if (mini) {
        return (
            <button
                onClick={handleClick}
                className={cn(
                    "p-2 rounded-full transition-all duration-300",
                    isFollowing
                        ? "bg-white/10 text-green-400 hover:bg-red-500/20 hover:text-red-400"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105",
                    className
                )}
                title={isFollowing ? "Unfollow" : "Follow"}
            >
                {isFollowing ? (isHovered ? <UserPlus size={16} className="rotate-45" /> : <UserCheck size={16} />) : <UserPlus size={16} />}
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                isFollowing
                    ? "bg-white/5 text-white/80 hover:bg-red-500/10 hover:text-red-400 border border-white/10"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20",
                className
            )}
        >
            {isFollowing ? (
                <>
                    {isHovered ? <UserPlus size={16} className="rotate-45" /> : <UserCheck size={16} />}
                    <span>{isHovered ? 'Unfollow' : 'Following'}</span>
                </>
            ) : (
                <>
                    <UserPlus size={16} />
                    <span>Follow</span>
                </>
            )}
        </button>
    );
}
