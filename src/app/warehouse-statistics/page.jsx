"use client";

import WarehouseStatistics from "../../shared/components/WarehouseStatistics";
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';

export default function WarehouseStatisticsPage() {
  const { checkAuth } = useAuth();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <WarehouseStatistics />
    </>
  );
}