import { useCallback, useRef, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { analyzeExcelFile } from '../../services/exercisesService';
import { useUser } from 'contexts/UserContext';
import { api } from 'services/api-client';

export function useExerciseExcelImport(params: { onAfterImport?: () => void; setLoading: (v: boolean) => void }) {
  const { onAfterImport, setLoading } = params;
  const { showToast } = useToast();
  const { coach } = useUser();
  const [analysisDialogVisible, setAnalysisDialogVisible] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [totalSize, setTotalSize] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileUploadRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onTemplateSelect = useCallback(
    (e: { files: Record<string, File> }) => {
      let _totalSize = totalSize;
      const files = e.files;
      Object.keys(files).forEach((key) => {
        _totalSize = files[key]?.size || 0;
      });
      setTotalSize(_totalSize);
      setSelectedFile(files[0] || null);
    },
    [totalSize]
  );

  const onTemplateUpload = useCallback((_e: any) => {
    // noop placeholder for PrimeReact callbacks
  }, []);

  const onTemplateError = useCallback((e: any) => {
    setTotalSize(0);
    console.error('Error during upload:', e);
  }, []);

  const onTemplateClear = useCallback(() => {
    setSelectedFile(null);
    setTotalSize(0);
  }, []);

  const uploadHandler = useCallback(
    async ({ files }: { files: File[] | Record<string, File> }) => {
      const file = Array.isArray(files) ? files[0] : (files as any)[0];
      const formData = new FormData();
      formData.append('file', file);
      try {
        setLoading(true);
        console.log('formData', formData);
        const { data } = await analyzeExcelFile(coach?.id, formData);
        setAnalysisDialogVisible(true);
        setAnalysisData(data);
      } catch (error: any) {
        onTemplateError(error);
        showToast('error', 'Error', error.message);
      } finally {
        setLoading(false);
      }
    },
    [coach, onTemplateError, showToast]
  );

  const handleAnalysisCancel = useCallback(() => {
    setAnalysisDialogVisible(false);
    if (fileUploadRef.current) fileUploadRef.current.clear();
    setSelectedFile(null);
    setTotalSize(0);
  }, []);

  const handleAnalysisConfirm = useCallback(async () => {
    try {
      setLoading(true);
      const importData = {
        newExercises: analysisData?.exercisesToCreate || [],
        updateExercises: analysisData?.exercisesToUpdate || []
      };
      await api.exercise.processImportExercises(importData);

      if (fileUploadRef.current) fileUploadRef.current.clear();
      setSelectedFile(null);
      setTotalSize(0);
      setAnalysisDialogVisible(false);
      setAnalysisData(null);
      onAfterImport && onAfterImport();
    } catch (error: any) {
      console.error('Error processing import exercises', error);
      onTemplateError(error);
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
      if (fileUploadRef.current) fileUploadRef.current.clear();
    }
  }, [analysisData, coach, onAfterImport, onTemplateError, setLoading, showToast]);

  return {
    // refs
    fileUploadRef,
    fileInputRef,
    // state
    selectedFile,
    totalSize,
    analysisDialogVisible,
    analysisData,
    // actions
    setAnalysisData,
    onTemplateSelect,
    uploadHandler,
    onTemplateUpload,
    onTemplateError,
    onTemplateClear,
    handleAnalysisCancel,
    handleAnalysisConfirm
  };
}
