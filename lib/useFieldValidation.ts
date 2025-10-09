// lib/useFieldValidation.ts
// 欄位驗證 Hook

import { useState, useEffect, useCallback } from 'react';
import { CalculatorInputs } from './useRetirementCalculator';
import { validateField } from './validationRules';

export interface FieldError {
  hasError: boolean;
  errorMessage: string;
}

export interface ValidationState {
  [key: string]: FieldError;
}

export function useFieldValidation(inputs: CalculatorInputs) {
  const [errors, setErrors] = useState<ValidationState>({});

  // 驗證單個欄位
  const validateSingleField = useCallback((fieldName: keyof CalculatorInputs) => {
    const result = validateField(fieldName, inputs[fieldName], inputs);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: {
        hasError: !result.isValid,
        errorMessage: result.errorMessage
      }
    }));
    
    return result.isValid;
  }, [inputs]);

  // 當輸入改變時，重新驗證相關欄位
  useEffect(() => {
    // 驗證所有已經有錯誤的欄位，或使用者已經輸入過的欄位
    Object.keys(inputs).forEach((fieldName) => {
      const key = fieldName as keyof CalculatorInputs;
      const value = inputs[key];
      
      // 只驗證有值的欄位或之前有錯誤的欄位
      if (value || errors[key]?.hasError) {
        validateSingleField(key);
      }
    });
  }, [inputs]); // 移除 validateSingleField 和 errors 避免無限循環

  // 清除特定欄位的錯誤
  const clearFieldError = useCallback((fieldName: keyof CalculatorInputs) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: {
        hasError: false,
        errorMessage: ''
      }
    }));
  }, []);

  // 檢查是否有任何錯誤
  const hasAnyError = useCallback(() => {
    return Object.values(errors).some(error => error.hasError);
  }, [errors]);

  return {
    errors,
    validateSingleField,
    clearFieldError,
    hasAnyError
  };
}
