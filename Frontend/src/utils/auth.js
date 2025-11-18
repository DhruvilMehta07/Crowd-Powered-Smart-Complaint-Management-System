// In-memory storage for access token (more secure than localStorage)
let accessToken = null;

// Restore accessToken from localStorage if present (on app load)
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('access_token');
  if (storedToken) {
    accessToken = storedToken;
  }
}


export const setAccessToken = (token) => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
};

export const getAccessToken = () => {
  return accessToken;
};


export const clearAccessToken = () => {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
};

// CSRF token helper
export const getCsrfToken = () => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, 'csrftoken'.length + 1) === ('csrftoken=')) {
        cookieValue = decodeURIComponent(cookie.substring('csrftoken'.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};
