
import { Navigate, useParams } from "react-router-dom";

export default function LegacyAnalysisRedirect() {
  const { id } = useParams();

  return (
    <Navigate
      to={`/app/analysis/${encodeURIComponent(id)}`}
      replace
    />
  );
}
