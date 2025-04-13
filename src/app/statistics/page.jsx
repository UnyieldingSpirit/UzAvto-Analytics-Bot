import FinancialAnalytics from "@/src/shared/components/FinancialAnalytics";
import Statistics from "../../shared/components/Statistics";
import AnalyticsDashboard from "@/src/shared/components/AnalyticsDashboard";
import ModelTrackingDashboard from "@/src/shared/components/ModelTrackingDashboard";
import InstallmentDashboard from "@/src/shared/components/InstallmentDashboard";
import SalesDashboard from "@/src/shared/components/SalesDashboard";

export default function StatisticsPage() {
  return (
    <>
    < Statistics />
<FinancialAnalytics/>
<AnalyticsDashboard/>
<ModelTrackingDashboard/>
<InstallmentDashboard/>
<SalesDashboard/>
  </>
      )
}