import { createBrowserRouter } from "react-router-dom";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Layout from "./components/Layout";

// Pages
import Dashboard from "./features/dashboard/pages/Dashboard";
import InterviewReportGenerator from "./features/interview/pages/Home";
import Report from "./features/interview/pages/Report.jsx";
import ResumeCreator from "./features/resume/pages/ResumeCreator";
import AtsCalculator from "./features/ats/pages/AtsCalculator";
import AtsEnhancer from "./features/ats/pages/AtsEnhancer";
import MockInterview from "./features/mockInterview/pages/MockInterview";
import PlanTracker from "./features/planTracker/pages/PlanTracker";
import Profile from "./features/profile/pages/Profile";
import Wishlist from "./features/wishlist/pages/Wishlist";


const withLayout = (Page) => (
    <Protected>
        <Layout>
            <Page />
        </Layout>
    </Protected>
)

export const router = createBrowserRouter([
    // ---- Public routes ----
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },

    // ---- Protected + Layout routes ----
    {
        path: "/",
        element: withLayout(Dashboard)
    },
    {
        path: "/interview-report",
        element: withLayout(InterviewReportGenerator)
    },
    {
        path: "/mock-interview",
        element: withLayout(MockInterview)
    },
    {
        path: "/resume-creator",
        element: withLayout(ResumeCreator)
    },
    {
        path: "/ats-calculator",
        element: withLayout(AtsCalculator)
    },
    {
        path: "/ats-enhancer",
        element: withLayout(AtsEnhancer)
    },
    {
        path: "/plan-tracker",
        element: withLayout(PlanTracker)
    },
    {
        path: "/profile",
        element: withLayout(Profile)
    },
    {
        path: "/wishlist",
        element: withLayout(Wishlist)
    },
    {
        path: "/interview/:interviewId",
        element: withLayout(Report)
    }
])
