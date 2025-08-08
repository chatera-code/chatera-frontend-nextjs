import { Document, Session } from '../types';

// Define base URLs for each service the front-end will call directly
const MAIN_API_BASE_URL = 'http://127.0.0.1:8000'; // For chat, sessions, docs
const INGESTION_API_BASE_URL = 'http://127.0.0.1:8002'; // For file uploads

// --- API Fetching Functions ---

/**
 * UPDATED: Uploads multiple documents to the dedicated ingestion service.
 */
export const uploadDocuments = async (clientId: string, files: File[], uploadChannelId: string): Promise<void> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  
  // Note the use of INGESTION_API_BASE_URL
  const response = await fetch(`${INGESTION_API_BASE_URL}/upload/?client_id=${clientId}&uploadChannelId=${uploadChannelId}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to upload documents');
  }
};

/**
 * UPDATED: Deletes multiple documents by calling the main app.
 */
export const deleteDocuments = async (docIds: string[], clientId: string): Promise<void> => {
  const response = await fetch(`${MAIN_API_BASE_URL}/api/documents/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_ids: docIds, clientId: clientId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete documents');
  }
};

export const fetchUserDocuments = async (clientId: string): Promise<Document[]> => {
  const response = await fetch(`${MAIN_API_BASE_URL}/api/documents?clientId=${clientId}`);
  if (!response.ok) throw new Error('Failed to fetch documents');
  const data = await response.json();
  return data.documents || [];
};

export const updateSession = async (sessionId: string, updates: { title?: string; isPinned?: boolean }): Promise<Session> => {
  const response = await fetch(`${MAIN_API_BASE_URL}/api/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update session');
  }
  return response.json();
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const response = await fetch(`${MAIN_API_BASE_URL}/api/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete session');
  }
};


export const fetchChatSessions = async (clientId: string): Promise<Session[]> => {
  const response = await fetch(`${MAIN_API_BASE_URL}/api/sessions?clientId=${clientId}`);
  if (!response.ok) throw new Error('Failed to fetch sessions');
  const data = await response.json();
  return data.sessions || [];
};

export const fetchChatHistory = async (sessionId: string) => {
  const response = await fetch(`${MAIN_API_BASE_URL}/api/chats?sessionId=${sessionId}`);
  if (!response.ok) throw new Error('Failed to fetch chat history');
  const data = await response.json();
  return data.messages || [];
};

export const createNewSession = async (clientId: string, initialData?: { title: string }): Promise<Session> => {
  const response = await fetch(`${MAIN_API_BASE_URL}/api/sessions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, ...initialData }),
  });
  if (!response.ok) throw new Error('Failed to create new session');
  const data = await response.json();
  return data.newSession;
};

export const sendMessage = async (
  req: {
    clientId: string;
    sessionId: string;
    message: string;
    documentIds: string[];
  },
  onToken: (token: string) => void,
  onClose: () => void,
  onError: (error: Error) => void
) => {
  try {
    const response = await fetch(`${MAIN_API_BASE_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onClose();
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6).trim();
          if (jsonStr) {
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.event === 'token') {
                onToken(parsed.data);
              } else if (parsed.event === 'end') {
                onClose();
              } else if (parsed.event === 'error') {
                throw new Error(parsed.data);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", jsonStr, e);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('SSE Error:', error);
    onError(error as Error);
  }
};