import { useColorMode, IconButton } from "@chakra-ui/react" // 1. Fjern IconButtonProps herfra
import { Sun, Moon } from "lucide-react"

// 2. Fjern typen fra props her
export const ColorModeSwitcher = (props: any) => { 
  const { colorMode, toggleColorMode } = useColorMode()
  const SwitchIcon = colorMode === "light" ? Moon : Sun

  return (
    <IconButton
      size="md"
      fontSize="lg"
      variant="ghost"
      color="current"
      marginLeft="2"
      onClick={toggleColorMode}
      icon={<SwitchIcon size={20} />}
      aria-label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
      {...props}
    />
  )
}