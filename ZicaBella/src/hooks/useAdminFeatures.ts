import { useState, useEffect } from 'react';
import { config } from '../constants/config';

export function useAdminSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${config.appUrl}/api/app/settings?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        // Only set settings if there's no error from the API
        if (!data.error) {
          setSettings(data);
        } else {
          console.error('API returned error:', data.error);
        }
      })
      .catch((err) => console.error('Error fetching admin settings:', err))
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}

export function useFeaturedUsers(isTopFeatured = false) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = isTopFeatured 
      ? `${config.appUrl}/api/featured-users?isTopFeatured=true`
      : `${config.appUrl}/api/featured-users`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
        }
      })
      .catch((err) => console.error('Error fetching featured users:', err))
      .finally(() => setLoading(false));
  }, [isTopFeatured]);

  return { users, loading };
}
