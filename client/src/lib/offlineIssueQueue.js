import api from "../api/axiosInstance.js";

const QUEUE_KEY = "offline_issue_queue_v1";

const readQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (items) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const dataUrlToFile = async (dataUrl, filename, mimeType) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType });
};

const serializeFormData = async (formData) => {
  const serialized = {
    fields: {},
    files: [],
  };

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      serialized.files.push({
        field: key,
        name: value.name,
        type: value.type,
        content: await fileToDataUrl(value),
      });
      continue;
    }
    serialized.fields[key] = value;
  }

  return serialized;
};

const deserializeToFormData = async (payload) => {
  const formData = new FormData();

  Object.entries(payload.fields || {}).forEach(([key, value]) => {
    formData.append(key, value);
  });

  for (const file of payload.files || []) {
    const rebuilt = await dataUrlToFile(file.content, file.name, file.type);
    formData.append(file.field, rebuilt);
  }

  return formData;
};

export const enqueueIssueReport = async (formData) => {
  const queue = readQueue();
  const serialized = await serializeFormData(formData);
  queue.push({
    id: `${Date.now()}-${Math.round(Math.random() * 100000)}`,
    createdAt: new Date().toISOString(),
    payload: serialized,
  });
  writeQueue(queue);
  return queue.length;
};

export const flushQueuedIssueReports = async () => {
  if (!navigator.onLine) return { flushed: 0, remaining: readQueue().length };

  const queue = readQueue();
  if (queue.length === 0) return { flushed: 0, remaining: 0 };

  const remaining = [];
  let flushed = 0;

  for (const item of queue) {
    try {
      const formData = await deserializeToFormData(item.payload);
      await api.post("/v1/issues", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      flushed += 1;
    } catch {
      remaining.push(item);
    }
  }

  writeQueue(remaining);
  return { flushed, remaining: remaining.length };
};

export const getQueuedIssueReportCount = () => readQueue().length;
