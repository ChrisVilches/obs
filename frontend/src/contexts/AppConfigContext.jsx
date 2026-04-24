import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetcher } from "../utils/fetcher";
import { showErrorToast } from "../utils/toast";

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const serverConfig = await fetcher("/api/config");
        setConfig(serverConfig);
        saveToLocalStorage(serverConfig);
      } catch (err) {
        console.error("Failed to sync config from server:", err.message);
      }
    })();
  }, []);

  const updateConfig = useCallback(async (updates) => {
    setSaving(true);
    try {
      const serverConfig = await fetcher("/api/config", {
        method: "PATCH",
        body: updates,
      });
      setConfig(serverConfig);
      saveToLocalStorage(serverConfig);
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <AppConfigContext.Provider value={{ config, saving, updateConfig }}>
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
