/**
 * Translations Utility
 * Provides translations for the application in different languages
 */

// English translations (default)
const en = {
  // Calculator form
  form: {
    title: 'Loan Calculator',
    loanAmount: 'Loan Amount',
    interestRate: 'Interest Rate',
    loanTerm: 'Loan Term',
    loanType: 'Loan Type',
    paymentFrequency: 'Payment Frequency',
    downPayment: 'Down Payment',
    additionalPayment: 'Additional Payment',
    startDate: 'Start Date',
    calculate: 'Calculate',
    reset: 'Reset',
    years: 'Years',
    months: 'Months',
    mortgage: 'Mortgage',
    auto: 'Auto',
    personal: 'Personal',
    student: 'Student',
    monthly: 'Monthly',
    biWeekly: 'Bi-Weekly',
    weekly: 'Weekly'
  },
  
  // Market rates
  marketRates: {
    title: 'Current Market Rates',
    disclaimer: 'Rates are estimates based on national averages and may vary by location, credit score, and other factors.',
    averageRate: 'Average Rate',
    rateRange: 'Rate Range',
    yourRate: 'Your Rate',
    difference: 'Difference',
    belowAverage: 'below average',
    aboveAverage: 'above average',
    sameAsAverage: 'same as average',
    useAverageRate: 'Use Average Rate',
    lastUpdated: 'Last Updated',
    viewTrends: 'View Rate Trends',
    compareRates: 'Compare Your Rate'
  },
  
  // Glossary
  glossary: {
    title: 'Financial Terms Glossary',
    openGlossary: 'Open Financial Terms Glossary',
    close: 'Close Glossary',
    search: 'Search glossary terms',
    searchPlaceholder: 'Search for terms...',
    noResults: 'No matching terms found',
    searchResults: '{count} terms found',
    opened: 'Financial glossary opened',
    closed: 'Financial glossary closed'
  },
  
  // Results display
  results: {
    monthlyPayment: 'Monthly Payment',
    totalPayment: 'Total Payment',
    totalInterest: 'Total Interest',
    payoffDate: 'Payoff Date',
    interestSavings: 'Interest Savings',
    timeReduction: 'Time Reduction',
    saveCalculation: 'Save Calculation',
    share: 'Share',
    export: 'Export',
    print: 'Print'
  },
  
  // Amortization table
  amortization: {
    title: 'Amortization Schedule',
    paymentNumber: 'Payment #',
    paymentDate: 'Date',
    payment: 'Payment',
    principal: 'Principal',
    interest: 'Interest',
    balance: 'Balance',
    totalPrincipal: 'Total Principal',
    totalInterest: 'Total Interest',
    filter: 'Filter',
    showAll: 'Show All',
    annual: 'Annual Summary',
    noData: 'No data available'
  },
  
  // Charts
  charts: {
    title: 'Payment Charts',
    principalVsInterest: 'Principal vs Interest',
    paymentBreakdown: 'Payment Breakdown',
    amortizationSchedule: 'Amortization Schedule',
    principal: 'Principal',
    interest: 'Interest',
    balance: 'Balance',
    time: 'Time'
  },
  
  // Saved calculations
  savedCalculations: {
    title: 'Saved Calculations',
    noSavedCalculations: 'No saved calculations',
    load: 'Load',
    delete: 'Delete',
    compare: 'Compare',
    rename: 'Rename',
    confirmDelete: 'Are you sure you want to delete this calculation?',
    enterName: 'Enter a name for this calculation',
    defaultName: 'Calculation'
  },
  
  // Settings
  settings: {
    title: 'Settings',
    theme: 'Theme',
    language: 'Language',
    currency: 'Currency',
    light: 'Light',
    dark: 'Dark',
    dateFormat: 'Date Format',
    numberFormat: 'Number Format'
  },
  
  // Comparison view
  comparison: {
    title: 'Loan Comparison',
    scenario: 'Scenario',
    difference: 'Difference',
    savings: 'Savings'
  },
  
  // Common
  common: {
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    warning: 'Warning',
    info: 'Information'
  },
  
  // Tooltips and guidance
  tooltips: {
    loanType: 'Select the type of loan you need. Different loan types have different default values and limits.',
    loanAmount: 'Enter the total amount you wish to borrow.',
    interestRate: 'The annual interest rate for your loan. Higher rates mean higher monthly payments.',
    loanTerm: 'The length of time to repay the loan. Longer terms mean lower monthly payments but more interest paid overall.',
    downPayment: 'Initial payment made upfront. A larger down payment reduces your loan amount and monthly payments.',
    additionalPayment: 'Extra amount paid each period beyond the required payment. This reduces your loan term and total interest.',
    paymentFrequency: 'How often you make payments. More frequent payments can reduce total interest paid.',
    startDate: 'The date when your loan begins and first payment is due.',
    
    // Results tooltips
    monthlyPayment: 'The amount you need to pay each period to repay the loan on schedule.',
    totalPayment: 'The total amount you will pay over the life of the loan, including principal and interest.',
    totalInterest: 'The total amount of interest you will pay over the life of the loan.',
    payoffDate: 'The date when your loan will be fully paid off if you make all scheduled payments.',
    interestSavings: 'The amount of interest you save by making additional payments.',
    
    // Tutorial
    startTutorial: 'Start a guided tour of the loan calculator features.',
    showGuidance: 'Show guidance for interpreting your loan results.',
    
    // Guidance
    interpretingResults: 'How to interpret your loan calculation results',
    affordabilityGuidance: 'Understanding loan affordability',
    refinanceGuidance: 'When to consider refinancing'
  },
  
  // Guidance
  guidance: {
    title: 'Loan Calculator Guidance',
    help: 'Help & Tips',
    tutorial: 'Interactive Tutorial',
    
    interpretingResultsTitle: 'Interpreting Your Results',
    interpretingResultsContent: 'Your loan calculation results show the monthly payment, total payment, total interest, and payoff date. The monthly payment is the amount you need to pay each period to repay the loan on schedule. The total payment is the sum of all payments over the life of the loan. The total interest is the cost of borrowing the money.',
    
    affordabilityTitle: 'Understanding Loan Affordability',
    affordabilityContent: 'When determining how much you can afford to borrow, consider the following:',
    affordabilityTip1: 'Your monthly loan payment should ideally be less than 28% of your gross monthly income.',
    affordabilityTip2: 'Consider all other debts and expenses when determining affordability.',
    affordabilityTip3: 'Remember to account for taxes, insurance, and maintenance costs for mortgages.',
    
    additionalPaymentsTitle: 'Benefits of Additional Payments',
    additionalPaymentsContent: 'Making additional payments can significantly reduce your loan term and the total interest paid. Even small additional payments can make a big difference over time.',
    
    refinanceTitle: 'When to Consider Refinancing',
    refinanceContent: 'Refinancing may be beneficial in the following situations:',
    refinanceTip1: 'When interest rates have dropped significantly since you obtained your loan.',
    refinanceTip2: 'When you want to change the term of your loan (shorter or longer).',
    refinanceTip3: 'When you want to switch from a variable to a fixed-rate loan or vice versa.'
  },
  
  // Tutorial
  tutorial: {
    loanTypeTitle: 'Loan Type',
    loanTypeContent: 'Start by selecting the type of loan you need. This will set appropriate defaults for your loan calculation.',
    
    loanAmountTitle: 'Loan Amount',
    loanAmountContent: 'Enter the total amount you wish to borrow. You can use the slider or type the exact amount.',
    
    interestRateTitle: 'Interest Rate',
    interestRateContent: 'Enter the annual interest rate for your loan. This is the cost of borrowing the money, expressed as a percentage.',
    
    loanTermTitle: 'Loan Term',
    loanTermContent: 'Enter the length of time to repay the loan in months. Longer terms mean lower monthly payments but more interest paid overall.',
    
    termPresetsTitle: 'Term Presets',
    termPresetsContent: 'Click these buttons to quickly set common loan terms like 5, 15, or 30 years.',
    
    additionalPaymentTitle: 'Additional Payment',
    additionalPaymentContent: 'Enter any extra amount you plan to pay each period. This can significantly reduce your loan term and total interest.',
    
    calculateTitle: 'Calculate',
    calculateContent: 'Click this button to calculate your loan based on the entered parameters.',
    
    resultsTitle: 'Results Summary',
    resultsContent: 'This section shows your monthly payment, total payment, total interest, and payoff date.',
    
    amortizationTitle: 'Amortization Schedule',
    amortizationContent: 'This table shows the breakdown of each payment over the life of the loan, including how much goes to principal and interest.',
    
    chartsTitle: 'Payment Charts',
    chartsContent: 'These charts visualize your loan data, showing the breakdown of principal vs. interest and the amortization schedule over time.',
    
    completedTitle: 'Tutorial Completed',
    completedContent: 'You\'ve completed the tutorial! You now know how to use the loan calculator to make informed financial decisions.'
  }
};

