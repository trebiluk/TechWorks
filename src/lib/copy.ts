import { APP_VERSION, VERSION_LABEL } from "@/lib/version";

export const APP_NAME = "TechWorks";
export const APP_MARK = "TECHWORKS™";
export const APP_RELEASE = APP_VERSION;
export const COPYRIGHT_YEAR = 2026;
export const COPYRIGHT_HOLDER = "Richard Kulibert";
/** Visible footer / chip hover / About — same string everywhere. */
export const COPYRIGHT_LINE = `© ${COPYRIGHT_YEAR} ${COPYRIGHT_HOLDER}. ${APP_MARK} ${VERSION_LABEL}.`;
export const COPYRIGHT_NOTICE = COPYRIGHT_LINE;
export const TRADEMARK_NOTICE = `${APP_MARK} is a trademark of ${COPYRIGHT_HOLDER}.`;
export const COPYRIGHT_LONG = `${COPYRIGHT_LINE}
${TRADEMARK_NOTICE}
Classroom salary, skills, and workshop desk. Aliases only on public surfaces. Google Sheets remains the archive. Not licensed for redistribution without permission.`;
export const LEGAL_TITLE = COPYRIGHT_LINE;
