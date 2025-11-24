import { Center, Text, VStack, Icon } from "@chakra-ui/react";
import { FaLock } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

interface StaffRouteProps {
  children: React.ReactNode;
}

export default function StaffRoute({ children }: StaffRouteProps) {
  const { user } = useAuth();

  // 디버깅
  console.log("=== StaffRoute Debug ===");
  console.log("User object:", user);
  console.log("User role:", user?.role);
  console.log("Is STAFF?:", user?.role === "STAFF");
  console.log("========================");

  // 먼저 로그인 체크
  return (
    <ProtectedRoute>
      {/* 로그인 후 STAFF 권한 체크 */}
      {user?.role === "STAFF" ? (
        <>{children}</>
      ) : (
        <Center h="50vh">
          <VStack spacing={4}>
            <Icon as={FaLock} boxSize={16} color="red.500" />
            <Text fontSize="2xl" fontWeight="bold">
              접근 권한이 없습니다
            </Text>
            <Text color="gray.600">
              이 페이지는 직원만 접근할 수 있습니다.
            </Text>
          </VStack>
        </Center>
      )}
    </ProtectedRoute>
  );
}
