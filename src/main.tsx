import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link as RouterLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import {
  ChakraProvider,
  Box,
  Container,
  Flex,
  Link,
  Button,
  HStack,
  useColorMode,
  useColorModeValue,
  Icon,
  extendTheme,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import StaffRoute from "./components/StaffRoute";

const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: "#e3f2fd",
      100: "#bbdefb",
      200: "#90caf9",
      300: "#64b5f6",
      400: "#42a5f5",
      500: "#2196f3",
      600: "#1e88e5",
      700: "#1976d2",
      800: "#1565c0",
      900: "#0d47a1",
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === "dark" ? "gray.900" : "gray.50",
      },
    }),
  },
  shadows: {
    outline: "0 0 0 3px rgba(33, 150, 243, 0.6)",
    brand: "0 0 20px rgba(33, 150, 243, 0.3)",
    "brand-lg": "0 10px 40px rgba(33, 150, 243, 0.2)",
  },
  components: {
    Button: {
      variants: {
        gradient: {
          bgGradient: "linear(to-r, brand.400, brand.600)",
          color: "white",
          _hover: {
            bgGradient: "linear(to-r, brand.500, brand.700)",
            transform: "translateY(-2px)",
            boxShadow: "brand-lg",
          },
          _active: {
            transform: "translateY(0)",
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: "xl",
          overflow: "hidden",
        },
      },
    },
  },
});

function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Button onClick={toggleColorMode} variant="ghost" size="sm">
      {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
    </Button>
  );
}

export function Layout() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const bgColor = useColorModeValue("rgba(255, 255, 255, 0.8)", "rgba(26, 32, 44, 0.8)");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <Box
        as="nav"
        bg={bgColor}
        backdropFilter="blur(10px)"
        borderBottom="1px"
        borderColor={borderColor}
        position="sticky"
        top={0}
        zIndex={10}
        shadow="md"
      >
        <Container maxW="container.xl">
          <Flex h={16} alignItems="center" justifyContent="space-between">
            <HStack spacing={8} alignItems="center">
              <Link
                as={RouterLink}
                to="/"
                fontSize="xl"
                fontWeight="extrabold"
                bgGradient="linear(to-r, brand.400, brand.600)"
                bgClip="text"
                _hover={{
                  textDecoration: "none",
                  transform: "scale(1.05)",
                }}
                transition="all 0.2s"
              >
                🍽️ 또간집
              </Link>
              <HStack as="nav" spacing={2} display={{ base: "none", md: "flex" }}>
                <Link
                  as={RouterLink}
                  to="/"
                  px={4}
                  py={2}
                  rounded="full"
                  fontWeight={isActive("/") ? "semibold" : "medium"}
                  color={isActive("/") ? "white" : useColorModeValue("gray.700", "gray.200")}
                  bg={isActive("/") ? "brand.500" : "transparent"}
                  _hover={{
                    textDecoration: "none",
                    bg: isActive("/") ? "brand.600" : useColorModeValue("gray.100", "gray.700"),
                    transform: "translateY(-2px)",
                  }}
                  transition="all 0.2s"
                >
                  홈
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      as={RouterLink}
                      to="/order"
                      px={4}
                      py={2}
                      rounded="full"
                      fontWeight={isActive("/order") ? "semibold" : "medium"}
                      color={isActive("/order") ? "white" : useColorModeValue("gray.700", "gray.200")}
                      bg={isActive("/order") ? "brand.500" : "transparent"}
                      _hover={{
                        textDecoration: "none",
                        bg: isActive("/order") ? "brand.600" : useColorModeValue("gray.100", "gray.700"),
                        transform: "translateY(-2px)",
                      }}
                      transition="all 0.2s"
                    >
                      메뉴 주문
                    </Link>
                    <Link
                      as={RouterLink}
                      to="/orders"
                      px={4}
                      py={2}
                      rounded="full"
                      fontWeight={isActive("/orders") ? "semibold" : "medium"}
                      color={isActive("/orders") ? "white" : useColorModeValue("gray.700", "gray.200")}
                      bg={isActive("/orders") ? "brand.500" : "transparent"}
                      _hover={{
                        textDecoration: "none",
                        bg: isActive("/orders") ? "brand.600" : useColorModeValue("gray.100", "gray.700"),
                        transform: "translateY(-2px)",
                      }}
                      transition="all 0.2s"
                    >
                      내 주문
                    </Link>
                    {user?.role === "STAFF" && (
                      <Link
                        as={RouterLink}
                        to="/staff"
                        px={4}
                        py={2}
                        rounded="full"
                        fontWeight={isActive("/staff") ? "semibold" : "medium"}
                        color={isActive("/staff") ? "white" : useColorModeValue("gray.700", "gray.200")}
                        bg={isActive("/staff") ? "brand.500" : "transparent"}
                        _hover={{
                          textDecoration: "none",
                          bg: isActive("/staff") ? "brand.600" : useColorModeValue("gray.100", "gray.700"),
                          transform: "translateY(-2px)",
                        }}
                        transition="all 0.2s"
                      >
                        직원 대시보드
                      </Link>
                    )}
                  </>
                )}
              </HStack>
            </HStack>
            <HStack spacing={3}>
              <ColorModeToggle />
              {isAuthenticated ? (
                <Menu>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    rounded="full"
                    cursor="pointer"
                    minW={0}
                  >
                    <HStack spacing={2}>
                      <Avatar size="sm" name={user?.name} bg="brand.500" />
                      <Text display={{ base: "none", md: "block" }} fontSize="sm">
                        {user?.name}
                      </Text>
                    </HStack>
                  </MenuButton>
                  <MenuList>
                    <MenuItem icon={<Icon as={FaUser} />} isDisabled>
                      {user?.email}
                    </MenuItem>
                    <MenuItem icon={<Icon as={FaSignOutAlt} />} onClick={logout}>
                      로그아웃
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <HStack spacing={2}>
                  <Button
                    as={RouterLink}
                    to="/login"
                    variant="ghost"
                    size="sm"
                    rounded="full"
                  >
                    로그인
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/register"
                    size="sm"
                    bgGradient="linear(to-r, brand.400, brand.600)"
                    color="white"
                    rounded="full"
                    _hover={{
                      bgGradient: "linear(to-r, brand.500, brand.700)",
                    }}
                  >
                    회원가입
                  </Button>
                </HStack>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>
      <Container maxW="container.xl" py={8}>
        <Outlet />
      </Container>
    </Box>
  );
}

