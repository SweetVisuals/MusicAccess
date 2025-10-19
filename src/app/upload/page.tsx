import { DashboardLayout } from '@/components/layout/DashboardLayout';
import UploadWizard from './upload-wizard';

export default function UploadPage() {
  return (
    <DashboardLayout>
      <UploadWizard />
    </DashboardLayout>
  );
}
