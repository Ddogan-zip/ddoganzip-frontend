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
      p={8}
      bg={useColorModeValue("white", "gray.800")}
      rounded="2xl"
      shadow="lg"
      borderWidth="1px"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      transition="all 0.3s"
      position="relative"
      overflow="hidden"
      _hover={{
        shadow: "2xl",
        transform: "translateY(-8px)",
        borderColor: "brand.400",
      }}
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        bgGradient: "linear(to-r, brand.400, brand.600)",
        opacity: 0,
        transition: "opacity 0.3s",
      }}
      sx={{
        "&:hover::before": {
          opacity: 1,
        },
      }}
    >
      <Flex
        w={16}
        h={16}
        align="center"
        justify="center"
        color="white"
        rounded="2xl"
        bgGradient="linear(to-br, brand.400, brand.600)"
        mb={6}
        shadow="md"
        _groupHover={{
          transform: "scale(1.1) rotate(5deg)",
        }}
        transition="all 0.3s"
      >
        <Icon as={icon} boxSize={8} />
      </Flex>
      <Heading size="md" mb={3}>
        {title}
      </Heading>
      <Text color={useColorModeValue("gray.600", "gray.400")} lineHeight="tall">
        {text}
      </Text>
    </Stack>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        position="relative"
        bgGradient={useColorModeValue(
          "linear(to-br, blue.50, purple.50, pink.50)",
          "linear(to-br, gray.800, gray.900, gray.800)"
        )}
        rounded="3xl"
        py={{ base: 16, md: 24 }}
        px={{ base: 6, md: 12 }}
        mb={16}
        overflow="hidden"
        shadow="2xl"
        _before={{
          content: '""',
          position: "absolute",
          top: "-50%",
          right: "-20%",
          width: "600px",
          height: "600px",
          borderRadius: "full",
          bgGradient: "radial(brand.200, transparent)",
          opacity: 0.3,
          filter: "blur(60px)",
        }}
        _after={{
          content: '""',
          position: "absolute",
          bottom: "-50%",
          left: "-20%",
          width: "600px",
          height: "600px",
          borderRadius: "full",
          bgGradient: "radial(purple.200, transparent)",
          opacity: 0.3,
          filter: "blur(60px)",
        }}
      >
        <VStack spacing={8} textAlign="center" position="relative" zIndex={1}>
          <VStack spacing={4}>
            <Text
              fontSize="lg"
              fontWeight="semibold"
              color="brand.500"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              🎤 AI 음성 인식 기반
            </Text>
            <Heading
              as="h1"
              size={{ base: "2xl", md: "4xl" }}
              fontWeight="black"
              lineHeight="shorter"
              bgGradient="linear(to-r, brand.500, purple.500)"
              bgClip="text"
            >
              또간집 배달 서비스
            </Heading>
          </VStack>
          <Text
            fontSize={{ base: "lg", md: "2xl" }}
            color={useColorModeValue("gray.700", "gray.300")}
            maxW="3xl"
            fontWeight="medium"
          >
            음성 인식 기술로 간편하게 주문하세요.
            <br />
            손쉬운 메뉴 선택과 빠른 배달로 최고의 식사 경험을 제공합니다.
          </Text>
          <Stack direction={{ base: "column", md: "row" }} spacing={4} mt={8}>
            <Button
              size="lg"
              px={10}
              py={7}
              fontSize="lg"
              bgGradient="linear(to-r, brand.400, brand.600)"
              color="white"
              rounded="full"
              onClick={() => navigate("/order")}
              _hover={{
                bgGradient: "linear(to-r, brand.500, brand.700)",
                transform: "translateY(-4px)",
                shadow: "2xl",
              }}
              _active={{
                transform: "translateY(-2px)",
              }}
              shadow="xl"
            >
              🚀 지금 주문하기
            </Button>
            <Button
              variant="outline"
              borderColor="brand.500"
              color={useColorModeValue("brand.600", "brand.300")}
              size="lg"
              px={10}
              py={7}
              fontSize="lg"
              rounded="full"
              onClick={() => navigate("/staff")}
              _hover={{
                bg: useColorModeValue("brand.50", "gray.700"),
                transform: "translateY(-4px)",
                shadow: "xl",
              }}
              _active={{
                transform: "translateY(-2px)",
              }}
            >
              👨‍💼 직원 대시보드
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
        position="relative"
        bgGradient={useColorModeValue(
          "linear(to-r, brand.500, purple.600)",
          "linear(to-r, brand.600, purple.700)"
        )}
        rounded="3xl"
        py={16}
        px={{ base: 6, md: 12 }}
        mt={16}
        overflow="hidden"
        shadow="2xl"
      >
        <Box
          position="absolute"
          top="-50%"
          left="-10%"
          width="400px"
          height="400px"
          borderRadius="full"
          bg="whiteAlpha.100"
          filter="blur(80px)"
        />
        <Box
          position="absolute"
          bottom="-50%"
          right="-10%"
          width="400px"
          height="400px"
          borderRadius="full"
          bg="whiteAlpha.100"
          filter="blur(80px)"
        />
        <VStack spacing={6} textAlign="center" position="relative" zIndex={1}>
          <Heading size="xl" color="white">
            ✨ 지금 바로 시작하세요
          </Heading>
          <Text fontSize="xl" color="whiteAlpha.900" maxW="2xl">
            음성으로 간편하게 주문하고, 맛있는 식사를 즐기세요.
            <br />
            새로운 주문 경험을 지금 바로 체험해보세요!
          </Text>
          <Button
            size="lg"
            px={12}
            py={7}
            fontSize="lg"
            bg="white"
            color="brand.600"
            rounded="full"
            onClick={() => navigate("/order")}
            _hover={{
              transform: "translateY(-4px) scale(1.05)",
              shadow: "dark-lg",
            }}
            _active={{
              transform: "translateY(-2px) scale(1.02)",
            }}
            shadow="xl"
          >
            🍽️ 주문하러 가기
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
