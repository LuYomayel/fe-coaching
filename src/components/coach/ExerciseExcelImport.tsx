import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { useIntl } from 'react-intl';
import { useExerciseExcelImport } from '../../hooks/coach/useExerciseExcelImport';
import ExcelAnalysisDialog from '../dialogs/ExcelAnalysisDialog';

interface Props {
  onAfterImport?: () => void;
  setLoading: (v: boolean) => void;
}

export function ExerciseExcelImport({ onAfterImport, setLoading }: Props) {
  const intl = useIntl();
  const imp = useExerciseExcelImport({ onAfterImport, setLoading });

  return (
    <>
      <Button
        label={intl.formatMessage({ id: 'coach.importExercises' })}
        icon="pi pi-upload"
        onClick={() => imp.fileInputRef.current && imp.fileInputRef.current.click()}
        className="p-button-outlined"
      />
      <input
        ref={imp.fileInputRef}
        type="file"
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const files = { 0: e.target.files[0] as File } as any;
            imp.onTemplateSelect({ files });
            imp.uploadHandler({ files } as any);
          }
        }}
      />
      <FileUpload
        ref={imp.fileUploadRef as any}
        customUpload
        uploadHandler={imp.uploadHandler as any}
        onUpload={imp.onTemplateUpload as any}
        onSelect={imp.onTemplateSelect as any}
        onError={imp.onTemplateError as any}
        onClear={imp.onTemplateClear as any}
        multiple={false}
        maxFileSize={1000000}
        accept=".xlsx, .xls"
        emptyTemplate={<p className="m-0">{intl.formatMessage({ id: 'coach.dragAndDropExercises' })}</p>}
        style={{ display: 'none' }}
      />

      {imp.analysisDialogVisible && (
        <ExcelAnalysisDialog
          visible={imp.analysisDialogVisible}
          onHide={imp.handleAnalysisCancel}
          analysisData={imp.analysisData}
          onConfirm={imp.handleAnalysisConfirm}
          setAnalysisData={imp.setAnalysisData}
        />
      )}
    </>
  );
}