// Lazy load pages
const Home = React.lazy(() => import("./pages/Home"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage"));
const About = React.lazy(() => import("./pages/About"));
const MenuOrderPage = React.lazy(() => import("./pages/MenuOrderPage"));
const OrderHistoryPage = React.lazy(() => import("./pages/OrderHistoryPage"));
const StaffDashboardPage = React.lazy(() => import("./pages/StaffDashboardPage"));
const Todos = React.lazy(() => import("./pages/Todos"));

const qc = new QueryClient();

function Root() {
  return (
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <QueryClientProvider client={qc}>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route
                    index
                    element={
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <Home />
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="login"
                    element={
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <LoginPage />
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="register"
                    element={
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <RegisterPage />
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="about"
                    element={
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <About />
                      </React.Suspense>
                    }
                  />
                  <Route
                    path="order"
                    element={
                      <ProtectedRoute>
                        <React.Suspense fallback={<div>Loading...</div>}>
                          <MenuOrderPage />
                        </React.Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="orders"
                    element={
                      <ProtectedRoute>
                        <React.Suspense fallback={<div>Loading...</div>}>
                          <OrderHistoryPage />
                        </React.Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="staff"
                    element={
                      <StaffRoute>
                        <React.Suspense fallback={<div>Loading...</div>}>
                          <StaffDashboardPage />
                        </React.Suspense>
                      </StaffRoute>
                    }
                  />
                  <Route
                    path="todos"
                    element={
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <Todos />
                      </React.Suspense>
                    }
                  />
                  <Route path="*" element={<div>Not Found</div>} />
                </Route>
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ChakraProvider>
    </React.StrictMode>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
