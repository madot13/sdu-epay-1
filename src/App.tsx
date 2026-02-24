import './App.css'
import {Route, Routes} from "react-router-dom";
import PaymentPage from "./pages/PaymentPage.tsx";
import {LoginPage} from "./pages/LoginPage.tsx";
import {AdminPage} from "@/pages/AdminPage.tsx";
import {EventsPage} from "@/pages/EventsPage.tsx";
import {PromoCodesPage} from "@/pages/PromoCodesPage.tsx";
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import {ReauireAuth} from "@/layouts/RequireAuth.tsx";
import {DepartmentsPage} from "@/pages/DepartmentsPage.tsx";
import {SuccessPaymentPage} from "@/components/payment/SuccessPaymentPage.tsx";
import {FailPaymentPage} from "@/components/payment/FailPaymentPage.tsx";
import {DashboardPage} from "@/pages/DashboardPage.tsx";
import {Toaster} from "react-hot-toast";
import {FileViewerPage} from "@/pages/FileViewerPage.tsx";
import {OrdersPage} from "@/pages/OrdersPage.tsx";
import PacketEventsPage from '@/components/packet-events/PacketEventsPage';

function App() {
  return (
      <PrimeReactProvider>
          <Routes>
              <Route path="/" element={<PaymentPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={
                  <ReauireAuth>
                      <DashboardPage />
                  </ReauireAuth>
              }
              />
              <Route path="/admin" element={
                  <ReauireAuth>
                    <AdminPage />
                  </ReauireAuth>
              } />
              <Route path="/events" element={
                  <ReauireAuth>
                    <EventsPage />
                  </ReauireAuth>
                  } />
              <Route path="/promo-codes" element={
                  <ReauireAuth>
                    <PromoCodesPage />
                  </ReauireAuth>
              } />
              <Route path="/departments" element={
                  <ReauireAuth>
                      <DepartmentsPage />
                  </ReauireAuth>
              } />
              <Route path="/file-reader" element={
                  <ReauireAuth>
                      <FileViewerPage />
                  </ReauireAuth>
              }
              />
              <Route path="/orders" element={
                  <ReauireAuth>
                      <OrdersPage />
                  </ReauireAuth>
              }
              />
              <Route path="/admin/packet-events" element={<PacketEventsPage />} />
              <Route path={"/success"} element={<SuccessPaymentPage />} />
              <Route path={"/fail"} element={<FailPaymentPage />} />
          </Routes>
          <Toaster position="top-right" />
      </PrimeReactProvider>
  )
}

export default App
