import { useTranslation } from "react-i18next";

import { StatusPage } from "@/shared/ui/status-page";

const NotFound = () => {
  const { t } = useTranslation("common");

  return (
    <StatusPage
      code={t("notFoundTitle")}
      description={t("notFoundDescription")}
      testId="not-found"
    />
  );
};

export default NotFound;
