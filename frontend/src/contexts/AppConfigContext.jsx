import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetcher } from "../utils/fetcher";

const LOCAL_STORAGE_KEY = "appConfig";

const defaultConfig = { strictLineBreaks: false };

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToLocalStorage(config) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
}

const AppConfigContext = createContext(null);

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState(() => {
    const stored = loadFromLocalStorage();
    return { ...defaultConfig, ...stored };
  });

  useEffect(() => {
    fetcher("/api/config")
      .then((serverConfig) => {
        setConfig(serverConfig);
        saveToLocalStorage(serverConfig);
      })
      .catch(() => {});
  }, []);

  const updateConfig = useCallback(async (updates) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      saveToLocalStorage(next);
      return next;
    });

    await fetcher("/api/config", {
      method: "PUT",
      body: updates,
    });
  }, []);

  return (
    <AppConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) {
    throw new Error("useAppConfig must be used within AppConfigProvider");
  }
  return ctx;
}
