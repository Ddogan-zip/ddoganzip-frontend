import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  Card,
  CardBody,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Icon,
  Divider,
  HStack,
} from "@chakra-ui/react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import type { LoginRequest } from "../api/types";

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });
  const { login, isLoading } = useAuth();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8}>
        {/* Header */}
        <Box textAlign="center">
          <Heading
            size="2xl"
            mb={3}
            bgGradient="linear(to-r, brand.400, brand.600)"
            bgClip="text"
          >
            로그인
          </Heading>
          <Text color={useColorModeValue("gray.600", "gray.400")}>
            또간집에 오신 것을 환영합니다
          </Text>
        </Box>

        {/* Login Form Card */}
        <Card
          w="100%"
          bg={cardBg}
          shadow="xl"
          borderWidth="1px"
          borderColor={borderColor}
          rounded="2xl"
        >
          <CardBody p={8}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel>이메일</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FaEnvelope} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      size="lg"
                      rounded="lg"
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>비밀번호</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FaLock} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      size="lg"
                      rounded="lg"
                    />
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  w="100%"
                  size="lg"
                  bgGradient="linear(to-r, brand.400, brand.600)"
                  color="white"
                  rounded="lg"
                  isLoading={isLoading}
                  _hover={{
                    bgGradient: "linear(to-r, brand.500, brand.700)",
                    transform: "translateY(-2px)",
                    shadow: "lg",
                  }}
                  _active={{
                    transform: "translateY(0)",
                  }}
                >
                  로그인
                </Button>
              </VStack>
            </form>

            <Divider my={6} />

            <HStack justify="center" spacing={2}>
              <Text color={useColorModeValue("gray.600", "gray.400")}>
                계정이 없으신가요?
              </Text>
              <Link
                as={RouterLink}
                to="/register"
                color="brand.500"
                fontWeight="semibold"
                _hover={{
                  color: "brand.600",
                  textDecoration: "underline",
                }}
              >
                회원가입
              </Link>
            </HStack>
          </CardBody>
        </Card>

        {/* Test Accounts Info */}
        <Card
          w="100%"
          bg={useColorModeValue("blue.50", "gray.700")}
          borderWidth="1px"
          borderColor={useColorModeValue("blue.200", "gray.600")}
          rounded="xl"
        >
          <CardBody p={4}>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              테스트 계정
            </Text>
            <VStack align="start" spacing={1} fontSize="xs">
              <Text>일반 사용자: user@test.com / test1234</Text>
              <Text>직원: staff@test.com / staff1234</Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}
