import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/Default')));

// utilities routing
const UtilsTypography = Loadable(lazy(() => import('views/utilities/Typography')));
const UtilsColor = Loadable(lazy(() => import('views/utilities/Color')));
const UtilsShadow = Loadable(lazy(() => import('views/utilities/Shadow')));

// sample page routing
const SamplePage = Loadable(lazy(() => import('views/sample-page')));
// purchase orders / approvals
const Approvals = Loadable(lazy(() => import('views/purchase-orders/Approvals')));
const CreateApproval = Loadable(lazy(() => import('views/purchase-orders/CreateApproval')));
const PendingApprovals = Loadable(lazy(() => import('views/purchase-orders/PendingApprovals')));
const ApprovalDetail = Loadable(lazy(() => import('views/purchase-orders/ApprovalDetail')));
const Login = Loadable(lazy(() => import('views/Auth/Login')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'typography',
      element: <UtilsTypography />
    },
    {
      path: 'color',
      element: <UtilsColor />
    },
    {
      path: 'shadow',
      element: <UtilsShadow />
    },
    {
      path: 'approvals',
      children: [
        { path: '', element: <Approvals /> },
        { path: 'create', element: <CreateApproval /> },
        { path: 'pending', element: <PendingApprovals /> },
        { path: 'requests/:id', element: <ApprovalDetail /> }
      ]
    },
    {
      path: 'login',
      element: <Login />
    }
    {
      path: '/sample-page',
      element: <SamplePage />
    }
  ]
};

export default MainRoutes;
