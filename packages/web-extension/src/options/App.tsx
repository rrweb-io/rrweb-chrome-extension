import { Route, Routes } from 'react-router-dom';
import SidebarWithHeader from '../components/SidebarWithHeader';
import { FiTarget, FiList, FiSettings } from 'react-icons/fi';
import RRWebVersion from './RRWebVersion';
import { Box } from '@chakra-ui/react';

export default function App() {
  return (
    <SidebarWithHeader
      title="Settings"
      headBarItems={[
        {
          label: 'Sessions',
          icon: FiList,
          href: '#',
        },
        {
          label: 'Settings',
          icon: FiSettings,
          href: '/pages/index.html#',
        },
      ]}
      sideBarItems={[
        {
          label: 'rrweb versions',
          icon: FiTarget,
          href: `#`,
        },
      ]}
    >
      <Box p="10">
        <Routes>
          <Route path="/" element={<RRWebVersion />} />
        </Routes>
      </Box>
    </SidebarWithHeader>
  );
}
