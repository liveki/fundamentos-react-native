import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartProducts = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (cartProducts) {
        setProducts(JSON.parse(cartProducts));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function updateStorage(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify([...products]),
      );
    }

    updateStorage();
  }, [products]);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const productIndex = products.findIndex(item => item.id === product.id);

      if (productIndex === -1) {
        const cartItem: Product = {
          ...product,
          quantity: 1,
        };

        setProducts(oldstate => [...oldstate, cartItem]);
      } else {
        const newProducts: Product[] = products;
        newProducts[productIndex].quantity += 1;

        setProducts([...newProducts]);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts: Product[] = products;
      const productIndex = newProducts.findIndex(product => product.id === id);
      newProducts[productIndex].quantity += 1;

      setProducts([...newProducts]);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts: Product[] = products;
      const productIndex = newProducts.findIndex(product => product.id === id);

      newProducts[productIndex].quantity -= 1;

      if (newProducts[productIndex].quantity === 0) {
        newProducts.splice(productIndex, 1);
      }

      setProducts([...newProducts]);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
