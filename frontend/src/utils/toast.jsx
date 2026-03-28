import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

function showToast(msg, { Icon, iconColor, bgColor, ringColor, textColor }) {
  return toast.custom((t) => (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-sm w-full ${bgColor} shadow-lg rounded-lg pointer-events-auto flex ring-1 ${ringColor}`}
    >
      <div className="flex-1 w-0 p-3">
        <div className="flex items-center">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <p className={`ml-2 text-sm font-medium ${textColor}`}>{msg}</p>
        </div>
      </div>
    </div>
  ));
}

export function showSuccessToast(msg) {
  return showToast(msg, {
    Icon: CheckCircleIcon,
    iconColor: "text-green-400",
    bgColor: "bg-green-900/90",
    ringColor: "ring-green-500/50",
    textColor: "text-green-200",
  });
}

export function showErrorToast(msg) {
  return showToast(msg, {
    Icon: XCircleIcon,
    iconColor: "text-red-400",
    bgColor: "bg-red-900/90",
    ringColor: "ring-red-500/50",
    textColor: "text-red-200",
  });
}

export function showInfoToast(msg) {
  return showToast(msg, {
    Icon: InformationCircleIcon,
    iconColor: "text-gray-400",
    bgColor: "bg-gray-800",
    ringColor: "ring-black ring-opacity-5",
    textColor: "text-gray-200",
  });
}
