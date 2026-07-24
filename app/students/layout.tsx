import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";

import { StudentsQueryProvider } from "./queries/students-query-provider";

export default async function StudentsLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={{ Students: messages.Students }}>
      <StudentsQueryProvider>
        {children}
        {modal}
      </StudentsQueryProvider>
    </NextIntlClientProvider>
  );
}
