import { CartProvider } from "@/lib/cart-context";

export default function RestaurantLayout({ children, params }) {
  return <CartProvider restaurantId={params.restaurantId}>{children}</CartProvider>;
}
