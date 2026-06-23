import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CharacterCreation from './pages/CharacterCreation';
import StatsTab from './pages/StatsTab';
import InventoryTab from './pages/InventoryTab';
import DataTab from './pages/DataTab';
import MapTab from './pages/MapTab';
import JournalTab from './pages/JournalTab';
import CombatTab from './pages/CombatTab';
import CodexTab from './pages/CodexTab';
import RoundTab from './pages/RoundTab';
import { useGameState } from './store/gameState';
import GlobalModal from './components/GlobalModal';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { vault, mainQuest } = useGameState();
  
  if (!vault || !mainQuest) {
    return <Navigate to="/creation" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <>
      <GlobalModal />
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Navigate to="/stats" replace />} />
        
        <Route path="/creation" element={
          <div className="h-screen w-screen bg-black text-[#14FF00] p-6 relative">
            <div className="crt-overlay" />
            <CharacterCreation />
          </div>
        } />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/stats" element={<StatsTab />} />
          <Route path="/inventory" element={<InventoryTab />} />
          <Route path="/data" element={<DataTab />} />
          <Route path="/map" element={<MapTab />} />
          <Route path="/journal" element={<JournalTab />} />
          <Route path="/combat" element={<CombatTab />} />
          <Route path="/codex" element={<CodexTab />} />
          <Route path="/round" element={<RoundTab />} />
        </Route>

        <Route path="*" element={<Navigate to="/stats" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
