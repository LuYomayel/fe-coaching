import { useCallback, useRef, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { analyzeExcelFile } from '../../services/exercisesService';
import { useUser } from 'contexts/UserContext';
import { api } from 'services/api-client';
import { useExercisesStore } from '../../stores/useExercisesStore';

export function useExerciseExcelImport(params: { onAfterImport?: () => void; setLoading: (v: boolean) => void }) {
  const { onAfterImport, setLoading } = params;
  const { showToast } = useToast();
  const { coach } = useUser();
  const invalidateExercises = useExercisesStore((s) => s.invalidate);
  const [analysisDialogVisible, setAnalysisDialogVisible] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [totalSize, setTotalSize] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileUploadRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearAll = useCallback(() => {
    setSelectedFile(null);
    setTotalSize(0);
    setAnalysisData(null);
    setAnalysisDialogVisible(false);
    if (fileUploadRef.current?.clear) {
      fileUploadRef.current.clear();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

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
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    console.error('Error during upload:', e);
  }, []);

  const onTemplateClear = useCallback(() => {
    setSelectedFile(null);
    setTotalSize(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        console.log('data', data);
        setAnalysisDialogVisible(true);
        setAnalysisData(data);
      } catch (error: any) {
        onTemplateError(error);
        console.error('Error analyzing excel file', error);
        showToast('error', 'Error', error.message);
      } finally {
        setLoading(false);
      }
    },
    [coach, onTemplateError, setLoading, showToast]
  );

  const handleAnalysisCancel = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const handleAnalysisConfirm = useCallback(async () => {
    try {
      setLoading(true);
      const importData = {
        newExercises: analysisData?.exercisesToCreate || [],
        updateExercises: analysisData?.exercisesToUpdate || []
      };
      await api.exercise.processImportExercises(importData);

      invalidateExercises();
      clearAll();
      onAfterImport && onAfterImport();
    } catch (error: any) {
      console.error('Error processing import exercises', error);
      showToast('error', 'Error', error.message);
      clearAll();
    } finally {
      setLoading(false);
    }
  }, [analysisData, clearAll, invalidateExercises, onAfterImport, setLoading, showToast]);

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
