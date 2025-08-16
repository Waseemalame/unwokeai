import { useEffect, useState } from 'react';
import axios from 'axios';

export function useUserProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;
    setIsLoading(true);
    axios.get(`/api/users/${userId}/profile`)
      .then(res => !isCancelled && setProfile(res.data))
      .finally(() => !isCancelled && setIsLoading(false));
    return () => { isCancelled = true; };
  }, [userId]);

  return { profile, isLoading };
}
