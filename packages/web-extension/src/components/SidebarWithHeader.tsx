import { ReactNode } from 'react';
import {
  IconButton,
  Box,
  CloseButton,
  Flex,
  HStack,
  Icon,
  Image,
  useColorModeValue,
  Link,
  Drawer,
  DrawerContent,
  useDisclosure,
  BoxProps,
  FlexProps,
  Heading,
} from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import Browser from 'webextension-polyfill';

interface SideBarItem {
  name: string;
  icon: IconType;
  href: string;
}

export default function SidebarWithHeader({
  children,
  title,
  sideBarItems,
}: {
  children: ReactNode;
  title?: string;
  sideBarItems: SideBarItem[];
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box minH="100vh">
      <SidebarContent
        sideBarItems={sideBarItems}
        onClose={() => onClose}
        display={{ base: 'none', md: 'block' }}
        title={title}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent
            onClose={onClose}
            sideBarItems={sideBarItems}
            title={title}
          />
        </DrawerContent>
      </Drawer>
      <MobileNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }}>{children}</Box>
    </Box>
  );
}

interface SidebarProps extends BoxProps {
  onClose: () => void;
  title?: string;
  sideBarItems: SideBarItem[];
}

const SidebarContent = ({
  onClose,
  sideBarItems,
  title,
  ...rest
}: SidebarProps) => {
  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justify="flex-start" gap="3">
        <Image
          borderRadius="md"
          boxSize="2rem"
          src={Browser.runtime.getURL('assets/icon128.png')}
          alt="RRWeb Logo"
        />
        {title && (
          <Heading as="h4" size="md">
            {title}
          </Heading>
        )}
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      {sideBarItems.map((link) => (
        <NavItem key={link.name} icon={link.icon} href={link.href}>
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

interface NavItemProps extends FlexProps {
  icon: IconType;
  href: string;
  children: string;
}
const NavItem = ({ icon, href, children, ...rest }: NavItemProps) => {
  return (
    <Link
      href={href}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
      fontSize="lg"
      fontWeight={500}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: 'gray.200',
        }}
        {...rest}
      >
        <>
          {icon && <Icon mr="4" fontSize="16" as={icon} />}
          {children}
        </>
      </Flex>
    </Link>
  );
};

interface MobileProps extends FlexProps {
  onOpen: () => void;
}
const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      {...rest}
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <HStack spacing={{ base: '0', md: '6' }}>
        <Flex alignItems={'center'}></Flex>
      </HStack>
    </Flex>
  );
};
