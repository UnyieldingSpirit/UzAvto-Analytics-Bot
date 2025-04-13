import FinancialAnalytics from "@/src/shared/components/FinancialAnalytics";
import Statistics from "../../shared/components/Statistics";
import AnalyticsDashboard from "@/src/shared/components/AnalyticsDashboard";
import ModelTrackingDashboard from "@/src/shared/components/ModelTrackingDashboard";
import InstallmentDashboard from "@/src/shared/components/InstallmentDashboard";
import SalesDashboard from "@/src/shared/components/SalesDashboard";
import AutoDashboard from "@/src/shared/components/AutoDashboard";
import CarContractsAnalytics from "@/src/shared/components/CarContractsAnalytics";
import WarehouseAnalytics from "@/src/shared/components/WarehouseAnalytics";
import CarWarehouseAnalytics from "@/src/shared/components/CarWarehouseAnalytics";
// import WarehouseDashboard from "@/src/shared/components/WarehouseDashboard";

export default function StatisticsPage() {
  return (
    <>
    < Statistics />
<FinancialAnalytics/>
<AnalyticsDashboard/>
<ModelTrackingDashboard/>
<InstallmentDashboard/>
<SalesDashboard/>
<AutoDashboard/>
<CarContractsAnalytics/>
<WarehouseAnalytics/>
<CarWarehouseAnalytics/>
{/* <WarehouseDashboard/> */}
  </>
      )
}