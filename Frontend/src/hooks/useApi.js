import { useCallback } from 'react';
import api from '../utils/axiosConfig';

export const useApi = () => {
  const get = useCallback((url, config = {}) => {
    return api.get(url, config);
  }, []);

  const post = useCallback((url, data = {}, config = {}) => {
    return api.post(url, data, config);
  }, []);

  const put = useCallback((url, data = {}, config = {}) => {
    return api.put(url, data, config);
  }, []);

  const patch = useCallback((url, data = {}, config = {}) => {
    return api.patch(url, data, config);
  }, []);

  const del = useCallback((url, config = {}) => {
    return api.delete(url, config);
  }, []);

  return { get, post, put, patch, del };
};