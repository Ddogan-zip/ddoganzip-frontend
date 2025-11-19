import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Image,
  RadioGroup,
  Radio,
  Stack,
  Divider,
  Box,
  useColorModeValue,
  IconButton,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { FaPlus, FaMinus, FaShoppingCart } from "react-icons/fa";
import type { DinnerDetail, Dish, ServingStyle, Customization } from "../api/types";

interface MenuDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuDetail: DinnerDetail | null;
  onAddToCart: (
    dinnerId: number,
    servingStyleId: number,
    quantity: number,
    customizations: Customization[]
  ) => void;
}

interface DishQuantity {
  dishId: number;
  quantity: number;
  originalQuantity: number;
}

export default function MenuDetailModal({
  isOpen,
  onClose,
  menuDetail,
  onAddToCart,
}: MenuDetailModalProps) {
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [dishQuantities, setDishQuantities] = useState<Record<number, DishQuantity>>({});
  const [orderQuantity, setOrderQuantity] = useState(1);
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Initialize serving style and dish quantities when modal opens
  useEffect(() => {
    if (menuDetail && isOpen) {
      // Set default serving style (first available)
      if (menuDetail.availableStyles.length > 0) {
        setSelectedStyleId(menuDetail.availableStyles[0].styleId);
      }

      // Initialize dish quantities with default values
      const initialQuantities: Record<number, DishQuantity> = {};
      menuDetail.dishes.forEach((dish) => {
        initialQuantities[dish.dishId] = {
          dishId: dish.dishId,
          quantity: dish.defaultQuantity,
          originalQuantity: dish.defaultQuantity,
        };
      });
      setDishQuantities(initialQuantities);
      setOrderQuantity(1);
    }
  }, [menuDetail, isOpen]);

  if (!menuDetail) return null;

  const selectedStyle = menuDetail.availableStyles.find(
    (style) => style.styleId === selectedStyleId
  );

  // Calculate customizations based on quantity changes
  const getCustomizations = (): Customization[] => {
    const customizations: Customization[] = [];

    Object.values(dishQuantities).forEach((dq) => {
      const diff = dq.quantity - dq.originalQuantity;

      if (diff > 0) {
        // ADD: quantity increased
        customizations.push({
          action: "ADD",
          dishId: dq.dishId,
          quantity: diff,
        });
      } else if (diff < 0) {
        // REMOVE: quantity decreased
        customizations.push({
          action: "REMOVE",
          dishId: dq.dishId,
          quantity: Math.abs(diff),
        });
      }
      // If diff === 0, no customization needed
    });

    return customizations;
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    let total = menuDetail.basePrice;

    // Add serving style price
    if (selectedStyle) {
      total += selectedStyle.additionalPrice;
    }

    // Add customizations price
    Object.entries(dishQuantities).forEach(([dishIdStr, dq]) => {
      const dish = menuDetail.dishes.find((d) => d.dishId === parseInt(dishIdStr));
      if (dish) {
        const diff = dq.quantity - dq.originalQuantity;
        if (diff > 0) {
          total += dish.basePrice * diff;
        } else if (diff < 0) {
          total -= dish.basePrice * Math.abs(diff);
        }
      }
    });

    return total * orderQuantity;
  };

  const handleAddToCart = () => {
    if (!selectedStyleId) {
      toast({
        title: "서빙 스타일을 선택해주세요",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const customizations = getCustomizations();
    onAddToCart(menuDetail.dinnerId, selectedStyleId, orderQuantity, customizations);
    onClose();
  };

  const updateDishQuantity = (dishId: number, delta: number) => {
    setDishQuantities((prev) => {
      const current = prev[dishId];
      const newQuantity = Math.max(0, current.quantity + delta);
      return {
        ...prev,
        [dishId]: {
          ...current,
          quantity: newQuantity,
        },
      };
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg={cardBg}>
        <ModalHeader
          bgGradient="linear(to-r, brand.50, purple.50)"
          borderBottom="1px"
          borderColor={borderColor}
        >
          <Text
            fontSize="2xl"
            fontWeight="bold"
            bgGradient="linear(to-r, brand.500, purple.500)"
            bgClip="text"
          >
            {menuDetail.name}
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* Menu Image */}
            {menuDetail.imageUrl && (
              <Image
                src={menuDetail.imageUrl}
                alt={menuDetail.name}
                rounded="lg"
                objectFit="cover"
                h="200px"
                w="100%"
              />
            )}

            {/* Description */}
            <Box>
              <Text color="gray.600" fontSize="md">
                {menuDetail.description}
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="brand.500" mt={2}>
                기본 가격: {menuDetail.basePrice.toLocaleString()}원
              </Text>
            </Box>

            <Divider />

            {/* Dishes Included */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                포함된 요리
              </Text>
              <VStack spacing={3} align="stretch">
                {menuDetail.dishes.map((dish) => (
                  <Box
                    key={dish.dishId}
                    p={3}
                    bg={useColorModeValue("gray.50", "gray.700")}
                    rounded="md"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <HStack justify="space-between" mb={2}>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold">{dish.name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {dish.description}
                        </Text>
                        <Text fontSize="sm" color="brand.500" fontWeight="medium">
                          {dish.basePrice.toLocaleString()}원
                        </Text>
                      </VStack>
                    </HStack>
                    <HStack justify="space-between" align="center">
                      <Text fontSize="sm" color="gray.600">
                        기본 수량: {dish.defaultQuantity}개
                      </Text>
                      <HStack>
                        <IconButton
                          aria-label="Decrease dish quantity"
                          icon={<FaMinus />}
                          size="sm"
                          onClick={() => updateDishQuantity(dish.dishId, -1)}
                          isDisabled={dishQuantities[dish.dishId]?.quantity === 0}
                        />
                        <Badge
                          colorScheme={
                            dishQuantities[dish.dishId]?.quantity !==
                            dish.defaultQuantity
                              ? "purple"
                              : "gray"
                          }
                          fontSize="md"
                          px={3}
                          py={1}
                        >
                          {dishQuantities[dish.dishId]?.quantity || 0}개
                        </Badge>
                        <IconButton
                          aria-label="Increase dish quantity"
                          icon={<FaPlus />}
                          size="sm"
                          onClick={() => updateDishQuantity(dish.dishId, 1)}
                        />
                      </HStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </Box>

            <Divider />

            {/* Serving Style Selection */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                서빙 스타일 선택
              </Text>
              <RadioGroup
                value={selectedStyleId?.toString()}
                onChange={(value) => setSelectedStyleId(parseInt(value))}
              >
                <Stack spacing={3}>
                  {menuDetail.availableStyles.map((style) => (
                    <Box
                      key={style.styleId}
                      p={4}
                      borderWidth="2px"
                      borderColor={
                        selectedStyleId === style.styleId
                          ? "brand.400"
                          : borderColor
                      }
                      rounded="md"
                      bg={
                        selectedStyleId === style.styleId
                          ? useColorModeValue("brand.50", "gray.700")
                          : "transparent"
                      }
                      transition="all 0.2s"
                      cursor="pointer"
                      onClick={() => setSelectedStyleId(style.styleId)}
                    >
                      <Radio value={style.styleId.toString()}>
                        <HStack justify="space-between" w="100%">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{style.name}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {style.description}
                            </Text>
                          </VStack>
                          <Text
                            fontWeight="bold"
                            color={style.additionalPrice > 0 ? "brand.500" : "green.500"}
                          >
                            {style.additionalPrice > 0
                              ? `+${style.additionalPrice.toLocaleString()}원`
                              : "무료"}
                          </Text>
                        </HStack>
                      </Radio>
                    </Box>
                  ))}
                </Stack>
              </RadioGroup>
            </Box>

            <Divider />

            {/* Order Quantity */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                주문 수량
              </Text>
              <HStack>
                <IconButton
                  aria-label="Decrease order quantity"
                  icon={<FaMinus />}
                  onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                  isDisabled={orderQuantity === 1}
                />
                <Badge colorScheme="brand" fontSize="xl" px={6} py={2}>
                  {orderQuantity}개
                </Badge>
                <IconButton
                  aria-label="Increase order quantity"
                  icon={<FaPlus />}
                  onClick={() => setOrderQuantity(orderQuantity + 1)}
                />
              </HStack>
            </Box>

            {/* Total Price */}
            <Box
              p={4}
              bgGradient="linear(to-r, green.50, green.100)"
              rounded="lg"
              borderWidth="2px"
              borderColor="green.400"
            >
              <HStack justify="space-between">
                <Text fontSize="xl" fontWeight="bold">
                  총 금액:
                </Text>
                <Text
                  fontSize="2xl"
                  fontWeight="black"
                  bgGradient="linear(to-r, green.500, green.700)"
                  bgClip="text"
                >
                  {calculateTotalPrice().toLocaleString()}원
                </Text>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px" borderColor={borderColor}>
          <Button variant="ghost" mr={3} onClick={onClose}>
            취소
          </Button>
          <Button
            leftIcon={<FaShoppingCart />}
            bgGradient="linear(to-r, brand.400, brand.600)"
            color="white"
            onClick={handleAddToCart}
            _hover={{
              bgGradient: "linear(to-r, brand.500, brand.700)",
              transform: "translateY(-2px)",
              boxShadow: "lg",
            }}
            size="lg"
          >
            장바구니에 담기
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
