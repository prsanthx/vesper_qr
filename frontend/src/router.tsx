import { Suspense, lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import Generator from "./routes/Generator";
import Resolve from "./routes/Resolve";
import { Spinner } from "./components/ui/Spinner";

const StaticExplainer = lazy(() => import("./routes/StaticExplainer"));
const DynamicExplainer = lazy(() => import("./routes/DynamicExplainer"));
const TypesIndex = lazy(() => import("./routes/TypesIndex"));
const TypeDetail = lazy(() => import("./routes/TypeDetail"));
const Features = lazy(() => import("./routes/Features"));
const UseWeddings = lazy(() => import("./routes/UseWeddings"));
const Faq = lazy(() => import("./routes/Faq"));
const Sponsor = lazy(() => import("./routes/Sponsor"));
const ApiDocs = lazy(() => import("./routes/ApiDocs"));
const Contact = lazy(() => import("./routes/Contact"));
const About = lazy(() => import("./routes/About"));
const Mine = lazy(() => import("./routes/Mine"));
const EditCode = lazy(() => import("./routes/EditCode"));
const Report = lazy(() => import("./routes/Report"));
const Legal = lazy(() => import("./routes/Legal"));
const Status = lazy(() => import("./routes/Status"));
const NotFound = lazy(() => import("./routes/NotFound"));

function L({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  { path: "/", element: <Generator /> },
  { path: "/r/:slug", element: <Resolve /> },
  { path: "/static", element: <L><StaticExplainer /></L> },
  { path: "/dynamic", element: <L><DynamicExplainer /></L> },
  { path: "/types", element: <L><TypesIndex /></L> },
  { path: "/types/:slug", element: <L><TypeDetail /></L> },
  { path: "/features", element: <L><Features /></L> },
  { path: "/use/weddings", element: <L><UseWeddings /></L> },
  { path: "/faq", element: <L><Faq /></L> },
  { path: "/sponsor", element: <L><Sponsor /></L> },
  { path: "/api", element: <L><ApiDocs /></L> },
  { path: "/contact", element: <L><Contact /></L> },
  { path: "/about", element: <L><About /></L> },
  { path: "/mine", element: <L><Mine /></L> },
  { path: "/e/:token", element: <L><EditCode /></L> },
  { path: "/report", element: <L><Report /></L> },
  { path: "/privacy", element: <L><Legal /></L> },
  { path: "/terms", element: <L><Legal /></L> },
  { path: "/disclaimer", element: <L><Legal /></L> },
  { path: "/status", element: <L><Status /></L> },
  { path: "/pricing", element: <Navigate to="/sponsor" replace /> },
  { path: "*", element: <L><NotFound /></L> },
]);
