import { useQuery } from "@tanstack/react-query";
import { getMenuList, getMenuDetails } from "../api/menu";
import type { DinnerMenuItem, DinnerDetail } from "../api/types";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Spinner,
  Card,
  CardBody,
  CardFooter,
  Image,
  useColorModeValue,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  SimpleGrid,
  Badge,
  Divider,
  Stack,
} from "@chakra-ui/react";
import { FaUtensils, FaWineGlass, FaShoppingCart } from "react-icons/fa";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function MenuBrowsePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const cardBg = useColorModeValue("white", "gray.800");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDinnerId, setSelectedDinnerId] = useState<number | null>(null);

  // 메뉴 목록 조회
  const { data: menuList, isPending: isLoadingList } = useQuery<DinnerMenuItem[]>({
    queryKey: ["menu-list"],
    queryFn: getMenuList,
  });

  // 선택된 메뉴 상세 조회
  const { data: menuDetail, isPending: isLoadingDetail } = useQuery<DinnerDetail>({
    queryKey: ["menu-detail", selectedDinnerId],
    queryFn: () => getMenuDetails(selectedDinnerId!),
    enabled: !!selectedDinnerId,
  });

  const handleMenuClick = (dinnerId: number) => {
    setSelectedDinnerId(dinnerId);
    onOpen();
  };

  const handleOrderClick = (dinnerId?: number) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (dinnerId) {
      navigate("/order", { state: { selectedDinnerId: dinnerId } });
    } else {
      navigate("/order");
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      {/* Header */}
      <Box
        bgGradient={useColorModeValue(
          "linear(to-r, orange.50, yellow.50)",
          "linear(to-r, gray.800, gray.700)"
        )}
        p={8}
        rounded="2xl"
        shadow="xl"
      >
        <Heading
          size="2xl"
          mb={3}
          bgGradient="linear(to-r, orange.500, yellow.500)"
          bgClip="text"
        >
          🍽️ 메뉴 둘러보기
        </Heading>
        <Text
          color={useColorModeValue("gray.700", "gray.300")}
          fontSize="lg"
        >
          또간집의 정성스런 디너 메뉴를 확인하세요
        </Text>
      </Box>

      {/* Loading State */}
      {isLoadingList && (
        <Box textAlign="center" py={8}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text mt={4} color={useColorModeValue("gray.600", "gray.400")}>
            메뉴를 불러오는 중...
          </Text>
        </Box>
      )}

      {/* Menu Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {menuList?.map((menu) => (
          <Card
            key={menu.dinnerId}
            bg={cardBg}
            shadow="lg"
            borderWidth="1px"
            borderColor={useColorModeValue("gray.200", "gray.700")}
            rounded="2xl"
            overflow="hidden"
            cursor="pointer"
            transition="all 0.3s"
            _hover={{
              shadow: "2xl",
              transform: "translateY(-4px)",
              borderColor: "brand.400",
            }}
            onClick={() => handleMenuClick(menu.dinnerId)}
          >
            {/* Menu Image */}
            <Image
              src={menu.imageUrl}
              alt={menu.name}
              height="200px"
              width="100%"
              objectFit="cover"
              fallbackSrc="https://via.placeholder.com/400x200?text=Menu+Image"
            />

            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Heading size="md">{menu.name}</Heading>
                <Text fontSize="sm" color="gray.600" noOfLines={2}>
                  {menu.description}
                </Text>
                <HStack justify="space-between" pt={2}>
                  <Badge colorScheme="green" fontSize="lg" px={3} py={1} rounded="full">
                    {menu.basePrice.toLocaleString()}원~
                  </Badge>
                  <Icon as={FaUtensils} color="orange.500" boxSize={5} />
                </HStack>
              </VStack>
            </CardBody>

            <CardFooter pt={0}>
              <Button
                width="100%"
                colorScheme="brand"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuClick(menu.dinnerId);
                }}
              >
                자세히 보기
              </Button>
            </CardFooter>
          </Card>
        ))}
      </SimpleGrid>

      {/* Menu Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {menuDetail?.name || "메뉴 상세"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {isLoadingDetail && (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="brand.500" />
              </Box>
            )}

            {menuDetail && (
              <VStack align="stretch" spacing={6}>
                {/* Menu Image */}
                <Image
                  src={menuDetail.imageUrl}
                  alt={menuDetail.name}
                  width="100%"
                  height="300px"
                  objectFit="cover"
                  rounded="lg"
                  fallbackSrc="https://via.placeholder.com/600x300?text=Menu+Image"
                />

                {/* Description */}
                <Box>
                  <Text fontSize="md" color="gray.700">
                    {menuDetail.description}
                  </Text>
                </Box>

                {/* Base Price */}
                <HStack justify="space-between" p={4} bg="green.50" rounded="md">
                  <Text fontSize="lg" fontWeight="semibold">
                    기본 가격
                  </Text>
                  <Text fontSize="2xl" fontWeight="black" color="green.600">
                    {menuDetail.basePrice.toLocaleString()}원
                  </Text>
                </HStack>

                <Divider />

                {/* Available Styles */}
                <Box>
                  <HStack mb={3}>
                    <Icon as={FaUtensils} color="orange.500" />
                    <Heading size="sm">제공 스타일</Heading>
                  </HStack>
                  <SimpleGrid columns={1} spacing={3}>
                    {menuDetail.availableStyles.map((style) => (
                      <Box
                        key={style.styleId}
                        p={4}
                        bg={useColorModeValue("gray.50", "gray.700")}
                        border="1px"
                        borderColor={useColorModeValue("gray.200", "gray.600")}
                        rounded="md"
                      >
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{style.name}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {style.description}
                            </Text>
                          </VStack>
                          <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                            +{style.additionalPrice.toLocaleString()}원
                          </Badge>
                        </HStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>

                <Divider />

                {/* Dishes (Customization Options) */}
                <Box>
                  <HStack mb={3}>
                    <Icon as={FaWineGlass} color="purple.500" />
                    <Heading size="sm">커스터마이징 옵션</Heading>
                  </HStack>
                  <SimpleGrid columns={1} spacing={3}>
                    {menuDetail.dishes.map((dish) => (
                      <Box
                        key={dish.dishId}
                        p={4}
                        bg={useColorModeValue("gray.50", "gray.700")}
                        border="1px"
                        borderColor={useColorModeValue("gray.200", "gray.600")}
                        rounded="md"
                      >
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{dish.name}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {dish.description}
                            </Text>
                          </VStack>
                          <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                            +{dish.basePrice.toLocaleString()}원
                          </Badge>
                        </HStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Order Button */}
                <Stack spacing={3} pt={4}>
                  <Button
                    size="lg"
                    colorScheme="brand"
                    leftIcon={<Icon as={FaShoppingCart} />}
                    onClick={() => handleOrderClick(menuDetail.dinnerId)}
                    width="100%"
                  >
                    {isAuthenticated ? "주문하기" : "로그인하고 주문하기"}
                  </Button>
                  {!isAuthenticated && (
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      주문하려면 로그인이 필요합니다
                    </Text>
                  )}
                </Stack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
