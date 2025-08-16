import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

export function useTracksFeed(searchQuery) {
  const [tracks, setTracks] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastQueryRef = useRef('');

  // load first page whenever the search query changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    lastQueryRef.current = searchQuery;

    axios
      .get('/api/tracks', { params: { search: searchQuery, limit: 24 } })
      .then((res) => {
        if (isCancelled) return;
        setTracks(res.data.items || []);
        setNextCursor(res.data.nextCursor || null);
      })
      .finally(() => !isCancelled && setIsLoading(false));

    return () => {
      isCancelled = true;
    };
  }, [searchQuery]);

  const fetchNext = async () => {
    if (!nextCursor || isLoading) return;
    setIsLoading(true);
    const res = await axios.get('/api/tracks', {
      params: { search: lastQueryRef.current, limit: 24, cursor: nextCursor },
    });
    setTracks((prev) => [...prev, ...(res.data.items || [])]);
    setNextCursor(res.data.nextCursor || null);
    setIsLoading(false);
  };

  return { tracks, nextCursor, isLoading, fetchNext };
}