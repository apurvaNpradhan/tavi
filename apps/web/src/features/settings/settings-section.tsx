import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * The heading and intro copy for one settings section.
 *
 * Sections are routes, so this is the only place their presentation is decided;
 * the route component below it is just the fields.
 */
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading font-semibold text-base tracking-tight">{title}</h2>
        {description ? (
          <p className="text-balance text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default SettingsSection;
