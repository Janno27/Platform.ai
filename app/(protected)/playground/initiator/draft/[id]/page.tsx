import { DraftEditorPage } from './draft-editor-page';

export default function Page({ params }: { params: { id: string } }) {
  return <DraftEditorPage draftId={params.id} />;
} 