import { useState, useCallback, useEffect } from 'react';
import { apiGet } from '../api/shopify';
import { ENDPOINTS } from '../api/queries';
import { FlatProduct, FlatCollection } from '../api/types';

export function useProducts(count = 24) {
  const [products, setProducts] = useState<FlatProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<{ products: FlatProduct[] }>(
        ENDPOINTS.products,
        { limit: String(count) }
      );
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

export function useProductByHandle(handle: string) {
  const [product, setProduct] = useState<FlatProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGet<{ product: FlatProduct | null }>(
          ENDPOINTS.productByHandle(handle)
        );
        setProduct(data.product);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [handle]);

  return { product, loading, error };
}

export function useSearchProducts() {
  const [results, setResults] = useState<FlatProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const data = await apiGet<{ products: FlatProduct[] }>(
        ENDPOINTS.search,
        { q: query, limit: '48' }
      );
      setResults(data.products || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
}

export function useCollections(count = 20, location?: 'header' | 'page' | 'menu') {
  const [collections, setCollections] = useState<FlatCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: String(count) };
      if (location) params.location = location;
      const data = await apiGet<{ collections: FlatCollection[] }>(
        ENDPOINTS.collections,
        params
      );
      setCollections(data.collections || []);
    } catch (err) {
      console.error('Collections error:', err);
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return { collections, loading, refetch: fetchCollections };
}

export function useCollectionByHandle(handle: string) {
  const [collection, setCollection] = useState<FlatCollection | null>(null);
  const [products, setProducts] = useState<FlatProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollection = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<{ collection: FlatCollection | null; products: FlatProduct[] }>(
        ENDPOINTS.collectionByHandle(handle),
        { limit: '50' }
      );
      setCollection(data.collection);
      setProducts(data.products || []);
    } catch (err) {
      console.error('Collection error:', err);
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  return { collection, products, loading, refetch: fetchCollection };
}
