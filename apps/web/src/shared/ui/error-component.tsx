import { useTranslation } from "react-i18next";

import { StatusPage } from "@/shared/ui/status-page";

const ErrorComponent = () => {
  const { t } = useTranslation("common");

  return (
    <StatusPage
      code={t("errorTitle")}
      description={t("errorDescription")}
      testId="error-component"
    />
  );
};

export default ErrorComponent;
