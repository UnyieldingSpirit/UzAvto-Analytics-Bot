"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FinancialAnalytics from "@/src/shared/components/FinancialAnalytics";
import AnalyticsDashboard from "@/src/shared/components/ContractsAnalyticsDashboard";
import ModelTrackingDashboard from "@/src/shared/components/ModelTrackingDashboard";
import InstallmentDashboard from "@/src/shared/components/InstallmentDashboard";
import SalesDashboard from "@/src/shared/components/SalesDashboard";
import AutoDashboard from "@/src/shared/components/AutoDashboard";
import CarContractsAnalytics from "@/src/shared/components/CarContractsAnalytics";
import WarehouseAnalytics from "@/src/shared/components/WarehouseAnalytics";
import CarWarehouseAnalytics from "@/src/shared/components/CarWarehouseAnalytics";
import WarehouseDashboard from "@/src/shared/components/WarehouseDashboard";

export default function StatisticsPage() {
  const router = useRouter();
  
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [router]);

  return (
    <>
      <FinancialAnalytics/>
      <AnalyticsDashboard/>
      <ModelTrackingDashboard/>
      <InstallmentDashboard/>
      <SalesDashboard/>
      <AutoDashboard/>
      <CarContractsAnalytics/>
      <WarehouseAnalytics/>
      <CarWarehouseAnalytics/>
      <WarehouseDashboard/>
    </>
  );
}