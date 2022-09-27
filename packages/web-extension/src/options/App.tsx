import { Route, Routes } from 'react-router-dom';
import SidebarWithHeader from '../components/SidebarWithHeader';
import { FiTarget } from 'react-icons/fi';
import RRWebVersion from './RRWebVersion';
import { Box } from '@chakra-ui/react';

export default function App() {
  return (
    <SidebarWithHeader
      title="Settings"
      sideBarItems={[
        {
          name: 'rrweb versions',
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