// Spanish translations
const es = {
  // Calculator form
  form: {
    title: 'Calculadora de Préstamos',
    loanAmount: 'Monto del Préstamo',
    interestRate: 'Tasa de Interés',
    loanTerm: 'Plazo del Préstamo',
    loanType: 'Tipo de Préstamo',
    paymentFrequency: 'Frecuencia de Pago',
    downPayment: 'Pago Inicial',
    additionalPayment: 'Pago Adicional',
    startDate: 'Fecha de Inicio',
    calculate: 'Calcular',
    reset: 'Reiniciar',
    years: 'Años',
    months: 'Meses',
    mortgage: 'Hipoteca',
    auto: 'Auto',
    personal: 'Personal',
    student: 'Estudiantil',
    monthly: 'Mensual',
    biWeekly: 'Quincenal',
    weekly: 'Semanal'
  },
  
  // Market rates
  marketRates: {
    title: 'Tasas Actuales del Mercado',
    disclaimer: 'Las tasas son estimaciones basadas en promedios nacionales y pueden variar según la ubicación, puntaje crediticio y otros factores.',
    averageRate: 'Tasa Promedio',
    rateRange: 'Rango de Tasas',
    yourRate: 'Su Tasa',
    difference: 'Diferencia',
    belowAverage: 'por debajo del promedio',
    aboveAverage: 'por encima del promedio',
    sameAsAverage: 'igual al promedio',
    useAverageRate: 'Usar Tasa Promedio',
    lastUpdated: 'Última Actualización',
    viewTrends: 'Ver Tendencias de Tasas',
    compareRates: 'Comparar Su Tasa'
  },
  
  // Glossary
  glossary: {
    title: 'Glosario de Términos Financieros',
    openGlossary: 'Abrir Glosario de Términos Financieros',
    close: 'Cerrar Glosario',
    search: 'Buscar términos en el glosario',
    searchPlaceholder: 'Buscar términos...',
    noResults: 'No se encontraron términos coincidentes',
    searchResults: '{count} términos encontrados',
    opened: 'Glosario financiero abierto',
    closed: 'Glosario financiero cerrado'
  },
  
  // Results display
  results: {
    monthlyPayment: 'Pago Mensual',
    totalPayment: 'Pago Total',
    totalInterest: 'Interés Total',
    payoffDate: 'Fecha de Liquidación',
    interestSavings: 'Ahorro de Intereses',
    timeReduction: 'Reducción de Tiempo',
    saveCalculation: 'Guardar Cálculo',
    share: 'Compartir',
    export: 'Exportar',
    print: 'Imprimir'
  },
  
  // Amortization table
  amortization: {
    title: 'Tabla de Amortización',
    paymentNumber: '# de Pago',
    paymentDate: 'Fecha',
    payment: 'Pago',
    principal: 'Capital',
    interest: 'Interés',
    balance: 'Saldo',
    totalPrincipal: 'Capital Total',
    totalInterest: 'Interés Total',
    filter: 'Filtrar',
    showAll: 'Mostrar Todo',
    annual: 'Resumen Anual',
    noData: 'No hay datos disponibles'
  },
  
  // Charts
  charts: {
    title: 'Gráficos de Pago',
    principalVsInterest: 'Capital vs Interés',
    paymentBreakdown: 'Desglose de Pagos',
    amortizationSchedule: 'Calendario de Amortización',
    principal: 'Capital',
    interest: 'Interés',
    balance: 'Saldo',
    time: 'Tiempo'
  },
  
  // Saved calculations
  savedCalculations: {
    title: 'Cálculos Guardados',
    noSavedCalculations: 'No hay cálculos guardados',
    load: 'Cargar',
    delete: 'Eliminar',
    compare: 'Comparar',
    rename: 'Renombrar',
    confirmDelete: '¿Está seguro de que desea eliminar este cálculo?',
    enterName: 'Ingrese un nombre para este cálculo',
    defaultName: 'Cálculo'
  },
  
  // Settings
  settings: {
    title: 'Configuración',
    theme: 'Tema',
    language: 'Idioma',
    currency: 'Moneda',
    light: 'Claro',
    dark: 'Oscuro',
    dateFormat: 'Formato de Fecha',
    numberFormat: 'Formato de Número'
  },
  
  // Comparison view
  comparison: {
    title: 'Comparación de Préstamos',
    scenario: 'Escenario',
    difference: 'Diferencia',
    savings: 'Ahorros'
  },
  
  // Common
  common: {
    yes: 'Sí',
    no: 'No',
    ok: 'Aceptar',
    cancel: 'Cancelar',
    save: 'Guardar',
    close: 'Cerrar',
    loading: 'Cargando...',
    error: 'Ocurrió un error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información'
  },
  
  // Tooltips and guidance
  tooltips: {
    loanType: 'Seleccione el tipo de préstamo que necesita. Diferentes tipos de préstamos tienen diferentes valores y límites predeterminados.',
    loanAmount: 'Ingrese el monto total que desea pedir prestado.',
    interestRate: 'La tasa de interés anual de su préstamo. Tasas más altas significan pagos mensuales más altos.',
    loanTerm: 'El período de tiempo para pagar el préstamo. Plazos más largos significan pagos mensuales más bajos pero más intereses pagados en general.',
    downPayment: 'Pago inicial realizado por adelantado. Un pago inicial más grande reduce el monto de su préstamo y los pagos mensuales.',
    additionalPayment: 'Cantidad adicional pagada en cada período más allá del pago requerido. Esto reduce el plazo de su préstamo y el interés total.',
    paymentFrequency: 'Con qué frecuencia realiza los pagos. Pagos más frecuentes pueden reducir el interés total pagado.',
    startDate: 'La fecha en que comienza su préstamo y vence el primer pago.',
    
    // Results tooltips
    monthlyPayment: 'La cantidad que debe pagar en cada período para pagar el préstamo según lo programado.',
    totalPayment: 'El monto total que pagará durante la vida del préstamo, incluido el capital y los intereses.',
    totalInterest: 'El monto total de interés que pagará durante la vida del préstamo.',
    payoffDate: 'La fecha en que su préstamo se pagará por completo si realiza todos los pagos programados.',
    interestSavings: 'La cantidad de interés que ahorra al realizar pagos adicionales.',
    
    // Tutorial
    startTutorial: 'Inicie un recorrido guiado por las funciones de la calculadora de préstamos.',
    showGuidance: 'Mostrar orientación para interpretar los resultados de su préstamo.',
    
    // Guidance
    interpretingResults: 'Cómo interpretar los resultados del cálculo de su préstamo',
    affordabilityGuidance: 'Comprender la asequibilidad del préstamo',
    refinanceGuidance: 'Cuándo considerar la refinanciación'
  },
  
  // Guidance
  guidance: {
    title: 'Guía de la Calculadora de Préstamos',
    help: 'Ayuda y Consejos',
    tutorial: 'Tutorial Interactivo',
    
    interpretingResultsTitle: 'Interpretando Sus Resultados',
    interpretingResultsContent: 'Los resultados del cálculo de su préstamo muestran el pago mensual, el pago total, el interés total y la fecha de liquidación. El pago mensual es la cantidad que debe pagar en cada período para pagar el préstamo según lo programado. El pago total es la suma de todos los pagos durante la vida del préstamo. El interés total es el costo de pedir prestado el dinero.',
    
    affordabilityTitle: 'Entendiendo la Asequibilidad del Préstamo',
    affordabilityContent: 'Al determinar cuánto puede permitirse pedir prestado, considere lo siguiente:',
    affordabilityTip1: 'Su pago mensual del préstamo debería ser idealmente menos del 28% de su ingreso mensual bruto.',
    affordabilityTip2: 'Considere todas las otras deudas y gastos al determinar la asequibilidad.',
    affordabilityTip3: 'Recuerde tener en cuenta los impuestos, el seguro y los costos de mantenimiento para las hipotecas.',
    
    additionalPaymentsTitle: 'Beneficios de los Pagos Adicionales',
    additionalPaymentsContent: 'Hacer pagos adicionales puede reducir significativamente el plazo de su préstamo y el interés total pagado. Incluso pequeños pagos adicionales pueden hacer una gran diferencia con el tiempo.',
    
    refinanceTitle: 'Cuándo Considerar la Refinanciación',
    refinanceContent: 'La refinanciación puede ser beneficiosa en las siguientes situaciones:',
    refinanceTip1: 'Cuando las tasas de interés han bajado significativamente desde que obtuvo su préstamo.',
    refinanceTip2: 'Cuando desea cambiar el plazo de su préstamo (más corto o más largo).',
    refinanceTip3: 'Cuando desea cambiar de un préstamo de tasa variable a uno de tasa fija o viceversa.'
  },
  
  // Tutorial
  tutorial: {
    loanTypeTitle: 'Tipo de Préstamo',
    loanTypeContent: 'Comience seleccionando el tipo de préstamo que necesita. Esto establecerá los valores predeterminados apropiados para su cálculo de préstamo.',
    
    loanAmountTitle: 'Monto del Préstamo',
    loanAmountContent: 'Ingrese el monto total que desea pedir prestado. Puede usar el control deslizante o escribir el monto exacto.',
    
    interestRateTitle: 'Tasa de Interés',
    interestRateContent: 'Ingrese la tasa de interés anual para su préstamo. Este es el costo de pedir prestado el dinero, expresado como un porcentaje.',
    
    loanTermTitle: 'Plazo del Préstamo',
    loanTermContent: 'Ingrese el período de tiempo para pagar el préstamo en meses. Plazos más largos significan pagos mensuales más bajos pero más intereses pagados en general.',
    
    termPresetsTitle: 'Plazos Preestablecidos',
    termPresetsContent: 'Haga clic en estos botones para establecer rápidamente plazos comunes de préstamos como 5, 15 o 30 años.',
    
    additionalPaymentTitle: 'Pago Adicional',
    additionalPaymentContent: 'Ingrese cualquier cantidad adicional que planea pagar en cada período. Esto puede reducir significativamente el plazo de su préstamo y el interés total.',
    
    calculateTitle: 'Calcular',
    calculateContent: 'Haga clic en este botón para calcular su préstamo según los parámetros ingresados.',
    
    resultsTitle: 'Resumen de Resultados',
    resultsContent: 'Esta sección muestra su pago mensual, pago total, interés total y fecha de liquidación.',
    
    amortizationTitle: 'Tabla de Amortización',
    amortizationContent: 'Esta tabla muestra el desglose de cada pago durante la vida del préstamo, incluido cuánto va al capital y al interés.',
    
    chartsTitle: 'Gráficos de Pago',
    chartsContent: 'Estos gráficos visualizan los datos de su préstamo, mostrando el desglose de capital versus interés y el calendario de amortización a lo largo del tiempo.',
    
    completedTitle: 'Tutorial Completado',
    completedContent: '¡Ha completado el tutorial! Ahora sabe cómo usar la calculadora de préstamos para tomar decisiones financieras informadas.'
  }
};

// Available translations
const translations = {
  en,
  es
};

/**
 * Get translation for a key
 * @param {string} key - Translation key in dot notation (e.g., 'form.title')
 * @param {string} language - Language code
 * @returns {string} Translated text or key if translation not found
 */
export function getTranslation(key, language = 'en') {
  const keys = key.split('.');
  let translation = translations[language] || translations.en;
  
  for (const k of keys) {
    translation = translation[k];
    if (translation === undefined) {
      return key; // Return key if translation not found
    }
  }
  
  return translation;
}

/**
 * Get all translations for a language
 * @param {string} language - Language code
 * @returns {Object} Translations object
 */
export function getTranslations(language = 'en') {
  return translations[language] || translations.en;
}

/**
 * Get available languages
 * @returns {Array} Array of language objects with code and name
 */
export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' }
  ];
}

export default {
  getTranslation,
  getTranslations,
  getAvailableLanguages
};