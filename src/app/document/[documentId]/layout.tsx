import { DocumentLayout } from '@/app/document/[documentId]/_components/document-layout';
import { DocumentByIdPageParams } from '@/app/document/[documentId]/types';
import { Metadata, ResolvingMetadata } from 'next';

const title = 'Some title'; //TODO: this must be fetched from server (endpoint which returns only title)

export async function generateMetadata(
  _props: DocumentByIdPageParams,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  return {
    title: `${title} - Beast Doc`,
    description: `Editing and collaboration for document with title of ${title}`,
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  //TODO:  fetch data and pass to document layout and it children as well
  return <DocumentLayout>{children}</DocumentLayout>;
}
