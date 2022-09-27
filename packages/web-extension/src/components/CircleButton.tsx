import { Button } from '@chakra-ui/react';

export function CircleButton({
  size,
  onClick,
  children,
  title,
  ...rest
}: {
  size: number;
  onClick?: () => void;
  children?: React.ReactNode;
  title?: string;
}) {
  return (
    <Button
      w={`${size}rem`}
      h={`${size}rem`}
      padding={`${size / 2}rem`}
      borderRadius={9999}
      textAlign="center"
      bgColor="gray.100"
      boxSizing="content-box"
      onClick={onClick}
      title={title}
      {...rest}
    >
      {children}
    </Button>
  );
}
