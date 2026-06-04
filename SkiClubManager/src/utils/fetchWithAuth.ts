export const fetchWithAuth = async (
  url: string,
  accessToken: string | null,
  options: RequestInit = {}
): Promise<Response> => {
  if (!accessToken) {
    console.warn('No hay accessToken disponible.');
    return new Response(null, { status: 401, statusText: 'No token' });
  }

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  console.log('➡️ fetchWithAuth:', url, options.method || 'GET', headers);

  return fetch(url, {
    ...options,
    headers,
  });
};
