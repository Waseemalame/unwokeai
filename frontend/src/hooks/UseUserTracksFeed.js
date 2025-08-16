import { useEffect, useState } from 'react';
import axios from 'axios';

export function useUserTracks(userId) {
  const [tracks, setTracks] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;
    setIsLoading(true);
    axios.get(`/api/users/${userId}/tracks`, { params: { limit: 24 } })
      .then(res => {
        if (isCancelled) return;
        setTracks(res.data.items || []);
        setNextCursor(res.data.nextCursor || null);
      })
      .finally(() => !isCancelled && setIsLoading(false));
    return () => { isCancelled = true; };
  }, [userId]);

  const fetchNext = async () => {
    if (!nextCursor || isLoading) return;
    setIsLoading(true);
    const res = await axios.get(`/api/users/${userId}/tracks`, {
      params: { limit: 24, cursor: nextCursor },
    });
    setTracks(prev => [...prev, ...(res.data.items || [])]);
    setNextCursor(res.data.nextCursor || null);
    setIsLoading(false);
  };

  return { tracks, nextCursor, isLoading, fetchNext };
}
