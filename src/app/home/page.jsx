"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnalyticsReports  from '../../shared/components/AnalyticsReports';

export default function StatisticsPage() {
  const router = useRouter();
  
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [router]);

  return (
    <>
   <AnalyticsReports />
    </>
  );
}