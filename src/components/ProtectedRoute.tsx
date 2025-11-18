import { Navigate } from "react-router-dom";
import { Box, Spinner, Center } from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Center h="50vh">
        <Box textAlign="center">
          <Spinner size="xl" color="brand.500" thickness="4px" />
        </Box>
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
