import { useCallback, useState } from "react";
import { useAppConfig } from "../contexts/AppConfigContext";
import { showErrorToast } from "../utils/toast";
import Modal from "./Modal";

function ToggleSwitch({ checked, saving, onChange }) {
  const trackClass = checked ? "bg-indigo-600" : "bg-gray-700";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={saving}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${trackClass}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          saving ? "animate-pulse" : ""
        } ${checked ? "translate-x-[18px]" : "translate-x-[2px]"}`}
      />
    </button>
  );
}

// TODO: word break is weird
function SettingRow({ name, description, checked, saving, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-200">{name}</div>
        <div className="text-xs text-gray-500 leading-relaxed mt-0.5">
          {description}
        </div>
      </div>
      <ToggleSwitch checked={checked} saving={saving} onChange={onChange} />
    </div>
  );
}

const categories = [
  {
    name: "Markdown",
    settings: [
      {
        key: "strictLineBreaks",
        name: "Strict line breaks",
        description:
          "When enabled, single line breaks in Markdown are ignored (standard behavior). When disabled, they are rendered as line breaks.",
      },
    ],
  },
];

export default function SettingsModal({ open, onClose }) {
  const { config, updateConfig } = useAppConfig();
  const [savingKey, setSavingKey] = useState(null);

  const handleToggle = useCallback(
    async (key, value) => {
      setSavingKey(key);
      try {
        await updateConfig({ [key]: value });
      } catch (err) {
        showErrorToast(err.message);
      } finally {
        setSavingKey(null);
      }
    },
    [updateConfig],
  );

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      {categories.map((category) => (
        <div key={category.name}>
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 mt-2 first:mt-0">
            {category.name}
          </div>
          <div className="divide-y divide-gray-800">
            {category.settings.map((setting) => (
              <SettingRow
                key={setting.key}
                name={setting.name}
                description={setting.description}
                checked={config[setting.key]}
                saving={savingKey === setting.key}
                onChange={(value) => handleToggle(setting.key, value)}
              />
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}
