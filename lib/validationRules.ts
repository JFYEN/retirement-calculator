// lib/validationRules.ts
// 驗證規則定義

import { CalculatorInputs } from './useRetirementCalculator';

export interface ValidationRule {
  validate: (value: string, allInputs: CalculatorInputs) => boolean;
  errorMessage: string;
}

export interface FieldValidationRules {
  [key: string]: ValidationRule[];
}

// 輔助函數：將字串轉換為數字
const toNum = (value: string): number => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

// 定義所有欄位的驗證規則
export const validationRules: FieldValidationRules = {
  // 基本資料
  age: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 1 && num <= 100;
      },
      errorMessage: '請輸入 1–100 歲'
    }
  ],
  
  retireAge: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 1 && num <= 100;
      },
      errorMessage: '請輸入 1–100 歲'
    },
    {
      validate: (value, allInputs) => {
        const retireAge = toNum(value);
        const currentAge = toNum(allInputs.age);
        return retireAge > currentAge;
      },
      errorMessage: '退休年齡必須大於當前年齡'
    }
  ],
  
  lifeExp: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 1 && num <= 120;
      },
      errorMessage: '請輸入 1–120 歲'
    },
    {
      validate: (value, allInputs) => {
        const lifeExp = toNum(value);
        const retireAge = toNum(allInputs.retireAge);
        return lifeExp > retireAge;
      },
      errorMessage: '預期壽命必須大於退休年齡'
    }
  ],
  
  // 現金流相關
  monthlyExpense: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 0 && num <= 10000000;
      },
      errorMessage: '請輸入有效金額（0–1000萬）'
    }
  ],
  
  monthlySaving: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 0 && num <= 10000000;
      },
      errorMessage: '請輸入有效金額（0–1000萬）'
    }
  ],
  
  postFixedIncome: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 0 && num <= 10000000;
      },
      errorMessage: '請輸入有效金額（0–1000萬）'
    }
  ],
  
  // 資產相關
  cash: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 0 && num <= 1000000000;
      },
      errorMessage: '請輸入有效金額（0–10億）'
    }
  ],
  
  invest: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 0 && num <= 1000000000;
      },
      errorMessage: '請輸入有效金額（0–10億）'
    }
  ],
  
  realEstate: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 0 && num <= 1000000000;
      },
      errorMessage: '請輸入有效金額（0–10億）'
    }
  ],
  
  // 房貸相關
  mortgageBalance: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 0 && num <= 1000000000;
      },
      errorMessage: '請輸入有效金額（0–10億）'
    }
  ],
  
  mortgageAprPct: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 0 && num <= 100;
      },
      errorMessage: '請輸入 0–100%'
    }
  ],
  
  mortgageYearsLeft: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 0 && num <= 50;
      },
      errorMessage: '請輸入 0–50 年'
    }
  ],
  
  // 報酬率與通膨
  rPrePct: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= -50 && num <= 100;
      },
      errorMessage: '請輸入 -50–100%'
    }
  ],
  
  rPostPct: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= -50 && num <= 100;
      },
      errorMessage: '請輸入 -50–100%'
    }
  ],
  
  inflationPct: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= -10 && num <= 50;
      },
      errorMessage: '請輸入 -10–50%'
    }
  ],
  
  reAppPct: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= -50 && num <= 100;
      },
      errorMessage: '請輸入 -50–100%'
    }
  ],
  
  medicalLateBoostPct: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 0 && num <= 1000;
      },
      errorMessage: '請輸入 0–1000%'
    }
  ],
  
  // 房產處置相關
  sellCostRatePct: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 0 && num <= 100;
      },
      errorMessage: '請輸入 0–100%'
    }
  ],
  
  rentNetMonthly: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 0 && num <= 10000000;
      },
      errorMessage: '請輸入有效金額（0–1000萬）'
    }
  ],
  
  saleAge: [
    {
      validate: (value) => {
        const num = toNum(value);
        return num >= 1 && num <= 120;
      },
      errorMessage: '請輸入 1–120 歲'
    },
    {
      validate: (value, allInputs) => {
        const saleAge = toNum(value);
        const retireAge = toNum(allInputs.retireAge);
        return saleAge >= retireAge;
      },
      errorMessage: '出售年齡必須 ≥ 退休年齡'
    }
  ],

  rentAge: [
    {
      validate: (value) => {
        if (!value || value.trim() === '') return true; // 允許空值
        const num = toNum(value);
        return num >= 1 && num <= 120;
      },
      errorMessage: '請輸入 1–120 歲'
    },
    {
      validate: (value, allInputs) => {
        if (!value || value.trim() === '') return true; // 允許空值
        const rentAge = toNum(value);
        const currentAge = toNum(allInputs.age);
        return rentAge >= currentAge;
      },
      errorMessage: '出租年齡必須 ≥ 當前年齡'
    }
  ]
};

// 驗證單個欄位
export function validateField(
  fieldName: keyof CalculatorInputs,
  value: string,
  allInputs: CalculatorInputs
): { isValid: boolean; errorMessage: string } {
  const rules = validationRules[fieldName];
  
  // 如果沒有規則或值為空，視為有效
  if (!rules || !value || value.trim() === '') {
    return { isValid: true, errorMessage: '' };
  }
  
  // 檢查所有規則
  for (const rule of rules) {
    if (!rule.validate(value, allInputs)) {
      return { isValid: false, errorMessage: rule.errorMessage };
    }
  }
  
  return { isValid: true, errorMessage: '' };
}

// 驗證所有欄位
export function validateAllFields(inputs: CalculatorInputs): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  
  Object.keys(validationRules).forEach((fieldName) => {
    const result = validateField(
      fieldName as keyof CalculatorInputs,
      inputs[fieldName as keyof CalculatorInputs],
      inputs
    );
    
    if (!result.isValid) {
      errors[fieldName] = result.errorMessage;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
