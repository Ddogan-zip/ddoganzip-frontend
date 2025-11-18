import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Icon,
  Stack,
  useColorModeValue,
  Flex,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaMicrophone, FaUtensils, FaBoxOpen, FaClock } from "react-icons/fa";

interface FeatureProps {
  title: string;
  text: string;
  icon: any;
}

function Feature({ title, text, icon }: FeatureProps) {
  return (
    <Stack
      p={6}
      bg={useColorModeValue("white", "gray.800")}
      rounded="lg"
      shadow="md"
      borderWidth="1px"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      transition="all 0.3s"
      _hover={{
        shadow: "xl",
        transform: "translateY(-4px)",
      }}
    >
      <Flex
        w={12}
        h={12}
        align="center"
        justify="center"
        color="white"
        rounded="md"
        bg="brand.500"
        mb={4}
      >
        <Icon as={icon} boxSize={6} />
      </Flex>
      <Heading size="md" mb={2}>
        {title}
      </Heading>
      <Text color={useColorModeValue("gray.600", "gray.400")}>{text}</Text>
    </Stack>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bg={useColorModeValue("brand.50", "gray.800")}
        rounded="2xl"
        py={{ base: 12, md: 20 }}
        px={{ base: 6, md: 12 }}
        mb={12}
      >
        <VStack spacing={6} textAlign="center">
          <Heading
            as="h1"
            size={{ base: "xl", md: "3xl" }}
            fontWeight="extrabold"
            color={useColorModeValue("gray.800", "white")}
          >
            음성으로 주문하는
            <br />
            <Text as="span" color="brand.500">
              똑간집 배달 서비스
            </Text>
          </Heading>
          <Text
            fontSize={{ base: "md", md: "xl" }}
            color={useColorModeValue("gray.600", "gray.300")}
            maxW="2xl"
          >
            음성 인식 기술로 간편하게 주문하세요. 손쉬운 메뉴 선택과 빠른 배달로
            최고의 식사 경험을 제공합니다.
          </Text>
          <Stack direction={{ base: "column", md: "row" }} spacing={4} mt={6}>
            <Button
              colorScheme="brand"
              size="lg"
              px={8}
              onClick={() => navigate("/order")}
              _hover={{
                transform: "translateY(-2px)",
                shadow: "lg",
              }}
            >
              지금 주문하기
            </Button>
            <Button
              variant="outline"
              colorScheme="brand"
              size="lg"
              px={8}
              onClick={() => navigate("/staff")}
            >
              직원 대시보드
            </Button>
          </Stack>
        </VStack>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={12}>
        <VStack spacing={12}>
          <VStack spacing={4} textAlign="center">
            <Heading size="xl">주요 기능</Heading>
            <Text
              fontSize="lg"
              color={useColorModeValue("gray.600", "gray.400")}
            >
              똑간집이 제공하는 혁신적인 서비스
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} w="full">
            <Feature
              icon={FaMicrophone}
              title="음성 주문"
              text="말로 주문하면 자동으로 장바구니에 담깁니다. 빠르고 편리한 주문 경험을 제공합니다."
            />
            <Feature
              icon={FaUtensils}
              title="다양한 메뉴"
              text="신선한 재료로 만든 다양한 디너 메뉴를 제공합니다. 취향에 맞게 선택하세요."
            />
            <Feature
              icon={FaBoxOpen}
              title="맞춤 서빙 스타일"
              text="심플, 프리미엄, 패밀리 등 원하는 서빙 스타일을 선택할 수 있습니다."
            />
            <Feature
              icon={FaClock}
              title="실시간 주문 관리"
              text="주문 상태를 실시간으로 확인하고 배달 진행 상황을 추적할 수 있습니다."
            />
          </SimpleGrid>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box
        bg={useColorModeValue("gray.100", "gray.800")}
        rounded="2xl"
        py={12}
        px={{ base: 6, md: 12 }}
        mt={12}
      >
        <VStack spacing={6} textAlign="center">
          <Heading size="lg">지금 바로 시작하세요</Heading>
          <Text
            fontSize="lg"
            color={useColorModeValue("gray.600", "gray.400")}
          >
            음성으로 간편하게 주문하고, 맛있는 식사를 즐기세요.
          </Text>
          <Button
            colorScheme="brand"
            size="lg"
            px={8}
            onClick={() => navigate("/order")}
          >
            주문하러 가기
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
