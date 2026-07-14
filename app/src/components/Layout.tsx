import { Outlet, NavLink } from 'react-router-dom';
import { Activity, Backpack, Database, Map as MapIcon, Book, BookOpen, Compass } from 'lucide-react';
import SkillTestModal from './SkillTestModal';
import OracleWidget from './OracleWidget';
import MuseWidget from './MuseWidget';
import DeathModal from './DeathModal';
import TutorialOverlay from './TutorialOverlay';
import { useGameState } from '../store/gameState';

export default function Layout() {
  const { hp, maxHp, rads, ap, maxAp, luck, maxLuck } = useGameState();

  const navItems = [
    { name: 'Round', path: '/round', icon: Compass },
    { name: 'Stats', path: '/stats', icon: Activity },
    { name: 'Inv', path: '/inventory', icon: Backpack },
    { name: 'Data', path: '/data', icon: Database },
    { name: 'Map', path: '/map', icon: MapIcon },
    { name: 'Journal', path: '/journal', icon: Book },
    { name: 'Codex', path: '/codex', icon: BookOpen },
  ];

  return (
    <div className="h-screen w-full bg-[#051a05] text-[#14FF00] font-mono overflow-hidden select-none flex flex-col relative">
      <div className="crt-overlay" />
      <DeathModal />
      
      {/* Header */}
      <header className="border-b-2 border-[#14FF00] p-4 flex justify-between items-center opacity-90">
        <h1 className="text-xl uppercase tracking-widest">Pip-Boy 3000 Mark IV</h1>
        <div className="flex gap-4 text-sm">
          <span className="uppercase">HP {hp}/{Math.max(1, maxHp - rads)}</span>
          <span className="uppercase">AP {ap}/{maxAp}</span>
          <span className="uppercase">LP {luck}/{maxLuck}</span>
        </div>
      </header>

      {/* Dynamic Content Area */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20 custom-scrollbar">
        <Outlet />
      </main>

      {/* Global Action Widgets */}
      <SkillTestModal />
      <OracleWidget />
      <MuseWidget />
      <TutorialOverlay />

      {/* Bottom Navigation Bar */}
      <nav className="border-t-2 border-[#14FF00] bg-black">
        <ul className="flex items-stretch px-1 py-2">
          {navItems.map((item) => (
            <li key={item.name} className="flex-1 min-w-0 text-center">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center px-0.5 py-1.5 rounded transition-colors ${
                    isActive ? 'bg-[#14FF00] text-black' : 'text-[#14FF00] hover:bg-[#051A05]'
                  }`
                }
              >
                <item.icon size={20} className="mb-1 shrink-0" />
                <span className="text-[11px] uppercase leading-none truncate max-w-full">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
