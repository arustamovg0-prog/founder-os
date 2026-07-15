'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { setLocale } from '@/app/actions/locale';

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();

  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
      setLocale(newLocale);
    });
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-zinc-400">
      <button 
        onClick={() => handleLocaleChange('en')}
        disabled={isPending}
        className={`hover:text-zinc-100 transition-colors ${locale === 'en' ? 'text-zinc-100 font-medium' : ''}`}
      >
        EN
      </button>
      <span>/</span>
      <button 
        onClick={() => handleLocaleChange('ru')}
        disabled={isPending}
        className={`hover:text-zinc-100 transition-colors ${locale === 'ru' ? 'text-zinc-100 font-medium' : ''}`}
      >
        RU
      </button>
      <span>/</span>
      <button 
        onClick={() => handleLocaleChange('uz')}
        disabled={isPending}
        className={`hover:text-zinc-100 transition-colors ${locale === 'uz' ? 'text-zinc-100 font-medium' : ''}`}
      >
        UZ
      </button>
    </div>
  );
}
