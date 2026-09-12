import React, { useState, useEffect } from 'react';
import { ActiveUserRecord, fetchActiveUsersAsync, pingActiveUserAsync, isAdminUser, getUserProfilePhoto } from '../utils/auth';
import { ShieldCheck, Crown, UserCheck, Activity, Radio, Sparkles } from 'lucide-react';

interface ActiveUsersMarqueeProps {
  loggedInUser: string | null;
  isLight?: boolean;
}

export const ActiveUsersMarquee: React.FC<ActiveUsersMarqueeProps> = ({ loggedInUser, isLight }) => {
  const [users, setUsers] = useState<ActiveUserRecord[]>([]);

  useEffect(() => {
    let isMounted = true;

    const syncUsers = async () => {
      if (loggedInUser) {
        const res = await pingActiveUserAsync(loggedInUser);
        if (isMounted) setUsers(res && Array.isArray(res.users) ? res.users : []);
      } else {
        const fetched = await fetchActiveUsersAsync();
        if (isMounted) setUsers(Array.isArray(fetched) ? fetched : []);
      }
    };

    syncUsers();
    const interval = setInterval(syncUsers, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loggedInUser]);

  if (!Array.isArray(users) || users.length === 0) return null;

  const isViewerAdmin = isAdminUser(loggedInUser);

  // Duplicate user array 6 times to create smooth seamless right-to-left marquee without empty gaps
  const displayList = [...users, ...users, ...users, ...users, ...users, ...users];

  // Helper function to render avatar image or high-quality custom logo
  const UserAvatar = ({ user }: { user: ActiveUserRecord }) => {
    const [imgError, setImgError] = useState(false);
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const initial = (cleanEmail || 'G')[0].toUpperCase();

    // Color theme based on initial
    const colors = [
      'from-blue-600 via-indigo-600 to-violet-700 border-blue-400',
      'from-purple-600 via-fuchsia-600 to-pink-600 border-purple-400',
      'from-emerald-600 via-teal-600 to-cyan-700 border-emerald-400',
      'from-amber-500 via-orange-600 to-red-600 border-amber-400',
      'from-cyan-600 via-blue-600 to-indigo-700 border-cyan-400',
    ];
    const colorClass = colors[initial.charCodeAt(0) % colors.length];

    const savedPhoto = getUserProfilePhoto(cleanEmail);
    const avatarSrc = user.photoUrl || savedPhoto;

    if (avatarSrc && !imgError) {
      return (
        <div className="relative group/avatar shrink-0">
          <img
            src={avatarSrc}
            alt={user.email}
            onError={() => setImgError(true)}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/70 shadow-lg transform group-hover/avatar:scale-110 transition duration-300 bg-slate-800"
            referrerPolicy="no-referrer"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-950 animate-pulse" />
        </div>
      );
    }

    // High quality letter logo badge generator fallback
    const uiAvatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || cleanEmail.split('@')[0])}&background=0D8ABC&color=fff&size=128&bold=true`;

    return (
      <div className="relative group/avatar shrink-0">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${colorClass} text-white font-black text-xs flex items-center justify-center shadow-lg border border-white/40 transform group-hover/avatar:scale-110 transition duration-300 relative overflow-hidden`}>
          {!imgError ? (
            <img
              src={uiAvatarSrc}
              alt={cleanEmail}
              onError={() => setImgError(true)}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <>
              <div className="absolute inset-0 opacity-20 flex items-center justify-center font-sans text-[18px]">G</div>
              <span className="relative z-10 drop-shadow-md text-sm">{initial}</span>
            </>
          )}
        </div>
        {/* Google Small Badge */}
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow ring-1 ring-slate-800">
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-950 animate-pulse" />
      </div>
    );
  };

  return (
    <div className={`w-full overflow-hidden border-t border-b ${isLight ? 'bg-slate-900/95 text-slate-100 border-slate-800' : 'bg-slate-950/90 text-slate-100 border-slate-800/80'} backdrop-blur-xl py-2.5 relative select-none shadow-2xl`}>
      {/* 3D Ambient Glow Effects */}
      <div className="absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

      {/* Ticker Header Tag */}
      <div className="max-w-7xl mx-auto px-4 mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75" />
            <Radio className="w-4 h-4 text-emerald-400 relative z-10" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <Sparkles className="w-3 h-3 text-emerald-300" />
            <span>{isViewerAdmin ? 'LIVE ACTIVE GMAIL USERS' : 'LIVE ONLINE USERS'}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block">
            ({users.length} {isViewerAdmin ? 'គណនី Gmail កំពុងប្រើប្រាស់' : 'អ្នកប្រើប្រាស់កំពុងអនឡាញ'})
          </span>
        </div>
      </div>

      {/* Marquee Motion Container (Right to Left) */}
      <div className="flex overflow-hidden relative w-full">
        <div className="animate-marquee-rtl flex items-center gap-3 py-1 px-4 cursor-pointer">
          {displayList.map((usr, index) => {
            const isSuper = usr.role === 'Super Admin';
            const isAdmin = usr.role === 'Admin';
            const isMe = loggedInUser && usr.email.toLowerCase() === loggedInUser.toLowerCase();

            // NORMAL USER VIEW: Show only the Logo / Avatar
            if (!isViewerAdmin) {
              return (
                <div
                  key={`${usr.email}-${index}`}
                  className={`p-1.5 rounded-full transition-all duration-300 transform hover:scale-115 flex items-center justify-center ${
                    isMe
                      ? 'bg-blue-600/30 ring-2 ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                      : isSuper
                      ? 'bg-amber-500/30 ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : isAdmin
                      ? 'bg-purple-500/30 ring-2 ring-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-800/90 border border-slate-700/80 shadow-md'
                  }`}
                >
                  <UserAvatar user={usr} />
                </div>
              );
            }

            // ADMIN VIEW: Show full details (Logo + Gmail + Role Badge + Status)
            return (
              <div
                key={`${usr.email}-${index}`}
                className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  isMe
                    ? 'bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-purple-900/80 border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                    : isSuper
                    ? 'bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-amber-950/80 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : isAdmin
                    ? 'bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-purple-950/80 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/60 shadow-md'
                }`}
              >
                {/* Avatar */}
                <UserAvatar user={usr} />

                {/* User Info */}
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100 tracking-tight font-mono max-w-[160px] truncate">
                      {usr.email}
                    </span>
                    {isMe && (
                      <span className="text-[9px] bg-blue-500 text-white font-extrabold px-1.5 py-0.2 rounded-md shadow-sm">
                        អ្នក
                      </span>
                    )}
                  </div>

                  {/* Role Tag & Status */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isSuper ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 rounded-md glow-3d-badge">
                        <Crown className="w-2.5 h-2.5 text-amber-400" />
                        Super Admin
                      </span>
                    ) : isAdmin ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.2 rounded-md glow-3d-badge">
                        <ShieldCheck className="w-2.5 h-2.5 text-purple-400" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 rounded-md glow-3d-badge">
                        <UserCheck className="w-2.5 h-2.5 text-emerald-400" />
                        CS Staff
                      </span>
                    )}

                    <span className="text-[9px] text-slate-400 font-medium">
                      • 🟢 Live
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

