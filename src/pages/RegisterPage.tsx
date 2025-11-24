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
import { FaEnvelope, FaLock, FaUser, FaHome, FaPhone } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import type { RegisterRequest } from "../api/types";

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterRequest>({
    email: "",
    password: "",
    name: "",
    phoneNumber: "",
    address: "",
  });
  const { register, isLoading } = useAuth();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(formData);
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
            회원가입
          </Heading>
          <Text color={useColorModeValue("gray.600", "gray.400")}>
            또간집의 회원이 되어보세요
          </Text>
        </Box>

        {/* Register Form Card */}
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
              <VStack spacing={4}>
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
                      rounded="lg"
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>이름</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FaUser} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="홍길동"
                      rounded="lg"
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>전화번호</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FaPhone} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="010-1234-5678"
                      rounded="lg"
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>주소</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FaHome} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="서울시 강남구..."
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
                  mt={4}
                  _hover={{
                    bgGradient: "linear(to-r, brand.500, brand.700)",
                    transform: "translateY(-2px)",
                    shadow: "lg",
                  }}
                  _active={{
                    transform: "translateY(0)",
                  }}
                >
                  회원가입
                </Button>
              </VStack>
            </form>

            <Divider my={6} />

            <HStack justify="center" spacing={2}>
              <Text color={useColorModeValue("gray.600", "gray.400")}>
                이미 계정이 있으신가요?
              </Text>
              <Link
                as={RouterLink}
                to="/login"
                color="brand.500"
                fontWeight="semibold"
                _hover={{
                  color: "brand.600",
                  textDecoration: "underline",
                }}
              >
                로그인
              </Link>
            </HStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}
