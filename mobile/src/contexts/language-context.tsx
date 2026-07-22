import React, { createContext, useContext, useState, useCallback } from 'react';

type Language = 'en' | 'ar';

const translations = {
    en: {
        home: 'Home', records: 'Records', meds: 'Meds',
        insights: 'Insights', settings: 'Settings',
        dashboard: 'DASHBOARD', goodMorning: 'Good Morning',
        goodAfternoon: 'Good Afternoon', goodEvening: 'Good Evening',
        scanPrescription: 'Scan New Prescription',
        scanSubtitle: 'Digitize your handwritten medical documents instantly with AI',
        recentScans: 'Recent Scans', seeAll: 'See All',
        myReminders: 'My Reminders', insights_title: 'Insights',
        adherence: 'Adherence', streak: 'Streak', taken: 'Taken', missed: 'Missed',
        noData: 'No Data Yet', createReminder: 'Create Reminder',
        pharmacyMap: 'Nearest Pharmacy', findPharmacy: 'Find pharmacies near you',
        language: 'Language', theme: 'Theme', darkMode: 'Dark Mode',
        arabic: 'العربية', english: 'English',
        active: 'Active', all: 'All',
        export_pdf: 'Export PDF', medication_info: 'Medication Info',
        swipeHint: 'Swipe left to reveal actions',
        errorLoadingReminders: 'Error Loading Reminders',
        tryAgainLater: 'Please try again later.',
        noRemindersYet: 'No Reminders Yet',
        noRemindersMsg: 'Create your first medication reminder to stay on track with your doses.',
        appearance: 'Appearance', account: 'Account', support: 'Support',
        accountProfile: 'Account Profile', familyProfiles: 'Family Profiles',
        notifications: 'Notifications', logOut: 'Log Out', settingsTitle: 'Settings',
        schedule: 'Schedule', pharmacy: 'Pharmacy',
        version: 'Prescripto v1.0.0',
    },
    ar: {
        home: 'الرئيسية', records: 'السجلات', meds: 'الأدوية',
        insights: 'التحليلات', settings: 'الإعدادات',
        dashboard: 'لوحة التحكم', goodMorning: 'صباح الخير',
        goodAfternoon: 'مساء الخير', goodEvening: 'مساء الخير',
        scanPrescription: 'مسح وصفة طبية',
        scanSubtitle: 'رقمنة وصفاتك الطبية المكتوبة بخط اليد فورًا باستخدام الذكاء الاصطناعي',
        recentScans: 'الفحوصات الأخيرة', seeAll: 'عرض الكل',
        myReminders: 'تذكيراتي', insights_title: 'التحليلات',
        adherence: 'الالتزام', streak: 'الإنجاز', taken: 'مأخوذ', missed: 'فائت',
        noData: 'لا توجد بيانات بعد', createReminder: 'إنشاء تذكير',
        pharmacyMap: 'أقرب صيدلية', findPharmacy: 'ابحث عن الصيدليات القريبة منك',
        language: 'اللغة', theme: 'المظهر', darkMode: 'الوضع الليلي',
        arabic: 'العربية', english: 'English',
        active: 'نشط', all: 'الكل',
        export_pdf: 'تصدير PDF', medication_info: 'معلومات الدواء',
        swipeHint: 'اسحب يساراً للكشف عن الإجراءات',
        errorLoadingReminders: 'خطأ في تحميل التذكيرات',
        tryAgainLater: 'يرجى المحاولة مرة أخرى لاحقاً.',
        noRemindersYet: 'لا توجد تذكيرات بعد',
        noRemindersMsg: 'أنشئ أول تذكير للدواء للبقاء على المسار الصحيح مع جرعاتك.',
        appearance: 'المظهر', account: 'الحساب', support: 'الدعم',
        accountProfile: 'ملف الحساب', familyProfiles: 'ملفات العائلة',
        notifications: 'الإشعارات', logOut: 'تسجيل الخروج', settingsTitle: 'الإعدادات',
        schedule: 'الجدول', pharmacy: 'الصيدلية',
        version: 'Prescripto v1.0.0',
    },
};

type TranslationKey = keyof typeof translations['en'];

interface LanguageContextType {
    language: Language;
    isRTL: boolean;
    t: (key: TranslationKey) => string;
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    isRTL: false,
    t: (key) => translations.en[key] ?? key,
    toggleLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    const toggleLanguage = useCallback(() => {
        setLanguage((l) => (l === 'en' ? 'ar' : 'en'));
    }, []);

    const t = useCallback(
        (key: TranslationKey) => translations[language][key] ?? translations.en[key] ?? key,
        [language]
    );

    return (
        <LanguageContext.Provider value={{ language, isRTL: language === 'ar', t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
