import { Route, Routes } from 'react-router-dom';
import SidebarWithHeader from '../components/SidebarWithHeader';
import { SessionList } from './SessionList';
import { FiList } from 'react-icons/fi';
import Player from './Player';

export default function App() {
  return (
    <SidebarWithHeader
      sideBarItems={[
        {
          name: 'Sessions',
          icon: FiList,
          href: `#`,
        },
      ]}
    >
      <Routes>
        <Route path="/" element={<SessionList />} />
        <Route path="session/:sessionId" element={<Player />} />
      </Routes>
    </SidebarWithHeader>
  );
}
